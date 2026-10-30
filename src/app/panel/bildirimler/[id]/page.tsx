import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { SeverityBadge, StatusBadge } from "@/components/status";
import { ActionList } from "@/components/action-list";
import { fmtDateTime } from "@/lib/format";
import { label, REPORT_KINDS, REPORT_STATUS } from "@/lib/labels";
import { addReportAction, updateReport } from "@/app/actions/reports";

type Props = { params: Promise<{ id: string }> };

export default async function ReportDetail({ params }: Props) {
  const s = await requireSession();
  const id = Number((await params).id);
  const r = db.select().from(schema.reports)
    .where(and(eq(schema.reports.id, id), eq(schema.reports.orgId, s.orgId))).get();
  if (!r) notFound();
  const site = db.select().from(schema.sites).where(eq(schema.sites.id, r.siteId)).get();
  const actions = db.select().from(schema.correctiveActions).where(eq(schema.correctiveActions.reportId, id)).all();

  return (
    <div className="space-y-6">
      <Link href="/panel/bildirimler" className="text-sm text-muted hover:text-ink">← Bildirimler</Link>
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="h1">{label(REPORT_KINDS, r.kind)} · {r.category}</h1>
        <SeverityBadge severity={r.severity} />
        <StatusBadge status={r.status} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="card space-y-3 lg:col-span-2">
          <p className="whitespace-pre-wrap leading-relaxed">{r.description}</p>
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            <div><dt className="text-muted">Lokasyon</dt><dd>{site?.name}{r.location ? ` · ${r.location}` : ""}</dd></div>
            <div><dt className="text-muted">Bildirim zamanı</dt><dd>{fmtDateTime(r.createdAt)}</dd></div>
            <div><dt className="text-muted">Bildiren</dt><dd>{r.reporterName ?? "Anonim"}</dd></div>
            {r.closedAt && <div><dt className="text-muted">Kapanış</dt><dd>{fmtDateTime(r.closedAt)}</dd></div>}
          </dl>
          {r.photoFile && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={`/api/foto/${r.photoFile}`} alt="Bildirim fotoğrafı" className="max-h-96 rounded-lg border border-line" />
          )}
        </section>

        <form key={`${r.status}|${r.actionNote ?? ""}`} action={updateReport} className="card space-y-3">
          <input type="hidden" name="id" value={r.id} />
          <h2 className="h2">Değerlendirme</h2>
          <div>
            <label htmlFor="status" className="label">Durum</label>
            <select id="status" name="status" defaultValue={r.status} className="field">
              {Object.entries(REPORT_STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="actionNote" className="label">Not / alınan önlem</label>
            <textarea id="actionNote" name="actionNote" rows={4} defaultValue={r.actionNote ?? ""} className="field" />
          </div>
          <button className="btn-primary w-full">Kaydet</button>
        </form>
      </div>

      <section className="card space-y-4">
        <h2 className="h2">Düzeltici / önleyici faaliyetler</h2>
        <ActionList actions={actions} back={`/panel/bildirimler/${r.id}`} />
        <form action={addReportAction} className="grid gap-3 sm:grid-cols-[1fr_180px_160px_auto] sm:items-end">
          <input type="hidden" name="reportId" value={r.id} />
          <div><label htmlFor="title" className="label">Faaliyet</label><input id="title" name="title" required className="field" /></div>
          <div><label htmlFor="owner" className="label">Sorumlu</label><input id="owner" name="owner" className="field" /></div>
          <div><label htmlFor="dueDate" className="label">Termin</label><input id="dueDate" name="dueDate" type="date" className="field" /></div>
          <button className="btn-secondary">Ekle</button>
        </form>
      </section>
    </div>
  );
}
