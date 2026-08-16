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
const siteName = "PatinaHall Updates";
const siteDescription =
  "Official, dated updates from PatinaHall — a marketplace for vintage furniture, antiques, design objects, and independent stores.";
const aboutUpdatedAt = "2026-08-16";
const privacyUpdatedAt = "2026-08-16";
const socialProfiles = Object.freeze([
  "https://www.linkedin.com/company/patinahall/",
  "https://www.instagram.com/patinahallcom/",
  "https://nl.pinterest.com/patinahall/",
  "https://www.youtube.com/@patinahall"
]);
const allowedEditorialLinkOrigins = new Set([
  marketplaceOrigin,
  "https://www.entouragefinds.com"
]);
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

const httpsUrl = (value, field, maximum = 320) => {
  const input = boundedText(value, field, maximum);
  let url;

  try {
    url = new URL(input);
  } catch {
    throw new TypeError(`${field} must be an absolute URL`);
  }

  assert(url.protocol === "https:", `${field} must use HTTPS`);
  assert(url.username.length === 0 && url.password.length === 0,
    `${field} must not contain credentials`);
  return url;
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

  const relatedLinks = value.relatedLinks === undefined
    ? []
    : value.relatedLinks;
  assert(Array.isArray(relatedLinks) && relatedLinks.length <= 2,
    `${fileName}.relatedLinks must contain at most 2 links`);
  const validatedRelatedLinks = relatedLinks.map((link, linkIndex) => {
    assert(link !== null && typeof link === "object",
      `${fileName}.relatedLinks[${linkIndex}] is invalid`);
    const url = httpsUrl(
      link.href,
      `${fileName}.relatedLinks[${linkIndex}].href`
    );
    assert(allowedEditorialLinkOrigins.has(url.origin),
      `${fileName}.relatedLinks[${linkIndex}].href is not an approved editorial origin`);
    return {
      label: boundedText(
        link.label,
        `${fileName}.relatedLinks[${linkIndex}].label`,
        60
      ),
      href: url.href
    };
  });

  let image;
  if (value.image !== undefined) {
    assert(value.image !== null && typeof value.image === "object",
      `${fileName}.image is invalid`);
    const imageUrl = httpsUrl(value.image.url, `${fileName}.image.url`);
    assert(imageUrl.origin === siteOrigin,
      `${fileName}.image.url must stay on PatinaHall Updates`);
    assert(Number.isInteger(value.image.width) && value.image.width > 0,
      `${fileName}.image.width must be a positive integer`);
    assert(Number.isInteger(value.image.height) && value.image.height > 0,
      `${fileName}.image.height must be a positive integer`);
    image = {
      url: imageUrl.href,
      src: imageUrl.pathname,
      alt: boundedText(value.image.alt, `${fileName}.image.alt`, 180),
      width: value.image.width,
      height: value.image.height
    };
  }

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
    },
    relatedLinks: validatedRelatedLinks,
    ...(image === undefined ? {} : { image })
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
    <a class="brand" href="/" aria-label="PatinaHall Updates home">
      <span class="brand__mark" aria-hidden="true"></span>
      <span>PATINAHALL UPDATES</span>
    </a>
    <nav class="site-nav" aria-label="Main navigation">
      <a href="/news/">Updates</a>
      <a href="/about/">About</a>
      <a class="site-nav__primary" href="${marketplaceOrigin}/"><span>Explore PatinaHall</span><b aria-hidden="true">↗</b></a>
    </nav>
  </header>`;

const analyticsConsent = `
  <aside class="analytics-consent" data-analytics-consent-panel hidden aria-label="Privacy choices">
    <div class="analytics-consent__copy">
      <div class="analytics-consent__heading">
        <p class="eyebrow">Privacy choices</p>
        <button class="analytics-consent__close" type="button" data-analytics-consent-close hidden aria-label="Close privacy choices">×</button>
      </div>
      <h2>A clearer picture, only if you agree.</h2>
      <p>Essential storage remembers this choice. Optional analytics helps us understand which updates are useful. This site works without analytics. <a href="/privacy/">Read the privacy note</a>.</p>
      <p class="analytics-consent__detail">Allow all means essential storage plus optional analytics. Advertising and personalisation stay off.</p>
      <p class="analytics-consent__status" data-analytics-consent-status role="status" hidden></p>
      <p class="analytics-consent__error" data-analytics-consent-error role="alert" hidden>We could not save your choice. Enable site storage and try again; analytics remains off.</p>
    </div>
    <div class="analytics-consent__actions">
      <button type="button" data-analytics-choice="denied" aria-pressed="false">Essential only</button>
      <button type="button" data-analytics-choice="granted" aria-pressed="false">Allow all</button>
    </div>
  </aside>`;

const footer = `
  <footer class="site-footer">
    <div>
      <a class="brand" href="/">
        <span class="brand__mark" aria-hidden="true"></span>
        <span>PATINAHALL UPDATES</span>
      </a>
      <p>Official, dated updates from PatinaHall — a marketplace for vintage furniture, antiques, design objects, and independent stores.</p>
    </div>
    <nav class="footer-links" aria-label="Footer navigation">
      <a href="/news/">Updates</a>
      <a href="/about/">About</a>
      <a href="/privacy/">Privacy</a>
      <button type="button" class="footer-links__button" data-analytics-consent-open hidden>Privacy choices</button>
      <a href="${marketplaceOrigin}/catalog">Catalogue ↗</a>
      <a href="${marketplaceOrigin}/stores">Stores ↗</a>
    </nav>
    <small>© 2026 PatinaHall</small>
  </footer>`;

const layout = ({ title, description, canonicalPath, body, pageClass = "", structuredData, image }) => `<!doctype html>
<html lang="en">
<head>
  <script src="/assets/analytics-consent.js" defer></script>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="${escapeHtml(description)}">
  <meta name="robots" content="index,follow">
  <meta name="theme-color" content="#f4f0e8">
  <title>${escapeHtml(title)}</title>
  <link rel="canonical" href="${siteOrigin}${canonicalPath}">
  <link rel="alternate" type="application/rss+xml" title="PatinaHall Updates" href="${siteOrigin}/feed.xml">
  <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
  <link rel="shortcut icon" href="/favicon.ico">
  <link rel="stylesheet" href="/assets/styles.css">
  <meta property="og:site_name" content="PatinaHall Updates">
  <meta property="og:type" content="${structuredData?.["@type"] === "NewsArticle" ? "article" : "website"}">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:url" content="${siteOrigin}${canonicalPath}">
  <meta name="twitter:card" content="${image === undefined ? "summary" : "summary_large_image"}">
  ${image === undefined ? "" : `<meta property="og:image" content="${escapeHtml(image.url)}">
  <meta property="og:image:alt" content="${escapeHtml(image.alt)}">
  <meta property="og:image:width" content="${image.width}">
  <meta property="og:image:height" content="${image.height}">
  <meta name="twitter:image" content="${escapeHtml(image.url)}">`}
  ${structuredData === undefined ? "" : `<script type="application/ld+json">${jsonForScript(structuredData)}</script>`}
