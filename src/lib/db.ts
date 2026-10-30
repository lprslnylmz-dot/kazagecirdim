import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import * as schema from "./schema";

const dbPath = path.resolve(process.env.DATABASE_PATH ?? "data/app.db");

function open() {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  const sqlite = new Database(dbPath);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  sqlite.exec(schema.BOOTSTRAP_SQL);
  return drizzle(sqlite, { schema });
}

// Geliştirme modunda sıcak yeniden yüklemede tek bağlantı kalsın
const g = globalThis as unknown as { __kgDb?: ReturnType<typeof open> };
export const db = g.__kgDb ?? (g.__kgDb = open());
export { schema };
