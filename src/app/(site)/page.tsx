import Link from "next/link";
import { GUIDES, ACCIDENT_TYPES } from "@/lib/content";

const ICON: Record<string, string> = { trafik: "🚗", ev: "🏠", is: "🦺", diger: "🩹" };

export default function HomePage() {
  return (
    <div className="space-y-12">
      <section className="pt-4">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand">Kazadan sonra yalnız değilsiniz</p>
        <h1 className="mt-2 max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">
          Ne tür bir kaza geçirdiniz?
        </h1>
        <p className="mt-3 max-w-2xl text-muted">
          Seçin; ne yapmanız gerektiğini, hangi belgelerin önemli olduğunu ve hangi sürelere dikkat etmeniz
          gerektiğini sade bir dille anlatalım.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {ACCIDENT_TYPES.map((t) => (
            <Link
              key={t}
              href={`/kaza/${t}`}
              className="card group flex items-start gap-4 transition-shadow hover:shadow-md"
            >
              <span className="text-3xl" aria-hidden>{ICON[t]}</span>
              <span>
                <span className="block text-lg font-semibold group-hover:text-brand">{GUIDES[t].title}</span>
                <span className="mt-1 block text-sm text-muted">{GUIDES[t].short}</span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="card">
          <h2 className="h2">Kaza Sonrası Asistanı</h2>
          <p className="mt-2 text-sm text-muted">
            Kaza türünü ve tarihini girin; size özel, tarihli bir yapılacaklar listesi oluşturalım.
            Üye olmanız gerekmez.
          </p>
          <Link href="/asistan" className="btn-primary mt-4">Listemi oluştur</Link>
        </div>
        <div className="card">
          <h2 className="h2">İş kazası ödenek hesaplayıcı</h2>
          <p className="mt-2 text-sm text-muted">
            İstirahatli olduğunuz günler için SGK'dan alabileceğiniz geçici iş göremezlik ödeneğini yaklaşık hesaplayın.
          </p>
          <Link href="/hesaplayici" className="btn-secondary mt-4">Hesapla</Link>
        </div>
      </section>

      <section className="card flex flex-col items-start gap-4 border-brand bg-brand-soft sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="h2">İşyerinizde kaza mı oldu?</h2>
          <p className="mt-1 text-sm text-muted">
            İlk 72 saat, SGK bildirim süresi, kök neden analizi ve ramak kala bildirimleri tek panelde.
          </p>
        </div>
        <Link href="/isveren" className="btn-primary shrink-0">İşverenler için</Link>
      </section>
    </div>
  );
}