</head>
<body class="${escapeHtml(pageClass)}">
${navigation}
${body}
${footer}
${analyticsConsent}
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
        <p class="eyebrow">Official PatinaHall updates</p>
        <h1>Building a clearer marketplace for furniture with history.</h1>
      </div>
      <div class="hero__note">
        <p>PatinaHall brings vintage furniture, antiques, and design objects from independent stores into one calm, current catalogue.</p>
        <p>Buyers discover pieces on PatinaHall and continue to the original seller.</p>
        <div class="hero__actions">
          <a href="${marketplaceOrigin}/catalog">Browse the catalogue <span aria-hidden="true">→</span></a>
          <a href="${marketplaceOrigin}/seller/">For store owners <span aria-hidden="true">↗</span></a>
        </div>
      </div>
    </section>
    <section class="latest" aria-labelledby="latest-title">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Public record</p>
          <h2 id="latest-title">Latest updates</h2>
        </div>
        <a href="/news/">View all updates →</a>
      </div>
      <div class="news-list news-list--home">
        ${posts.slice(0, 3).map((post) => newsCard(post)).join("")}
      </div>
    </section>
    <section class="identity" aria-labelledby="identity-title">
      <header>
        <p class="eyebrow">What PatinaHall does</p>
        <h2 id="identity-title">Independent stores stay independent. Their pieces become easier to discover.</h2>
      </header>
      <div class="identity__list">
        <article>
          <span>01</span>
          <h3><a href="${marketplaceOrigin}/catalog">One current catalogue</a></h3>
          <p>Explore available furniture and objects from different stores without losing the identity of the seller.</p>
        </article>
        <article>
          <span>02</span>
          <h3><a href="${marketplaceOrigin}/stores">Independent store pages</a></h3>
          <p>Understand who found each piece, then continue directly to that store when something feels right.</p>
        </article>
        <article>
          <span>03</span>
          <h3><a href="${marketplaceOrigin}/seller/">Catalogue import for sellers</a></h3>
          <p>Supported Shopify stores can prepare their existing catalogue privately instead of recreating every listing.</p>
        </article>
      </div>
    </section>
  </main>`;

const organizationId = `${marketplaceOrigin}/#organization`;
const websiteId = `${siteOrigin}/#website`;
const organizationData = Object.freeze({
  "@type": "Organization",
  "@id": organizationId,
  name: "PatinaHall",
  url: `${marketplaceOrigin}/`,
  description:
    "A marketplace for vintage furniture, antiques, design objects, and independent stores.",
  sameAs: socialProfiles
});
const websiteData = {
  "@context": "https://schema.org",
  "@graph": [organizationData, {
    "@type": "WebSite",
    "@id": websiteId,
    name: siteName,
    description: siteDescription,
    url: `${siteOrigin}/`,
    publisher: organizationData,
    about: { "@id": organizationId }
  }]
};

