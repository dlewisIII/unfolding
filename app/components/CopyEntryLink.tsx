"use client";

import { useEffect, useRef, useState } from "react";
import { copy, type Locale } from "../i18n";

export function CopyEntryLink({ locale, canonicalPath }: { locale: Locale; canonicalPath: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const text = copy[locale];

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  async function copyLink() {
    const url = new URL(canonicalPath, window.location.origin).href;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 1800);
  }

  return <span className="copy-entry-action">
    <button type="button" onClick={copyLink} aria-label={text.copyLink} title={text.copyLink}>
      <span className="chain-link-icon" aria-hidden="true" />
    </button>
    <span className="copy-entry-status" role="status" aria-live="polite">{copied ? text.linkCopied : ""}</span>
  </span>;
}
