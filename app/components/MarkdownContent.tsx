import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import { remarkDetails } from "../lib/markdown-details.mjs";

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

type HastNode = { type: string; value?: string; properties?: { className?: string[] }; children?: HastNode[] };

function cellText(node: HastNode): string {
  return node.type === "text" ? node.value ?? "" : (node.children ?? []).map(cellText).join("");
}

function hasMath(node: HastNode): boolean {
  return Boolean(node.properties?.className?.includes("katex")) || (node.children ?? []).some(hasMath);
}

/** Long prose wraps inside table cells; short values and formulas stay on one line so numbers never split. */
function cellClassName(node: HastNode) {
  return hasMath(node) || cellText(node).trim().length <= 14 ? "cell-compact" : undefined;
}

export function MarkdownContent({ children }: { children: string }) {
  return <ReactMarkdown
    remarkPlugins={[remarkGfm, remarkMath, remarkDetails]}
    rehypePlugins={[rehypeKatex]}
    components={{
      table: ({ node: _node, ...props }) => <div className="table-scroll"><table {...props} /></div>,
      th: ({ node, ...props }) => <th {...props} className={node ? cellClassName(node as HastNode) : undefined} />,
      td: ({ node, ...props }) => <td {...props} className={node ? cellClassName(node as HastNode) : undefined} />,
      a: ({ node: _node, href, children, ...props }) => {
        const external = typeof href === "string" && /^(?:https?:)?\/\//i.test(href);
        return <a
          {...props}
          href={href}
          target={external ? "_blank" : undefined}
          rel={external ? "noopener noreferrer" : undefined}
        >{children}</a>;
      },
    }}
  >{normalizeExternalAnchors(normalizeDisplayMathDelimiters(children))}</ReactMarkdown>;
}
