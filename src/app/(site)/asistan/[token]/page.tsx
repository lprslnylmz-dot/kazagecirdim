import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { GUIDES, isAccidentType, scheduleChecklist } from "@/lib/content";
import { daysUntil } from "@/lib/workdays";
import { fmtDate } from "@/lib/format";
import { toggleAssistantItem, saveAssistantNote } from "@/app/actions/assistant";
import { CopyLink } from "@/components/copy-link";

export const metadata: Metadata = { title: "Yapılacaklar listem", robots: { index: false } };
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ token: string }> };

export default async function AssistantCase({ params }: Props) {
  const { token } = await params;
  const row = db.select().from(schema.assistantCases).where(eq(schema.assistantCases.token, token)).get();
  if (!row || !isAccidentType(row.accidentType)) notFound();

  const guide = GUIDES[row.accidentType];
  const done = new Set<string>(JSON.parse(row.doneKeys));
  const items = scheduleChecklist(row.accidentType, row.accidentDate);
  const doneCount = items.filter((i) => done.has(i.key)).length;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header>
        <p className="text-sm text-muted">{guide.title} · Kaza tarihi: {fmtDate(row.accidentDate)}</p>
        <h1 className="h1 mt-1">Yapılacaklar listem</h1>
        <p className="mt-2 text-sm text-muted">{doneCount} / {items.length} madde tamamlandı</p>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-line">
          <div className="h-full bg-brand" style={{ width: `${(doneCount / items.length) * 100}%` }} />
        </div>
      </header>

      <div className="no-print rounded-lg border border-warn bg-warn-soft p-4 text-sm">
        <strong>Bu bağlantıyı kaydedin.</strong> Listeniz yalnızca bu adresle açılır; kaybederseniz geri getiremeyiz.
        <CopyLink />
      </div>

      <ul className="space-y-2">
        {items.map((item) => {
          const isDone = done.has(item.key);
          const left = item.due ? daysUntil(item.due) : null;
          const urgent = !isDone && left !== null && left <= 1;
          return (
            <li key={item.key} className={`card flex items-start gap-3 p-4 ${isDone ? "opacity-60" : ""}`}>
              <form action={toggleAssistantItem}>
                <input type="hidden" name="token" value={token} />
                <input type="hidden" name="key" value={item.key} />
                <button
                  aria-label={isDone ? "Tamamlanmadı olarak işaretle" : "Tamamlandı olarak işaretle"}
                  className={`mt-0.5 flex h-6 w-6 items-center justify-center rounded-md border-2 ${isDone ? "border-brand bg-brand text-white" : "border-line bg-white"}`}
                >
                  {isDone ? "✓" : ""}
                </button>
              </form>
              <div className="flex-1">
                <p className={`font-medium ${isDone ? "line-through" : ""}`}>{item.label}</p>
                {item.detail && <p className="mt-0.5 text-sm text-muted">{item.detail}</p>}
              </div>
              {item.due && (
                <span className={`badge shrink-0 ${urgent ? (left! < 0 ? "bg-alert-soft text-alert" : "bg-warn-soft text-warn") : "bg-paper text-muted"}`}>
                  {item.approximate ? "Öneri: " : ""}{fmtDate(item.due)}
                </span>
              )}
            </li>
          );
        })}
      </ul>

      <form key={row.note ?? ""} action={saveAssistantNote} className="card space-y-3">
        <input type="hidden" name="token" value={token} />
        <label htmlFor="note" className="label">Notlarım</label>
        <textarea id="note" name="note" rows={5} defaultValue={row.note ?? ""} className="field"
          placeholder="Poliçe numarası, dosya numarası, görüştüğünüz kişiler…" />
        <p className="hint">Kimlik numarası, banka veya kart bilgisi yazmayın.</p>
        <button className="btn-secondary">Notu kaydet</button>
      </form>

      <p className="text-sm">
        <Link href={`/kaza/${guide.type}`} className="font-medium text-brand underline">Rehberin tamamını oku</Link>
      </p>
    </div>
  );
}
