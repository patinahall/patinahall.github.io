import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const source = readFileSync(new URL("../assets/navigation.js", import.meta.url), "utf8");

const createHarness = ({ reduceMotion = false } = {}) => {
  const classes = new Set();
  const headerListeners = new Map();
  const windowListeners = new Map();
  const header = {
    classList: {
      add: (value) => classes.add(value),
      remove: (value) => classes.delete(value)
    },
    contains: (value) => value === header
  };
  const documentObject = {
    activeElement: null,
    querySelector: () => header
  };
  header.addEventListener = (name, listener) => headerListeners.set(name, listener);
  let animationFrame;
  const windowObject = {
    scrollY: 0,
    addEventListener: (name, listener) => windowListeners.set(name, listener),
    matchMedia: () => ({ matches: reduceMotion }),
    requestAnimationFrame: (listener) => {
      animationFrame = listener;
    }
  };
  vm.runInNewContext(source, {
    document: documentObject,
    window: windowObject
  });
  const scrollTo = (value) => {
    windowObject.scrollY = value;
    windowListeners.get("scroll")?.();
    const listener = animationFrame;
    animationFrame = undefined;
    listener?.();
  };
  return {
    classes,
    documentObject,
    header,
    headerListeners,
    scrollTo,
    windowListeners
  };
};

const navigation = createHarness();
for (const value of [3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36]) {
  navigation.scrollTo(value);
}
assert.equal(navigation.classes.has("site-header--hidden"), true);

for (const value of [33, 30, 27]) navigation.scrollTo(value);
assert.equal(navigation.classes.has("site-header--hidden"), false);

navigation.documentObject.activeElement = navigation.header;
navigation.scrollTo(60);
assert.equal(navigation.classes.has("site-header--hidden"), false);

navigation.classes.add("site-header--hidden");
navigation.headerListeners.get("focusin")?.();
assert.equal(navigation.classes.has("site-header--hidden"), false);

const reducedMotionNavigation = createHarness({ reduceMotion: true });
assert.equal(reducedMotionNavigation.windowListeners.has("scroll"), false);

process.stdout.write("Verified scroll-aware PatinaHall Updates navigation.\n");
