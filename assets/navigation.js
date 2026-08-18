(function (windowObject, documentObject) {
  "use strict";

  var header = documentObject.querySelector("[data-scroll-header]");
  var gateway = documentObject.querySelector("[data-destination-gateway]");
  var primaryNavigation = documentObject.querySelector("[data-header-primary]");
  var destinationNavigation = documentObject.querySelector(
    "[data-header-destinations]"
  );

  if (header === null
    || gateway === null
    || primaryNavigation === null
    || destinationNavigation === null) {
    return;
  }

  var ticking = false;
  var destinationsVisible = null;

  var render = function (showDestinations) {
    if (showDestinations === destinationsVisible) return;
    destinationsVisible = showDestinations;
    header.classList.toggle("site-header--destinations", showDestinations);
    primaryNavigation.inert = showDestinations;
    destinationNavigation.inert = !showDestinations;
    primaryNavigation.setAttribute("aria-hidden", String(showDestinations));
    destinationNavigation.setAttribute("aria-hidden", String(!showDestinations));
  };

  var updateHeader = function () {
    render(
      gateway.getBoundingClientRect().bottom
        <= header.getBoundingClientRect().bottom
    );
    ticking = false;
  };

  var scheduleUpdate = function () {
    if (ticking) return;
    windowObject.requestAnimationFrame(updateHeader);
    ticking = true;
  };

  destinationNavigation.inert = true;
  windowObject.addEventListener("scroll", scheduleUpdate, { passive: true });
  windowObject.addEventListener("resize", scheduleUpdate);
  scheduleUpdate();
})(window, document);
