/**
 * İş kazası geçici iş göremezlik ödeneği — yaklaşık hesap.
 *
 * Dayanak (5510 s. K. m.18): ödenek, günlük kazancın yatarak tedavide yarısı,
 * ayakta tedavide üçte ikisidir. İş kazasında ödenek, istirahatin ilk gününden itibaren ödenir.
 * Günlük kazanç; kazadan önceki son 12 ayda prim bildirilen son 3 ayın kazancına göre bulunur
 * ve prime esas kazanç üst sınırını aşamaz.
 *
 * Bu modül bilgilendirme amaçlı yaklaşık bir değer üretir; kesin tutarı SGK hesaplar.
 */

export type OdenekGirdi = {
  /** Son 3 ayın prime esas brüt kazanç toplamı (TL) */
  son3AyKazanc: number;
  /** Son 3 ayda prim ödenen gün sayısı (genelde 90) */
  son3AyGun: number;
  yatarakGun: number;
  ayaktaGun: number;
  /** İsteğe bağlı: günlük kazanç üst sınırı (TL). Verilirse günlük kazanç bununla sınırlanır. */
  gunlukUstSinir?: number;
};

export type OdenekSonuc = {
  gunlukKazanc: number;
  yatarakGunluk: number;
  ayaktaGunluk: number;
  yatarakToplam: number;
  ayaktaToplam: number;
  toplam: number;
};

const yuvarla = (n: number) => Math.round(n * 100) / 100;

export function hesaplaOdenek(g: OdenekGirdi): OdenekSonuc {
  if (g.son3AyGun <= 0) throw new Error("Gün sayısı sıfırdan büyük olmalı");
  if ([g.son3AyKazanc, g.yatarakGun, g.ayaktaGun].some((v) => v < 0 || !Number.isFinite(v))) {
    throw new Error("Değerler negatif olamaz");
  }
  let gunluk = g.son3AyKazanc / g.son3AyGun;
  if (g.gunlukUstSinir && g.gunlukUstSinir > 0) gunluk = Math.min(gunluk, g.gunlukUstSinir);
  const yatarakGunluk = gunluk / 2;
  const ayaktaGunluk = (gunluk * 2) / 3;
  const yatarakToplam = yatarakGunluk * g.yatarakGun;
  const ayaktaToplam = ayaktaGunluk * g.ayaktaGun;
  return {
    gunlukKazanc: yuvarla(gunluk),
    yatarakGunluk: yuvarla(yatarakGunluk),
    ayaktaGunluk: yuvarla(ayaktaGunluk),
    yatarakToplam: yuvarla(yatarakToplam),
    ayaktaToplam: yuvarla(ayaktaToplam),
    toplam: yuvarla(yatarakToplam + ayaktaToplam),
  };
}
