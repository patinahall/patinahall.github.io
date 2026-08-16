import assert from "node:assert/strict";
import {
  readFileSync
} from "node:fs";
import {
  dirname,
  resolve
} from "node:path";
import {
  fileURLToPath
} from "node:url";
import {
  runInNewContext
} from "node:vm";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const loader = readFileSync(resolve(root, "assets/analytics-consent.js"), "utf8");
const home = readFileSync(resolve(root, "index.html"), "utf8");
const privacy = readFileSync(resolve(root, "privacy/index.html"), "utf8");
const sitemap = readFileSync(resolve(root, "sitemap.xml"), "utf8");

const runLoader = (storedValue = null) => {
  const insertedScripts = [];
  const stored = new Map();
  if (storedValue !== null) {
    stored.set("patinahall.analytics-consent.v1", storedValue);
  }

  const firstScript = {
    parentNode: {
      insertBefore: (script) => insertedScripts.push(script)
    }
  };
  const documentObject = {
    addEventListener: () => undefined,
    createElement: () => ({
      setAttribute(name, value) {
        this[name] = value;
      }
    }),
    getElementsByTagName: () => [firstScript],
    querySelector: () => null,
    querySelectorAll: () => [],
    readyState: "loading"
  };
  const windowObject = {
    localStorage: {
      getItem: (key) => stored.get(key) ?? null,
      setItem: (key, value) => stored.set(key, value)
    },
    location: {
      reload: () => undefined
    }
  };

  runInNewContext(loader, {
    document: documentObject,
    window: windowObject
  });

  return {
    insertedScripts,
    windowObject
  };
};

const withoutChoice = runLoader();
assert.equal(withoutChoice.insertedScripts.length, 0);
const defaultConsent = Array.from(withoutChoice.windowObject.dataLayer[0]);
assert.deepEqual(defaultConsent.slice(0, 2), ["consent", "default"]);
assert.equal(defaultConsent[2].analytics_storage, "denied");
assert.equal(defaultConsent[2].ad_storage, "denied");
assert.equal(defaultConsent[2].ad_user_data, "denied");
assert.equal(defaultConsent[2].ad_personalization, "denied");
assert.equal(defaultConsent[2].functionality_storage, "denied");
assert.equal(defaultConsent[2].personalization_storage, "denied");
assert.equal(defaultConsent[2].security_storage, "granted");

const grantedChoice = JSON.stringify({
  choice: "granted",
  expiresAt: Date.now() + 60_000,
  version: 1
});
const withChoice = runLoader(grantedChoice);
assert.equal(withChoice.insertedScripts.length, 1);
assert.equal(
  withChoice.insertedScripts[0].src,
  "https://www.googletagmanager.com/gtm.js?id=GTM-K4GWHP6J"
);
assert.equal(
  withChoice.insertedScripts[0]["data-patinahall-gtm"],
  "GTM-K4GWHP6J"
);
assert.equal(withChoice.windowObject.patinaHallAnalytics.enable(), false);
assert.equal(withChoice.insertedScripts.length, 1);

const deniedChoice = JSON.stringify({
  choice: "denied",
  expiresAt: Date.now() + 60_000,
  version: 1
});
assert.equal(runLoader(deniedChoice).insertedScripts.length, 0);
assert.equal(runLoader("not-json").insertedScripts.length, 0);
assert.equal(runLoader(JSON.stringify({
  choice: "granted",
  expiresAt: Date.now() - 1,
  version: 1
})).insertedScripts.length, 0);

assert.equal(loader.includes("GTM-K4GWHP6J"), true);
assert.equal(loader.includes("googletagmanager.com/ns.html"), false);
assert.equal(loader.includes('ad_storage: "granted"'), false);
assert.equal(loader.includes('ad_user_data: "granted"'), false);
assert.equal(loader.includes('ad_personalization: "granted"'), false);
assert.equal(home.includes("/assets/analytics-consent.js"), true);
assert.equal(home.includes("data-analytics-consent-panel"), true);
assert.equal(home.includes("Privacy choices"), true);
assert.equal(privacy.includes("G-2SNNEES0DF"), true);
assert.equal(privacy.includes("GTM-K4GWHP6J"), true);
assert.equal(sitemap.includes("https://patinahall.github.io/privacy/"), true);

console.log("Verified consent-gated PatinaHall Updates analytics.");
