/* Reader for the two-page agency overview.
   page-flip (MIT) draws the curl. Wide screens open on both pages.
   A phone shows one page, and a swipe or the arrows turns it. */
(function () {
  var shell = document.getElementById("shell");
  var book = document.getElementById("book");
  var prev = document.getElementById("prev");
  var next = document.getElementById("next");
  var spreadBtn = document.getElementById("spread");
  var status = document.getElementById("status");
  if (!shell || !book || !window.St || !window.St.PageFlip) return;

  var pages = book.querySelectorAll(".brochure-page");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var flip = new St.PageFlip(book, {
    width: 612,
    height: 792,
    size: "stretch",
    minWidth: 250,
    maxWidth: 680,
    minHeight: 320,
    maxHeight: 920,
    drawShadow: true,
    flippingTime: reduce ? 1 : 750,
    usePortrait: true,
    startPage: 0,
    autoSize: true,
    maxShadowOpacity: 0.35,
    showCover: false,
    mobileScrollSupport: true,
    swipeDistance: 28,
    clickEventForward: true,
    useMouseEvents: true,
    showPageCorners: true,
    disableFlipByClick: false,
    startZIndex: 2
  });

  flip.loadFromHTML(pages);
  book.classList.add("is-ready");

  var later = document.getElementById("page-2");
  function loadLater() {
    if (!later || later.getAttribute("src")) return;
    later.src = later.getAttribute("data-src");
    later.srcset = later.getAttribute("data-srcset");
    later.sizes = later.getAttribute("data-sizes");
  }
  if (flip.getOrientation() !== "portrait") loadLater();
  else {
    var kick = function () { loadLater(); };
    setTimeout(kick, 600);
    book.addEventListener("touchstart", kick, { passive: true, once: true });
    next.addEventListener("pointerdown", kick, { once: true });
  }

  function portrait() {
    return flip.getOrientation() === "portrait";
  }
  function single() {
    return shell.classList.contains("is-single");
  }
  function busy() {
    return flip.getState() === "flipping";
  }
  function layout() {
    flip.getUI().update();
    mark();
  }
  function mark() {
    var spread = !portrait() && !single();
    shell.classList.toggle("is-spread", spread);
    shell.classList.toggle("is-portrait", !spread);
    var index = flip.getCurrentPageIndex();
    if (spread) {
      status.textContent = "Pages 1 and 2 of 2";
      prev.disabled = true;
      next.disabled = false;
    } else {
      status.textContent = "Page " + (index + 1) + " of 2";
      prev.disabled = index <= 0 && !single();
      next.disabled = index >= flip.getPageCount() - 1;
    }
    spreadBtn.hidden = !single();
    book.setAttribute("aria-label", status.textContent + ". Agency overview brochure.");
  }
  function goNext() {
    if (busy()) return;
    loadLater();
    if (!portrait() && !single()) {
      loadLater();
      shell.classList.add("is-single");
      layout();
      requestAnimationFrame(function () {
        requestAnimationFrame(function () { flip.flipNext("bottom"); });
      });
      return;
    }
    flip.flipNext("bottom");
  }
  function goPrev() {
    if (busy()) return;
    if (!portrait() && !single()) return;
    if (single() && flip.getCurrentPageIndex() <= 0) {
      shell.classList.remove("is-single");
      layout();
      return;
    }
    flip.flipPrev("bottom");
  }
  function showSpread() {
    if (busy()) return;
    shell.classList.remove("is-single");
    layout();
    book.focus();
  }

  prev.addEventListener("click", goPrev);
  next.addEventListener("click", goNext);
  spreadBtn.addEventListener("click", showSpread);

  book.addEventListener("click", function (e) {
    if (e.target.closest("a, button")) return;
    if (portrait() || single()) return;
    var rect = book.getBoundingClientRect();
    if (e.clientX > rect.left + rect.width / 2) goNext();
  });

  document.addEventListener("keydown", function (e) {
    if (e.altKey || e.metaKey || e.ctrlKey) return;
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft" && e.key !== "Home" && e.key !== "End") return;
    var target = e.target;
    if (target && target.closest("input, textarea, select, summary, a")) return;
    if (target && target.closest("button") && !target.closest(".brochure-turn")) return;
    if (target && target.closest("header, footer")) return;
    if (e.key === "ArrowRight") {
      e.preventDefault();
      goNext();
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      goPrev();
    } else if (e.key === "Home") {
      e.preventDefault();
      if (single()) showSpread();
      else flip.turnToPage(0);
    } else if (e.key === "End") {
      e.preventDefault();
      if (!portrait() && !single()) goNext();
      else flip.flip(flip.getPageCount() - 1, "bottom");
    }
  });

  flip.on("flip", mark);
  flip.on("changeOrientation", mark);
  flip.on("init", mark);
  window.addEventListener("load", function () {
    layout();
  });
  mark();
})();