generated.push(["index.html", layout({
  title: "PatinaHall Updates — official marketplace releases",
  description: siteDescription,
  canonicalPath: "/",
  body: homeBody,
  pageClass: "home-page",
  structuredData: websiteData
})]);

const archiveBody = `
  <main>
    <section class="archive-intro">
      <div>
        <p class="eyebrow">Dated public record</p>
        <h1>All updates.</h1>
      </div>
      <p>Short, factual notes about public releases, independent Store pages, and meaningful changes to PatinaHall.</p>
    </section>
    <section class="archive" aria-label="All PatinaHall updates">
      <div class="news-list">
        ${posts.map((post) => newsCard(post)).join("")}
      </div>
    </section>
  </main>`;

generated.push(["news/index.html", layout({
  title: "All updates · PatinaHall Updates",
  description: "Browse every official, dated marketplace update from PatinaHall.",
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
  const relatedLinks = post.relatedLinks.map((link) =>
    `<a class="article__related-link" href="${escapeHtml(link.href)}">${escapeHtml(link.label)} <span aria-hidden="true">↗</span></a>`
  ).join("");
  const articleBody = `
  <main class="article">
    <article>
      <header class="article__header">
        <p class="eyebrow">${escapeHtml(post.label)}</p>
        <h1>${escapeHtml(post.title)}</h1>
        <p class="article__dek">${escapeHtml(post.description)}</p>
        <time datetime="${post.publishedAt}">Published ${escapeHtml(formatDate(post.publishedAt))}</time>
      </header>
      ${post.image === undefined ? "" : `<figure class="article__media">
        <img src="${escapeHtml(post.image.src)}" alt="${escapeHtml(post.image.alt)}" width="${post.image.width}" height="${post.image.height}" fetchpriority="high">
      </figure>`}
      <div class="article__body">
        ${sections}
        <div class="article__actions">
          <a class="article__cta" href="${escapeHtml(post.callToAction.href)}">${escapeHtml(post.callToAction.label)} <span aria-hidden="true">↗</span></a>
          ${relatedLinks}
        </div>
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
    author: organizationData,
    publisher: organizationData,
    isPartOf: { "@id": websiteId },
    about: { "@id": organizationId },
    ...(post.image === undefined ? {} : { image: [post.image.url] })
  };
  generated.push([`news/${post.slug}/index.html`, layout({
    title: `${post.title} · PatinaHall Updates`,
    description: post.description,
    canonicalPath,
    body: articleBody,
    pageClass: "article-page",
    structuredData: articleData,
    ...(post.image === undefined ? {} : { image: post.image })
  })]);
}

const aboutBody = `
  <main class="about-page">
    <header class="about-intro">
      <p class="eyebrow">What we are building</p>
      <h1>Two principles guide PatinaHall.</h1>
      <p class="about-intro__lede">PatinaHall is a marketplace for vintage furniture, antiques, and design objects. We are building it around two practical commitments: less duplicate work for independent sellers, and a catalogue that rewards a buyer's attention.</p>
    </header>
    <section class="principles" aria-label="PatinaHall principles">
      <article class="principle">
        <p class="principle__label">01 · For store owners</p>
        <h2>Another route to buyers, not another catalogue to babysit.</h2>
        <p>Independent shops should not have to rebuild and maintain the same catalogue everywhere they sell. Our goal is zero duplicate catalogue maintenance: sellers keep working in the system they already use, while PatinaHall takes on the repetitive work needed to make those products discoverable in another place. Buyers continue to the original seller, so the shop keeps its own customer relationship.</p>
        <p>That is both a product-design and an engineering problem. Routine work should happen quietly. Reviews, exceptions, and anything that changes what a buyer sees should stay clear and under the seller's control. Over time, we want one reliable product update to reach more relevant channels without copying titles, prices, availability, and photographs by hand.</p>
        <p class="principle__status"><strong>What works today:</strong> supported Shopify stores can import an existing catalogue into a private PatinaHall workspace. Etsy connections and automatic two-way marketplace synchronisation are future work, not current features.</p>
      </article>
      <article class="principle">
        <p class="principle__label">02 · For buyers</p>
        <h2>A catalogue worth looking through.</h2>
        <p>A marketplace should do more than aggregate inventory. Buyers should not have to sift through anonymous, mass-produced resale presented as distinctive design. PatinaHall is being built around interesting vintage furniture, antiques, and objects from independent dealers.</p>
        <p>We prioritise sellers who source with judgement and can explain what they are offering—often people who travel through European markets, homes, and auctions and choose pieces themselves. Our public pilot begins with a Dutch independent store; as PatinaHall grows, we want to work with more small businesses across Europe and the United States.</p>
        <p>Country of manufacture is not our shortcut for quality. What matters is whether a piece is considered, accurately described, and connected to a seller who knows it. When maker, date, condition, or provenance is uncertain, we would rather say so than invent certainty.</p>
      </article>
    </section>
    <section class="about-publication" aria-labelledby="about-publication-title">
      <p class="eyebrow">About this publication</p>
      <h2 id="about-publication-title">The public record of what changed.</h2>
      <p>PatinaHall Updates publishes short, dated notes about meaningful releases. It does not mirror the catalogue or repeat buyer guides.</p>
      <p>Explore current pieces and Store pages on <a href="${marketplaceOrigin}/">patinahall.com</a>, read practical advice in <a href="${marketplaceOrigin}/guides">Guides</a>, find longer stories in the <a href="${marketplaceOrigin}/journal">PatinaHall Journal</a>, or follow product work suitable for public discussion in the <a href="https://github.com/patinahall/patinahall.github.io/issues">public roadmap on GitHub</a>.</p>
    </section>
  </main>`;

generated.push(["about/index.html", layout({
  title: "About · PatinaHall Updates",
  description: "PatinaHall is guided by two principles: less catalogue maintenance for independent sellers and a more considered marketplace for buyers.",
  canonicalPath: "/about/",
  body: aboutBody,
  pageClass: "about"
})]);

const privacyBody = `
  <main class="privacy-page">
    <header class="privacy-intro">
      <p class="eyebrow">Privacy on PatinaHall Updates</p>
      <h1>Measurement remains optional.</h1>
      <p>Last updated 16 August 2026. PatinaHall Updates is a public editorial site. You can read every page without allowing analytics.</p>
    </header>
    <div class="privacy-sections">
      <section>
        <h2>Your choice</h2>
        <p>Essential browser storage remembers your privacy choice for up to 180 days. If you choose Essential only, this site does not request Google Tag Manager or Google Analytics.</p>
        <p>You can reopen Privacy choices in the footer at any time. Withdrawing consent stops future analytics loading after the page reloads; it does not automatically remove Google cookies already stored in your browser or delete data Google has already received.</p>
      </section>
      <section>
        <h2>Optional analytics</h2>
        <p>If you choose Allow all, this site loads Google Tag Manager container <code>GTM-K4GWHP6J</code>. Its reviewed configuration contains the Google Analytics 4 tag <code>G-2SNNEES0DF</code>.</p>
        <p>Google may receive the page address and title, referrer, date and time, browser, device, language, screen, interaction and session identifiers, connection data needed for the request, and an approximate location derived from that connection data. PatinaHall does not deliberately add account credentials, email addresses, seller-workspace data, Product data, or seller-site purchase information to the analytics data layer on this site.</p>
        <p>Analytics storage alone follows your choice. Advertising storage, advertising user data, advertising personalisation, optional functionality storage, and personalisation storage remain denied.</p>
      </section>
      <section>
        <h2>More information</h2>
        <p>Read the broader <a href="${marketplaceOrigin}/privacy">PatinaHall Privacy and Data Notice</a> and <a href="https://support.google.com/analytics/answer/11593727?hl=en">Google's Analytics privacy information</a>. Privacy questions can be sent to <a href="mailto:privacy@patinahall.com">privacy@patinahall.com</a>.</p>
      </section>
    </div>
  </main>`;

generated.push(["privacy/index.html", layout({
  title: "Privacy · PatinaHall Updates",
  description: "How PatinaHall Updates uses essential storage and consent-gated optional analytics.",
  canonicalPath: "/privacy/",
  body: privacyBody,
  pageClass: "privacy"
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
  title: "Page not found · PatinaHall Updates",
  description: "The requested PatinaHall Updates page could not be found.",
  canonicalPath: "/404.html",
  body: notFoundBody,
  pageClass: "not-found-page"
}).replace('<meta name="robots" content="index,follow">', '<meta name="robots" content="noindex,follow">')]);

const latestPublishedAt = posts[0].publishedAt;
const sitemapEntries = [
  { path: "/", lastModified: latestPublishedAt },
  { path: "/news/", lastModified: latestPublishedAt },
  { path: "/about/", lastModified: aboutUpdatedAt },
  { path: "/privacy/", lastModified: privacyUpdatedAt },
  ...posts.map((post) => ({
    path: `/news/${post.slug}/`,
    lastModified: post.publishedAt
  }))
];

generated.push(["sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapEntries.map(({ path, lastModified }) => `  <url><loc>${siteOrigin}${escapeXml(path)}</loc><lastmod>${lastModified}</lastmod></url>`).join("\n")}
</urlset>
`]);

generated.push(["feed.xml", `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${siteName}</title>
    <link>${siteOrigin}/</link>
    <description>${escapeXml(siteDescription)}</description>
    <language>en</language>
    <atom:link href="${siteOrigin}/feed.xml" rel="self" type="application/rss+xml" />
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

generated.push(["llms.txt", `# PatinaHall

> PatinaHall is a marketplace for vintage furniture, antiques, design objects, and independent stores. It begins in the Netherlands and helps buyers discover current pieces while keeping the original seller clear.

Canonical marketplace: ${marketplaceOrigin}/
Official dated updates: ${siteOrigin}/

## Main public resources

- Catalogue: ${marketplaceOrigin}/catalog
- Independent stores: ${marketplaceOrigin}/stores
- Furniture and antiques guides: ${marketplaceOrigin}/guides
- PatinaHall Journal: ${marketplaceOrigin}/journal
- Seller workspace: ${marketplaceOrigin}/seller/
- Public roadmap: https://github.com/patinahall/patinahall.github.io/issues
- Privacy choices: ${siteOrigin}/privacy/

## Product principles

- For sellers: reduce duplicate catalogue maintenance and keep important decisions under seller control. Supported Shopify stores can import today; Etsy connections and automatic two-way marketplace synchronisation remain future work.
- For buyers: favour considered vintage furniture, antiques, and design objects from independent dealers over anonymous mass-produced resale, while stating uncertainty about maker, date, condition, or provenance honestly.

## Publication boundary

PatinaHall Updates contains short, factual release notes. Product listings, Store pages, evergreen Guides, and longer Journal stories remain canonical on patinahall.com and are not mirrored here.
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
