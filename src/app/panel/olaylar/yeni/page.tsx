import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { NewIncidentForm } from "./form";

export default async function NewIncident() {
  const s = await requireSession();
  const sites = db.select({ id: schema.sites.id, name: schema.sites.name })
    .from(schema.sites).where(eq(schema.sites.orgId, s.orgId)).all();
  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="h1">Kaza kaydı aç</h1>
      <div className="rounded-lg border border-alert bg-alert-soft p-4 text-sm">
        <strong className="text-alert">Önce can güvenliği.</strong> Yaralıya ilk yardım yapıldığından ve gerekiyorsa 112'nin
        arandığından emin olun. Kolluk kuvvetlerine bildirim derhal yapılmalıdır.
      </div>
      <NewIncidentForm sites={sites} />
    </div>
  );
}
