import crypto from "node:crypto";

const TZ = "Europe/Istanbul";

export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = iso.length === 10 ? new Date(`${iso}T12:00:00`) : new Date(iso);
  return d.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric", timeZone: TZ });
}

export function fmtDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  // Saat dilimi bilgisi olmayan form değerleri ("YYYY-AA-GGTSS:DD") Türkiye saatidir
  const d = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(iso) ? new Date(`${iso}:00+03:00`) : new Date(iso);
  return d.toLocaleString("tr-TR", {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: TZ,
  });
}

export function fmtTL(n: number): string {
  return n.toLocaleString("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 2 });
}

/** URL'de kullanılabilen, tahmin edilemez kısa kod */
export function randomCode(bytes = 6): string {
  return crypto.randomBytes(bytes).toString("base64url");
}

/** Bugünün tarihi, İstanbul saatine göre (YYYY-AA-GG) */
export function todayIstanbul(): string {
  return new Date().toLocaleDateString("sv-SE", { timeZone: TZ });
}
