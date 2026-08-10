# Unfolding

A minimal personal journal and research notebook. The first vertical slice preserves authorship through three separate text states: an editable draft, an immutable review snapshot, and an explicitly selected published version.

## Content workflow

```sh
pnpm entry:create my-entry "My entry" en
# Write in content/entries/my-entry/draft.md
pnpm entry:review my-entry examples/review-input.json
pnpm entry:publish my-entry --as-is
pnpm content:sync
```

See [docs/CONTENT_WORKFLOW.md](docs/CONTENT_WORKFLOW.md) for the state and integrity rules. Review findings are canonical JSON records; the Markdown review is a generated reading view.

## Development

```sh
pnpm install
pnpm dev
pnpm build
pnpm test
```

The reader supports Markdown, inline math such as `$P \to Q$`, display math, code blocks, and images embedded in entry Markdown.
