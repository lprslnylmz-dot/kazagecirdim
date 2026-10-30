import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-md px-4 py-24 text-center">
      <h1 className="h1">Sayfa bulunamadı</h1>
      <p className="mt-3 text-muted">Aradığınız sayfa taşınmış veya bağlantı hatalı olabilir.</p>
      <Link href="/" className="btn-primary mt-6">Ana sayfaya dön</Link>
    </main>
  );
}
