import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

/**
 * Veri modeli
 *
 * Kurumsal taraf (işveren / işyeri):
 *   organizations ─┬─ users
 *                  ├─ sites ── reports (ramak kala / güvensiz durum bildirimleri)
 *                  └─ incidents ─┬─ incidentChecklist (72 saat listesi)
 *                                ├─ witnesses
 *                                ├─ rootCauses (5 Neden)
 *                                └─ correctiveActions (DÖF)
 *
 * Bireysel taraf (kişi / ev / çalışan):
 *   assistantCases — giriş gerektirmeyen, gizli bağlantıyla açılan kişisel kontrol listesi
 */

const now = () => new Date().toISOString();

export const organizations = sqliteTable("organizations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  plan: text("plan").notNull().default("pilot"), // pilot | temel | profesyonel | kurumsal
  createdAt: text("created_at").notNull().$defaultFn(now),
});

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orgId: integer("org_id").notNull().references(() => organizations.id),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().default("admin"), // admin | uzman | yonetici
  createdAt: text("created_at").notNull().$defaultFn(now),
});

export const sites = sqliteTable("sites", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orgId: integer("org_id").notNull().references(() => organizations.id),
  name: text("name").notNull(),
  /** QR kodundaki tahmin edilemez kısa kod: /b/<code> */
  code: text("code").notNull().unique(),
  createdAt: text("created_at").notNull().$defaultFn(now),
});

export const reports = sqliteTable("reports", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orgId: integer("org_id").notNull().references(() => organizations.id),
  siteId: integer("site_id").notNull().references(() => sites.id),
  kind: text("kind").notNull(), // ramak_kala | guvensiz_durum | guvensiz_davranis | oneri
  category: text("category").notNull(),
  severity: integer("severity").notNull().default(2), // 1 düşük, 2 orta, 3 yüksek
  description: text("description").notNull(),
  location: text("location"),
  photoFile: text("photo_file"),
  reporterName: text("reporter_name"), // boş = anonim
  status: text("status").notNull().default("yeni"), // yeni | inceleniyor | aksiyonda | kapandi
  actionNote: text("action_note"),
  createdAt: text("created_at").notNull().$defaultFn(now),
  closedAt: text("closed_at"),
});

export const incidents = sqliteTable("incidents", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orgId: integer("org_id").notNull().references(() => organizations.id),
  siteId: integer("site_id").references(() => sites.id),
  title: text("title").notNull(),
  occurredAt: text("occurred_at").notNull(), // ISO tarih-saat
  employeeName: text("employee_name"),
  injury: text("injury"),
  treatment: text("treatment"), // ilk_yardim | ayakta | yatarak | olum
  /** 5510 s. K. m.13: kazadan sonraki 3 iş günü */
  sgkDeadline: text("sgk_deadline").notNull(), // YYYY-MM-DD
  sgkNotifiedAt: text("sgk_notified_at"),
  policeNotifiedAt: text("police_notified_at"),
  status: text("status").notNull().default("acik"), // acik | kapandi
  returnToWorkNote: text("return_to_work_note"),
  createdAt: text("created_at").notNull().$defaultFn(now),
});

export const incidentChecklist = sqliteTable("incident_checklist", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  incidentId: integer("incident_id").notNull().references(() => incidents.id),
  itemKey: text("item_key").notNull(),
  label: text("label").notNull(),
  phase: text("phase").notNull(), // ilk_saat | ilk_gun | ilk_72_saat
  doneAt: text("done_at"),
});

export const witnesses = sqliteTable("witnesses", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  incidentId: integer("incident_id").notNull().references(() => incidents.id),
  name: text("name").notNull(),
  statement: text("statement").notNull(),
  createdAt: text("created_at").notNull().$defaultFn(now),
});

export const rootCauses = sqliteTable("root_causes", {
  incidentId: integer("incident_id").primaryKey().references(() => incidents.id),
  why1: text("why1"),
  why2: text("why2"),
  why3: text("why3"),
  why4: text("why4"),
  why5: text("why5"),
  rootCause: text("root_cause"),
  category: text("category"), // insan | yontem | makine | malzeme | ortam | yonetim
  updatedAt: text("updated_at").notNull().$defaultFn(now),
});

