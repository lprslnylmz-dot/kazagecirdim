import fs from "node:fs/promises";
import { and, eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { safeUploadPath } from "@/lib/uploads";

const TYPES: Record<string, string> = { jpg: "image/jpeg", png: "image/png", webp: "image/webp" };

/** Bildirim fotoğrafları yalnızca aynı kurumun oturum açmış kullanıcılarına gösterilir. */
export async function GET(_req: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const session = await getSession();
  if (!session) return new Response("Yetkisiz", { status: 401 });

  const filePath = safeUploadPath(name);
  if (!filePath) return new Response("Bulunamadı", { status: 404 });

  const owned = db.select({ id: schema.reports.id }).from(schema.reports)
    .where(and(eq(schema.reports.photoFile, name), eq(schema.reports.orgId, session.orgId))).get();
  if (!owned) return new Response("Bulunamadı", { status: 404 });

  try {
    const data = await fs.readFile(filePath);
    return new Response(new Uint8Array(data), {
      headers: {
        "Content-Type": TYPES[name.split(".").pop()!] ?? "application/octet-stream",
        "Cache-Control": "private, max-age=3600",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Bulunamadı", { status: 404 });
  }
}
