"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { parseIstanbulLocal, sgkDeadline } from "@/lib/workdays";
import { INCIDENT_CHECKLIST, ROOT_CAUSE_CATEGORIES, TREATMENT } from "@/lib/labels";

export type IncidentFormState = { error?: string; values?: Record<string, string> } | undefined;

const Create = z.object({
  title: z.string().trim().min(3, "Kısa bir başlık girin").max(200),
  occurredAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "Kaza tarihi ve saatini girin"),
  siteId: z.coerce.number().int().optional(),
  employeeName: z.string().trim().max(120).optional(),
  injury: z.string().trim().max(1000).optional(),
  treatment: z.enum(Object.keys(TREATMENT) as [string, ...string[]]),
});

export async function createIncident(_prev: IncidentFormState, formData: FormData): Promise<IncidentFormState> {
  const s = await requireSession();
  const values = Object.fromEntries([...formData.entries()].filter(([k, v]) => typeof v === "string" && !k.startsWith("$"))) as Record<string, string>;
  const parsed = Create.safeParse(values);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Form hatalı", values };
  const d = parsed.data;

  if (parseIstanbulLocal(d.occurredAt).getTime() > Date.now() + 5 * 60_000) return { error: "Kaza zamanı gelecekte olamaz", values };

  let siteId: number | null = null;
  if (d.siteId) {
    const site = db.select().from(schema.sites)
      .where(and(eq(schema.sites.id, d.siteId), eq(schema.sites.orgId, s.orgId))).get();
    siteId = site?.id ?? null;
  }

  const incident = db.transaction((tx) => {
    const inc = tx.insert(schema.incidents).values({
      orgId: s.orgId,
      siteId,
      title: d.title,
      occurredAt: d.occurredAt,
      employeeName: d.employeeName || null,
      injury: d.injury || null,
      treatment: d.treatment,
      sgkDeadline: sgkDeadline(d.occurredAt),
    }).returning().get();
    tx.insert(schema.incidentChecklist)
      .values(INCIDENT_CHECKLIST.map((c) => ({ incidentId: inc.id, itemKey: c.key, label: c.label, phase: c.phase })))
      .run();
    return inc;
  });

  redirect(`/panel/olaylar/${incident.id}`);
}

/** Olayın bu kuruma ait olduğunu doğrular */
function ownIncident(orgId: number, id: number) {
  return db.select().from(schema.incidents)
    .where(and(eq(schema.incidents.id, id), eq(schema.incidents.orgId, orgId))).get();
}

export async function markNotified(formData: FormData) {
  const s = await requireSession();
  const id = Number(formData.get("id"));
  const which = String(formData.get("which"));
  const inc = ownIncident(s.orgId, id);
  if (!inc) return;
  const nowIso = new Date().toISOString();
  if (which === "sgk") {
    db.update(schema.incidents).set({ sgkNotifiedAt: inc.sgkNotifiedAt ? null : nowIso }).where(eq(schema.incidents.id, id)).run();
    // Kontrol listesindeki SGK maddesini de eşle
    db.update(schema.incidentChecklist).set({ doneAt: inc.sgkNotifiedAt ? null : nowIso })
      .where(and(eq(schema.incidentChecklist.incidentId, id), eq(schema.incidentChecklist.itemKey, "sgk"))).run();
  } else if (which === "kolluk") {
    db.update(schema.incidents).set({ policeNotifiedAt: inc.policeNotifiedAt ? null : nowIso }).where(eq(schema.incidents.id, id)).run();
    db.update(schema.incidentChecklist).set({ doneAt: inc.policeNotifiedAt ? null : nowIso })
      .where(and(eq(schema.incidentChecklist.incidentId, id), eq(schema.incidentChecklist.itemKey, "kolluk"))).run();
  }
  revalidatePath(`/panel/olaylar/${id}`);
}

