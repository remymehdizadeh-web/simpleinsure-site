/* page-flip (MIT) turns the pages.
   Wide screens show a spread. A narrow screen shows one page.
   Page shape comes from the first image, so a square booklet works
   the same way as the current letter-size placeholder.
   Add a .brochure-page for each new page. Leave src off after the first
   and set data-src so later pages load when the reader reaches them. */
(function () {
  var book = document.getElementById("book");
  var prev = document.getElementById("prev");
  var next = document.getElementById("next");
  var status = document.getElementById("status");
  if (!book || !window.St || !window.St.PageFlip) return;

  var pages = book.querySelectorAll(".brochure-page");
  if (!pages.length) return;
  var firstImg = pages[0].querySelector("img");
  var pageW = parseInt(firstImg && firstImg.getAttribute("width"), 10) || 1000;
  var pageH = parseInt(firstImg && firstImg.getAttribute("height"), 10) || 1000;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var flip = new St.PageFlip(book, {
    width: pageW,
    height: pageH,
    size: "stretch",
    minWidth: 260,
    maxWidth: 640,
    minHeight: 260,
    maxHeight: 900,
    drawShadow: false,
    flippingTime: reduce ? 1 : 700,
    usePortrait: true,
    startPage: 0,
    autoSize: true,
    maxShadowOpacity: 0,
    showCover: false,
    mobileScrollSupport: true,
    swipeDistance: 28,
    clickEventForward: true,
    useMouseEvents: true,
    showPageCorners: false,
    disableFlipByClick: true,
    startZIndex: 2
  });

  flip.loadFromHTML(pages);
  book.classList.add("is-ready");

  function portrait() {
    return flip.getOrientation() === "portrait";
  }
  function count() {
    return flip.getPageCount();
  }
  function index() {
    return flip.getCurrentPageIndex();
  }
  function busy() {
    return flip.getState() === "flipping";
  }
  function canPrev() {
    return index() > 0;
  }
  function canNext() {
    var i = index();
    var n = count();
    if (portrait()) return i < n - 1;
    return i + 2 < n;
  }
  function loadPage(i) {
    var page = pages[i];
    if (!page) return;
    var img = page.querySelector("img");
    if (!img || img.getAttribute("src") || !img.getAttribute("data-src")) return;
    img.src = img.getAttribute("data-src");
    if (img.getAttribute("data-srcset")) img.srcset = img.getAttribute("data-srcset");
    if (img.getAttribute("data-sizes")) img.sizes = img.getAttribute("data-sizes");
  }
  function visibleLast() {
    var i = index();
    if (portrait()) return i;
    return Math.min(count() - 1, i + 1);
  }
  function ensureVisible() {
    var last = visibleLast();
    var p;
    for (p = 0; p <= last; p++) loadPage(p);
  }
  function preloadNext() {
    var i = visibleLast();
    loadPage(i + 1);
    loadPage(i + 2);
  }
  function mark() {
    var n = count();
    var i = index();
    var alone = portrait() || i + 1 >= n;
    var text = alone
      ? "Page " + (i + 1) + " of " + n
      : "Pages " + (i + 1) + " and " + (i + 2) + " of " + n;
    status.textContent = text;
    prev.disabled = !canPrev();
    next.disabled = !canNext();
    book.setAttribute("aria-label", text + ". Our brochure.");
  }
  function goNext() {
    if (busy() || !canNext()) return;
    preloadNext();
    flip.flipNext("bottom");
  }
  function goPrev() {
    if (busy() || !canPrev()) return;
    flip.flipPrev("bottom");
  }

  prev.addEventListener("click", goPrev);
  next.addEventListener("click", goNext);
  book.addEventListener("click", function (e) {
    if (e.target.closest("a, button")) return;
    var rect = book.getBoundingClientRect();
    if (e.clientX > rect.left + rect.width / 2) goNext();
    else goPrev();
  });
  book.addEventListener("touchstart", function () { preloadNext(); }, { passive: true });
  next.addEventListener("pointerdown", function () { preloadNext(); });

  document.addEventListener("keydown", function (e) {
    if (e.altKey || e.metaKey || e.ctrlKey) return;
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft" && e.key !== "Home" && e.key !== "End") return;
    var target = e.target;
    if (target && target.closest("input, textarea, select, summary, a")) return;
    if (target && target.closest("button") && !target.closest(".brochure-nav")) return;
    if (target && target.closest("header, footer")) return;
    if (e.key === "ArrowRight") {
      e.preventDefault();
      goNext();
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      goPrev();
    } else if (e.key === "Home") {
      e.preventDefault();
      flip.turnToPage(0);
    } else if (e.key === "End") {
      e.preventDefault();
      var p;
      for (p = 0; p < count(); p++) loadPage(p);
      flip.turnToPage(count() - 1);
    }
  });

  flip.on("flip", function () {
    ensureVisible();
    mark();
  });
  flip.on("changeOrientation", function () {
    ensureVisible();
    mark();
  });
  flip.on("init", function () {
    ensureVisible();
    mark();
  });
  ensureVisible();
  setTimeout(preloadNext, 700);
  mark();
})();
