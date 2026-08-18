(function (windowObject, documentObject) {
  "use strict";
  var header = documentObject.querySelector("[data-scroll-header]");
  if (header === null) return;
  var reduceMotion = windowObject.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var lastScrollY = windowObject.scrollY;
  var accumulatedTravel = 0;
  var lastDirection = 0;
  var ticking = false;
  var revealHeader = function () {
    header.classList.remove("site-header--hidden");
    header.classList.add("site-header--revealed");
  };
  var updateHeader = function () {
    var currentScrollY = windowObject.scrollY;
    var delta = currentScrollY - lastScrollY;
    var direction = delta === 0 ? lastDirection : delta > 0 ? 1 : -1;
    if (direction !== lastDirection) accumulatedTravel = 0;
    accumulatedTravel += Math.abs(delta);
    var headerHasFocus = header.contains(documentObject.activeElement);
    if (currentScrollY <= 24 || headerHasFocus) {
      revealHeader();
      accumulatedTravel = 0;
    } else if (direction < 0 && accumulatedTravel >= 8) {
      revealHeader();
      accumulatedTravel = 0;
    } else if (direction > 0 && accumulatedTravel >= 12) {
      header.classList.add("site-header--hidden");
      header.classList.remove("site-header--revealed");
      accumulatedTravel = 0;
    }
    lastScrollY = currentScrollY;
    lastDirection = direction;
    ticking = false;
  };
  header.addEventListener("focusin", revealHeader);
  if (!reduceMotion) {
    windowObject.addEventListener("scroll", function () {
      if (!ticking) {
        windowObject.requestAnimationFrame(updateHeader);
        ticking = true;
      }
    }, { passive: true });
  }
})(window, document);
