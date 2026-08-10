import Link from "next/link";
import { Logo } from "./Logo";
import { ThemeControl } from "./ThemeControl";

export function SiteHeader() {
  return (
    <header className="site-header">
      <Logo />
      <nav className="top-nav" aria-label="Primary navigation">
        <Link href="/about">About</Link>
        <Link href="/search">Search</Link>
        <ThemeControl />
      </nav>
    </header>
  );
}
