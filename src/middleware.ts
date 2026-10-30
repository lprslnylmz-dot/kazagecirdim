import { NextResponse, type NextRequest } from "next/server";

/** Panel sayfalarına oturum çerezi olmadan girilmesini engeller (asıl doğrulama sayfalarda yapılır). */
export function middleware(req: NextRequest) {
  if (!req.cookies.get("kg_session")) {
    const url = req.nextUrl.clone();
    url.pathname = "/giris";
    url.searchParams.set("sonra", req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = { matcher: ["/panel/:path*"] };
