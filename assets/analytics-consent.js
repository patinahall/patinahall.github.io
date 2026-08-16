(function (windowObject, documentObject, storageKey, containerId) {
  "use strict";

  var consentLifetimeMs = 180 * 24 * 60 * 60 * 1000;
  var dataLayerName = "dataLayer";
  var loaded = false;

  windowObject[dataLayerName] = windowObject[dataLayerName] || [];
  windowObject.gtag = windowObject.gtag || function () {
    windowObject[dataLayerName].push(arguments);
  };

  var consentState = function (analyticsStorage) {
    return {
      analytics_storage: analyticsStorage,
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
      functionality_storage: "denied",
      personalization_storage: "denied",
      security_storage: "granted"
    };
  };

  windowObject.gtag("consent", "default", consentState("denied"));

  var enableAnalytics = function () {
    if (loaded) {
      return false;
    }

    windowObject.gtag("consent", "update", consentState("granted"));
    windowObject[dataLayerName].push({
      "gtm.start": Date.now(),
      event: "gtm.js"
    });

    var firstScript = documentObject.getElementsByTagName("script")[0];
    var tagManagerScript = documentObject.createElement("script");
    tagManagerScript.async = true;
    tagManagerScript.src = "https://www.googletagmanager.com/gtm.js?id="
      + containerId;
    tagManagerScript.setAttribute("data-patinahall-gtm", containerId);
    firstScript.parentNode.insertBefore(tagManagerScript, firstScript);
    loaded = true;
    return true;
  };

  var disableAnalytics = function () {
    var wasLoaded = loaded;
    windowObject.gtag("consent", "update", consentState("denied"));
    return wasLoaded;
  };

  windowObject.patinaHallAnalytics = {
    disable: disableAnalytics,
    enable: enableAnalytics
  };

  var readChoice = function () {
    try {
      var raw = windowObject.localStorage.getItem(storageKey);
      var record = raw === null ? null : JSON.parse(raw);
      if (record !== null
        && record.version === 1
        && (record.choice === "granted" || record.choice === "denied")
        && typeof record.expiresAt === "number"
        && Number.isFinite(record.expiresAt)
        && record.expiresAt > Date.now()) {
        return record.choice;
      }
    } catch (_error) {
      /* Storage failure leaves optional analytics disabled. */
    }
    return null;
  };

  var persistChoice = function (choice) {
    try {
      var serialized = JSON.stringify({
        choice: choice,
        expiresAt: Date.now() + consentLifetimeMs,
        version: 1
      });
      windowObject.localStorage.setItem(storageKey, serialized);
      return windowObject.localStorage.getItem(storageKey) === serialized;
    } catch (_error) {
      return false;
    }
  };

  var currentChoice = readChoice();
  if (currentChoice === "granted") {
    enableAnalytics();
  }

  var initialiseChoices = function () {
    var panel = documentObject.querySelector("[data-analytics-consent-panel]");
    var openButtons = documentObject.querySelectorAll(
      "[data-analytics-consent-open]"
    );
    if (panel === null || openButtons.length === 0) {
      return;
    }

    var closeButton = panel.querySelector("[data-analytics-consent-close]");
    var choiceButtons = panel.querySelectorAll("[data-analytics-choice]");
    var status = panel.querySelector("[data-analytics-consent-status]");
    var storageError = panel.querySelector("[data-analytics-consent-error]");

    var renderChoice = function () {
      choiceButtons.forEach(function (button) {
        button.setAttribute(
          "aria-pressed",
          String(button.getAttribute("data-analytics-choice") === currentChoice)
        );
      });

      if (currentChoice === null) {
        status.hidden = true;
        closeButton.hidden = true;
        return;
      }

      status.textContent = currentChoice === "granted"
        ? "Current choice: optional analytics allowed."
        : "Current choice: essential storage only.";
      status.hidden = false;
      closeButton.hidden = false;
    };

    openButtons.forEach(function (button) {
      button.hidden = false;
      button.addEventListener("click", function () {
        storageError.hidden = true;
        renderChoice();
        panel.hidden = false;
        if (currentChoice !== null) {
          closeButton.focus();
        }
      });
    });

    choiceButtons.forEach(function (button) {
      button.addEventListener("click", function () {
        var nextChoice = button.getAttribute("data-analytics-choice");
        if (nextChoice !== "granted" && nextChoice !== "denied") {
          return;
        }
        if (!persistChoice(nextChoice)) {
          storageError.hidden = false;
          panel.hidden = false;
          return;
        }

        currentChoice = nextChoice;
        storageError.hidden = true;
        renderChoice();

        if (nextChoice === "granted") {
          enableAnalytics();
          panel.hidden = true;
          return;
        }

        if (disableAnalytics()) {
          windowObject.location.reload();
          return;
        }
        panel.hidden = true;
      });
    });

    closeButton.addEventListener("click", function () {
      if (currentChoice !== null) {
        panel.hidden = true;
      }
    });

    renderChoice();
    panel.hidden = currentChoice !== null;
  };

  if (documentObject.readyState === "loading") {
    documentObject.addEventListener("DOMContentLoaded", initialiseChoices);
  } else {
    initialiseChoices();
  }
})(
  window,
  document,
  "patinahall.analytics-consent.v1",
  "GTM-K4GWHP6J"
);
