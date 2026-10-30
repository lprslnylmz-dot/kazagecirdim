import Link from "next/link";
import { and, desc, eq, type SQL } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { SeverityBadge, StatusBadge } from "@/components/status";
import { fmtDateTime } from "@/lib/format";
import { label, REPORT_KINDS, REPORT_STATUS } from "@/lib/labels";

type Props = { searchParams: Promise<{ durum?: string; lokasyon?: string }> };

export default async function ReportsList({ searchParams }: Props) {
  const s = await requireSession();
  const sp = await searchParams;
  const sites = db.select().from(schema.sites).where(eq(schema.sites.orgId, s.orgId)).all();

  const conds: SQL[] = [eq(schema.reports.orgId, s.orgId)];
  if (sp.durum && sp.durum in REPORT_STATUS) conds.push(eq(schema.reports.status, sp.durum));
  if (sp.lokasyon) conds.push(eq(schema.reports.siteId, Number(sp.lokasyon)));

  const rows = db.select().from(schema.reports).where(and(...conds))
    .orderBy(desc(schema.reports.createdAt)).limit(200).all();
  const siteName = new Map(sites.map((x) => [x.id, x.name]));

  return (
    <div className="space-y-4">
      <h1 className="h1">Ramak kala ve güvensizlik bildirimleri</h1>

      <form className="flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="durum" className="label">Durum</label>
          <select id="durum" name="durum" defaultValue={sp.durum ?? ""} className="field">
            <option value="">Tümü</option>
            {Object.entries(REPORT_STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="lokasyon" className="label">Lokasyon</label>
          <select id="lokasyon" name="lokasyon" defaultValue={sp.lokasyon ?? ""} className="field">
            <option value="">Tümü</option>
            {sites.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
          </select>
        </div>
        <button className="btn-secondary">Filtrele</button>
      </form>

      <div className="overflow-x-auto rounded-xl border border-line bg-white">
        <table className="w-full text-sm">
          <thead className="bg-paper text-left text-muted">
            <tr>
              <th className="px-4 py-2.5 font-medium">Tarih</th>
              <th className="px-4 py-2.5 font-medium">Tür / konu</th>
              <th className="px-4 py-2.5 font-medium">Lokasyon</th>
              <th className="px-4 py-2.5 font-medium">Önem</th>
              <th className="px-4 py-2.5 font-medium">Durum</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-paper">
                <td className="whitespace-nowrap px-4 py-2.5 text-muted">{fmtDateTime(r.createdAt)}</td>
                <td className="px-4 py-2.5">
                  <Link href={`/panel/bildirimler/${r.id}`} className="font-medium hover:text-brand">
                    {label(REPORT_KINDS, r.kind)} · {r.category}
                  </Link>
                  <p className="line-clamp-1 text-muted">{r.description}</p>
                </td>
                <td className="px-4 py-2.5">{siteName.get(r.siteId)}</td>
                <td className="px-4 py-2.5"><SeverityBadge severity={r.severity} /></td>
                <td className="px-4 py-2.5"><StatusBadge status={r.status} /></td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-muted">Bu filtreye uyan bildirim yok.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
