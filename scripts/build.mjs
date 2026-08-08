import {
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync
} from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const checkOnly = process.argv.includes("--check");
const siteOrigin = "https://patinahall.github.io";
const marketplaceOrigin = "https://patinahall.com";
const generated = [];

const escapeHtml = (value) => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");

const escapeXml = escapeHtml;

const jsonForScript = (value) => JSON.stringify(value)
  .replaceAll("<", "\\u003c");

const assert = (condition, message) => {
  if (!condition) {
    throw new TypeError(message);
  }
};

const boundedText = (value, field, maximum) => {
  assert(typeof value === "string", `${field} must be a string`);
  const normalized = value.trim();
  assert(normalized.length > 0, `${field} must not be empty`);
  assert(normalized.length <= maximum, `${field} is too long`);
  return normalized;
};

const validatePost = (value, fileName) => {
  assert(value !== null && typeof value === "object", `${fileName} must be an object`);
  assert(value.schemaVersion === 1, `${fileName} has an unknown schemaVersion`);

  const slug = boundedText(value.slug, `${fileName}.slug`, 80);
  assert(/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(slug), `${fileName}.slug is invalid`);
  const publishedAt = boundedText(value.publishedAt, `${fileName}.publishedAt`, 10);
  assert(/^\d{4}-\d{2}-\d{2}$/u.test(publishedAt), `${fileName}.publishedAt is invalid`);
  assert(fileName.startsWith(`${publishedAt}-${slug}`), `${fileName} must match its date and slug`);

  assert(Array.isArray(value.sections) && value.sections.length > 0 && value.sections.length <= 8,
    `${fileName}.sections must contain 1-8 sections`);

  const sections = value.sections.map((section, sectionIndex) => {
    assert(section !== null && typeof section === "object", `${fileName}.sections[${sectionIndex}] is invalid`);
    const heading = section.heading === undefined
      ? undefined
      : boundedText(section.heading, `${fileName}.sections[${sectionIndex}].heading`, 120);
    assert(Array.isArray(section.paragraphs) && section.paragraphs.length > 0 && section.paragraphs.length <= 6,
      `${fileName}.sections[${sectionIndex}].paragraphs is invalid`);
    return {
      ...(heading === undefined ? {} : { heading }),
      paragraphs: section.paragraphs.map((paragraph, paragraphIndex) =>
        boundedText(paragraph, `${fileName}.sections[${sectionIndex}].paragraphs[${paragraphIndex}]`, 1_200))
    };
  });

  assert(value.callToAction !== null && typeof value.callToAction === "object",
    `${fileName}.callToAction is invalid`);
  const href = boundedText(value.callToAction.href, `${fileName}.callToAction.href`, 240);
  assert(href.startsWith(`${marketplaceOrigin}/`), `${fileName}.callToAction.href must stay on PatinaHall`);

  return Object.freeze({
    slug,
    title: boundedText(value.title, `${fileName}.title`, 120),
    description: boundedText(value.description, `${fileName}.description`, 220),
    publishedAt,
    label: boundedText(value.label, `${fileName}.label`, 40),
    sections,
    callToAction: {
      label: boundedText(value.callToAction.label, `${fileName}.callToAction.label`, 50),
      href
    }
  });
};

const posts = readdirSync(resolve(root, "content/news"))
  .filter((fileName) => fileName.endsWith(".json"))
  .map((fileName) => validatePost(
    JSON.parse(readFileSync(resolve(root, "content/news", fileName), "utf8")),
    fileName
  ))
  .sort((left, right) => right.publishedAt.localeCompare(left.publishedAt));

assert(posts.length > 0, "At least one news post is required");
assert(new Set(posts.map((post) => post.slug)).size === posts.length, "Post slugs must be unique");

const formatDate = (date) => new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Europe/Amsterdam"
}).format(new Date(`${date}T12:00:00Z`));

const navigation = `
  <header class="site-header">
    <a class="brand" href="/" aria-label="PatinaHall News home">
      <span class="brand__mark" aria-hidden="true"></span>
      <span>PATINAHALL NEWS</span>
    </a>
    <nav class="site-nav" aria-label="Main navigation">
      <a href="/news/">News</a>
      <a href="/about/">About</a>
      <a class="site-nav__primary" href="${marketplaceOrigin}/"><span>Visit PatinaHall</span><b aria-hidden="true">↗</b></a>
    </nav>
  </header>`;

