(function () {
  var d = document;
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  d.documentElement.classList.add("js");

  var header = d.querySelector(".site-header");
  var menuBtn = d.querySelector(".nav-btn");
  var sheet = d.getElementById("sheet");
  var lenis = null;
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
    if (lenis) lenis.start();
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
    if (lenis) lenis.stop();
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
      if (mobileQ.matches && window.ScrollTrigger) {
        ScrollTrigger.getAll().forEach(function (st) {
          if (st.trigger && st.trigger.classList && st.trigger.classList.contains("h-pin")) st.kill();
        });
      }
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
  function collect(form) {
    var lines = [];
    var label = lineLabel(form);
    if (label) lines.push("Account: " + label);
    var seen = {};
    form.querySelectorAll("input, select, textarea").forEach(function (el) {
      if (el.disabled || el.type === "radio" || el.type === "checkbox" || el.type === "file" || !el.name) return;
      if (el.closest("[hidden]")) return;
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
      if (el.disabled || !el.checked || el.closest("[hidden]")) return;
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
      openMail(subject, collect(form), form);
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

  // Native scrolling only. No scroll library, no pinning, no scroll-linked transforms.
})();
