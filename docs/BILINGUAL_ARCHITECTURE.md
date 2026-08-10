# Bilingual architecture

UNFOLDING uses symmetric, indexable locale routes: `/en/...` and `/ru/...`.
The root route chooses a locale from the saved `unfolding-language` cookie and
then from `Accept-Language`. It never uses IP address or geolocation.

Each entry directory remains one entity with one stable `id` and an
`originalLanguage` (`en` or `ru`). The original published version remains in
`published.md`. An optional author-approved translation is stored at
`translations/<locale>/published.md` and described by
`metadata.translations.<locale>`:

```json
{
  "translations": {
    "ru": {
      "status": "published",
      "slug": "localized-slug",
      "title": "Localized title",
      "publishedAt": "2026-08-11T00:00:00.000Z",
      "tags": []
    }
  }
}
```

No translation is generated or published automatically. A locale entry route
exists only when that version is explicitly marked `published` and its
`published.md` exists. On an entry without a translation, the unavailable
language remains visible in the switcher but is disabled and explains that the
translation has not been published.

Localized pages emit a canonical URL and `hreflang` alternates. Entry pages
emit alternates only for versions that actually exist, preventing fictional or
machine-translated pages from entering the index.
