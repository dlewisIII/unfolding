import Link from "next/link";
import { ThemeControl } from "./ThemeControl";

export function SiteHeader() {
  return (
    <header className="site-header">
      <nav className="top-nav" aria-label="Primary navigation">
        <Link href="/about">About</Link>
        <Link href="/search">Search</Link>
        <ThemeControl />
      </nav>
      <div className="journal-identity">
        <Link className="wordmark" href="/" aria-label="Unfolding — journal">Unfolding</Link>
        <div className="identity-rule" aria-hidden="true" />
        <p className="concept-coordinates" aria-label="Conceptual coordinates: Phenomenology">
          <span>Phenomenology</span>
        </p>
      </div>
    </header>
  );
}
