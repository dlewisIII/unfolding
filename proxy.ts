import { NextRequest, NextResponse } from "next/server";

const themes = new Set(["light", "dark"]);
const primaryHost = "unfolding.day";
const legacyHosts = new Set(["www.unfolding.day"]);

function canonicalPath(pathname: string) {
  return pathname === "/en" ? "/" : pathname.startsWith("/en/") ? pathname.slice(3) || "/" : pathname;
}

export function proxy(request: NextRequest) {
  const forwardedHost = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "";
  const host = forwardedHost.split(",")[0].trim().split(":")[0].toLowerCase();

  if (legacyHosts.has(host)) {
    const destination = request.nextUrl.clone();
    destination.protocol = "https:";
    destination.host = primaryHost;
    destination.pathname = canonicalPath(destination.pathname);
    return NextResponse.redirect(destination, 301);
  }

  const { pathname } = request.nextUrl;
  const firstSegment = pathname.split("/")[1];

  if (firstSegment === "en") {
    const destination = request.nextUrl.clone();
    destination.pathname = canonicalPath(pathname);
    return NextResponse.redirect(destination, 301);
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-unfolding-locale", firstSegment === "ru" ? "ru" : "en");
  const theme = request.cookies.get("unfolding-theme")?.value;
  if (theme && themes.has(theme)) requestHeaders.set("x-unfolding-theme", theme);
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ["/:path*"],
};
