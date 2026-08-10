import { NextRequest, NextResponse } from "next/server";

const locales = new Set(["en", "ru"]);

function preferredLocale(request: NextRequest) {
  const saved = request.cookies.get("unfolding-language")?.value;
  if (saved && locales.has(saved)) return saved;
  return request.headers.get("accept-language")?.toLowerCase().startsWith("ru") ? "ru" : "en";
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const firstSegment = pathname.split("/")[1];

  if (!locales.has(firstSegment)) {
    const locale = preferredLocale(request);
    const destination = request.nextUrl.clone();
    destination.pathname = pathname === "/" ? `/${locale}` : `/${locale}${pathname}`;
    return NextResponse.redirect(destination, 307);
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-unfolding-locale", firstSegment);
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ["/((?!_next/|favicon\\.svg|og\\.png|.*\\.[a-zA-Z0-9]+$).*)"],
};
