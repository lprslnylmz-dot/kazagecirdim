"use client";

import { useActionState } from "react";
import { submitReport } from "@/app/actions/reports";
import { REPORT_CATEGORIES, REPORT_KINDS, SEVERITY } from "@/lib/labels";

export function ReportForm({ code }: { code: string }) {
  const [state, action, pending] = useActionState(submitReport, undefined);
  const vals = state?.values ?? {};

  if (state?.ok) {
    return (
      <div className="card mt-6 text-center">
        <p className="text-4xl" aria-hidden>✓</p>
        <h2 className="mt-2 text-lg font-semibold">Teşekkürler, bildiriminiz alındı</h2>
        <p className="mt-2 text-sm text-muted">İSG ekibi inceleyecek. Gördüğünüz her risk bir kazayı önleyebilir.</p>
        <a href={`/b/${code}`} className="btn-secondary mt-4">Yeni bildirim</a>
      </div>
    );
  }

  return (
    <form key={JSON.stringify(vals)} action={action} className="mt-6 space-y-5">
      <input type="hidden" name="code" value={code} />
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />

      {state?.error && <p role="alert" className="rounded-lg bg-alert-soft p-3 text-sm text-alert">{state.error}</p>}

      <fieldset>
        <legend className="label">Ne bildirmek istiyorsunuz?</legend>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(REPORT_KINDS).map(([k, v], i) => (
            <label key={k} className="flex cursor-pointer items-center gap-2 rounded-lg border border-line bg-white p-3 text-sm has-[:checked]:border-brand has-[:checked]:bg-brand-soft">
              <input type="radio" name="kind" value={k} defaultChecked={vals.kind ? vals.kind === k : i === 0} required />
              {v}
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <label htmlFor="category" className="label">Konu</label>
        <select id="category" name="category" className="field" required defaultValue={vals.category ?? ""}>
          <option value="" disabled>Seçin</option>
          {REPORT_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div>
        <label htmlFor="description" className="label">Ne gördünüz?</label>
        <textarea id="description" name="description" rows={4} required minLength={5} className="field" defaultValue={vals.description}
          placeholder="Ör. Depo girişinde yağ dökülmüş, forklift geçerken kayma riski var." />
      </div>

      <div>
        <label htmlFor="location" className="label">Tam yeri (isteğe bağlı)</label>
        <input id="location" name="location" className="field" defaultValue={vals.location} placeholder="Ör. B hattı, 3 numaralı pres yanı" />
      </div>

      <fieldset>
        <legend className="label">Ne kadar ciddi?</legend>
        <div className="grid grid-cols-3 gap-2">
          {Object.entries(SEVERITY).map(([k, v]) => (
            <label key={k} className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-line bg-white p-2.5 text-sm has-[:checked]:border-brand has-[:checked]:bg-brand-soft">
              <input type="radio" name="severity" value={k} defaultChecked={k === (vals.severity ?? "2")} className="sr-only" />
              {v}
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <label htmlFor="photo" className="label">Fotoğraf (isteğe bağlı)</label>
        <input id="photo" name="photo" type="file" accept="image/jpeg,image/png,image/webp" capture="environment" className="field" />
        <p className="hint">En fazla 5 MB. Yüzleri görünen kişilerin fotoğrafını çekmeyin.</p>
      </div>

      <div>
        <label htmlFor="reporterName" className="label">Adınız (isteğe bağlı)</label>
        <input id="reporterName" name="reporterName" className="field" defaultValue={vals.reporterName} placeholder="Boş bırakırsanız anonim kalır" />
      </div>

      <button disabled={pending} className="btn-primary w-full py-3 text-base">
        {pending ? "Gönderiliyor…" : "Bildirimi gönder"}
      </button>
    </form>
  );
}
