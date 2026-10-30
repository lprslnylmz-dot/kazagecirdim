"use client";

import { useActionState } from "react";
import { createIncident } from "@/app/actions/incidents";
import { TREATMENT } from "@/lib/labels";

function nowLocal() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

export function NewIncidentForm({ sites }: { sites: { id: number; name: string }[] }) {
  const [state, action, pending] = useActionState(createIncident, undefined);
  const v = state?.values ?? {};
  return (
    <form key={JSON.stringify(v)} action={action} className="card space-y-4">
      {state?.error && <p role="alert" className="rounded-lg bg-alert-soft p-3 text-sm text-alert">{state.error}</p>}
      <div>
        <label htmlFor="title" className="label">Kısa başlık</label>
        <input id="title" name="title" required className="field" defaultValue={v.title} placeholder="Ör. Pres hattında el sıkışması" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="occurredAt" className="label">Kaza tarihi ve saati</label>
          <input id="occurredAt" name="occurredAt" type="datetime-local" required defaultValue={v.occurredAt ?? nowLocal()} suppressHydrationWarning className="field" />
        </div>
        <div>
          <label htmlFor="siteId" className="label">Lokasyon</label>
          <select id="siteId" name="siteId" className="field" defaultValue={v.siteId}>
            {sites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="employeeName" className="label">Kaza geçiren çalışan</label>
          <input id="employeeName" name="employeeName" className="field" defaultValue={v.employeeName} />
          <p className="hint">Kimlik numarası girmeyin; SGK bildirimi e-Bildirge üzerinden yapılır.</p>
        </div>
        <div>
          <label htmlFor="treatment" className="label">Tedavi durumu</label>
          <select id="treatment" name="treatment" className="field" defaultValue={v.treatment ?? "ayakta"}>
            {Object.entries(TREATMENT).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label htmlFor="injury" className="label">Ne oldu? Yaralanmanın kısa tanımı</label>
        <textarea id="injury" name="injury" rows={3} className="field" defaultValue={v.injury} />
      </div>
      <button disabled={pending} className="btn-danger w-full">{pending ? "Kaydediliyor…" : "Dosyayı aç ve SGK süresini hesapla"}</button>
    </form>
  );
}
