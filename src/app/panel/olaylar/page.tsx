import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { SgkBadge } from "@/components/status";
import { fmtDateTime } from "@/lib/format";
import { label, TREATMENT } from "@/lib/labels";

export default async function IncidentsList() {
  const s = await requireSession();
  const rows = db.select().from(schema.incidents).where(eq(schema.incidents.orgId, s.orgId))
    .orderBy(desc(schema.incidents.occurredAt)).all();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="h1">Kaza dosyaları</h1>
        <Link href="/panel/olaylar/yeni" className="btn-danger">+ Kaza kaydı aç</Link>
      </div>
      {rows.length === 0 ? (
        <div className="card text-center text-muted">
          <p>Kayıtlı kaza yok. Umarız hep böyle kalır.</p>
          <p className="mt-1 text-sm">Kaza olduğunda buradan dosya açın; SGK bildirim süresi otomatik hesaplanır.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {rows.map((i) => (
            <li key={i.id}>
              <Link href={`/panel/olaylar/${i.id}`} className="card flex flex-wrap items-center justify-between gap-3 p-4 hover:shadow-sm">
                <span>
                  <span className="block font-semibold">{i.title}</span>
                  <span className="text-sm text-muted">
                    {fmtDateTime(i.occurredAt)} · {label(TREATMENT, i.treatment)}{i.employeeName ? ` · ${i.employeeName}` : ""}
                  </span>
                </span>
                <span className="flex flex-wrap items-center gap-2">
                  {i.status === "kapandi" ? <span className="badge bg-ok-soft text-ok">Kapandı</span> : <SgkBadge deadline={i.sgkDeadline} notifiedAt={i.sgkNotifiedAt} />}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
