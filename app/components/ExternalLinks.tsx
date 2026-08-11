import type { ExternalLink } from "@/content/generated";

export function ExternalLinks({ links, ariaLabel }: { links: ExternalLink[]; ariaLabel: string }) {
  if (!links.length) return null;
  return <nav className="external-links" aria-label={ariaLabel}>
    {links.map((link) => <a href={link.url} target="_blank" rel="noopener noreferrer" key={link.id}>{link.type === "github" ? "GitHub ↗" : `${link.label} ↗`}</a>)}
  </nav>;
}
