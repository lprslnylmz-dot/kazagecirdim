import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

export const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR ?? "data/uploads");
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

/** Dosya içeriğinin ilk baytlarına bakarak görsel türünü belirler (uzantıya güvenilmez). */
export function sniffImage(buf: Buffer): "jpg" | "png" | "webp" | null {
  if (buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "jpg";
  if (buf.length > 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "png";
  if (buf.length > 12 && buf.subarray(0, 4).toString() === "RIFF" && buf.subarray(8, 12).toString() === "WEBP") return "webp";
  return null;
}

export type SaveResult = { ok: true; file: string } | { ok: false; error: string };

/** Yüklenen görseli rastgele bir adla saklar. Dosya yoksa ok:true, file:"" döner. */
export async function saveImage(file: File | null): Promise<SaveResult> {
  if (!file || file.size === 0) return { ok: true, file: "" };
  if (file.size > MAX_UPLOAD_BYTES) return { ok: false, error: "Fotoğraf en fazla 5 MB olabilir" };
  const buf = Buffer.from(await file.arrayBuffer());
  const ext = sniffImage(buf);
  if (!ext) return { ok: false, error: "Yalnızca JPG, PNG veya WEBP fotoğraf yüklenebilir" };
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  const name = `${crypto.randomUUID()}.${ext}`;
  await fs.writeFile(path.join(UPLOAD_DIR, name), buf);
  return { ok: true, file: name };
}

/** Yalnızca bizim ürettiğimiz biçimdeki dosya adlarını kabul eder (dizin dışına çıkmayı engeller). */
export function safeUploadPath(name: string): string | null {
  if (!/^[0-9a-f-]{36}\.(jpg|png|webp)$/.test(name)) return null;
  return path.join(UPLOAD_DIR, name);
}
