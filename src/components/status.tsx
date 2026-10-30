import { daysUntil } from "@/lib/workdays";
import { fmtDate } from "@/lib/format";
import { REPORT_STATUS, SEVERITY } from "@/lib/labels";

const STATUS_STYLE: Record<string, string> = {
  yeni: "bg-warn-soft text-warn",
  inceleniyor: "bg-brand-soft text-brand",
  aksiyonda: "bg-brand-soft text-brand",
  kapandi: "bg-ok-soft text-ok",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`badge ${STATUS_STYLE[status] ?? "bg-paper text-muted"}`}>
      {REPORT_STATUS[status as keyof typeof REPORT_STATUS] ?? status}
    </span>
  );
}

export function SeverityBadge({ severity }: { severity: number }) {
  const style = severity >= 3 ? "bg-alert-soft text-alert" : severity === 2 ? "bg-warn-soft text-warn" : "bg-paper text-muted";
  return <span className={`badge ${style}`}>{SEVERITY[severity as 1 | 2 | 3] ?? severity}</span>;
}

/** SGK bildirim son günü için renkli durum */
export function SgkBadge({ deadline, notifiedAt }: { deadline: string; notifiedAt: string | null }) {
  if (notifiedAt) return <span className="badge bg-ok-soft text-ok">SGK bildirildi</span>;
  const left = daysUntil(deadline);
  if (left < 0) return <span className="badge bg-alert-soft text-alert">SGK süresi {-left} gün geçti</span>;
  if (left === 0) return <span className="badge bg-alert-soft text-alert">SGK son gün: bugün</span>;
  return (
    <span className={`badge ${left <= 1 ? "bg-alert-soft text-alert" : "bg-warn-soft text-warn"}`}>
      SGK son gün: {fmtDate(deadline)} ({left} gün)
    </span>
  );
}
