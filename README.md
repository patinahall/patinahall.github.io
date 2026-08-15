# PatinaHall Updates

The official, dated public record of meaningful releases from
[PatinaHall](https://patinahall.com/), a marketplace for vintage furniture,
antiques, design objects, and independent stores.

## Purpose

This repository owns short factual launch notes, Store announcements, and
marketplace release updates. It does not mirror the PatinaHall catalogue,
evergreen Guides, or longer Journal stories. Those remain canonical on
`patinahall.com`.

GitHub Issues are the curated
[public roadmap](https://github.com/patinahall/patinahall.github.io/issues).
They must not contain private seller data, credentials, production incidents,
or internal evidence.

Every update should state:

1. what changed;
2. who benefits;
3. where the reader can see or use it.

Do not publish keyword-only pages, generated catalogue mirrors, speculative
claims, or rewritten copies of content already published on PatinaHall.

## Publishing

1. Add one validated JSON document under `content/news/`.
2. Run `npm run build`.
3. Review the generated homepage, archive, article, feed, sitemap, and
   `llms.txt`.
4. Run `npm run check` and commit both the source and generated pages.

Article slugs are permanent public URLs and should not be renamed after
publication. The site is dependency-free and is served directly by GitHub
Pages from the repository root.
