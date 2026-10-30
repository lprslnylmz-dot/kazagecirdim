import Link from "next/link";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { logout } from "@/app/actions/auth";

export const dynamic = "force-dynamic";

const NAV = [
  { href: "/panel", label: "Özet" },
  { href: "/panel/olaylar", label: "Kazalar" },
  { href: "/panel/bildirimler", label: "Ramak kala" },
  { href: "/panel/rapor", label: "Aylık rapor" },
  { href: "/panel/lokasyonlar", label: "Lokasyonlar ve QR" },
];

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const s = await requireSession();
  const org = db.select().from(schema.organizations).where(eq(schema.organizations.id, s.orgId)).get();

  return (
    <div className="min-h-screen">
      <header className="no-print border-b border-line bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <Link href="/panel" className="font-bold">kaza<span className="text-brand">gecirdim</span></Link>
            <span className="badge bg-brand-soft text-brand">{org?.name}</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-muted">{s.name}</span>
            <form action={logout}><button className="btn-secondary btn-sm">Çıkış</button></form>
          </div>
        </div>
        <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 pb-2 text-sm">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="whitespace-nowrap rounded-md px-3 py-1.5 text-muted hover:bg-paper hover:text-ink">
              {n.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
