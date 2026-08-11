# UNFOLDING entry workflow

These instructions are persistent repository policy. Apply them whenever a user creates, edits, reviews, translates, or publishes a journal entry. Natural-language intent is authoritative; the user never needs to type the internal commands below.

## Intent mapping

- Phrases equivalent to “Новая запись на русском”, “New entry RU”, or “New entry Russian” mean `new-entry(ru)`.
- Phrases equivalent to “Новая запись на английском”, “New entry EN”, or “New entry English” mean `new-entry(en)`.
- Phrases equivalent to “Перевод на английский”, “Английская версия”, “Translate to English”, or “Translate to EN” mean `translate(en)`.
- Phrases equivalent to “Перевод на русский”, “Русская версия”, “Translate to Russian”, or “Translate to RU” mean `translate(ru)`.
- Semantically equivalent natural phrasing has the same meaning. Do not ask the user to repeat review, tagging, translation, or publication rules when intent is clear.

## New entry

1. If the command contains the entry text, use it. Otherwise treat the user's next supplied text as the entry body.
2. Create exactly one entry with `pnpm entry:create <ru|en> <slug> --from <file>`. A title is optional; add `--title <title>` only when the author explicitly approved that metadata title, not merely because the draft contains an H1.
3. The script creates a stable UUID, an offset-aware `createdAt` in the current system timezone, sets `originalLanguage`, writes the source bytes unchanged to `draft.md`, and makes the entry active.
4. Prepare a structured review input covering every required category, then run `pnpm entry:review <slug> <locale> <review.json> <suggested-tags.json>`. If the lifecycle has no approved metadata title, also save a title proposal with `pnpm entry:title:suggest <slug|--active> <locale> <suggested-title.json>`.
5. Never rewrite `draft.md`, accept suggested tags, or publish automatically. Stop after presenting the review in clear human language and wait for the author.

## Review policy

Every review covers exactly these categories: `language`, `clarity`, `logic`, `factual_claims`, and `mathematics`. Each category must have a check with `status: reviewed` or `status: not_applicable`; never omit a category. Issues contain `category`, `location` (paragraph and/or exact fragment), `explanation`, `severity`, `status`, and optional `confidence`.

Review as an editor/teacher. Identify possible problems but do not silently correct the author's words. Store suggested semantic tags separately from approved `metadata.json.tags`; derive them from the actual content and do not use a fixed taxonomy. If there are no major or blocking open issues, explicitly say that the version is ready for publication from the review perspective.

When the author explicitly accepts or edits the tags, write only that approved list with `pnpm entry:tags <slug|--active> <locale> --from <approved-tags.json>`. Rejection may leave the approved list empty. Never promote `suggested-tags.json` automatically.

When no metadata title is approved, inspect the author text after review. If it contains an H1 (`# Title`), propose that exact H1 as the primary title but do not remove or alter it in `draft.md`, `original.md`, or `published.md`. Otherwise propose one natural title and add up to two alternatives only when genuinely useful. Store proposals in the language lifecycle's `suggested-title.json`. A title becomes metadata only after explicit author confirmation via `pnpm entry:title:approve <slug|--active> <locale> --title <title>`.

External links are optional root entry metadata and never part of author text. Store an explicitly supplied/approved list with `pnpm entry:links <slug|--active> --from <external-links.json>`. Keep `url` independent from `label`. GitHub links always render publicly as `GitHub ↗`, regardless of repository name; prefer a direct file/material URL supplied by the author.

The first review of each language lifecycle seals its own `original.md`. It is immutable thereafter and protected by SHA-256. A later draft may be reviewed again, but must not replace that snapshot.

## Authorial style

Avoid excessive use of the em dash (`—`) in proposed wording, editorial suggestions, and agent-generated translations. Do not use it as the default way to connect clauses when a full stop, comma, colon, or a natural restructuring expresses the thought more clearly. Retain an em dash where syntax or the author's rhythm genuinely calls for it.

This rule never authorizes changes to immutable author text. Do not remove, replace, or normalize punctuation in author-supplied `draft.md`, `original.md`, or `published.md` automatically.

## Revisions and active entry

- When context clearly identifies the current entry, treat a new author-supplied version as a revision of its `draft.md`, not a new entry. Use `pnpm entry:draft <slug|--active> <locale> --from <file>`, then review again.
- Repository state stores at most one explicit active entry in `content/.active-entry.json`. New-entry and explicit selection update it. Translation, review, revision, and publication may use it only when context is unambiguous.
- Never infer “active” merely from the newest timestamp. If conversational context and explicit active state conflict, or multiple drafts are plausible, ask which entry the author means. Use `pnpm entry:active -- show|set <slug>|clear` to inspect or change the explicit state.

## Translation

Translation creates another language lifecycle of the same root entry, never another root entry. Run `pnpm entry:translate <slug|--active> <ru|en> --from <file> --method <author|agent>` for author-supplied or agent-produced translation text. Preserve the root `id`, root `createdAt`, and `originalLanguage`; record `translatedAt` and private provenance `translationMethod` separately. Never expose translation provenance publicly without a separate author decision.

The translation lives under `translations/<locale>/` with `draft.md`, immutable review snapshot `original.md`, `review.json`, `review.md`, `suggested-tags.json`, and, only after explicit publication, `published.md`. If the agent writes the translation, it is still only a draft and requires normal review and author approval.

### Russian mathematical translation style

When translating mathematical or logical entries into Russian, use established terminology found in Russian-language university textbooks and courses rather than literal English calques. Preserve the mathematical meaning and proof structure exactly.

Use the following current terminology:

- `implication` → `импликация`
- `premise` → `посылка`
- `conclusion` → `заключение`
- `Modus Ponens` → `правило отделения (modus ponens)`
- `Conditional Proof` → `правило введения импликации` or `правило дедукции`
- `antecedent` → `антецедент`
- `consequent` → `консеквент`

For `antecedent` and `consequent`, do not introduce Russian technical terms unless they are useful in context. In explanatory prose, prefer a natural formulation that refers explicitly to `P`, `Q`, or the relevant expressions.

For `Conditional Proof`, prefer `правило введения импликации` when describing an inference step in a proof. Use `правило дедукции` only when that term matches the formal system or source under discussion. Write Latin names such as `modus ponens` in lowercase in Russian prose.

Do not translate mathematical terminology mechanically. If several established Russian equivalents exist and the correct choice depends on the formal system, record the ambiguity as a review issue instead of choosing silently.

## Publication gate

Only an explicit author instruction semantically equivalent to “Publish”, “Опубликовать”, “Publish as is”, or “Опубликовать как есть” authorizes publication. New entry, translation, revision, and review never create `published.md` or set a lifecycle to published. Publish the intended locale with `pnpm entry:publish <slug|--active> <locale> (--as-is|--from-draft)`. If locale or entry is genuinely ambiguous, ask one short question first.

Publishing one locale does not publish the other. Both versions retain the same root `id` and `createdAt`; `translatedAt`, `submittedAt`, and `publishedAt` are lifecycle history only and never replace the root date.
