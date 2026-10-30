"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/lib/db";
import { isAccidentType } from "@/lib/content";
import { randomCode } from "@/lib/format";

const CreateCase = z.object({
  tur: z.string().refine(isAccidentType, "Geçersiz kaza türü"),
  tarih: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Tarih gerekli"),
});

export async function createAssistantCase(formData: FormData) {
  const parsed = CreateCase.safeParse({ tur: formData.get("tur"), tarih: formData.get("tarih") });
  if (!parsed.success) redirect("/asistan?hata=1");
  const token = randomCode(12);
  db.insert(schema.assistantCases)
    .values({ token, accidentType: parsed.data.tur, accidentDate: parsed.data.tarih })
    .run();
  redirect(`/asistan/${token}`);
}

export async function toggleAssistantItem(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const key = String(formData.get("key") ?? "");
  const row = db.select().from(schema.assistantCases).where(eq(schema.assistantCases.token, token)).get();
  if (!row) return;
  const done = new Set<string>(JSON.parse(row.doneKeys));
  if (done.has(key)) done.delete(key); else done.add(key);
  db.update(schema.assistantCases)
    .set({ doneKeys: JSON.stringify([...done]) })
    .where(eq(schema.assistantCases.id, row.id))
    .run();
  revalidatePath(`/asistan/${token}`);
}

export async function saveAssistantNote(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const note = String(formData.get("note") ?? "").slice(0, 4000);
  db.update(schema.assistantCases).set({ note }).where(eq(schema.assistantCases.token, token)).run();
  revalidatePath(`/asistan/${token}`);
}
