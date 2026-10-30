/**
 * İş günü hesabı — SGK iş kazası bildirim süresi için.
 *
 * 5510 s. Kanun m.13 ve 6331 s. Kanun m.14: işveren iş kazasını kazadan sonraki
 * 3 iş günü içinde SGK'ya bildirir. SGK örneği: kaza pazartesi → en geç perşembe,
 * kaza çarşamba → en geç pazartesi. Hafta sonu ve resmi tatiller iş günü sayılmaz.
 *
 * ÖNEMLİ: Dini bayram tarihleri her yıl değişir; HOLIDAYS listesini yıllık güncelleyin.
 * Bu hesap yardımcıdır; kesin süre için SGK duyurularını esas alın.
 */

/** Sabit tarihli resmi tatiller (AA-GG) */
const FIXED_HOLIDAYS = ["01-01", "04-23", "05-01", "05-19", "07-15", "08-30", "10-29"];

/** Değişken tarihli tatiller (YYYY-AA-GG). Arife günleri yarım gün olduğundan dahil edilmedi. */
export const VARIABLE_HOLIDAYS: string[] = [
  // 2026 Ramazan Bayramı
  "2026-03-20", "2026-03-21", "2026-03-22",
  // 2026 Kurban Bayramı
  "2026-05-27", "2026-05-28", "2026-05-29", "2026-05-30",
  // TODO: 2027 ve sonrası bayram tarihleri resmi takvimden eklenmeli
];

export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function isHoliday(d: Date, extra: string[] = VARIABLE_HOLIDAYS): boolean {
  const iso = toISODate(d);
  return FIXED_HOLIDAYS.includes(iso.slice(5)) || extra.includes(iso);
}

export function isWorkday(d: Date, extra: string[] = VARIABLE_HOLIDAYS): boolean {
  const wd = d.getDay(); // 0 pazar, 6 cumartesi
  return wd !== 0 && wd !== 6 && !isHoliday(d, extra);
}

/** Verilen tarihten SONRAKİ n'inci iş gününü döndürür (kaza günü sayılmaz). */
export function addWorkdays(from: Date, n: number, extra: string[] = VARIABLE_HOLIDAYS): Date {
  const d = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  let count = 0;
  while (count < n) {
    d.setDate(d.getDate() + 1);
    if (isWorkday(d, extra)) count++;
  }
  return d;
}

/** Kaza tarihine göre SGK bildirimi için son gün (YYYY-AA-GG). */
export function sgkDeadline(occurredAt: Date | string): string {
  // "YYYY-AA-GG" veya "YYYY-AA-GGTSS:DD": yalnızca tarih kısmı kullanılır, saat dilimi kaymasın diye elle ayrıştırılır
  const d =
    typeof occurredAt === "string"
      ? (([y, m, day]) => new Date(y, m - 1, day))(occurredAt.slice(0, 10).split("-").map(Number))
      : occurredAt;
  return toISODate(addWorkdays(d, 3));
}

/** Formdan gelen "YYYY-AA-GGTSS:DD" değerini Türkiye saati (UTC+3) olarak yorumlar. */
export function parseIstanbulLocal(value: string): Date {
  return new Date(`${value.length === 16 ? `${value}:00` : value}+03:00`);
}

/** Bugünden son güne kalan takvim günü (negatif = gecikmiş). */
export function daysUntil(isoDate: string, today: Date = new Date()): number {
  const t = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const [y, m, d] = isoDate.split("-").map(Number);
  return Math.round((new Date(y, m - 1, d).getTime() - t) / 86_400_000);
}
