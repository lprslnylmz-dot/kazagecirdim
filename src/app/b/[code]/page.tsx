import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { ReportForm } from "./report-form";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Ramak kala bildirimi", robots: { index: false } };

type Props = { params: Promise<{ code: string }> };

export default async function ReportPage({ params }: Props) {
  const { code } = await params;
  const site = db.select().from(schema.sites).where(eq(schema.sites.code, code)).get();
  if (!site) notFound();
  const org = db.select().from(schema.organizations).where(eq(schema.organizations.id, site.orgId)).get();

  return (
    <main className="mx-auto max-w-md px-4 py-6">
      <p className="text-xs font-semibold uppercase tracking-wide text-brand">{org?.name}</p>
      <h1 className="mt-1 text-2xl font-bold">Bir risk mi gördünüz?</h1>
      <p className="mt-2 text-sm text-muted">
        {site.name} · Bildiriminiz kazaları önlemeye yardım eder. İsminizi yazmak zorunda değilsiniz.
      </p>
      <div className="mt-3 rounded-lg bg-alert-soft p-3 text-sm text-alert">
        Yaralanma veya yangın varsa önce <a href="tel:112" className="font-bold underline">112</a>'yi arayın ve amirinize haber verin.
      </div>
      <ReportForm code={code} />
      <p className="mt-6 text-center text-xs text-muted">kazagecirdim.com ile çalışır</p>
    </main>
  );
}
