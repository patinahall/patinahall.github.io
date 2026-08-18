(function (windowObject, documentObject) {
  "use strict";
  var header = documentObject.querySelector("[data-scroll-header]");
  if (header === null) return;
  var reduceMotion = windowObject.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var lastScrollY = windowObject.scrollY;
  var ticking = false;
  var updateHeader = function () {
    var currentScrollY = windowObject.scrollY;
    var movingDown = currentScrollY > lastScrollY + 8;
    var movingUp = currentScrollY < lastScrollY - 8;
    if (currentScrollY <= 24 || movingUp) {
      header.classList.remove("site-header--hidden");
      header.classList.add("site-header--revealed");
    } else if (movingDown) {
      header.classList.add("site-header--hidden");
      header.classList.remove("site-header--revealed");
    }
    lastScrollY = currentScrollY;
    ticking = false;
  };
  if (!reduceMotion) {
    windowObject.addEventListener("scroll", function () {
      if (!ticking) {
        windowObject.requestAnimationFrame(updateHeader);
        ticking = true;
      }
    }, { passive: true });
  }
})(window, document);
