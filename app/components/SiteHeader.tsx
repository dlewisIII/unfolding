/* eslint-disable @next/next/no-html-link-for-pages -- vinext client navigation currently stalls in production; document navigation is intentional. */
import { ThemeControl } from "./ThemeControl";

export function SiteHeader() {
  return (
    <header className="site-header">
      <nav className="top-nav" aria-label="Primary navigation">
        <a href="/about" target="_top">About</a>
        <a href="/search" target="_top">Search</a>
        <ThemeControl />
      </nav>
      <div className="journal-identity">
        <a className="wordmark" href="/" target="_top" aria-label="Unfolding — journal">Unfolding</a>
        <div className="identity-rule" aria-hidden="true" />
        <ul className="concept-coordinates" aria-label="Conceptual coordinates">
          <li>Phenomenology</li>
          <li>Metaphysics</li>
          <li>Science</li>
          <li>Experience</li>
          <li>Creation</li>
        </ul>
      </div>
    </header>
  );
}