export async function toggleChecklistItem(formData: FormData) {
  const s = await requireSession();
  const id = Number(formData.get("incidentId"));
  const itemId = Number(formData.get("itemId"));
  const inc = ownIncident(s.orgId, id);
  if (!inc) return;
  const item = db.select().from(schema.incidentChecklist)
    .where(and(eq(schema.incidentChecklist.id, itemId), eq(schema.incidentChecklist.incidentId, id))).get();
  if (!item) return;
  const doneAt = item.doneAt ? null : new Date().toISOString();
  db.update(schema.incidentChecklist).set({ doneAt }).where(eq(schema.incidentChecklist.id, itemId)).run();
  // SGK ve kolluk maddeleri olay kaydındaki alanlarla eşlensin
  if (item.itemKey === "sgk") db.update(schema.incidents).set({ sgkNotifiedAt: doneAt }).where(eq(schema.incidents.id, id)).run();
  if (item.itemKey === "kolluk") db.update(schema.incidents).set({ policeNotifiedAt: doneAt }).where(eq(schema.incidents.id, id)).run();
  revalidatePath(`/panel/olaylar/${id}`);
}

export async function addWitness(formData: FormData) {
  const s = await requireSession();
  const id = Number(formData.get("incidentId"));
  if (!ownIncident(s.orgId, id)) return;
  const name = String(formData.get("name") ?? "").trim().slice(0, 120);
  const statement = String(formData.get("statement") ?? "").trim().slice(0, 5000);
  if (!name || !statement) return;
  db.insert(schema.witnesses).values({ incidentId: id, name, statement }).run();
  revalidatePath(`/panel/olaylar/${id}`);
}

const RootCause = z.object({
  incidentId: z.coerce.number().int(),
  why1: z.string().max(500).optional(),
  why2: z.string().max(500).optional(),
  why3: z.string().max(500).optional(),
  why4: z.string().max(500).optional(),
  why5: z.string().max(500).optional(),
  rootCause: z.string().max(1000).optional(),
  category: z.enum(["", ...Object.keys(ROOT_CAUSE_CATEGORIES)] as [string, ...string[]]).optional(),
});

export async function saveRootCause(formData: FormData) {
  const s = await requireSession();
  const d = RootCause.parse(Object.fromEntries(formData));
  if (!ownIncident(s.orgId, d.incidentId)) return;
  const values = {
    why1: d.why1 || null, why2: d.why2 || null, why3: d.why3 || null, why4: d.why4 || null, why5: d.why5 || null,
    rootCause: d.rootCause || null, category: d.category || null, updatedAt: new Date().toISOString(),
  };
  db.insert(schema.rootCauses).values({ incidentId: d.incidentId, ...values })
    .onConflictDoUpdate({ target: schema.rootCauses.incidentId, set: values }).run();
  // Kök neden analizi başladıysa kontrol listesinde işaretle
  db.update(schema.incidentChecklist).set({ doneAt: new Date().toISOString() })
    .where(and(eq(schema.incidentChecklist.incidentId, d.incidentId), eq(schema.incidentChecklist.itemKey, "kokneden"))).run();
  revalidatePath(`/panel/olaylar/${d.incidentId}`);
}

export async function addIncidentAction(formData: FormData) {
  const s = await requireSession();
  const id = Number(formData.get("incidentId"));
  if (!ownIncident(s.orgId, id)) return;
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return;
  db.insert(schema.correctiveActions).values({
    orgId: s.orgId,
    incidentId: id,
    title: title.slice(0, 300),
    owner: String(formData.get("owner") ?? "").slice(0, 120) || null,
    dueDate: String(formData.get("dueDate") ?? "") || null,
  }).run();
  revalidatePath(`/panel/olaylar/${id}`);
}

export async function saveReturnToWork(formData: FormData) {
  const s = await requireSession();
  const id = Number(formData.get("incidentId"));
  if (!ownIncident(s.orgId, id)) return;
  const note = String(formData.get("note") ?? "").slice(0, 4000);
  db.update(schema.incidents).set({ returnToWorkNote: note || null }).where(eq(schema.incidents.id, id)).run();
  revalidatePath(`/panel/olaylar/${id}`);
}

export async function setIncidentStatus(formData: FormData) {
  const s = await requireSession();
  const id = Number(formData.get("id"));
  const inc = ownIncident(s.orgId, id);
  if (!inc) return;
  db.update(schema.incidents).set({ status: inc.status === "acik" ? "kapandi" : "acik" }).where(eq(schema.incidents.id, id)).run();
  revalidatePath(`/panel/olaylar/${id}`);
  revalidatePath("/panel/olaylar");
}
