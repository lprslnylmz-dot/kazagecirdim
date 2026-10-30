# kazagecirdim.com

Kaza geçirenlere ücretsiz rehberlik eden, işverenlere ise kaza müdahale ve ramak kala bildirim yazılımı satan tek platform.

| Modül | Kim kullanır | Kim öder | Adres |
| --- | --- | --- | --- |
| Kaza rehberleri (trafik, ev, iş, diğer) | Kişi, ev/aile, çalışan | — (trafik ve güven) | `/`, `/kaza/[tur]` |
| Kaza Sonrası Asistanı | Kişi, ev/aile, çalışan | — | `/asistan` |
| İş kazası ödenek hesaplayıcı | Çalışan | — | `/hesaplayici` |
| QR ile ramak kala bildirimi | Çalışan (girişsiz, anonim) | İşyeri | `/b/[kod]` |
| Ramak kala paneli, DÖF, aylık rapor | İSG uzmanı, işveren | İşyeri | `/panel/bildirimler`, `/panel/rapor` |
| Kaza müdahale dosyası | İşveren, İSG uzmanı | İşveren | `/panel/olaylar` |
| İşveren tanıtım ve fiyatlar | İşveren | — | `/isveren` |

## Hızlı başlangıç

Gereksinim: Node.js 20 veya üzeri.

```bash
npm install
cp .env.example .env          # SESSION_SECRET'i değiştirin
npm run seed                  # demo kurum ve verileri
npm run dev                   # http://localhost:3000
```

Demo giriş: `demo@kazagecirdim.com` / `demo12345`
Demo QR formu: http://localhost:3000/b/demo-fabrika

Üretim:

```bash
npm run build
SESSION_SECRET="$(openssl rand -base64 48)" PUBLIC_BASE_URL="https://kazagecirdim.com" npm start
```

`SESSION_SECRET` üretimde zorunludur; yoksa giriş işlemleri hata verir.

## Testler

```bash
npm test                      # birim testleri (SGK süresi, ödenek, rapor, yükleme güvenliği)
npm run typecheck
# Uçtan uca (Python Playwright gerekir; sunucu 3100 portunda çalışıyor olmalı):
python3 tests/e2e.py
```

## Teknoloji

- **Next.js 15 (App Router) + React 19 + TypeScript**: sunucu bileşenleri ve server action'lar; ayrı bir API katmanı yok.
- **SQLite + Drizzle ORM** (`better-sqlite3`): tek dosyalık veritabanı, `data/app.db`. Tablolar ilk açılışta oluşturulur.
- **Tailwind CSS v4**: tema renkleri `src/app/globals.css` içinde.
- **jose + bcryptjs**: imzalı, httpOnly oturum çerezi; şifreler bcrypt ile.
- **zod**: tüm form girdilerinin doğrulanması. **qrcode**: afişlerdeki QR.

## Klasör yapısı

```
src/
  app/
    (site)/            Herkese açık site: ana sayfa, rehberler, asistan, hesaplayıcı, işveren, giriş/kayıt
    b/[code]/          Çalışanın QR ile açtığı bildirim formu (mobil)
    panel/             İşveren paneli (giriş gerekir)
      olaylar/         Kaza dosyaları: SGK süresi, 72 saat listesi, tanık, 5 Neden, DÖF, işe dönüş, rapor
      bildirimler/     Ramak kala bildirimleri ve DÖF
      rapor/           Aylık İSG raporu (yazdırılabilir)
      lokasyonlar/     Lokasyonlar ve QR afişleri
    actions/           Server action'lar (auth, assistant, reports, incidents)
    api/foto/          Bildirim fotoğrafları (yalnız aynı kurum görebilir)
  lib/
    schema.ts          Veri modeli
    content.ts         Rehber metinleri ve asistan kontrol listeleri  ← içerik buradan düzenlenir
    labels.ts          Kategoriler, durumlar, işveren 72 saat listesi
    workdays.ts        İş günü ve SGK 3 iş günü hesabı             ← tatilleri yıllık güncelleyin
    odenek.ts          Geçici iş göremezlik ödeneği hesabı
    report-stats.ts    Aylık rapor hesapları
scripts/seed.ts        Demo verisi
tests/                 Birim ve uçtan uca testler
```

## Güvenlik ve KVKK notları

- Her panel sorgusu oturumdaki `orgId` ile filtrelenir; başka kurumun kaydına erişim 404 döner (uçtan uca testte doğrulanır).
- Yüklenen dosyaların türü uzantıdan değil içeriğin ilk baytlarından belirlenir (JPG, PNG, WEBP; en fazla 5 MB). Dosyalar `data/uploads` altında tahmin edilemez adlarla, web kökünün dışında saklanır.
- QR formu girişsizdir; isim isteğe bağlıdır. Basit bir bot tuzağı alanı vardır. Canlıya çıkmadan önce oran sınırlama (rate limit) eklenmeli.
- Kaza dosyalarında TC kimlik numarası ve sağlık verisi istenmez; arayüz bunu açıkça uyarır. İşe dönüş planına yalnız çalışanın onayladığı iş düzenlemeleri yazılmalıdır.
- Asistan listeleri hesap gerektirmez; gizli bağlantıyla açılır ve arama motorlarına kapalıdır.
- Canlıya çıkmadan önce: aydınlatma metni ve açık rıza metinleri, VERBİS değerlendirmesi, Türkiye'de barındırma, yedekleme ve veri saklama süreleri.

## İçerik ve mevzuat

Rehber metinleri genel bilgilendirmedir; yayından önce bir avukat ve İSG uzmanı tarafından gözden geçirilmelidir. Dayanılan başlıca kurallar:

- İş kazası işverence kolluğa derhal, SGK'ya kazadan sonraki 3 iş günü içinde bildirilir (5510 s. K. m.13, 6331 s. K. m.14).
- Geçici iş göremezlik ödeneği: yatarak tedavide günlük kazancın yarısı, ayakta tedavide üçte ikisi.
- 1 Temmuz 2026'dan itibaren araç değer kaybı maddi hasar başvurusuyla birlikte eksper raporunda belirlenir; itiraz süresi 3 iş günüdür.

`src/lib/workdays.ts` içindeki dini bayram tarihleri yalnız 2026 için girildi; her yıl güncellenmelidir.

## Sonraki adımlar

1. **E-posta / SMS hatırlatıcı**: SGK son gününe 1 gün kala işverene, asistan maddelerinin son gününde kullanıcıya bildirim (zamanlanmış görev + e-posta servisi).
2. **Çoklu kullanıcı ve roller**: kuruma kullanıcı davet etme; `users.role` alanı hazır.
3. **Abonelik ve ödeme**: `organizations.plan` alanı hazır; iyzico veya benzeri bir ödeme altyapısı entegrasyonu.
4. **OSGB görünümü**: bir OSGB kullanıcısının birden fazla müşteri kurumunu yönetmesi.
5. **PostgreSQL'e geçiş**: büyüdükçe `drizzle-orm/node-postgres` ile; şema `pg-core`'a taşınır, `drizzle-kit` ile migration'lar üretilir.
6. **Oran sınırlama ve CAPTCHA**: açık bildirim formu için.
7. **Sigorta ve ürün ortaklıkları**: rehber sayfalarına ortak bağlantı bileşeni.
