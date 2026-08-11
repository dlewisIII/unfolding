import { ThemeControl } from "./ThemeControl";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { copy, type Locale } from "../i18n";
import wordmarkSvg from "../../unfolding-wordmark.svg?raw";

type AlternateRoutes = Record<string, Partial<Record<Locale, string>>>;

export function SiteHeader({ locale, alternateRoutes }: { locale: Locale; alternateRoutes: AlternateRoutes }) {
  const text = copy[locale];
  return (
    <header className="site-header">
      <nav className="top-nav" aria-label="Primary navigation">
        <a className="home-link" href={`/${locale}`} aria-label={locale === "ru" ? "Главная" : "Home"} title={locale === "ru" ? "Главная" : "Home"}>
          <span className="home-icon" aria-hidden="true" />
        </a>
        <a href={`/${locale}/about`}>{text.about}</a>
        <a href={`/${locale}/search`}>{text.search}</a>
        <div className="nav-controls">
          <LanguageSwitcher locale={locale} alternateRoutes={alternateRoutes} />
          <ThemeControl locale={locale} />
        </div>
      </nav>
      <div className="journal-identity">
        <a className="wordmark" href={`/${locale}`} aria-label="UNFOLDING">
          <span className="wordmark-art" aria-hidden="true" dangerouslySetInnerHTML={{ __html: wordmarkSvg }} />
        </a>
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