const footer = `
  <footer class="site-footer">
    <div>
      <a class="brand" href="/">
        <span class="brand__mark" aria-hidden="true"></span>
        <span>PATINAHALL NEWS</span>
      </a>
      <p>Official launch notes and updates from the PatinaHall vintage furniture and antiques marketplace.</p>
    </div>
    <nav class="footer-links" aria-label="Footer navigation">
      <a href="/news/">News</a>
      <a href="/about/">About</a>
      <a href="${marketplaceOrigin}/">PatinaHall ↗</a>
    </nav>
    <small>© 2026 PatinaHall</small>
  </footer>`;

const layout = ({ title, description, canonicalPath, body, pageClass = "", structuredData }) => `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="${escapeHtml(description)}">
  <meta name="robots" content="index,follow">
  <meta name="theme-color" content="#f4f0e8">
  <title>${escapeHtml(title)}</title>
  <link rel="canonical" href="${siteOrigin}${canonicalPath}">
  <link rel="alternate" type="application/rss+xml" title="PatinaHall News" href="${siteOrigin}/feed.xml">
  <link rel="stylesheet" href="/assets/styles.css">
  <meta property="og:site_name" content="PatinaHall News">
  <meta property="og:type" content="${structuredData?.["@type"] === "NewsArticle" ? "article" : "website"}">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:url" content="${siteOrigin}${canonicalPath}">
  ${structuredData === undefined ? "" : `<script type="application/ld+json">${jsonForScript(structuredData)}</script>`}
</head>
<body class="${escapeHtml(pageClass)}">
${navigation}
${body}
${footer}
</body>
</html>
`;

const newsCard = (post, headingLevel = 2) => `
  <article class="news-card">
    <p class="eyebrow">${escapeHtml(post.label)}</p>
    <time datetime="${post.publishedAt}">${escapeHtml(formatDate(post.publishedAt))}</time>
    <h${headingLevel}><a href="/news/${post.slug}/">${escapeHtml(post.title)}</a></h${headingLevel}>
    <p>${escapeHtml(post.description)}</p>
    <a class="news-card__link" href="/news/${post.slug}/" aria-label="Read ${escapeHtml(post.title)}">Read the update →</a>
  </article>`;

const homeBody = `
  <main>
    <section class="hero">
      <div>
        <p class="eyebrow">From the marketplace</p>
        <h1>News &amp;<br>field notes.</h1>
      </div>
      <p class="hero__note">Updates from PatinaHall — a growing marketplace for furniture and objects with history, gathered from independent shops and dealers.</p>
    </section>
    <section class="latest" aria-labelledby="latest-title">
      <div class="section-heading">
        <h2 id="latest-title">Latest updates</h2>
        <a href="/news/">View all news →</a>
      </div>
      <div class="news-list">
        ${posts.slice(0, 6).map((post) => newsCard(post)).join("")}
      </div>
    </section>
  </main>`;

const homeDescription = "Official news, launch notes, and updates from the PatinaHall vintage furniture and antiques marketplace.";

const websiteData = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "PatinaHall News",
  description: homeDescription,
  url: `${siteOrigin}/`,
  publisher: {
    "@type": "Organization",
    name: "PatinaHall",
    url: `${marketplaceOrigin}/`
  }
};

generated.push(["index.html", layout({
  title: "PatinaHall News — launch notes and marketplace updates",
  description: homeDescription,
  canonicalPath: "/",
  body: homeBody,
  pageClass: "home-page",
  structuredData: websiteData
})]);

const archiveBody = `
  <main>
    <section class="archive-intro">
      <div>
        <p class="eyebrow">News archive</p>
        <h1>All updates.</h1>
      </div>
      <p>Launch notes, new Store pages, and considered updates from the people building PatinaHall.</p>
    </section>
    <section class="archive" aria-label="All PatinaHall news">
      <div class="news-list">
        ${posts.map((post) => newsCard(post)).join("")}
      </div>
    </section>
  </main>`;

generated.push(["news/index.html", layout({
  title: "News archive · PatinaHall News",
  description: "Browse every official launch note and marketplace update from PatinaHall.",
  canonicalPath: "/news/",
  body: archiveBody,
  pageClass: "archive-page"
})]);

