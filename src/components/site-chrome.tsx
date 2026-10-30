import Link from "next/link";

export function EmergencyBar() {
  return (
    <div className="no-print bg-alert text-white">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2 text-sm">
        <strong>Acil durumda hemen arayın:</strong>
        <a href="tel:112" className="underline">112 Acil Çağrı</a>
        <a href="tel:114" className="underline">114 Zehir Danışma</a>
      </div>
    </div>
  );
}

export function SiteHeader() {
  return (
    <header className="no-print border-b border-line bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="text-lg font-bold tracking-tight">
          kaza<span className="text-brand">gecirdim</span>.com
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          <Link href="/asistan" className="rounded-md px-3 py-2 hover:bg-paper">Asistan</Link>
          <Link href="/hesaplayici" className="hidden rounded-md px-3 py-2 hover:bg-paper sm:inline">Ödenek hesaplayıcı</Link>
          <Link href="/isveren" className="rounded-md px-3 py-2 font-semibold text-brand hover:bg-brand-soft">Ben işverenim</Link>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="no-print mt-16 border-t border-line bg-white">
      <div className="mx-auto grid max-w-5xl gap-6 px-4 py-8 text-sm text-muted sm:grid-cols-3">
        <div>
          <p className="font-semibold text-ink">kazagecirdim.com</p>
          <p className="mt-2">Kazadan sonra ne yapacağınızı sade bir dille anlatır.</p>
        </div>
        <div className="space-y-1">
          <Link href="/kaza/trafik" className="block hover:text-ink">Trafik kazası</Link>
          <Link href="/kaza/ev" className="block hover:text-ink">Ev kazası</Link>
          <Link href="/kaza/is" className="block hover:text-ink">İş kazası</Link>
          <Link href="/isveren" className="block hover:text-ink">İşverenler için</Link>
        </div>
        <p className="text-xs leading-relaxed">
          Bu sitedeki bilgiler genel bilgilendirme amaçlıdır; hukuki veya tıbbi tavsiye değildir.
          Kişisel durumunuz için bir avukata veya sağlık profesyoneline başvurun.
        </p>
      </div>
    </footer>
  );
}

export function PublicShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <EmergencyBar />
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
      <SiteFooter />
    </>
  );
}
