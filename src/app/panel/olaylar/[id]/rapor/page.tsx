import { notFound } from "next/navigation";
import { and, asc, eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { fmtDate, fmtDateTime } from "@/lib/format";
import { label, PHASE_LABEL, ROOT_CAUSE_CATEGORIES, TREATMENT } from "@/lib/labels";
import { PrintButton } from "@/components/print-button";

export default async function IncidentReport({ params }: { params: Promise<{ id: string }> }) {
  const s = await requireSession();
  const id = Number((await params).id);
  const inc = db.select().from(schema.incidents)
    .where(and(eq(schema.incidents.id, id), eq(schema.incidents.orgId, s.orgId))).get();
  if (!inc) notFound();
  const org = db.select().from(schema.organizations).where(eq(schema.organizations.id, s.orgId)).get();
  const site = inc.siteId ? db.select().from(schema.sites).where(eq(schema.sites.id, inc.siteId)).get() : null;
  const checklist = db.select().from(schema.incidentChecklist)
    .where(eq(schema.incidentChecklist.incidentId, id)).orderBy(asc(schema.incidentChecklist.id)).all();
  const witnesses = db.select().from(schema.witnesses).where(eq(schema.witnesses.incidentId, id)).all();
  const rc = db.select().from(schema.rootCauses).where(eq(schema.rootCauses.incidentId, id)).get();
  const actions = db.select().from(schema.correctiveActions).where(eq(schema.correctiveActions.incidentId, id)).all();
  const whys = [rc?.why1, rc?.why2, rc?.why3, rc?.why4, rc?.why5].filter(Boolean);

  return (
    <article className="mx-auto max-w-3xl space-y-6 bg-white p-6 text-sm sm:p-10">
      <div className="no-print flex justify-end"><PrintButton label="Yazdır / PDF" /></div>

      <header className="border-b-2 border-ink pb-4">
        <p className="text-muted">{org?.name} · Kaza inceleme raporu</p>
        <h1 className="mt-1 text-2xl font-bold">{inc.title}</h1>
        <p className="mt-1 text-muted">Rapor tarihi: {fmtDate(new Date().toISOString())} · Dosya no: {inc.id}</p>
      </header>

      <section>
        <h2 className="mb-2 font-bold">1. Olay bilgileri</h2>
        <table className="w-full border-collapse">
          <tbody>
            {[
              ["Tarih ve saat", fmtDateTime(inc.occurredAt)],
              ["Lokasyon", site?.name ?? "—"],
              ["Kaza geçiren", inc.employeeName ?? "—"],
              ["Tedavi durumu", label(TREATMENT, inc.treatment)],
              ["SGK bildirimi son günü", fmtDate(inc.sgkDeadline)],
              ["SGK bildirimi", inc.sgkNotifiedAt ? fmtDateTime(inc.sgkNotifiedAt) : "Yapılmadı"],
              ["Kolluk bildirimi", inc.policeNotifiedAt ? fmtDateTime(inc.policeNotifiedAt) : "Kayıt yok"],
            ].map(([k, v]) => (
              <tr key={k} className="border-b border-line"><th className="w-56 py-1.5 text-left font-medium text-muted">{k}</th><td className="py-1.5">{v}</td></tr>
            ))}
          </tbody>
        </table>
        {inc.injury && <p className="mt-3 whitespace-pre-wrap">{inc.injury}</p>}
      </section>

      <section>
        <h2 className="mb-2 font-bold">2. İlk 72 saat uygulamaları</h2>
        <ul className="space-y-1">
          {checklist.map((c) => (
            <li key={c.id}>
              {c.doneAt ? "☑" : "☐"} {c.label} <span className="text-muted">({PHASE_LABEL[c.phase as keyof typeof PHASE_LABEL]}{c.doneAt ? `, ${fmtDateTime(c.doneAt)}` : ""})</span>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-2 font-bold">3. Tanık ifadeleri</h2>
        {witnesses.length === 0 ? <p className="text-muted">Kayıt yok.</p> : witnesses.map((w) => (
          <div key={w.id} className="mb-3"><p className="font-medium">{w.name}</p><p className="whitespace-pre-wrap">{w.statement}</p></div>
        ))}
      </section>

      <section>
        <h2 className="mb-2 font-bold">4. Kök neden analizi</h2>
        {whys.length === 0 && !rc?.rootCause ? <p className="text-muted">Henüz yapılmadı.</p> : (
          <>
            <ol className="list-decimal space-y-1 pl-5">{whys.map((w, i) => <li key={i}>{w}</li>)}</ol>
            <p className="mt-2"><strong>Kök neden:</strong> {rc?.rootCause ?? "—"} {rc?.category ? `(${label(ROOT_CAUSE_CATEGORIES, rc.category)})` : ""}</p>
          </>
        )}
      </section>

      <section>
        <h2 className="mb-2 font-bold">5. Düzeltici / önleyici faaliyetler</h2>
        {actions.length === 0 ? <p className="text-muted">Kayıt yok.</p> : (
          <table className="w-full border-collapse">
            <thead><tr className="border-b-2 border-line text-left"><th className="py-1.5">Faaliyet</th><th>Sorumlu</th><th>Termin</th><th>Durum</th></tr></thead>
            <tbody>
              {actions.map((a) => (
                <tr key={a.id} className="border-b border-line">
                  <td className="py-1.5">{a.title}</td><td>{a.owner ?? "—"}</td><td>{fmtDate(a.dueDate)}</td>
                  <td>{a.status === "tamamlandi" ? "Tamamlandı" : "Açık"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {inc.returnToWorkNote && (
        <section>
          <h2 className="mb-2 font-bold">6. İşe dönüş planı</h2>
          <p className="whitespace-pre-wrap">{inc.returnToWorkNote}</p>
        </section>
      )}

      <footer className="grid grid-cols-2 gap-8 pt-10 text-center text-muted">
        <div className="border-t border-ink pt-2">İSG Uzmanı</div>
        <div className="border-t border-ink pt-2">İşveren / İşveren vekili</div>
      </footer>
    </article>
  );
}