for (const post of posts) {
  const canonicalPath = `/news/${post.slug}/`;
  const sections = post.sections.map((section) => `
      <section>
        ${section.heading === undefined ? "" : `<h2>${escapeHtml(section.heading)}</h2>`}
        ${section.paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("\n        ")}
      </section>`).join("");
  const articleBody = `
  <main class="article">
    <article>
      <header class="article__header">
        <p class="eyebrow">${escapeHtml(post.label)}</p>
        <h1>${escapeHtml(post.title)}</h1>
        <p class="article__dek">${escapeHtml(post.description)}</p>
        <time datetime="${post.publishedAt}">Published ${escapeHtml(formatDate(post.publishedAt))}</time>
      </header>
      <div class="article__body">
        ${sections}
        <a class="article__cta" href="${escapeHtml(post.callToAction.href)}">${escapeHtml(post.callToAction.label)} <span aria-hidden="true">↗</span></a>
      </div>
    </article>
  </main>`;
  const articleData = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: post.title,
    description: post.description,
    datePublished: post.publishedAt,
    dateModified: post.publishedAt,
    mainEntityOfPage: `${siteOrigin}${canonicalPath}`,
    author: {
      "@type": "Organization",
      name: "PatinaHall"
    },
    publisher: {
      "@type": "Organization",
      name: "PatinaHall",
      url: `${marketplaceOrigin}/`
    }
  };
  generated.push([`news/${post.slug}/index.html`, layout({
    title: `${post.title} · PatinaHall News`,
    description: post.description,
    canonicalPath,
    body: articleBody,
    pageClass: "article-page",
    structuredData: articleData
  })]);
}

const aboutBody = `
  <main class="about-page">
    <div>
      <p class="eyebrow">About this publication</p>
      <h1>Notes from PatinaHall.</h1>
      <p>PatinaHall News is the official update journal for PatinaHall, a marketplace for vintage furniture, antiques, independent stores, and useful buying guidance.</p>
      <p>We publish launch notes, meaningful marketplace changes, and new ways to explore furniture and objects with history. For the catalogue and practical guides, visit <a href="${marketplaceOrigin}/">patinahall.com</a>.</p>
    </div>
  </main>`;

generated.push(["about/index.html", layout({
  title: "About · PatinaHall News",
  description: "Learn what PatinaHall News publishes and how it relates to the PatinaHall marketplace.",
  canonicalPath: "/about/",
  body: aboutBody,
  pageClass: "about"
})]);

const notFoundBody = `
  <main class="not-found">
    <div>
      <p class="eyebrow">404</p>
      <h1>This note is not here.</h1>
      <p>Return to the <a href="/news/">news archive</a> or continue to <a href="${marketplaceOrigin}/">PatinaHall</a>.</p>
    </div>
  </main>`;

generated.push(["404.html", layout({
  title: "Page not found · PatinaHall News",
  description: "The requested PatinaHall News page could not be found.",
  canonicalPath: "/404.html",
  body: notFoundBody,
  pageClass: "not-found-page"
}).replace('<meta name="robots" content="index,follow">', '<meta name="robots" content="noindex,follow">')]);

const sitemapPaths = [
  "/",
  "/news/",
  "/about/",
  ...posts.map((post) => `/news/${post.slug}/`)
];

generated.push(["sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapPaths.map((path) => `  <url><loc>${siteOrigin}${escapeXml(path)}</loc></url>`).join("\n")}
</urlset>
`]);

generated.push(["feed.xml", `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>PatinaHall News</title>
    <link>${siteOrigin}/</link>
    <description>${escapeXml(homeDescription)}</description>
    <language>en</language>
${posts.map((post) => `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${siteOrigin}/news/${post.slug}/</link>
      <guid isPermaLink="true">${siteOrigin}/news/${post.slug}/</guid>
      <pubDate>${new Date(`${post.publishedAt}T12:00:00Z`).toUTCString()}</pubDate>
      <description>${escapeXml(post.description)}</description>
    </item>`).join("\n")}
  </channel>
</rss>
`]);

generated.push(["robots.txt", `User-agent: *
Allow: /

Sitemap: ${siteOrigin}/sitemap.xml
`]);

const mismatches = [];

for (const [relativePath, content] of generated) {
  const target = resolve(root, relativePath);
  const normalizedContent = content.replace(/[ \t]+$/gmu, "");
  if (checkOnly) {
    let current;
    try {
      current = readFileSync(target, "utf8");
    } catch {
      mismatches.push(relativePath);
      continue;
    }
    if (current !== normalizedContent) {
      mismatches.push(relativePath);
    }
    continue;
  }

  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, normalizedContent, "utf8");
}

if (mismatches.length > 0) {
  console.error(`Generated files are stale: ${mismatches.join(", ")}`);
  process.exitCode = 1;
} else {
  console.log(checkOnly
    ? `Verified ${generated.length} generated files.`
    : `Generated ${generated.length} files from ${posts.length} news posts.`);
}
