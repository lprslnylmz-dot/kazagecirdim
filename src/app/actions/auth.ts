"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/lib/db";
import { createSession, destroySession, hashPassword, verifyPassword } from "@/lib/auth";
import { randomCode } from "@/lib/format";

export type FormState = { error?: string; values?: Record<string, string> } | undefined;

/** Hata durumunda formu yeniden doldurmak için şifre dışındaki alanları geri döndürür */
function keep(formData: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of formData.entries()) {
    if (typeof v === "string" && !k.startsWith("$") && k !== "password") out[k] = v;
  }
  return out;
}

const Register = z.object({
  org: z.string().trim().min(2, "Kurum adı en az 2 karakter olmalı").max(120),
  site: z.string().trim().min(2, "Lokasyon adı gerekli").max(120),
  name: z.string().trim().min(2, "Adınızı girin").max(120),
  email: z.string().trim().toLowerCase().email("Geçerli bir e-posta girin"),
  password: z.string().min(8, "Şifre en az 8 karakter olmalı").max(200),
  kvkk: z.literal("on", { message: "Aydınlatma metnini onaylamanız gerekiyor" }),
});

export async function register(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = Register.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Form hatalı", values: keep(formData) };
  const d = parsed.data;

  const exists = db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.email, d.email)).get();
  if (exists) return { error: "Bu e-posta ile kayıtlı bir hesap var", values: keep(formData) };

  const passwordHash = await hashPassword(d.password);
  const result = db.transaction((tx) => {
    const org = tx.insert(schema.organizations).values({ name: d.org }).returning().get();
    const user = tx.insert(schema.users)
      .values({ orgId: org.id, name: d.name, email: d.email, passwordHash, role: "admin" })
      .returning().get();
    tx.insert(schema.sites).values({ orgId: org.id, name: d.site, code: randomCode() }).run();
    return { org, user };
  });

  await createSession({ userId: result.user.id, orgId: result.org.id, name: result.user.name });
  redirect("/panel");
}

const Login = z.object({
  email: z.string().trim().toLowerCase().email("Geçerli bir e-posta girin"),
  password: z.string().min(1, "Şifrenizi girin"),
  sonra: z.string().optional(),
});

export async function login(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = Login.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Form hatalı", values: keep(formData) };
  const u = db.select().from(schema.users).where(eq(schema.users.email, parsed.data.email)).get();
  // Kullanıcı yoksa da aynı mesaj: hesap varlığı sızdırılmasın
  if (!u || !(await verifyPassword(parsed.data.password, u.passwordHash))) {
    return { error: "E-posta veya şifre hatalı", values: keep(formData) };
  }
  await createSession({ userId: u.id, orgId: u.orgId, name: u.name });
  const next = parsed.data.sonra;
  redirect(next && next.startsWith("/panel") ? next : "/panel");
}

export async function logout() {
  await destroySession();
  redirect("/");
}
