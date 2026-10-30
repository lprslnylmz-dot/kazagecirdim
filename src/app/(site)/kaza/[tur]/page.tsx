import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { GUIDES, ACCIDENT_TYPES, isAccidentType } from "@/lib/content";

type Props = { params: Promise<{ tur: string }> };

export function generateStaticParams() {
  return ACCIDENT_TYPES.map((tur) => ({ tur }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tur } = await params;
  if (!isAccidentType(tur)) return {};
  return { title: GUIDES[tur].title, description: GUIDES[tur].intro };
}

export default async function GuidePage({ params }: Props) {
  const { tur } = await params;
  if (!isAccidentType(tur)) notFound();
  const g = GUIDES[tur];

  return (
    <article className="space-y-8">
      <header>
        <Link href="/" className="text-sm text-muted hover:text-ink">← Tüm kaza türleri</Link>
        <h1 className="h1 mt-3">{g.title}</h1>
        <p className="mt-3 max-w-2xl text-muted">{g.intro}</p>
      </header>

      <section className="rounded-xl border border-alert bg-alert-soft p-5">
        <h2 className="font-semibold text-alert">Önce bunlar</h2>
        <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm">
          {g.emergency.map((e) => <li key={e}>{e}</li>)}
        </ul>
      </section>

      {g.sections.map((s) => (
        <section key={s.heading}>
          <h2 className="h2">{s.heading}</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            {s.points.map((p) => <li key={p} className="leading-relaxed">{p}</li>)}
          </ul>
        </section>
      ))}

      <section className="card flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="h2">Size özel yapılacaklar listesi</h2>
          <p className="mt-1 text-sm text-muted">Kaza tarihinizi girin, maddeleri tarihleriyle takip edin.</p>
        </div>
        <Link href={`/asistan?tur=${g.type}`} className="btn-primary shrink-0">Listemi oluştur</Link>
      </section>

      {g.related && (
        <p className="text-sm">
          {g.related.map((r) => (
            <Link key={r.href} href={r.href} className="mr-4 font-medium text-brand underline">{r.label}</Link>
          ))}
        </p>
      )}

      <p className="text-xs text-muted">
        Son gözden geçirme: Ekim 2026. Genel bilgilendirmedir; hukuki veya tıbbi tavsiye değildir.
      </p>
    </article>
  );
}
