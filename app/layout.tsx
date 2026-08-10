import type { Metadata } from "next";
import { headers } from "next/headers";
import { SiteHeader } from "./components/SiteHeader";
import "@fontsource/bodoni-moda/400.css";
import "@fontsource/cormorant-garamond/400.css";
import "@fontsource/cormorant-garamond/500.css";
import "@fontsource/source-serif-4/400.css";
import "@fontsource/source-serif-4/400-italic.css";
import "@fontsource/source-serif-4/600.css";
import "@fontsource/ibm-plex-sans/400.css";
import "@fontsource/ibm-plex-sans/500.css";
import "katex/dist/katex.min.css";
import "./globals.css";

const themeBoot = `(function(){try{var t=localStorage.getItem('unfolding-theme');if(t==='light'||t==='dark')document.documentElement.setAttribute('data-theme',t);else document.documentElement.removeAttribute('data-theme')}catch(e){}})()`;

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host?.startsWith("localhost") || host?.startsWith("127.0.0.1") ? "http" : "https");
  const origin = host ? `${protocol}://${host}` : "https://unfolding.local";
  return {
    title: { default: "Unfolding", template: "%s · Unfolding" },
    description: "A personal journal and research notebook.",
    icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
    openGraph: {
      type: "website",
      title: "Unfolding",
      description: "Personal journal & research notebook",
      images: [{ url: `${origin}/og.png`, width: 1200, height: 630, alt: "Unfolding — Personal journal & research notebook" }],
    },
    twitter: { card: "summary_large_image", images: [`${origin}/og.png`] },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: themeBoot }} /></head>
      <body>
        <div className="site-shell">
          <SiteHeader />
          {children}
          <footer className="site-footer">Written and tended by Anastasia.</footer>
        </div>
      </body>
    </html>
  );
}
