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

`review.json` is canonical and machine-readable. `review.md` is a derived human view. Connections are reserved as independent documents under `content/connections/`; discovery and UI are intentionally not implemented yet.
