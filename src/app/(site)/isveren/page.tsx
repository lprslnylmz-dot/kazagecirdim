import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "İşverenler için",
  description: "İş kazası sonrası müdahale, SGK bildirim süresi takibi ve ramak kala bildirim platformu.",
};

const PLANS = [
  { name: "Temel", price: "2.900 TL / ay", items: ["1 lokasyon, 50 çalışana kadar", "QR ile anonim bildirim", "Bildirim paneli", "Aylık rapor"] },
  { name: "Profesyonel", price: "7.900 TL / ay", items: ["3 lokasyon, 250 çalışana kadar", "Kaza müdahale modülü", "Kök neden ve DÖF takibi", "Aylık otomatik rapor"], featured: true },
  { name: "Kurumsal", price: "Teklif", items: ["Sınırsız lokasyon", "Entegrasyonlar", "Özel raporlar", "Danışmanlık paketleri"] },
];

export default function EmployerPage() {
  return (
    <div className="space-y-12">
      <section>
        <p className="text-sm font-semibold uppercase tracking-wide text-brand">İşverenler ve İSG profesyonelleri için</p>
        <h1 className="mt-2 max-w-3xl text-3xl font-bold tracking-tight sm:text-4xl">
          Kazaya doğru müdahale edin. Bir sonrakini olmadan yakalayın.
        </h1>
        <p className="mt-4 max-w-2xl text-muted">
          İş kazası olduğunda 3 iş günlük SGK bildirim süresi, tanık ifadeleri, kök neden analizi ve düzeltici
          faaliyetler tek ekranda. Çalışanlarınız ise ramak kalaları QR kodla 30 saniyede, isterlerse anonim bildirir.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/kayit" className="btn-primary">30 gün ücretsiz deneyin</Link>
          <Link href="/giris" className="btn-secondary">Giriş yap</Link>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="card">
          <h2 className="h2">Kaza sonrası müdahale</h2>
          <p className="mt-2 text-sm text-muted">İlk 72 saat listesi, SGK son gün sayacı, tanık ifadeleri, 5 Neden analizi ve yazdırılabilir rapor.</p>
        </div>
        <div className="card">
          <h2 className="h2">Ramak kala bildirimi</h2>
          <p className="mt-2 text-sm text-muted">Her lokasyona bir QR afiş. Uygulama indirmeden, fotoğraflı ve anonim bildirim.</p>
        </div>
        <div className="card">
          <h2 className="h2">Aylık rapor</h2>
          <p className="mt-2 text-sm text-muted">Kategori ve lokasyon bazında eğilimler, açık aksiyonlar ve kapanma süreleri.</p>
        </div>
      </section>

      <section>
        <h2 className="h2">Fiyatlar</h2>
        <p className="mt-1 text-sm text-muted">İşyeri başına sabit fiyat; çalışan başına ücret yok. KDV hariç.</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {PLANS.map((p) => (
            <div key={p.name} className={`card ${p.featured ? "border-2 border-brand" : ""}`}>
              <h3 className="font-semibold">{p.name}</h3>
              <p className="mt-1 text-2xl font-bold">{p.price}</p>
              <ul className="mt-4 space-y-1.5 text-sm text-muted">
                {p.items.map((i) => <li key={i}>✓ {i}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="card">
        <h2 className="h2">Kaza Sonrası Müdahale Paketi</h2>
        <p className="mt-2 text-sm text-muted">
          Yeni bir kaza mı yaşadınız? Uzman danışmanımız ilk 72 saatte yanınızda: kök neden analizi, yerinde
          inceleme ve düzeltici faaliyet planı. Olay başına 15.000 TL'den başlayan fiyatlarla.
        </p>
        <p className="mt-3 text-xs text-muted">Paket hukuki temsil içermez; hukuki süreçler için bir avukata başvurmanızı öneririz.</p>
      </section>
    </div>
  );
}
