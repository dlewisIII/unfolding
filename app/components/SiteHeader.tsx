import { ThemeControl } from "./ThemeControl";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { copy, type Locale } from "../i18n";

type AlternateRoutes = Record<string, Partial<Record<Locale, string>>>;

export function SiteHeader({ locale, alternateRoutes }: { locale: Locale; alternateRoutes: AlternateRoutes }) {
  const text = copy[locale];
  return (
    <header className="site-header">
      <nav className="top-nav" aria-label="Primary navigation">
        <a href={`/${locale}/about`} target="_top">{text.about}</a>
        <a href={`/${locale}/search`} target="_top">{text.search}</a>
        <div className="nav-controls">
          <LanguageSwitcher locale={locale} alternateRoutes={alternateRoutes} />
          <ThemeControl locale={locale} />
        </div>
      </nav>
      <div className="journal-identity">
        <a className="wordmark" href={`/${locale}`} target="_top" aria-label="Unfolding — journal">Unfolding</a>
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
