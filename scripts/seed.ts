/**
 * Demo verisi: npm run seed
 * Giriş: demo@kazagecirdim.com / demo12345
 */
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db, schema } from "../src/lib/db";
import { INCIDENT_CHECKLIST } from "../src/lib/labels";
import { sgkDeadline } from "../src/lib/workdays";

const EMAIL = "demo@kazagecirdim.com";

async function main() {
  if (db.select().from(schema.users).where(eq(schema.users.email, EMAIL)).get()) {
    console.log("Demo verisi zaten var.");
    return;
  }
  const org = db.insert(schema.organizations).values({ name: "Demo Metal San. A.Ş.", plan: "profesyonel" }).returning().get();
  db.insert(schema.users).values({
    orgId: org.id, name: "Ayşe Demir", email: EMAIL, passwordHash: await bcrypt.hash("demo12345", 10),
  }).run();
  const fab = db.insert(schema.sites).values({ orgId: org.id, name: "Gebze fabrika", code: "demo-fabrika" }).returning().get();
  const depo = db.insert(schema.sites).values({ orgId: org.id, name: "Tuzla depo", code: "demo-depo" }).returning().get();

  const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString();
  const reports = [
    { siteId: fab.id, kind: "ramak_kala", category: "Makine / ekipman", severity: 3, description: "Pres 3'ün koruyucu kapağı açıkken makine çalıştı, el yaklaşmıştı.", status: "aksiyonda", createdAt: daysAgo(2) },
    { siteId: depo.id, kind: "guvensiz_durum", category: "Düşme / kayma / takılma", severity: 2, description: "Rampa girişinde yağ birikintisi var.", status: "kapandi", createdAt: daysAgo(6), closedAt: daysAgo(5) },
    { siteId: depo.id, kind: "guvensiz_davranis", category: "Forklift / araç trafiği", severity: 3, description: "Forklift yaya yolundan hızlı geçti.", status: "yeni", createdAt: daysAgo(1) },
    { siteId: fab.id, kind: "guvensiz_durum", category: "Elektrik", severity: 2, description: "Kaynak bölümünde açıkta kablo.", status: "inceleniyor", createdAt: daysAgo(9) },
    { siteId: fab.id, kind: "oneri", category: "Kişisel koruyucu donanım", severity: 1, description: "Kesilmeye dayanıklı eldiven bedenleri yetersiz, L beden eklenmeli.", status: "kapandi", createdAt: daysAgo(12), closedAt: daysAgo(10) },
  ];
  for (const r of reports) db.insert(schema.reports).values({ orgId: org.id, ...r }).run();

  const occurred = new Date(Date.now() - 86_400_000);
  const occurredAt = occurred.toLocaleString("sv-SE", { timeZone: "Europe/Istanbul" }).slice(0, 16).replace(" ", "T");
  const inc = db.insert(schema.incidents).values({
    orgId: org.id, siteId: fab.id, title: "Pres hattında parmak sıkışması", occurredAt,
    employeeName: "Mehmet K.", injury: "Kalıp değişimi sırasında sol el işaret parmağı sıkıştı.", treatment: "ayakta",
    sgkDeadline: sgkDeadline(occurredAt), policeNotifiedAt: occurred.toISOString(),
  }).returning().get();
  db.insert(schema.incidentChecklist).values(INCIDENT_CHECKLIST.map((c) => ({
    incidentId: inc.id, itemKey: c.key, label: c.label, phase: c.phase,
    doneAt: ["ilkyardim", "alan", "kolluk", "yonetim"].includes(c.key) ? occurred.toISOString() : null,
  }))).run();
  db.insert(schema.witnesses).values({ incidentId: inc.id, name: "Ali V.", statement: "Kalıp değişiminde kilitleme yapılmadan pres tetiklendi." }).run();
  db.insert(schema.correctiveActions).values({ orgId: org.id, incidentId: inc.id, title: "Kalıp değişimi için kilitleme-etiketleme talimatı", owner: "Bakım şefi" }).run();

  console.log(`Demo hazır → ${EMAIL} / demo12345 · Bildirim formu: /b/demo-fabrika`);
}

main();
