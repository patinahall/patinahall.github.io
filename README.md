# PatinaHall public notes

The official public publication for meaningful
[PatinaHall](https://patinahall.com/) releases and evergreen personal and
professional portraits of the specialist personas represented behind the
marketplace.

## Purpose

This repository owns short factual launch notes, Store announcements,
marketplace release updates, and the disclosed People section. It does not
mirror the PatinaHall catalogue, evergreen Guides, or longer Journal stories.
Those remain canonical on `patinahall.com`.

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

Every People profile must:

1. remain an editorial portrait of a team-managed digital role persona, not an
   employee record or natural-person biography;
2. include only personal interests explicitly approved for public use, without
   importing private boundaries, names or speculative detail into the page;
3. begin with the persona's interests and point of view, develop the vintage
   connection, and reserve the concrete PatinaHall role for the final section;
4. connect the represented profession to concrete PatinaHall work and one
   grounded way of looking at vintage furniture;
5. disclose the managed-persona and AI-generated-image boundary visibly;
6. use reviewed external profile links and content-hashed first-party media;
7. omit persona email aliases, credentials, invented personal history, and
   `Person`, founder, employee, or member structured-data claims.

## Publishing

The canonical local clone is the sibling `../patinahall.github.io` directory
when working from the PatinaHall marketplace workspace. Reuse that clone; do
not create a temporary clone for an ordinary update.

To publish an update or People profile:

1. Confirm the worktree is clean or identify and preserve existing changes.
   Use the HTTPS `origin` and the `patinahall` GitHub account; do not fall back
   to the engineering repository's SSH identity.
2. Fetch `origin/main` and fast-forward the clean local `main`.
3. Add one validated JSON document under `content/news/` or
   `content/people/`. News uses the current Europe/Amsterdam date; every
   public slug is permanent and must be chosen carefully.
4. For news, keep the required call to action on
   `https://patinahall.com/`. If a Store
   has no reviewed public destination yet, use an honest general PatinaHall
   destination rather than an unreviewed external link.
5. Run `npm run build`, then review the generated homepage, relevant archive
   or People hub, detail page, privacy page, feed, sitemap, and `llms.txt`.
6. Run `npm run check` and `git diff --check`.
7. Commit the source JSON and every generated page from the same build, then
   push `main`.
8. Confirm the GitHub Pages build reached `built` for that commit. Check the
   live article, homepage card, feed entry, and sitemap entry once.

Typical command sequence from the marketplace workspace:

```sh
cd ../patinahall.github.io
gh auth status
git remote -v
git status --short --branch
git fetch origin main
git merge --ff-only origin/main

# Add or edit content/news/YYYY-MM-DD-permanent-slug.json or
# content/people/permanent-slug.json.
npm run build
npm run check
git diff --check

# Replace these example paths, then stage every reviewed path from git status.
git add path/to/reviewed-source.json path/to/generated-page.html
git commit -m "Publish subject update"
git push origin main
gh api repos/patinahall/patinahall.github.io/pages/builds/latest
```

GitHub Pages publishes directly from the repository root after `main` is
pushed. There is no separate deploy command.

News and People slugs are permanent public URLs and should not be renamed after
publication. The site is dependency-free and is served directly by GitHub
Pages from the repository root. The RSS feed remains news-only.

## Privacy and analytics

The site works without analytics. Optional analytics loads only after a
visitor chooses `Allow all`; advertising and personalisation remain disabled.
The user-facing contract is on the [Privacy page](https://patinahall.github.io/privacy/),
and `npm run check` verifies the consent boundary before publication.
