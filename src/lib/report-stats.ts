/** Aylık rapor için saf hesaplama fonksiyonları (veritabanından bağımsız, test edilebilir). */

export type ReportRow = {
  kind: string;
  category: string;
  severity: number;
  siteId: number;
  status: string;
  createdAt: string;
  closedAt: string | null;
};

export function countBy<T>(rows: T[], key: (r: T) => string | number): { key: string; count: number }[] {
  const m = new Map<string, number>();
  for (const r of rows) {
    const k = String(key(r));
    m.set(k, (m.get(k) ?? 0) + 1);
  }
  return [...m.entries()].map(([k, count]) => ({ key: k, count })).sort((a, b) => b.count - a.count);
}

/** Kapanan bildirimlerin ortalama kapanma süresi (gün, 1 ondalık). Kapanan yoksa null. */
export function avgCloseDays(rows: ReportRow[]): number | null {
  const closed = rows.filter((r) => r.closedAt);
  if (closed.length === 0) return null;
  const total = closed.reduce((s, r) => s + (Date.parse(r.closedAt!) - Date.parse(r.createdAt)), 0);
  return Math.round((total / closed.length / 86_400_000) * 10) / 10;
}

/** "2026-10" → ay başı ve sonraki ay başı ISO aralığı (UTC) */
export function monthRange(ym: string): { from: string; to: string } {
  const [y, m] = ym.split("-").map(Number);
  const from = new Date(Date.UTC(y, m - 1, 1)).toISOString();
  const to = new Date(Date.UTC(y, m, 1)).toISOString();
  return { from, to };
}

export function isValidMonth(ym: string | undefined): ym is string {
  return !!ym && /^\d{4}-(0[1-9]|1[0-2])$/.test(ym);
}
