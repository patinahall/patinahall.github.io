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
3. Review the generated homepage, archive, article, privacy page, feed,
   sitemap, and `llms.txt`.
4. Run `npm run check` and commit both the source and generated pages.

Article slugs are permanent public URLs and should not be renamed after
publication. The site is dependency-free and is served directly by GitHub
Pages from the repository root.

## Optional analytics

The site uses the same Google Analytics 4 web stream as `patinahall.com` via
Google Tag Manager container `GTM-K4GWHP6J`; the current GA4 measurement ID is
`G-2SNNEES0DF`. Google remains absent from the network until a visitor chooses
`Allow all`. Advertising, advertising user data, advertising
personalisation, optional functionality storage, and personalisation storage
remain denied. The standard no-JavaScript GTM iframe is deliberately absent.

The versioned browser choice stops being accepted after 180 days and can be
reopened from the ordinary footer. Because browser storage is origin-scoped,
the Updates choice is separate from the choice stored on `patinahall.com`.
Withdrawing consent stops future GTM loading after reload; it does not delete
Google cookies or data already received by Google.

Cross-domain measurement is an external GA4 web-stream setting, not a
repository setting. It should include the exact domains `patinahall.com` and
`patinahall.github.io` so a consented linked journey can retain one user and
session.

Before a release that relies on GTM, inspect the published container without
executing it. The 2026-08-16 review found a 343,616-byte response with SHA-256
`5c3a319aaf62d96bd98495d27f3610f02179de313fcdfbb357b3d85a3d2a48fc`:
one configured `__googtag` resource for `G-2SNNEES0DF`, firing on `gtm.init`,
and no configured advertising destination ID.
