import Link from "next/link";
import { and, desc, eq, gte, ne, sql } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { SgkBadge, StatusBadge } from "@/components/status";
import { fmtDateTime } from "@/lib/format";
import { label, REPORT_KINDS } from "@/lib/labels";

export default async function Dashboard() {
  const s = await requireSession();
  const since = new Date(Date.now() - 30 * 86_400_000).toISOString();

  const openIncidents = db.select().from(schema.incidents)
    .where(and(eq(schema.incidents.orgId, s.orgId), eq(schema.incidents.status, "acik")))
    .orderBy(desc(schema.incidents.occurredAt)).all();
  const pendingSgk = openIncidents.filter((i) => !i.sgkNotifiedAt);

  const openReports = db.select({ n: sql<number>`count(*)` }).from(schema.reports)
    .where(and(eq(schema.reports.orgId, s.orgId), ne(schema.reports.status, "kapandi"))).get()?.n ?? 0;
  const last30 = db.select({ n: sql<number>`count(*)` }).from(schema.reports)
    .where(and(eq(schema.reports.orgId, s.orgId), gte(schema.reports.createdAt, since))).get()?.n ?? 0;
  const openActions = db.select({ n: sql<number>`count(*)` }).from(schema.correctiveActions)
    .where(and(eq(schema.correctiveActions.orgId, s.orgId), eq(schema.correctiveActions.status, "acik"))).get()?.n ?? 0;

  const recent = db.select().from(schema.reports).where(eq(schema.reports.orgId, s.orgId))
    .orderBy(desc(schema.reports.createdAt)).limit(5).all();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="h1">Özet</h1>
        <Link href="/panel/olaylar/yeni" className="btn-danger">+ Kaza kaydı aç</Link>
      </div>

      {pendingSgk.length > 0 && (
        <section className="rounded-xl border border-alert bg-alert-soft p-4">
          <h2 className="font-semibold text-alert">SGK bildirimi bekleyen kazalar</h2>
          <ul className="mt-2 space-y-2">
            {pendingSgk.map((i) => (
              <li key={i.id} className="flex flex-wrap items-center gap-2 text-sm">
                <Link href={`/panel/olaylar/${i.id}`} className="font-medium underline">{i.title}</Link>
                <SgkBadge deadline={i.sgkDeadline} notifiedAt={i.sgkNotifiedAt} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="grid gap-4 sm:grid-cols-4">
        <Stat label="Açık kaza dosyası" value={openIncidents.length} href="/panel/olaylar" />
        <Stat label="Açık bildirim" value={openReports} href="/panel/bildirimler" />
        <Stat label="Son 30 gün bildirim" value={last30} href="/panel/rapor" />
        <Stat label="Açık DÖF" value={openActions} href="/panel/bildirimler" />
      </section>

      <section className="card">
        <div className="flex items-center justify-between">
          <h2 className="h2">Son bildirimler</h2>
          <Link href="/panel/bildirimler" className="text-sm text-brand underline">Tümü</Link>
        </div>
        {recent.length === 0 ? (
          <p className="mt-3 text-sm text-muted">
            Henüz bildirim yok. <Link href="/panel/lokasyonlar" className="text-brand underline">QR afişini yazdırıp</Link> işyerinize asın.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-line">
            {recent.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm">
                <Link href={`/panel/bildirimler/${r.id}`} className="font-medium hover:text-brand">
                  {label(REPORT_KINDS, r.kind)} · {r.category}
                </Link>
                <span className="flex items-center gap-2 text-muted">{fmtDateTime(r.createdAt)} <StatusBadge status={r.status} /></span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value, href }: { label: string; value: number; href: string }) {
  return (
    <Link href={href} className="card hover:shadow-sm">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-1 text-3xl font-bold">{value}</p>
    </Link>
  );
}
