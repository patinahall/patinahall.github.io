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

The canonical local clone is the sibling `../patinahall.github.io` directory
when working from the PatinaHall marketplace workspace. Reuse that clone; do
not create a temporary clone for an ordinary update.

Before changing it:

1. Confirm the worktree is clean or identify and preserve every existing
   change.
2. Confirm `origin` is
   `https://github.com/patinahall/patinahall.github.io.git` for fetch and push.
3. Confirm GitHub CLI is authenticated as the `patinahall` account. Stop if it
   is not; do not fall back to the engineering repository's SSH identity.
4. Fetch `origin/main` and fast-forward the clean local `main` before editing.

To publish one update:

1. Add one validated JSON document under `content/news/`. Use the current
   Europe/Amsterdam publication date and choose the permanent slug carefully.
2. Keep the required call to action on `https://patinahall.com/`. If a Store
   has no reviewed public destination yet, use an honest general PatinaHall
   destination instead of adding an unreviewed external link or changing the
   editorial-origin allowlist for one announcement.
3. Run `npm run build` once.
4. Review the generated homepage, archive, article, privacy page, feed,
   sitemap, and `llms.txt`. Confirm the source and generated article say what
   changed, who benefits, and where the reader can go now.
5. Run `npm run check` and `git diff --check`.
6. Commit the source JSON and every generated page changed by that build in
   one commit, then push `main` through the HTTPS `origin`.
7. Read the latest GitHub Pages build and confirm it reached `built` for the
   pushed commit. Then perform one bounded live check of the article URL, its
   homepage card, feed entry, and sitemap entry.

Typical command sequence from the marketplace workspace:

```sh
cd ../patinahall.github.io
gh auth status
git remote -v
git status --short --branch
git fetch origin main
git merge --ff-only origin/main

# Add or edit content/news/YYYY-MM-DD-permanent-slug.json.
npm run build
npm run check
git diff --check

# Review and stage the exact source and generated files before committing.
git push origin main
gh api repos/patinahall/patinahall.github.io/pages/builds/latest
```

GitHub Pages publishes directly from the repository root after `main` is
pushed. There is no separate deploy command and no CloudFront invalidation.

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
