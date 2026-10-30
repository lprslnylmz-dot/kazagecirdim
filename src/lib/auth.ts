import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db, schema } from "./db";
import { baseUrl } from "./base-url";

const COOKIE = "kg_session";
const MAX_AGE = 60 * 60 * 24 * 14; // 14 gün

function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) {
    if (process.env.NODE_ENV === "production") throw new Error("SESSION_SECRET en az 32 karakter olmalı");
    return new TextEncoder().encode("gelistirme-anahtari-uretimde-kullanmayin-0000");
  }
  return new TextEncoder().encode(s);
}

export type Session = { userId: number; orgId: number; name: string };

export async function hashPassword(pw: string) {
  return bcrypt.hash(pw, 10);
}

export async function verifyPassword(pw: string, hash: string) {
  return bcrypt.compare(pw, hash);
}

export async function createSession(s: Session) {
  const token = await new SignJWT({ ...s })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secret());
  const jar = await cookies();
  // Üretimde HTTPS üzerinden çalışırken çerez yalnız güvenli bağlantıda gönderilir.
  // Yerelde `npm start` ile http://localhost üzerinde denerken çerezin düşmemesi için adrese bakılır.
  const secure = (await baseUrl()).startsWith("https://");
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function destroySession() {
  (await cookies()).delete(COOKIE);
}

export async function getSession(): Promise<Session | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    const s = payload as unknown as Session;
    // Kullanıcı silinmiş olabilir; veritabanından doğrula
    const u = db.select().from(schema.users).where(eq(schema.users.id, s.userId)).get();
    if (!u || u.orgId !== s.orgId) return null;
    return { userId: u.id, orgId: u.orgId, name: u.name };
  } catch {
    return null;
  }
}

/** Panel sayfaları ve işlemleri için: oturum yoksa girişe yönlendirir. */
export async function requireSession(): Promise<Session> {
  const s = await getSession();
  if (!s) redirect("/giris");
  return s;
}
