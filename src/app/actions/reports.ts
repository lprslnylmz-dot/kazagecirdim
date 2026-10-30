"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { saveImage } from "@/lib/uploads";
import { REPORT_CATEGORIES, REPORT_KINDS, REPORT_STATUS } from "@/lib/labels";

export type ReportFormState = { error?: string; ok?: boolean; values?: Record<string, string> } | undefined;

const Submit = z.object({
  code: z.string().min(4).max(32),
  kind: z.enum(Object.keys(REPORT_KINDS) as [keyof typeof REPORT_KINDS, ...(keyof typeof REPORT_KINDS)[]]),
  category: z.enum(REPORT_CATEGORIES),
  severity: z.coerce.number().int().min(1).max(3),
  description: z.string().trim().min(5, "Lütfen ne gördüğünüzü kısaca yazın").max(2000),
  location: z.string().trim().max(200).optional(),
  reporterName: z.string().trim().max(120).optional(),
  // Bot tuzağı: gerçek kullanıcı bu alanı görmez
  website: z.string().max(0).optional(),
});

/** Çalışanın QR ile açtığı formdan gelen bildirim (giriş gerektirmez). */
export async function submitReport(_prev: ReportFormState, formData: FormData): Promise<ReportFormState> {
  const raw = Object.fromEntries([...formData.entries()].filter(([, v]) => typeof v === "string"));
  const parsed = Submit.safeParse(raw);
  const values = raw as Record<string, string>;
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Form eksik", values };
  const d = parsed.data;

  const site = db.select().from(schema.sites).where(eq(schema.sites.code, d.code)).get();
  if (!site) return { error: "Bu bildirim bağlantısı geçersiz" };

  const photo = await saveImage(formData.get("photo") as File | null);
  if (!photo.ok) return { error: `${photo.error}. Lütfen fotoğrafı yeniden seçin.`, values };

  db.insert(schema.reports).values({
    orgId: site.orgId,
    siteId: site.id,
    kind: d.kind,
    category: d.category,
    severity: d.severity,
    description: d.description,
    location: d.location || null,
    reporterName: d.reporterName || null,
    photoFile: photo.file || null,
  }).run();

  return { ok: true };
}

const Update = z.object({
  id: z.coerce.number().int(),
  status: z.enum(Object.keys(REPORT_STATUS) as [string, ...string[]]),
  actionNote: z.string().trim().max(2000).optional(),
});

export async function updateReport(formData: FormData) {
  const s = await requireSession();
  const d = Update.parse(Object.fromEntries(formData));
  db.update(schema.reports)
    .set({
      status: d.status,
      actionNote: d.actionNote || null,
      closedAt: d.status === "kapandi" ? new Date().toISOString() : null,
    })
    .where(and(eq(schema.reports.id, d.id), eq(schema.reports.orgId, s.orgId)))
    .run();
  revalidatePath(`/panel/bildirimler/${d.id}`);
  revalidatePath("/panel/bildirimler");
}

/** Bildirimden düzeltici faaliyet (DÖF) oluşturur */
export async function addReportAction(formData: FormData) {
  const s = await requireSession();
  const reportId = Number(formData.get("reportId"));
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return;
  const report = db.select().from(schema.reports)
    .where(and(eq(schema.reports.id, reportId), eq(schema.reports.orgId, s.orgId))).get();
  if (!report) return;
  db.insert(schema.correctiveActions).values({
    orgId: s.orgId,
    reportId,
    title: title.slice(0, 300),
    owner: String(formData.get("owner") ?? "").slice(0, 120) || null,
    dueDate: String(formData.get("dueDate") ?? "") || null,
  }).run();
  if (report.status === "yeni" || report.status === "inceleniyor") {
    db.update(schema.reports).set({ status: "aksiyonda" }).where(eq(schema.reports.id, reportId)).run();
  }
  revalidatePath(`/panel/bildirimler/${reportId}`);
}

export async function toggleAction(formData: FormData) {
  const s = await requireSession();
  const id = Number(formData.get("id"));
  const back = String(formData.get("back") ?? "/panel");
  const a = db.select().from(schema.correctiveActions)
    .where(and(eq(schema.correctiveActions.id, id), eq(schema.correctiveActions.orgId, s.orgId))).get();
  if (!a) return;
  const done = a.status !== "tamamlandi";
  db.update(schema.correctiveActions)
    .set({ status: done ? "tamamlandi" : "acik", doneAt: done ? new Date().toISOString() : null })
    .where(eq(schema.correctiveActions.id, id)).run();
  revalidatePath(back);
}

const SiteForm = z.object({ name: z.string().trim().min(2).max(120) });

export async function createSite(formData: FormData) {
  const s = await requireSession();
  const d = SiteForm.safeParse(Object.fromEntries(formData));
  if (!d.success) redirect("/panel/lokasyonlar?hata=1");
  const { randomCode } = await import("@/lib/format");
  db.insert(schema.sites).values({ orgId: s.orgId, name: d.data.name, code: randomCode() }).run();
  revalidatePath("/panel/lokasyonlar");
}
