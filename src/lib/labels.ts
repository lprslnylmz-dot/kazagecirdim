/** Arayüzde kullanılan sabit etiketler ve şablonlar */

export const REPORT_KINDS = {
  ramak_kala: "Ramak kala",
  guvensiz_durum: "Güvensiz durum",
  guvensiz_davranis: "Güvensiz davranış",
  oneri: "İyileştirme önerisi",
} as const;

export const REPORT_CATEGORIES = [
  "Düşme / kayma / takılma",
  "Yüksekte çalışma",
  "Makine / ekipman",
  "Elektrik",
  "Forklift / araç trafiği",
  "Kimyasal",
  "Yangın",
  "Elle taşıma / ergonomi",
  "Kişisel koruyucu donanım",
  "Düzen / temizlik",
  "Diğer",
] as const;

export const SEVERITY = { 1: "Düşük", 2: "Orta", 3: "Yüksek" } as const;

export const REPORT_STATUS = {
  yeni: "Yeni",
  inceleniyor: "İnceleniyor",
  aksiyonda: "Aksiyonda",
  kapandi: "Kapandı",
} as const;

export const TREATMENT = {
  ilk_yardim: "Yalnız ilk yardım",
  ayakta: "Ayakta tedavi",
  yatarak: "Yatarak tedavi",
  olum: "Ölümlü",
} as const;

export const ROOT_CAUSE_CATEGORIES = {
  insan: "İnsan / davranış",
  yontem: "Yöntem / prosedür",
  makine: "Makine / ekipman",
  malzeme: "Malzeme",
  ortam: "Çalışma ortamı",
  yonetim: "Yönetim / organizasyon",
} as const;

/** İşveren için kaza sonrası ilk 72 saat kontrol listesi */
export const INCIDENT_CHECKLIST: { key: string; label: string; phase: "ilk_saat" | "ilk_gun" | "ilk_72_saat" }[] = [
  { key: "ilkyardim", label: "İlk yardım verildi, gerekiyorsa 112 arandı ve sevk kaydı alındı", phase: "ilk_saat" },
  { key: "alan", label: "Kaza alanı güvenli hale getirildi ve korundu (delil kaybolmadı)", phase: "ilk_saat" },
  { key: "kolluk", label: "Kolluk kuvvetlerine derhal bildirim yapıldı", phase: "ilk_saat" },
  { key: "yonetim", label: "İşveren / üst yönetim, İSG uzmanı ve işyeri hekimi bilgilendirildi", phase: "ilk_saat" },
  { key: "foto", label: "Alan, ekipman ve koşullar fotoğraflandı, ölçüler alındı", phase: "ilk_gun" },
  { key: "tanik", label: "Tanık ifadeleri bekletilmeden ayrı ayrı alındı", phase: "ilk_gun" },
  { key: "belge", label: "Eğitim, risk değerlendirmesi, KKD zimmet ve bakım kayıtları toplandı", phase: "ilk_gun" },
  { key: "sgk", label: "SGK iş kazası bildirimi yapıldı (3 iş günü içinde)", phase: "ilk_72_saat" },
  { key: "kokneden", label: "Kök neden analizi başlatıldı", phase: "ilk_72_saat" },
  { key: "gecici", label: "Benzer riskler için geçici önlem alındı", phase: "ilk_72_saat" },
  { key: "calisan", label: "Kaza geçiren çalışanla ve ailesiyle iletişim kuruldu, haklar hakkında bilgi verildi", phase: "ilk_72_saat" },
];

export const PHASE_LABEL = {
  ilk_saat: "İlk saat",
  ilk_gun: "İlk gün",
  ilk_72_saat: "İlk 72 saat",
} as const;

export function label<T extends Record<string, string>>(map: T, key: string | null | undefined): string {
  if (!key) return "—";
  return (map as Record<string, string>)[key] ?? key;
}
