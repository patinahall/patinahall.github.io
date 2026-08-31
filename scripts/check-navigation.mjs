import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const source = readFileSync(
  new URL("../assets/navigation.js", import.meta.url),
  "utf8"
);
const home = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const styles = readFileSync(
  new URL("../assets/styles.css", import.meta.url),
  "utf8"
);
const headerMarkup = home.match(
  /<header class="site-header"[\s\S]*?<\/header>/u
)?.[0] ?? "";

assert.match(home, /class="destination-gateway" data-destination-gateway/u);
assert.match(home, />Browse the catalogue</u);
assert.match(home, />For store owners</u);
assert.match(headerMarkup, /data-header-primary/u);
assert.match(headerMarkup, /data-header-destinations/u);
assert.match(headerMarkup, />People</u);
assert.match(headerMarkup, />Browse catalogue/u);
assert.match(styles, /\.site-header__inner\s*\{/u);
assert.match(styles, /\.site-header--destinations \.site-header__destinations/u);
assert.match(
  styles,
  /@media \(max-width: 760px\)[\s\S]*\.destination-gateway\s*\{[\s\S]*grid-template-columns: 1fr;/u
);
assert.match(
  styles,
  /@media \(max-width: 760px\)[\s\S]*\.site-header \.brand > span:last-child\s*\{[\s\S]*display: none;/u
);
assert.doesNotMatch(
  styles,
  /\.site-nav > a\s*\{\s*display: none;/u
);

const classes = new Set();
const windowListeners = new Map();
const attributes = new Map();
const header = {
  classList: {
    toggle: (value, enabled) => enabled
      ? classes.add(value)
      : classes.delete(value)
  },
  getBoundingClientRect: () => ({ bottom: 92 })
};
const gatewayRect = { bottom: 280 };
const gateway = {
  getBoundingClientRect: () => gatewayRect
};
const primaryNavigation = {
  inert: false,
  setAttribute: (name, value) => attributes.set(`primary:${name}`, value)
};
const destinationNavigation = {
  inert: false,
  setAttribute: (name, value) => attributes.set(`destinations:${name}`, value)
};
const elements = new Map([
  ["[data-scroll-header]", header],
  ["[data-destination-gateway]", gateway],
  ["[data-header-primary]", primaryNavigation],
  ["[data-header-destinations]", destinationNavigation]
]);
let animationFrame;
const windowObject = {
  addEventListener: (name, listener) => windowListeners.set(name, listener),
  requestAnimationFrame: (listener) => {
    animationFrame = listener;
  }
};

vm.runInNewContext(source, {
  document: {
    querySelector: (selector) => elements.get(selector) ?? null
  },
  window: windowObject
});

const runFrame = () => {
  const listener = animationFrame;
  animationFrame = undefined;
  listener?.();
};

runFrame();
assert.equal(classes.has("site-header--destinations"), false);
assert.equal(destinationNavigation.inert, true);

gatewayRect.bottom = 80;
windowListeners.get("scroll")?.();
runFrame();
assert.equal(classes.has("site-header--destinations"), true);
assert.equal(primaryNavigation.inert, true);
assert.equal(destinationNavigation.inert, false);
assert.equal(attributes.get("primary:aria-hidden"), "true");
assert.equal(attributes.get("destinations:aria-hidden"), "false");

gatewayRect.bottom = 180;
windowListeners.get("resize")?.();
runFrame();
assert.equal(classes.has("site-header--destinations"), false);
assert.equal(primaryNavigation.inert, false);
assert.equal(destinationNavigation.inert, true);

process.stdout.write("Verified morphing PatinaHall Updates navigation.\n");
