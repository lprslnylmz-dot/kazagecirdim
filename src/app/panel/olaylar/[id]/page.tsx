import Link from "next/link";
import { notFound } from "next/navigation";
import { and, asc, eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { SgkBadge } from "@/components/status";
import { ActionList } from "@/components/action-list";
import { fmtDate, fmtDateTime } from "@/lib/format";
import { INCIDENT_CHECKLIST, label, PHASE_LABEL, ROOT_CAUSE_CATEGORIES, TREATMENT } from "@/lib/labels";
import {
  addIncidentAction, addWitness, markNotified, saveReturnToWork, saveRootCause, setIncidentStatus, toggleChecklistItem,
} from "@/app/actions/incidents";

type Props = { params: Promise<{ id: string }> };

export default async function IncidentDetail({ params }: Props) {
  const s = await requireSession();
  const id = Number((await params).id);
  const inc = db.select().from(schema.incidents)
    .where(and(eq(schema.incidents.id, id), eq(schema.incidents.orgId, s.orgId))).get();
  if (!inc) notFound();

  const site = inc.siteId ? db.select().from(schema.sites).where(eq(schema.sites.id, inc.siteId)).get() : null;
  const checklist = db.select().from(schema.incidentChecklist)
    .where(eq(schema.incidentChecklist.incidentId, id)).orderBy(asc(schema.incidentChecklist.id)).all();
  const witnesses = db.select().from(schema.witnesses).where(eq(schema.witnesses.incidentId, id)).all();
  const rc = db.select().from(schema.rootCauses).where(eq(schema.rootCauses.incidentId, id)).get();
  const actions = db.select().from(schema.correctiveActions).where(eq(schema.correctiveActions.incidentId, id)).all();
  const doneCount = checklist.filter((c) => c.doneAt).length;
  const phases = [...new Set(INCIDENT_CHECKLIST.map((c) => c.phase))];
  const whys = [rc?.why1, rc?.why2, rc?.why3, rc?.why4, rc?.why5];

  return (
    <div className="space-y-6">
      <Link href="/panel/olaylar" className="text-sm text-muted hover:text-ink">← Kaza dosyaları</Link>

      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="h1">{inc.title}</h1>
          <p className="mt-1 text-sm text-muted">
            {fmtDateTime(inc.occurredAt)} · {site?.name ?? "Lokasyon yok"} · {label(TREATMENT, inc.treatment)}
            {inc.employeeName ? ` · ${inc.employeeName}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/panel/olaylar/${id}/rapor`} className="btn-secondary">Rapor</Link>
          <form action={setIncidentStatus}>
            <input type="hidden" name="id" value={id} />
            <button className="btn-secondary">{inc.status === "acik" ? "Dosyayı kapat" : "Yeniden aç"}</button>
          </form>
        </div>
      </header>

      {/* Yasal bildirimler */}
      <section className="grid gap-4 sm:grid-cols-2">
        <div className={`card ${inc.sgkNotifiedAt ? "" : "border-alert"}`}>
          <div className="flex items-center justify-between gap-2">
            <h2 className="h2">SGK bildirimi</h2>
            <SgkBadge deadline={inc.sgkDeadline} notifiedAt={inc.sgkNotifiedAt} />
          </div>
          <p className="mt-2 text-sm text-muted">
            Son gün <strong className="text-ink">{fmtDate(inc.sgkDeadline)}</strong> (kazadan sonraki 3 iş günü).
            Geç bildirimde o tarihe kadar ödenen geçici iş göremezlik ödeneği işverenden tahsil edilir ve idari para cezası uygulanır.
          </p>
          {inc.sgkNotifiedAt && <p className="mt-2 text-sm">Bildirim: {fmtDateTime(inc.sgkNotifiedAt)}</p>}
          <form action={markNotified} className="mt-3">
            <input type="hidden" name="id" value={id} />
            <input type="hidden" name="which" value="sgk" />
            <button className={inc.sgkNotifiedAt ? "btn-secondary btn-sm" : "btn-primary btn-sm"}>
              {inc.sgkNotifiedAt ? "İşareti kaldır" : "SGK'ya bildirildi olarak işaretle"}
            </button>
          </form>
        </div>
        <div className="card">
          <div className="flex items-center justify-between gap-2">
            <h2 className="h2">Kolluk bildirimi</h2>
            {inc.policeNotifiedAt
              ? <span className="badge bg-ok-soft text-ok">Bildirildi</span>
              : <span className="badge bg-alert-soft text-alert">Derhal yapılmalı</span>}
          </div>
          <p className="mt-2 text-sm text-muted">İş kazası, kazanın olduğu yerin yetkili kolluk kuvvetine derhal bildirilmelidir.</p>
          <form action={markNotified} className="mt-3">
            <input type="hidden" name="id" value={id} />
            <input type="hidden" name="which" value="kolluk" />
            <button className="btn-secondary btn-sm">{inc.policeNotifiedAt ? "İşareti kaldır" : "Bildirildi olarak işaretle"}</button>
          </form>
        </div>
      </section>

      {/* 72 saat listesi */}
      <section className="card">
        <div className="flex items-center justify-between">
          <h2 className="h2">İlk 72 saat kontrol listesi</h2>
          <span className="text-sm text-muted">{doneCount} / {checklist.length}</span>
        </div>
        <div className="mt-4 grid gap-6 lg:grid-cols-3">
          {phases.map((phase) => (
            <div key={phase}>
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">{PHASE_LABEL[phase]}</h3>
              <ul className="space-y-2">
                {checklist.filter((c) => c.phase === phase).map((c) => (
                  <li key={c.id} className="flex items-start gap-2 text-sm">
                    <form action={toggleChecklistItem}>
                      <input type="hidden" name="incidentId" value={id} />
                      <input type="hidden" name="itemId" value={c.id} />
                      <button aria-label="İşaretle"
                        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 text-xs ${c.doneAt ? "border-ok bg-ok text-white" : "border-line bg-white"}`}>
                        {c.doneAt ? "✓" : ""}
                      </button>
                    </form>
                    <span className={c.doneAt ? "text-muted line-through" : ""}>{c.label}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {inc.injury && (
        <section className="card">
          <h2 className="h2">Olayın tanımı</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">{inc.injury}</p>
        </section>
      )}

      {/* Tanıklar */}
      <section className="card space-y-4">
        <h2 className="h2">Tanık ifadeleri ({witnesses.length})</h2>
        {witnesses.map((w) => (
          <blockquote key={w.id} className="border-l-4 border-brand pl-4 text-sm">
            <p className="whitespace-pre-wrap">{w.statement}</p>
            <footer className="mt-1 text-muted">— {w.name}, {fmtDateTime(w.createdAt)}</footer>
          </blockquote>
        ))}
        <form action={addWitness} className="space-y-3 rounded-lg bg-paper p-4">
          <input type="hidden" name="incidentId" value={id} />
          <div><label htmlFor="wname" className="label">Tanık adı</label><input id="wname" name="name" required className="field" /></div>
          <div>
            <label htmlFor="statement" className="label">İfade</label>
            <textarea id="statement" name="statement" rows={3} required className="field"
              placeholder="Tanığın kendi cümleleriyle: ne gördü, nerede duruyordu, kaza öncesi ne oluyordu?" />
            <p className="hint">Tanıkları birbirinden ayrı ve bekletmeden dinleyin; yorum değil gözlem kaydedin.</p>
          </div>
          <button className="btn-secondary">İfadeyi ekle</button>
        </form>
      </section>

      {/* Kök neden */}
      <form key={rc?.updatedAt ?? "yeni"} action={saveRootCause} className="card space-y-3">
        <input type="hidden" name="incidentId" value={id} />
        <h2 className="h2">Kök neden analizi (5 Neden)</h2>
        <p className="text-sm text-muted">Her cevaba tekrar "neden?" diye sorun. Amaç suçlu değil, sistemdeki açığı bulmaktır.</p>
        {whys.map((w, i) => (
          <div key={i}>
            <label htmlFor={`why${i + 1}`} className="label">{i + 1}. Neden?</label>
            <input id={`why${i + 1}`} name={`why${i + 1}`} defaultValue={w ?? ""} className="field" />
          </div>
        ))}
        <div className="grid gap-3 sm:grid-cols-[1fr_240px]">
          <div><label htmlFor="rootCause" className="label">Kök neden</label><textarea id="rootCause" name="rootCause" rows={2} defaultValue={rc?.rootCause ?? ""} className="field" /></div>
          <div>
            <label htmlFor="category" className="label">Kategori</label>
            <select id="category" name="category" defaultValue={rc?.category ?? ""} className="field">
              <option value="">Seçin</option>
              {Object.entries(ROOT_CAUSE_CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
        </div>
        <button className="btn-primary">Analizi kaydet</button>
      </form>

      {/* DÖF */}
      <section className="card space-y-4">
        <h2 className="h2">Düzeltici / önleyici faaliyetler</h2>
        <ActionList actions={actions} back={`/panel/olaylar/${id}`} />
        <form action={addIncidentAction} className="grid gap-3 sm:grid-cols-[1fr_180px_160px_auto] sm:items-end">
          <input type="hidden" name="incidentId" value={id} />
          <div><label htmlFor="atitle" className="label">Faaliyet</label><input id="atitle" name="title" required className="field" /></div>
          <div><label htmlFor="aowner" className="label">Sorumlu</label><input id="aowner" name="owner" className="field" /></div>
          <div><label htmlFor="adue" className="label">Termin</label><input id="adue" name="dueDate" type="date" className="field" /></div>
          <button className="btn-secondary">Ekle</button>
        </form>
      </section>

      {/* İşe dönüş */}
      <form key={inc.returnToWorkNote ?? ""} action={saveReturnToWork} className="card space-y-3">
        <input type="hidden" name="incidentId" value={id} />
        <h2 className="h2">İşe dönüş planı</h2>
        <p className="text-sm text-muted">
          Doktor önerisine göre kademeli dönüş, geçici görev değişikliği ve takip görüşmeleri. Sağlık bilgisi yazmayın;
          yalnızca çalışanın onayladığı iş düzenlemelerini kaydedin.
        </p>
        <textarea name="note" rows={4} defaultValue={inc.returnToWorkNote ?? ""} className="field"
          placeholder="Ör. İlk 2 hafta pres hattı dışında görev; 1. ve 4. haftada takip görüşmesi." />
        <button className="btn-secondary">Kaydet</button>
      </form>
    </div>
  );
}
