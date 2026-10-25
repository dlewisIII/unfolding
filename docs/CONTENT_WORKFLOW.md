# Content workflow

The author text has three deliberately separate states:

- `draft.md` is the editable working text.
- `original.md` is created once, with an exclusive write, when the draft is submitted for review. Its SHA-256 is recorded and verified before publishing or syncing content.
- `published.md` is created only by an explicit `--as-is` or `--from-draft` publication decision.

## First vertical slice

```sh
pnpm entry:create my-entry "My entry" en
# edit content/entries/my-entry/draft.md
pnpm entry:review my-entry examples/review-input.json
# inspect review.json and review.md; optionally edit draft.md
pnpm entry:publish my-entry --as-is
pnpm content:sync
```

Use `--from-draft` after the author has made post-review edits and explicitly selected that working version for publication. Neither review nor tags can modify any Markdown body.

For a reviewed bilingual entry, the author may approve publication of both language versions together. In that case, the already presented reviewed tag proposals for RU and EN are approved as a pair and saved to their respective language lifecycles before publishing. The two tag lists remain independent; one is never mechanically copied or translated from the other.

Entry Markdown may contain collapsible blocks. The site renders exactly this form; any other raw HTML stays literal text:

```md
<details>
<summary>Plain-text label</summary>

Ordinary Markdown: lists, emphasis, links, math.

</details>
```

Keep the blank lines around the content. `<details open>` starts expanded, blocks may be nested, lists inside keep their markers, printing expands every block, and collapsed content is left out of the entry excerpt.

An entry with collapsible blocks is typeset as a research edition. Put each Sanskrit source in a blockquote (the Devanāgarī line, then the IAST line in italics) and the translation in the paragraph right after it. The sūtra's source goes directly under an `##` heading, and each commentary passage goes under its own `###` heading. Entries without collapsible blocks keep the ordinary blockquote style.

`review.json` is canonical and machine-readable. `review.md` is a derived human view. Connections are reserved as independent documents under `content/connections/`; discovery and UI are intentionally not implemented yet.
