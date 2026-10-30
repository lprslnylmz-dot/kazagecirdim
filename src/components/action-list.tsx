import { toggleAction } from "@/app/actions/reports";
import { fmtDate, todayIstanbul } from "@/lib/format";

type Action = { id: number; title: string; owner: string | null; dueDate: string | null; status: string };

export function ActionList({ actions, back }: { actions: Action[]; back: string }) {
  if (actions.length === 0) return <p className="text-sm text-muted">Henüz faaliyet eklenmedi.</p>;
  const today = todayIstanbul();
  return (
    <ul className="divide-y divide-line rounded-lg border border-line">
      {actions.map((a) => {
        const done = a.status === "tamamlandi";
        const late = !done && a.dueDate && a.dueDate < today;
        return (
          <li key={a.id} className="flex items-center gap-3 px-3 py-2.5 text-sm">
            <form action={toggleAction}>
              <input type="hidden" name="id" value={a.id} />
              <input type="hidden" name="back" value={back} />
              <button aria-label="Durumu değiştir"
                className={`flex h-5 w-5 items-center justify-center rounded border-2 text-xs ${done ? "border-ok bg-ok text-white" : "border-line"}`}>
                {done ? "✓" : ""}
              </button>
            </form>
            <span className={`flex-1 ${done ? "text-muted line-through" : ""}`}>{a.title}</span>
            {a.owner && <span className="text-muted">{a.owner}</span>}
            {a.dueDate && <span className={`badge ${late ? "bg-alert-soft text-alert" : "bg-paper text-muted"}`}>{fmtDate(a.dueDate)}</span>}
          </li>
        );
      })}
    </ul>
  );
}