export const correctiveActions = sqliteTable("corrective_actions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orgId: integer("org_id").notNull().references(() => organizations.id),
  incidentId: integer("incident_id").references(() => incidents.id),
  reportId: integer("report_id").references(() => reports.id),
  title: text("title").notNull(),
  owner: text("owner"),
  dueDate: text("due_date"),
  status: text("status").notNull().default("acik"), // acik | tamamlandi
  doneAt: text("done_at"),
  createdAt: text("created_at").notNull().$defaultFn(now),
});

export const assistantCases = sqliteTable("assistant_cases", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  /** Tahmin edilemez erişim anahtarı: /asistan/<token> */
  token: text("token").notNull().unique(),
  accidentType: text("accident_type").notNull(), // trafik | ev | is | diger
  accidentDate: text("accident_date").notNull(), // YYYY-MM-DD
  /** Tamamlanan madde anahtarları, JSON dizi */
  doneKeys: text("done_keys").notNull().default("[]"),
  note: text("note"),
  createdAt: text("created_at").notNull().$defaultFn(now),
});

/** Tabloları oluşturan SQL. Küçük kurulumlar için başlangıçta çalışır; üretimde migration aracı tercih edin. */
export const BOOTSTRAP_SQL = `
CREATE TABLE IF NOT EXISTS organizations (
  id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, plan TEXT NOT NULL DEFAULT 'pilot',
  created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT, org_id INTEGER NOT NULL REFERENCES organizations(id),
  name TEXT NOT NULL, email TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin', created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS sites (
  id INTEGER PRIMARY KEY AUTOINCREMENT, org_id INTEGER NOT NULL REFERENCES organizations(id),
  name TEXT NOT NULL, code TEXT NOT NULL UNIQUE, created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT, org_id INTEGER NOT NULL REFERENCES organizations(id),
  site_id INTEGER NOT NULL REFERENCES sites(id), kind TEXT NOT NULL, category TEXT NOT NULL,
  severity INTEGER NOT NULL DEFAULT 2, description TEXT NOT NULL, location TEXT, photo_file TEXT,
  reporter_name TEXT, status TEXT NOT NULL DEFAULT 'yeni', action_note TEXT,
  created_at TEXT NOT NULL, closed_at TEXT);
CREATE INDEX IF NOT EXISTS reports_org_created ON reports(org_id, created_at);
CREATE TABLE IF NOT EXISTS incidents (
  id INTEGER PRIMARY KEY AUTOINCREMENT, org_id INTEGER NOT NULL REFERENCES organizations(id),
  site_id INTEGER REFERENCES sites(id), title TEXT NOT NULL, occurred_at TEXT NOT NULL,
  employee_name TEXT, injury TEXT, treatment TEXT, sgk_deadline TEXT NOT NULL,
  sgk_notified_at TEXT, police_notified_at TEXT, status TEXT NOT NULL DEFAULT 'acik',
  return_to_work_note TEXT, created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS incident_checklist (
  id INTEGER PRIMARY KEY AUTOINCREMENT, incident_id INTEGER NOT NULL REFERENCES incidents(id),
  item_key TEXT NOT NULL, label TEXT NOT NULL, phase TEXT NOT NULL, done_at TEXT);
CREATE TABLE IF NOT EXISTS witnesses (
  id INTEGER PRIMARY KEY AUTOINCREMENT, incident_id INTEGER NOT NULL REFERENCES incidents(id),
  name TEXT NOT NULL, statement TEXT NOT NULL, created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS root_causes (
  incident_id INTEGER PRIMARY KEY REFERENCES incidents(id), why1 TEXT, why2 TEXT, why3 TEXT,
  why4 TEXT, why5 TEXT, root_cause TEXT, category TEXT, updated_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS corrective_actions (
  id INTEGER PRIMARY KEY AUTOINCREMENT, org_id INTEGER NOT NULL REFERENCES organizations(id),
  incident_id INTEGER REFERENCES incidents(id), report_id INTEGER REFERENCES reports(id),
  title TEXT NOT NULL, owner TEXT, due_date TEXT, status TEXT NOT NULL DEFAULT 'acik',
  done_at TEXT, created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS assistant_cases (
  id INTEGER PRIMARY KEY AUTOINCREMENT, token TEXT NOT NULL UNIQUE, accident_type TEXT NOT NULL,
  accident_date TEXT NOT NULL, done_keys TEXT NOT NULL DEFAULT '[]', note TEXT, created_at TEXT NOT NULL);
`;
