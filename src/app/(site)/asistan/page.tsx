import type { Metadata } from "next";
import { GUIDES, ACCIDENT_TYPES, isAccidentType } from "@/lib/content";
import { createAssistantCase } from "@/app/actions/assistant";
import { todayIstanbul } from "@/lib/format";

export const metadata: Metadata = { title: "Kaza Sonrası Asistanı" };

type Props = { searchParams: Promise<{ tur?: string; hata?: string }> };

export default async function AssistantStart({ searchParams }: Props) {
  const sp = await searchParams;
  const selected = sp.tur && isAccidentType(sp.tur) ? sp.tur : "trafik";

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="h1">Kaza Sonrası Asistanı</h1>
      <p className="mt-3 text-muted">
        Size özel, tarihli bir yapılacaklar listesi hazırlayalım. Üyelik gerekmez; liste yalnızca size verilen
        gizli bağlantıyla açılır.
      </p>

      {sp.hata && (
        <p className="mt-4 rounded-lg bg-alert-soft p-3 text-sm text-alert">Lütfen kaza türünü ve tarihini seçin.</p>
      )}

      <form action={createAssistantCase} className="card mt-6 space-y-5">
        <fieldset>
          <legend className="label">Kaza türü</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {ACCIDENT_TYPES.map((t) => (
              <label key={t} className="flex cursor-pointer items-center gap-2 rounded-lg border border-line p-3 text-sm has-[:checked]:border-brand has-[:checked]:bg-brand-soft">
                <input type="radio" name="tur" value={t} defaultChecked={t === selected} className="accent-[var(--color-brand)]" />
                {GUIDES[t].title.replace(" geçirdim", "")}
              </label>
            ))}
          </div>
        </fieldset>
        <div>
          <label htmlFor="tarih" className="label">Kaza tarihi</label>
          <input id="tarih" name="tarih" type="date" required max={todayIstanbul()} defaultValue={todayIstanbul()} className="field" />
        </div>
        <button className="btn-primary w-full">Listemi oluştur</button>
        <p className="hint">
          Bu araç sağlık bilgisi veya kimlik bilgisi istemez. Notlar alanına yazdıklarınız yalnızca bağlantıya sahip
          olanlarca görülebilir.
        </p>
      </form>
    </div>
  );
}
