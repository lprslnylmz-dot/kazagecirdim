import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { and, eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { baseUrl } from "@/lib/base-url";
import { PrintButton } from "@/components/print-button";

export default async function PosterPage({ params }: { params: Promise<{ id: string }> }) {
  const s = await requireSession();
  const id = Number((await params).id);
  const site = db.select().from(schema.sites)
    .where(and(eq(schema.sites.id, id), eq(schema.sites.orgId, s.orgId))).get();
  if (!site) notFound();
  const org = db.select().from(schema.organizations).where(eq(schema.organizations.id, s.orgId)).get();
  const url = `${await baseUrl()}/b/${site.code}`;
  const svg = await QRCode.toString(url, { type: "svg", margin: 1, errorCorrectionLevel: "M" });

  return (
    <div className="space-y-4">
      <div className="no-print flex items-center justify-between">
        <p className="text-sm text-muted">A4 olarak yazdırın.</p>
        <PrintButton />
      </div>
      <div className="mx-auto flex aspect-[1/1.414] max-w-xl flex-col items-center justify-between rounded-xl border-4 border-brand bg-white p-10 text-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-brand">{org?.name}</p>
          <h1 className="mt-3 text-4xl font-extrabold leading-tight">Bir risk mi gördün?</h1>
          <p className="mt-3 text-lg">Kaza olmadan bildir. 30 saniye sürer, isim vermek zorunda değilsin.</p>
        </div>
        <div className="w-64" dangerouslySetInnerHTML={{ __html: svg }} />
        <div>
          <p className="text-lg font-semibold">Telefonunun kamerasıyla okut</p>
          <p className="mt-1 text-sm text-muted">{site.name}</p>
          <p className="mt-4 text-sm font-semibold text-alert">Yaralanma veya yangında önce 112'yi ara.</p>
        </div>
      </div>
    </div>
  );
}
