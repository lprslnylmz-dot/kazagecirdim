import { and, eq, gte, lt } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { avgCloseDays, countBy, isValidMonth, monthRange } from "@/lib/report-stats";
import { label, REPORT_KINDS, SEVERITY } from "@/lib/labels";
import { todayIstanbul } from "@/lib/format";
import { PrintButton } from "@/components/print-button";

type Props = { searchParams: Promise<{ ay?: string }> };

export default async function MonthlyReport({ searchParams }: Props) {
  const s = await requireSession();
  const { ay } = await searchParams;
  const month = isValidMonth(ay) ? ay : todayIstanbul().slice(0, 7);
  const { from, to } = monthRange(month);

  const org = db.select().from(schema.organizations).where(eq(schema.organizations.id, s.orgId)).get();
  const sites = db.select().from(schema.sites).where(eq(schema.sites.orgId, s.orgId)).all();
  const siteName = new Map(sites.map((x) => [String(x.id), x.name]));

  const rows = db.select().from(schema.reports).where(and(
    eq(schema.reports.orgId, s.orgId), gte(schema.reports.createdAt, from), lt(schema.reports.createdAt, to),
  )).all();
  const incidents = db.select().from(schema.incidents).where(and(
    eq(schema.incidents.orgId, s.orgId), gte(schema.incidents.occurredAt, from.slice(0, 10)), lt(schema.incidents.occurredAt, to.slice(0, 10)),
  )).all();
  const openActions = db.select().from(schema.correctiveActions)
    .where(and(eq(schema.correctiveActions.orgId, s.orgId), eq(schema.correctiveActions.status, "acik"))).all();

  const monthLabel = new Date(`${month}-15T12:00:00`).toLocaleDateString("tr-TR", { month: "long", year: "numeric" });
  const closed = rows.filter((r) => r.status === "kapandi").length;
  const avg = avgCloseDays(rows);
  const maxCat = Math.max(1, ...countBy(rows, (r) => r.category).map((c) => c.count));

  return (
    <div className="space-y-6">
      <div className="no-print flex flex-wrap items-end justify-between gap-3">
        <form className="flex items-end gap-2">
          <div>
            <label htmlFor="ay" className="label">Ay</label>
            <input id="ay" name="ay" type="month" defaultValue={month} className="field" />
          </div>
          <button className="btn-secondary">Göster</button>
        </form>
        <PrintButton label="Raporu yazdır / PDF" />
      </div>

      <header>
        <p className="text-sm text-muted">{org?.name}</p>
        <h1 className="h1">İSG aylık raporu · {monthLabel}</h1>
      </header>

      <section className="grid gap-4 sm:grid-cols-4">
        <Kpi label="Bildirim" value={rows.length} />
        <Kpi label="Kapanan bildirim" value={closed} />
        <Kpi label="Ort. kapanma süresi" value={avg === null ? "—" : `${avg.toLocaleString("tr-TR")} gün`} />
        <Kpi label="İş kazası" value={incidents.length} tone={incidents.length ? "alert" : undefined} />
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="card">
          <h2 className="h2">Konuya göre bildirimler</h2>
          {rows.length === 0 ? <p className="mt-3 text-sm text-muted">Bu ay bildirim yok.</p> : (
            <ul className="mt-4 space-y-2.5">
              {countBy(rows, (r) => r.category).map((c) => (
                <li key={c.key} className="text-sm">
                  <div className="flex justify-between"><span>{c.key}</span><span className="font-semibold">{c.count}</span></div>
                  <div className="mt-1 h-2 rounded-full bg-paper">
                    <div className="h-full rounded-full bg-brand" style={{ width: `${(c.count / maxCat) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card space-y-5">
          <Breakdown title="Türe göre" items={countBy(rows, (r) => r.kind).map((c) => ({ ...c, key: label(REPORT_KINDS, c.key) }))} />
          <Breakdown title="Önem derecesine göre" items={countBy(rows, (r) => r.severity).map((c) => ({ ...c, key: SEVERITY[Number(c.key) as 1 | 2 | 3] }))} />
          <Breakdown title="Lokasyona göre" items={countBy(rows, (r) => r.siteId).map((c) => ({ ...c, key: siteName.get(c.key) ?? c.key }))} />
        </section>
      </div>

      <section className="card">
        <h2 className="h2">Açık düzeltici faaliyetler ({openActions.length})</h2>
        {openActions.length === 0 ? <p className="mt-2 text-sm text-muted">Açık faaliyet yok.</p> : (
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
            {openActions.map((a) => <li key={a.id}>{a.title}{a.owner ? ` — ${a.owner}` : ""}{a.dueDate ? ` (termin ${a.dueDate})` : ""}</li>)}
          </ul>
        )}
      </section>
    </div>
  );
}

function Kpi({ label, value, tone }: { label: string; value: number | string; tone?: "alert" }) {
  return (
    <div className={`card ${tone === "alert" ? "border-alert" : ""}`}>
      <p className="text-sm text-muted">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${tone === "alert" ? "text-alert" : ""}`}>{value}</p>
    </div>
  );
}

function Breakdown({ title, items }: { title: string; items: { key: string; count: number }[] }) {
  return (
    <div>
      <h3 className="text-sm font-semibold">{title}</h3>
      {items.length === 0 ? <p className="text-sm text-muted">—</p> : (
        <ul className="mt-1 text-sm">
          {items.map((i) => <li key={i.key} className="flex justify-between border-b border-line py-1"><span>{i.key}</span><span>{i.count}</span></li>)}
        </ul>
      )}
    </div>
  );
}
