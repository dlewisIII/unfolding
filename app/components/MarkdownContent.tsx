import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";

/**
 * remark-math accepts $…$ and $$…$$. Authorial Markdown also uses the
 * standard LaTeX display delimiters \[ … \], so normalize only complete,
 * standalone pairs before parsing. The stored Markdown remains untouched.
 */
export function normalizeDisplayMathDelimiters(markdown: string) {
  const lines = markdown.replace(/\r\n?/g, "\n").split("\n");
  const normalized: string[] = [];
  let bufferedBracketMath: string[] | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (bufferedBracketMath) {
      bufferedBracketMath.push(line);
      if (trimmed === "\\]") {
        normalized.push(
          bufferedBracketMath[0].replace(/^(\s*)\\\[\s*$/, (_match, indent: string) => `${indent}$$`),
          ...bufferedBracketMath.slice(1, -1),
          line.replace(/^(\s*)\\\]\s*$/, (_match, indent: string) => `${indent}$$`),
        );
        bufferedBracketMath = null;
      }
      continue;
    }

    if (trimmed === "\\[") {
      bufferedBracketMath = [line];
      continue;
    }
    normalized.push(line);
  }

  // An incomplete delimiter remains literal authorial text rather than being
  // silently converted into malformed display math.
  if (bufferedBracketMath) normalized.push(...bufferedBracketMath);
  return normalized
    .join("\n")
    // KaTeX has no glyph metrics for Cyrillic. In a \boxed{\text{…}} statement,
    // that can collapse the box edge into the text. A text-only statement is
    // displayed as centered display text; mathematical boxes remain unchanged.
    .replace(/\\boxed\{\\text\{([^{}]+)\}\}/g, "\\text{$1}");
}

/**
 * react-markdown intentionally does not render raw HTML. The journal sources
 * sometimes carry explicit safe external anchors, so convert that narrow form
 * to Markdown for rendering while leaving the stored author text untouched.
 * The component override below restores the required browser attributes.
 */
export function normalizeExternalAnchors(markdown: string) {
  return markdown.replace(
    /<a\s+href="([^"]+)"\s+target="_blank"\s+rel="noopener noreferrer">([\s\S]*?)<\/a>/g,
    (_match, href: string, label: string) => `[${label}](${href})`,
  );
}

export function MarkdownContent({ children }: { children: string }) {
  return <ReactMarkdown
    remarkPlugins={[remarkGfm, remarkMath]}
    rehypePlugins={[rehypeKatex]}
    components={{
      table: ({ node: _node, ...props }) => <div className="table-scroll"><table {...props} /></div>,
      a: ({ node: _node, href, ...props }) => {
        const external = typeof href === "string" && /^(?:https?:)?\/\//i.test(href);
        return <a
          {...props}
          href={href}
          target={external ? "_blank" : undefined}
          rel={external ? "noopener noreferrer" : undefined}
        />;
      },
    }}
  >{normalizeExternalAnchors(normalizeDisplayMathDelimiters(children))}</ReactMarkdown>;
}
