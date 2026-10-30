(function () {
  var d = document;
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  d.documentElement.classList.add("js");

  // Phone tap conversion. One hit per real click or tap on a tel: link,
  // including links added later. Capture so a handler that stops the bubble
  // still counts. Ignore scripted clicks. Beacon sends the hit without
  // delaying the dial.
  d.addEventListener("click", function (e) {
    if (!e.isTrusted) return;
    var link = e.target && e.target.closest && e.target.closest('a[href^="tel:"]');
    if (!link || typeof gtag !== "function") return;
    gtag("event", "conversion", {
      send_to: "AW-18528347675/2a8iCMaOnq0dEJvMgINF",
      transport_type: "beacon"
    });
  }, true);

  var header = d.querySelector(".site-header");
  var menuBtn = d.querySelector(".nav-btn");
  var sheet = d.getElementById("sheet");
  var scrollLock = 0;

  function closeSheet() {
    if (!sheet || sheet.hidden) return;
    sheet.hidden = true;
    d.documentElement.classList.remove("nav-open");
    d.body.classList.remove("nav-open");
    d.body.style.position = "";
    d.body.style.top = "";
    d.body.style.left = "";
    d.body.style.right = "";
    d.body.style.width = "";
    window.scrollTo(0, scrollLock || 0);
    if (menuBtn) menuBtn.setAttribute("aria-expanded", "false");
    pinHeader();
  }
  function openSheet() {
    scrollLock = window.scrollY || 0;
    sheet.hidden = false;
    d.documentElement.classList.add("nav-open");
    d.body.classList.add("nav-open");
    d.body.style.position = "fixed";
    d.body.style.top = (-scrollLock) + "px";
    d.body.style.left = "0";
    d.body.style.right = "0";
    d.body.style.width = "100%";
    headerShift = 0;
    d.documentElement.style.setProperty("--header-shift", "0px");
    menuBtn.setAttribute("aria-expanded", "true");
    var first = sheet.querySelector("nav a, button");
    if (first) first.focus();
  }
  if (menuBtn && sheet) {
    menuBtn.addEventListener("click", function () {
      if (sheet.hidden) openSheet();
      else {
        closeSheet();
        menuBtn.focus();
      }
    });
    sheet.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", closeSheet);
    });
  }
  d.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      closeSheet();
      d.querySelectorAll(".drop.is-open").forEach(function (el) {
        el.classList.remove("is-open");
        var b = el.querySelector("button");
        if (b) b.setAttribute("aria-expanded", "false");
      });
    }
  });
  d.querySelectorAll(".drop > button").forEach(function (btn) {
    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      var drop = btn.parentElement;
      var open = drop.classList.toggle("is-open");
      btn.setAttribute("aria-expanded", open ? "true" : "false");
      d.querySelectorAll(".drop.is-open").forEach(function (other) {
        if (other !== drop) {
          other.classList.remove("is-open");
          var b = other.querySelector("button");
          if (b) b.setAttribute("aria-expanded", "false");
        }
      });
    });
  });
  d.addEventListener("click", function (e) {
    if (!e.target.closest(".drop")) {
      d.querySelectorAll(".drop.is-open").forEach(function (el) {
        el.classList.remove("is-open");
        var b = el.querySelector("button");
        if (b) b.setAttribute("aria-expanded", "false");
      });
    }
  });

  var mobileQ = matchMedia("(max-width: 980px)");
  var headerShift = 0;

  function safeTop() {
    var probe = d.getElementById("safe-top-probe");
    if (!probe) {
      probe = d.createElement("div");
      probe.id = "safe-top-probe";
      probe.setAttribute("aria-hidden", "true");
      probe.style.cssText = "position:fixed;left:0;width:0;top:0;height:constant(safe-area-inset-top);height:env(safe-area-inset-top);pointer-events:none;visibility:hidden";
      d.body.appendChild(probe);
    }
    return (probe.getBoundingClientRect().height || 0) + 12;
  }

  function pinHeader() {
    if (!header) return;
    if (!mobileQ.matches || d.documentElement.classList.contains("nav-open")) {
      if (headerShift) {
        headerShift = 0;
        d.documentElement.style.setProperty("--header-shift", "0px");
      }
      return;
    }
    var want = safeTop();
    var top = header.getBoundingClientRect().top;
    var delta = want - top;
    if (Math.abs(delta) < 1.5) return;
    var next = headerShift + delta;
    if (Math.abs(next) > 280) return;
    headerShift = next;
    d.documentElement.style.setProperty("--header-shift", headerShift.toFixed(2) + "px");
    requestAnimationFrame(pinHeader);
  }

  function flattenRail() {
    var pin = d.querySelector(".h-pin");
    var track = d.querySelector(".h-track");
    if (!mobileQ.matches) {
      if (pin) pin.style.removeProperty("height");
      if (track) track.style.removeProperty("transform");
      return;
    }
    if (pin) pin.style.setProperty("height", "auto", "important");
    if (track) track.style.setProperty("transform", "none", "important");
  }

  function syncHeader() {
    var y = window.scrollY || 0;
    if (d.body.style.position === "fixed") y = scrollLock || 0;
    var stuck = y > 8;
    if (header) header.classList.toggle("is-stuck", stuck);
    d.documentElement.classList.toggle("scrolled", stuck);
    var veil = false;
    if (stuck && !d.body.classList.contains("nav-open")) {
      var stack = d.elementsFromPoint ? d.elementsFromPoint(24, 4) : [];
      var probe = null;
      for (var i = 0; i < stack.length; i++) {
        if (!stack[i].closest || stack[i].closest(".site-header")) continue;
        probe = stack[i];
        break;
      }
      veil = !(probe && probe.closest && probe.closest(".page-head, .hero, .photo-hero, .site-footer"));
    }
    d.documentElement.classList.toggle("veil", veil);
    pinHeader();
  }
  flattenRail();
  syncHeader();
  addEventListener("scroll", syncHeader, { passive: true });
  addEventListener("resize", function () { flattenRail(); pinHeader(); });
  addEventListener("orientationchange", function () { flattenRail(); pinHeader(); });
  if (window.visualViewport) {
    visualViewport.addEventListener("scroll", pinHeader);
    visualViewport.addEventListener("resize", pinHeader);
  }
  if (mobileQ.addEventListener) {
    mobileQ.addEventListener("change", function () {
      flattenRail();
      pinHeader();
    });
  }

  if (!reduce && "IntersectionObserver" in window) {
    d.documentElement.classList.add("motion");
    var riseNodes = d.querySelectorAll("[data-rise], .rise-photo");
    riseNodes.forEach(function (el, i) {
      el.style.setProperty("--d", (Math.min(i, 5) * 0.07) + "s");
      var r = el.getBoundingClientRect();
      if (r.top < window.innerHeight * 0.98 && r.bottom > 0) el.classList.add("is-in");
    });
    var riseIo = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add("is-in");
        riseIo.unobserve(en.target);
      });
    }, { rootMargin: "0px 0px 8% 0px", threshold: 0.01 });
    riseNodes.forEach(function (el) {
      if (!el.classList.contains("is-in")) riseIo.observe(el);
    });
    var groups = new Map();
    d.querySelectorAll("[data-reveal]").forEach(function (el) {
      var p = el.parentElement;
      var n = groups.get(p) || 0;
      groups.set(p, n + 1);
      el.style.setProperty("--d", Math.min(n, 6) * 0.06 + "s");
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add("is-in");
        io.unobserve(en.target);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });
    d.querySelectorAll("[data-reveal]").forEach(function (el) { io.observe(el); });

    d.querySelectorAll("[data-count]").forEach(function (el) {
      el.textContent = "$" + (+el.getAttribute("data-count")).toLocaleString("en-US");
    });

  } else {
    d.querySelectorAll("[data-count]").forEach(function (el) {
      el.textContent = "$" + (+el.getAttribute("data-count")).toLocaleString("en-US");
    });
    d.querySelectorAll(".money").forEach(function (el) { el.classList.add("is-in"); });
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function linkHtml(href, text) {
    return '<a href="' + esc(href) + '" rel="noopener">' + esc(text) + "</a>";
  }
  var stage = d.querySelector(".stage img");
  if (stage) {
    d.querySelectorAll(".plist a").forEach(function (a) {
      function show() {
        d.querySelectorAll(".plist a").forEach(function (x) { x.classList.remove("is-on"); });
        a.classList.add("is-on");
        var src = a.getAttribute("data-src");
        if (src && stage.getAttribute("src") !== src) {
          stage.src = src;
          stage.srcset = a.getAttribute("data-srcset") || "";
          stage.alt = a.getAttribute("data-alt") || "";
        }
        var cap = d.querySelector(".stage figcaption");
        if (cap) {
          var artist = a.getAttribute("data-artist") || "";
          var page = a.getAttribute("data-page") || "";
          var license = a.getAttribute("data-license") || "";
          var licenseUrl = a.getAttribute("data-license-url") || "";
          cap.innerHTML = '<span class="cap">Photograph by ' + linkHtml(page, artist) + ", " + linkHtml(licenseUrl, license) + "</span>";
        }
      }
      a.addEventListener("mouseenter", show);
      a.addEventListener("focus", show);
    });
  }

  d.querySelectorAll("[data-tabs]").forEach(function (root) {
    var buttons = [].slice.call(root.querySelectorAll("[data-tab]"));
    var panels = [].slice.call(root.querySelectorAll(".tab-panel"));
    function select(id) {
      buttons.forEach(function (b) {
        var on = b.getAttribute("data-tab") === id;
        b.setAttribute("aria-selected", on ? "true" : "false");
      });
      panels.forEach(function (p) { p.classList.toggle("is-on", p.id === "panel-" + id); });
    }
    buttons.forEach(function (b) {
      b.addEventListener("click", function () { select(b.getAttribute("data-tab")); });
    });
    if (buttons[0]) select(buttons[0].getAttribute("data-tab"));
  });

  var pracNav = d.querySelector(".prac-nav");
  if (pracNav) {
    var pracLinks = [].slice.call(pracNav.querySelectorAll("a[data-prac]"));
    function markPrac() {
      var wide = window.matchMedia("(min-width: 1024px)").matches;
      var current = pracLinks[0];
      if (wide) {
        var y = window.scrollY + 160;
        pracLinks.forEach(function (a) {
          var el = d.getElementById(a.getAttribute("data-prac"));
          if (!el) return;
          var top = el.getBoundingClientRect().top + window.scrollY;
          if (top <= y) current = a;
        });
      }
      pracLinks.forEach(function (a) { a.classList.toggle("is-on", a === current); });
    }
    addEventListener("scroll", markPrac, { passive: true });
    addEventListener("resize", markPrac);
    markPrac();
  }

  d.querySelectorAll("[data-checks]").forEach(function (root) {
    var key = "si-check-" + root.getAttribute("data-checks");
    var boxes = [].slice.call(root.querySelectorAll('input[type="checkbox"]'));
    try {
      var saved = JSON.parse(localStorage.getItem(key) || "{}");
      boxes.forEach(function (box) {
        if (saved[box.value]) box.checked = true;
      });
    } catch (err) {}
    function persist() {
      var data = {};
      boxes.forEach(function (box) { if (box.checked) data[box.value] = 1; });
      try { localStorage.setItem(key, JSON.stringify(data)); } catch (err) {}
    }
    boxes.forEach(function (box) { box.addEventListener("change", persist); });
    var btn = root.querySelector("[data-email-gaps]");
    if (btn) {
      btn.addEventListener("click", function () {
        var gaps = [];
        var have = [];
        boxes.forEach(function (box) {
          var name = (root.querySelector('label[for="' + box.id + '"] b') || {}).textContent || box.value;
          (box.checked ? have : gaps).push(name.trim());
        });
        var lines = [
          "Checklist: " + (root.getAttribute("data-label") || root.getAttribute("data-checks")),
          "",
          "I already have:",
          have.length ? have.map(function (x) { return "- " + x; }).join("\n") : "- (none marked)",
          "",
          "Please look at:",
          gaps.length ? gaps.map(function (x) { return "- " + x; }).join("\n") : "- (nothing left unchecked)"
        ];
        openMail(root.getAttribute("data-subject") || "Coverage checklist", lines, root);
      });
    }
  });

  var glossQ = d.getElementById("gloss-q");
  if (glossQ) {
    var terms = [].slice.call(d.querySelectorAll("[data-term]"));
    var count = d.getElementById("gloss-count");
    function filter() {
      var q = glossQ.value.trim().toLowerCase();
      var n = 0;
      terms.forEach(function (el) {
        var hit = !q || el.textContent.toLowerCase().indexOf(q) !== -1;
        el.classList.toggle("is-hide", !hit);
        if (hit) n++;
      });
      if (count) count.textContent = n + (n === 1 ? " term" : " terms");
    }
    glossQ.addEventListener("input", filter);
    filter();
  }

  function lineLabel(form) {
    var checked = form.querySelector('input[name="line"]:checked');
    if (!checked) return "";
    var lab = form.querySelector('label[for="' + checked.id + '"]');
    return lab ? lab.textContent.replace(/\s+/g, " ").trim() : checked.value;
  }
  function applyLine(form) {
    var checked = form.querySelector('input[name="line"]:checked');
    var line = checked ? checked.value : "";
    form.querySelectorAll("[data-for]").forEach(function (el) {
      var ok = !el.getAttribute("data-for") || !line || el.getAttribute("data-for").split(/\s+/).indexOf(line) !== -1;
      if (!line && el.getAttribute("data-for")) ok = false;
      el.hidden = !ok;
      el.querySelectorAll("input, select, textarea").forEach(function (input) {
        input.disabled = !ok;
      });
    });
  }
  function offForm(el, form) {
    for (var n = el.parentNode; n && n !== form; n = n.parentNode) {
      if (n.hasAttribute && n.hasAttribute("hidden") && !n.hasAttribute("data-step")) return true;
    }
    return false;
  }
  function collect(form) {
    var lines = [];
    var label = lineLabel(form);
    if (label) lines.push("Account: " + label);
    var seen = {};
    form.querySelectorAll("input, select, textarea").forEach(function (el) {
      if (el.disabled || el.type === "radio" || el.type === "checkbox" || el.type === "file" || !el.name || el.name.charAt(0) === "_") return;
      if (offForm(el, form)) return;
      var val = String(el.value || "").trim();
      if (!val) return;
      var lab = form.querySelector('label[for="' + el.id + '"]');
      var name = lab ? lab.textContent.trim() : el.name;
      if (seen[el.id]) return;
      seen[el.id] = 1;
      lines.push(name + ": " + val);
    });
    var boxes = [];
    form.querySelectorAll('input[type="checkbox"]').forEach(function (el) {
      if (el.disabled || !el.checked || offForm(el, form)) return;
      var lab = form.querySelector('label[for="' + el.id + '"]');
      if (lab) boxes.push(lab.textContent.replace(/\s+/g, " ").trim());
    });
    if (boxes.length) lines.push("Coverage to discuss: " + boxes.join(", "));
    return lines;
  }
  function mailtoHref(subject, lines) {
    var body = lines.join("\n");
    var href = "mailto:info@simpleinsure.co?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
    if (href.length > 1800) {
      body = lines.slice(0, 12).join("\n") + "\n\nThe full summary is on the confirmation screen. Please call if anything was cut off.";
      href = "mailto:info@simpleinsure.co?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
    }
    return href;
  }
  function openMail(subject, lines, scope) {
    var href = mailtoHref(subject, lines);
    var done = scope.querySelector(".done");
    var summary = scope.querySelector(".summary");
    var mail = scope.querySelector("[data-mailto]");
    if (summary) summary.textContent = lines.join("\n");
    if (mail) mail.href = href;
    if (done) {
      scope.querySelectorAll("[data-step]").forEach(function (p) { p.hidden = true; });
      var nav = scope.querySelector(".wizard-nav");
      var err = scope.querySelector(".form-error");
      var prog = scope.querySelector(".progress");
      var meter = scope.querySelector(".meter");
      if (nav) nav.hidden = true;
      if (err) err.hidden = true;
      if (prog) prog.hidden = true;
      if (meter) meter.hidden = true;
      done.hidden = false;
    }
    location.href = href;
  }
  var FORM_ENDPOINT = "https://formsubmit.co/377b52cf505cbfe923fcec89eeee6cae";
  var MAX_UPLOAD = 10 * 1024 * 1024;
  // FormSubmit reCAPTCHA. Off: the post goes through a hidden frame. On success FormSubmit
  // redirects that frame to /thank-you/, and this page follows. On: the visitor is sent to
  // FormSubmit's captcha page (it cannot load in a frame), then lands on /thank-you/.
  // The Google Ads conversion event lives only on /thank-you/.
  var USE_CAPTCHA = false;
  var THANK_YOU = "/thank-you/";
  function filesOf(form) {
    var out = [];
    form.querySelectorAll('input[type="file"]').forEach(function (el) {
      if (el.disabled || offForm(el, form)) return;
      [].slice.call(el.files || []).forEach(function (f) { out.push(f); });
    });
    return out;
  }
  function addHoney(form) {
    if (form.querySelector('input[name="_honey"]')) return;
    var wrap = d.createElement("div");
    wrap.setAttribute("aria-hidden", "true");
    wrap.style.cssText = "position:absolute;left:-10000px;top:auto;width:1px;height:1px;overflow:hidden";
    wrap.innerHTML = '<label>Leave this empty<input type="text" name="_honey" tabindex="-1" autocomplete="off"></label>';
    form.appendChild(wrap);
  }
  function showState(form, which) {
    form.querySelectorAll("[data-step]").forEach(function (p) { p.hidden = true; });
    ["wizard-nav", "form-error", "progress", "meter"].forEach(function (c) {
      var el = form.querySelector("." + c);
      if (el) el.hidden = true;
    });
    var done = form.querySelector(".done");
    var sent = form.querySelector(".sent");
    if (which === "sent") {
      if (!sent) {
        sent = d.createElement("div");
        sent.className = "sent done";
        sent.setAttribute("role", "status");
        sent.innerHTML = '<h2>Thanks. We have it.</h2><p class="lede">A broker will read what you sent and reply by phone or email. If it is urgent, call <a href="tel:+15162267969">(516) 226-7969</a>.</p>';
        form.appendChild(sent);
      }
      if (done) done.hidden = true;
      sent.hidden = false;
      sent.setAttribute("tabindex", "-1");
      if (sent.focus) sent.focus();
    }
  }
  function sendForm(form, subject, lines) {
    var err = form.querySelector(".form-error");
    var btn = form.querySelector("[data-next]");
    function fail(msg) {
      if (btn) { btn.disabled = false; btn.textContent = form.getAttribute("data-final") || "Send"; }
      if (err) { err.textContent = msg; err.hidden = false; }
    }
    var honey = form.querySelector('input[name="_honey"]');
    if (honey && honey.value) { showState(form, "sent"); return; }
    var files = filesOf(form);
    var total = files.reduce(function (n, f) { return n + f.size; }, 0);
    if (total > MAX_UPLOAD) {
      fail("Those files are over 10 MB together. Send fewer or smaller files, or email them to info@simpleinsure.co.");
      return;
    }
    var need = form.querySelector("[data-upload-for]");
    if (need) {
      var sel = form.querySelector("#" + need.getAttribute("data-upload-for"));
      if (sel && /upload/i.test(sel.value) && !(need.files && need.files.length)) {
        fail("Choose a file to upload, or pick \u201cI'll email it later.\u201d");
        if (need.focus) need.focus();
        return;
      }
    }
    var fields = [
      ["_subject", "Website: " + subject],
      ["_template", "table"],
      ["_honey", ""],
      ["_next", location.origin + THANK_YOU],
      ["Form", subject]
    ];
    if (!USE_CAPTCHA) fields.splice(2, 0, ["_captcha", "false"]);
    var used = {};
    fields.forEach(function (f) { used[f[0]] = 1; });
    var email = form.querySelector('input[type="email"]');
    if (email && String(email.value || "").trim()) fields.push(["_replyto", String(email.value).trim()]);
    lines.forEach(function (line, i) {
      var k = line.indexOf(": ");
      var key = k > 0 ? line.slice(0, k) : "Item " + (i + 1);
      var val = k > 0 ? line.slice(k + 2) : line;
      if (used[key]) key = key + " (" + (i + 1) + ")";
      used[key] = 1;
      fields.push([key, val]);
    });
    if (files.length) fields.push(["Files attached", files.map(function (f) { return f.name; }).join(", ")]);
    var name = "fs" + Date.now();
    var frame = d.createElement("iframe");
    frame.name = name;
    frame.title = "Form transport";
    frame.setAttribute("aria-hidden", "true");
    frame.tabIndex = -1;
    frame.style.cssText = "position:absolute;width:0;height:0;border:0;left:-10000px";
    var post = d.createElement("form");
    post.method = "POST";
    post.enctype = "multipart/form-data";
    post.action = FORM_ENDPOINT;
    post.target = name;
    post.hidden = true;
    fields.forEach(function (f) {
      var input = d.createElement("input");
      input.type = "hidden";
      input.name = f[0];
      input.value = f[1];
      post.appendChild(input);
    });
    var attached = 0;
    try {
      files.forEach(function (f, i) {
        var dt = new DataTransfer();
        dt.items.add(f);
        var input = d.createElement("input");
        input.type = "file";
        input.name = i === 0 ? "attachment" : "attachment" + (i + 1);
        input.files = dt.files;
        post.appendChild(input);
        attached++;
      });
    } catch (e) {
      attached = 0;
    }
    if (files.length && !attached) {
      [].slice.call(post.querySelectorAll('input[type="file"]')).forEach(function (el) { el.remove(); });
      form.querySelectorAll('input[type="file"]').forEach(function (orig, i) {
        if (!orig.files || !orig.files.length || offForm(orig, form)) return;
        var input = d.createElement("input");
        input.type = "file";
        input.name = attached === 0 ? "attachment" : "attachment" + (attached + 1);
        try { input.files = orig.files; post.appendChild(input); attached++; } catch (e) {}
      });
    }
    if (files.length && !attached) {
      fail("This browser could not attach your files. Please email them to info@simpleinsure.co or call (516) 226-7969.");
      return;
    }
    if (btn) { btn.disabled = true; btn.textContent = files.length ? "Uploading\u2026" : "Sending\u2026"; }
    if (err) err.hidden = true;
    function markSubmitted() {
      try { sessionStorage.setItem("si_submitted", "1"); } catch (e) {}
    }
    if (USE_CAPTCHA) {
      post.target = "_self";
      d.body.appendChild(post);
      markSubmitted();
      post.submit();
      return;
    }
    var settled = false;
    function cleanup() {
      setTimeout(function () { frame.remove(); post.remove(); }, 1000);
    }
    function onFail() {
      if (settled) return;
      settled = true;
      try { sessionStorage.removeItem("si_submitted"); } catch (e) {}
      cleanup();
      fail("We could not send this just now. Please try again, call (516) 226-7969, or use the email draft below.");
      var mail = form.querySelector("[data-mailto]");
      var summary = form.querySelector(".summary");
      var done = form.querySelector(".done:not(.sent)");
      if (mail) mail.href = mailtoHref(subject, lines);
      if (summary) summary.textContent = lines.join("\n");
      if (done) {
        done.hidden = false;
        var h = done.querySelector("h2");
        if (h) h.hidden = true;
      }
    }
    var timer = setTimeout(onFail, 150000);
    frame.addEventListener("load", function () {
      if (settled) return;
      var path;
      try { path = frame.contentWindow.location.pathname; } catch (e) { path = null; }
      if (path === "blank") return;
      clearTimeout(timer);
      if (path === "/thank-you/" || path === "/thank-you" || path === "/thank-you/index.html") {
        settled = true;
        cleanup();
        location.replace(THANK_YOU);
      } else {
        onFail();
      }
    });
    d.body.appendChild(frame);
    d.body.appendChild(post);
    markSubmitted();
    post.submit();
  }
  d.querySelectorAll("form.wizard").forEach(function (form) {
    var panes = [].slice.call(form.querySelectorAll("[data-step]"));
    var total = panes.length;
    var step = 1;
    var err = form.querySelector(".form-error");
    var back = form.querySelector("[data-back]");
    var next = form.querySelector("[data-next]");
    var meter = form.querySelector(".meter i");
    var count = form.querySelector("[data-stepcount]");
    var label = form.querySelector("[data-steplabel]");
    addHoney(form);
    function show(n) {
      step = n;
      panes.forEach(function (p) { p.hidden = Number(p.getAttribute("data-step")) !== n; });
      if (back) back.hidden = n === 1;
      if (next) next.textContent = n === total ? (form.getAttribute("data-final") || "Email this request") : "Continue";
      if (meter) meter.style.width = (n / total * 100) + "%";
      if (count) count.textContent = n + " of " + total;
      if (label) label.textContent = (panes[n - 1] && panes[n - 1].getAttribute("data-label")) || "";
      if (err) err.hidden = true;
    }
    function validate(pane) {
      var problem = null;
      var radios = {};
      pane.querySelectorAll("input, select, textarea").forEach(function (el) {
        if (el.disabled || el.closest("[hidden]")) return;
        if (el.type === "radio") {
          if (el.required) radios[el.name] = el;
          return;
        }
        if (el.required && !String(el.value || "").trim()) problem = problem || el;
      });
      Object.keys(radios).forEach(function (name) {
        if (!pane.querySelector('input[name="' + name + '"]:checked')) problem = problem || radios[name];
      });
      var email = pane.querySelector("[data-need='email']");
      var phone = pane.querySelector("[data-need='phone']");
      var needContact = email && phone && !email.disabled && !String(email.value || "").trim() && !String(phone.value || "").trim();
      if (needContact) problem = problem || email;
      if (problem && err) {
        if (needContact && problem === email) err.textContent = "Add an email or a phone number so a broker can reply.";
        else err.textContent = pane.getAttribute("data-error") || "Please complete the required fields.";
        err.hidden = false;
      }
      if (problem && problem.focus) problem.focus();
      return !problem;
    }
    form.querySelectorAll('input[name="line"]').forEach(function (el) {
      el.addEventListener("change", function () { applyLine(form); });
    });
    applyLine(form);
    if (back) back.addEventListener("click", function () { if (step > 1) show(step - 1); });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var pane = panes[step - 1];
      if (!validate(pane)) return;
      if (step < total) { show(step + 1); return; }
      var subject = (form.getAttribute("data-subject") || "Request") + (lineLabel(form) ? ": " + lineLabel(form) : "");
      sendForm(form, subject, collect(form));
    });
    if (total === 1) {
      var prog = form.querySelector(".progress");
      var met = form.querySelector(".meter");
      if (prog) prog.hidden = true;
      if (met) met.hidden = true;
    }
    var params = new URLSearchParams(location.search);
    var preset = params.get("type");
    if (preset) {
      var radio = form.querySelector('input[name="line"][value="' + preset + '"]');
      if (radio) {
        radio.checked = true;
        applyLine(form);
        if (total > 1) show(2);
      }
    }
    show(step);
    var copy = form.querySelector("[data-copy]");
    if (copy) {
      copy.addEventListener("click", function () {
        var text = (form.querySelector(".summary") || {}).textContent || "";
        function ok() { copy.textContent = "Copied"; }
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(ok).catch(function () {});
        }
      });
    }
  });

  var needsData = d.getElementById("needs-data");
  var needsApp = d.getElementById("needs-app");
  if (needsData && needsApp) {
    var data = JSON.parse(needsData.textContent);
    var state = { line: null, answers: {}, qi: 0 };
    var quoteLink = d.getElementById("needs-quote");
    function questionsFor(line) {
      return data.questions.filter(function (q) { return q.lines.indexOf(line) !== -1; });
    }
    function render() {
      if (!state.line) {
        needsApp.innerHTML = '<p class="kicker">Coverage guide</p><h2>What should we look at?</h2><div class="choices" style="margin-top:18px"></div>';
        var box = needsApp.querySelector(".choices");
        data.lines.forEach(function (line) {
          var b = d.createElement("button");
          b.type = "button";
          b.className = "choice";
          b.innerHTML = "<span><b>" + line.label + "</b><span style='display:block;color:inherit;opacity:.75;font-weight:440'>" + line.hint + "</span></span>";
          b.addEventListener("click", function () {
            state.line = line.id;
            state.qi = 0;
            state.answers = {};
            render();
          });
          box.appendChild(b);
        });
        return;
      }
      var qs = questionsFor(state.line);
      if (state.qi < qs.length) {
        var q = qs[state.qi];
        needsApp.innerHTML = '<p class="kicker">Question ' + (state.qi + 1) + " of " + qs.length + '</p><h2>' + q.label + '</h2><div class="yn"><button type="button" data-a="yes">Yes</button><button type="button" data-a="no">No</button></div><p style="margin-top:16px"><button type="button" class="btn-ghost" data-back>Back</button></p>';
        needsApp.querySelectorAll("[data-a]").forEach(function (b) {
          b.addEventListener("click", function () {
            state.answers[q.id] = b.getAttribute("data-a");
            state.qi++;
            render();
          });
        });
        needsApp.querySelector("[data-back]").addEventListener("click", function () {
          if (state.qi === 0) state.line = null;
          else state.qi--;
          render();
        });
        return;
      }
      var line = data.lines.filter(function (l) { return l.id === state.line; })[0];
      var items = data.items.filter(function (item) {
        if (item.lines.indexOf(state.line) === -1 && item.lines.indexOf("*") === -1) return false;
        if (item.when === "always") return true;
        return state.answers[item.when] === "yes";
      });
      var lis = items.map(function (item) {
        return "<li><b>" + item.title + "</b><span>" + item.why + "</span></li>";
      }).join("");
      needsApp.innerHTML = '<div class="memo"><p class="kicker">Coverage memo</p><h2>' + line.result + '</h2><p class="lede" style="margin-top:12px">A careful program usually has to answer the items below. This is a general list, not a quote and not a reading of your contracts.</p><ol>' + lis + '</ol><p class="note">' + data.disclaimer + '</p></div>';
      var actions = d.createElement("div");
      actions.className = "cta-row";
      var mail = d.createElement("button");
      mail.type = "button";
      mail.className = "btn";
      mail.innerHTML = 'Email this list <span class="arr" aria-hidden="true">→</span>';
      var lines = ["Coverage guide", "Account: " + line.label, ""].concat(items.map(function (item) { return "- " + item.title + ": " + item.why; }));
      lines.push("", data.disclaimer);
      mail.addEventListener("click", function () {
        location.href = mailtoHref("Coverage guide: " + line.label, lines);
      });
      actions.appendChild(mail);
      if (quoteLink) {
        var q = quoteLink.cloneNode(true);
        var u = new URL(quoteLink.href, location.href);
        u.searchParams.set("type", state.line);
        q.href = u.pathname + u.search;
        q.className = "btn-ghost";
        actions.appendChild(q);
      }
      var again = d.createElement("button");
      again.type = "button";
      again.className = "btn-ghost";
      again.textContent = "Start over";
      again.addEventListener("click", function () { state.line = null; render(); });
      actions.appendChild(again);
      needsApp.appendChild(actions);
    }
    render();
  }

  var pracNav = d.querySelector(".prac-nav");
  if (pracNav) {
    var pracLinks = [].slice.call(pracNav.querySelectorAll("a[data-prac]"));
    var pracSections = pracLinks.map(function (a) { return d.getElementById(a.getAttribute("data-prac")); });
    function markPractice() {
      var current = pracSections[0];
      pracSections.forEach(function (sec) {
        if (!sec) return;
        if (sec.getBoundingClientRect().top - 170 <= 0) current = sec;
      });
      pracLinks.forEach(function (a) {
        var on = current && a.getAttribute("data-prac") === current.id;
        a.classList.toggle("is-on", !!on);
        if (on) a.setAttribute("aria-current", "true");
        else a.removeAttribute("aria-current");
      });
    }
    addEventListener("scroll", markPractice, { passive: true });
    markPractice();
  }
  d.querySelectorAll(".cc-hot").forEach(function (a) {
    a.addEventListener("click", function (e) { e.stopPropagation(); });
  });

  d.querySelectorAll(".plist").forEach(function (list) {
    list.addEventListener("mousemove", function (e) {
      var a = e.target.closest("a");
      if (!a) return;
      var r = a.getBoundingClientRect();
      a.style.setProperty("--mx", e.clientX - r.left + "px");
      a.style.setProperty("--my", e.clientY - r.top + "px");
    });
  });

  // Practices card rail, restored from the Railway build (a457508) without GSAP or Lenis.
  // The section is pinned with position:sticky and the cards move one to one with the
  // native scroll, so the wheel and trackpad never feel stuck. Desktop with motion only.
  (function () {
    var pin = d.querySelector(".h-pin");
    var sticky = pin && pin.querySelector(".h-sticky");
    var track = pin && pin.querySelector(".h-track");
    if (!pin || !sticky || !track) return;
    var root = d.documentElement;
    var deskQ = matchMedia("(min-width: 1024px)");
    var slides = Array.prototype.slice.call(track.querySelectorAll(".slide"));
    var imgs = slides.map(function (s) { return s.querySelector("img"); });
    var now = pin.querySelector(".h-now");
    var bar = pin.querySelector(".h-bar");
    var on = false, dist = 0, top = 0, cur = 0, target = 0, ticking = 0;
    function pad(n) { return (n < 10 ? "0" : "") + n; }
    function paint() {
      ticking = 0;
      var diff = target - cur;
      cur = Math.abs(diff) < 0.5 ? target : cur + diff * 0.22;
      track.style.transform = "translate3d(" + (-cur).toFixed(1) + "px,0,0)";
      var vw = innerWidth, p = dist ? cur / dist : 0, best = 0, bestD = 1e9;
      slides.forEach(function (s, i) {
        var r = s.getBoundingClientRect();
        var c = (r.left + r.width / 2 - vw / 2) / vw;
        if (imgs[i]) imgs[i].style.transform = "translate3d(" + (c * -5).toFixed(2) + "%,0,0)";
        var dd = Math.abs(r.left + r.width / 2 - vw * 0.62);
        if (dd < bestD) { bestD = dd; best = i; }
      });
      if (bar) bar.style.setProperty("--p", p.toFixed(3));
      if (now) now.textContent = pad(best + 1);
      if (cur !== target) ticking = requestAnimationFrame(paint);
    }
    function onScroll() {
      if (!on) return;
      var y = window.scrollY || 0;
      target = Math.min(dist, Math.max(0, y - top));
      if (!ticking) ticking = requestAnimationFrame(paint);
    }
    function measure() {
      var want = deskQ.matches && !reduce;
      root.classList.toggle("rail", want);
      on = want;
      if (!on) {
        pin.style.removeProperty("height");
        track.style.transform = "";
        imgs.forEach(function (im) { if (im) im.style.transform = ""; });
        return;
      }
      dist = Math.max(0, track.offsetLeft + track.scrollWidth - sticky.clientWidth + 48);
      pin.style.setProperty("height", (sticky.clientHeight + dist) + "px", "important");
      top = pin.getBoundingClientRect().top + (window.scrollY || 0);
      cur = target = Math.min(dist, Math.max(0, (window.scrollY || 0) - top));
      paint();
    }
    measure();
    addEventListener("scroll", onScroll, { passive: true });
    addEventListener("resize", measure);
    addEventListener("load", measure);
    if (deskQ.addEventListener) deskQ.addEventListener("change", measure);
    slides.forEach(function (s) {
      var a = s.querySelector("a");
      if (a) a.addEventListener("focus", function () {
        if (!on) return;
        var want = top + Math.min(dist, Math.max(0, s.offsetLeft - track.offsetLeft - 48));
        window.scrollTo(0, want);
      });
    });
  })();
})();
