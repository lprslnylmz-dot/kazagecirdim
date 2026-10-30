import Link from "next/link";
import { eq, sql } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { createSite } from "@/app/actions/reports";
import { baseUrl } from "@/lib/base-url";

export default async function SitesPage({ searchParams }: { searchParams: Promise<{ hata?: string }> }) {
  const s = await requireSession();
  const { hata } = await searchParams;
  const base = await baseUrl();
  const sites = db.select({
    id: schema.sites.id, name: schema.sites.name, code: schema.sites.code,
    reports: sql<number>`(select count(*) from reports r where r.site_id = ${schema.sites.id})`,
  }).from(schema.sites).where(eq(schema.sites.orgId, s.orgId)).all();

  return (
    <div className="space-y-6">
      <h1 className="h1">Lokasyonlar ve QR afişleri</h1>
      <p className="max-w-2xl text-muted">
        Her lokasyonun kendine ait bir bildirim bağlantısı var. Afişi yazdırıp çalışanların göreceği yerlere asın;
        telefon kamerasıyla okutan herkes uygulama indirmeden bildirim yapabilir.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        {sites.map((x) => (
          <div key={x.id} className="card space-y-2">
            <h2 className="h2">{x.name}</h2>
            <p className="break-all text-sm text-muted">{base}/b/{x.code}</p>
            <p className="text-sm">{x.reports} bildirim</p>
            <div className="flex flex-wrap gap-2 pt-2">
              <Link href={`/panel/lokasyonlar/${x.id}/afis`} className="btn-primary btn-sm">QR afişi</Link>
              <a href={`/b/${x.code}`} target="_blank" className="btn-secondary btn-sm">Formu aç</a>
            </div>
          </div>
        ))}
      </div>

      <form action={createSite} className="card flex flex-wrap items-end gap-3">
        <div className="min-w-60 flex-1">
          <label htmlFor="name" className="label">Yeni lokasyon</label>
          <input id="name" name="name" required minLength={2} className="field" placeholder="Ör. Depo, Şantiye 2, Ofis" />
          {hata && <p className="mt-1 text-xs text-alert">Lokasyon adı en az 2 karakter olmalı.</p>}
        </div>
        <button className="btn-secondary">Ekle</button>
      </form>
    </div>
  );
}
