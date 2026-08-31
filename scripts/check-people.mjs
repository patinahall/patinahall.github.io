import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  readFileSync,
  readdirSync,
  statSync
} from "node:fs";
import {
  basename,
  dirname,
  resolve
} from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const people = readdirSync(resolve(root, "content/people"))
  .filter((fileName) => fileName.endsWith(".json"))
  .map((fileName) => JSON.parse(
    readFileSync(resolve(root, "content/people", fileName), "utf8")
  ))
  .sort((left, right) => left.order - right.order);

assert.equal(people.length, 6);
assert.equal(new Set(people.map(({ slug }) => slug)).size, people.length);
assert.equal(new Set(people.map(({ theme }) => theme)).size, people.length);
assert.equal(new Set(people.map(({ image }) => image.url)).size, people.length);

const jpegDimensions = (bytes) => {
  assert.equal(bytes[0], 0xff);
  assert.equal(bytes[1], 0xd8);
  let offset = 2;

  while (offset < bytes.length) {
    while (bytes[offset] === 0xff) offset += 1;
    const marker = bytes[offset];
    offset += 1;
    if (marker === 0xd8 || marker === 0xd9) continue;
    const segmentLength = bytes.readUInt16BE(offset);
    const startOfFrame = new Set([
      0xc0, 0xc1, 0xc2, 0xc3,
      0xc5, 0xc6, 0xc7,
      0xc9, 0xca, 0xcb,
      0xcd, 0xce, 0xcf
    ]);
    if (startOfFrame.has(marker)) {
      return {
        height: bytes.readUInt16BE(offset + 3),
        width: bytes.readUInt16BE(offset + 5)
      };
    }
    offset += segmentLength;
  }

  throw new TypeError("JPEG dimensions were not found");
};

const hub = readFileSync(resolve(root, "people/index.html"), "utf8");
const home = readFileSync(resolve(root, "index.html"), "utf8");
const sitemap = readFileSync(resolve(root, "sitemap.xml"), "utf8");
const feed = readFileSync(resolve(root, "feed.xml"), "utf8");

assert.match(home, />People</u);
assert.match(home, /href="\/people\/"/u);
assert.match(hub, /data-persona-disclosure/u);
assert.doesNotMatch(hub, /"@type":"Person"/u);
assert.doesNotMatch(feed, /\/people\//u);
assert.match(sitemap, /https:\/\/patinahall\.github\.io\/people\//u);

for (const person of people) {
  const route = `/people/${person.slug}/`;
  const html = readFileSync(
    resolve(root, "people", person.slug, "index.html"),
    "utf8"
  );
  const imagePath = resolve(root, new URL(person.image.url).pathname.slice(1));
  const imageBytes = readFileSync(imagePath);
  const imageName = basename(imagePath);
  const digest = createHash("sha256").update(imageBytes).digest("hex");
  const dimensions = jpegDimensions(imageBytes);

  assert.match(hub, new RegExp(`href="${route}"`, "u"));
  assert.match(html, new RegExp(
    `rel="canonical" href="https://patinahall\\.github\\.io${route}"`,
    "u"
  ));
  assert.match(html, /data-persona-disclosure/u);
  assert.match(html, /Editorial portrait for a team-managed PatinaHall profile/u);
  assert.match(html, /class="person-section person-section--patinahall"/u);
  assert.match(html, /"@type":"WebPage"/u);
  assert.doesNotMatch(html, /"@type":"Person"/u);
  assert.doesNotMatch(html, /mailto:/u);
  assert.match(sitemap, new RegExp(
    `https://patinahall\\.github\\.io${route}`,
    "u"
  ));

  for (const profile of person.profiles) {
    assert.match(html, new RegExp(
      profile.href.replace(/[.*+?^$()|[\]{}\\]/gu, "\\$&"),
      "u"
    ));
  }

  assert.equal(imageName.includes(digest.slice(0, 16)), true);
  assert.equal(imageBytes.includes(Buffer.from("Exif\0\0")), false);
  assert.equal(statSync(imagePath).size < 1_500_000, true);
  assert.deepEqual(dimensions, {
    width: person.image.width,
    height: person.image.height
  });
}

process.stdout.write("Verified six disclosed PatinaHall role profiles and their first-party media.\n");
