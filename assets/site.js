(function () {
  "use strict";
  var d = document, w = window;
  var PREVIEW = !!w.SI_PREVIEW;
  var FORM_ENDPOINT = "https://formsubmit.co/377b52cf505cbfe923fcec89eeee6cae";
  var MAX_UPLOAD = 10 * 1024 * 1024;
  var MAIL = "info@simpleinsure.co";

  /* mobile menu */
  var btn = d.querySelector(".menu-btn"), mnav = d.getElementById("mnav");
  if (btn && mnav) btn.addEventListener("click", function () {
    var open = mnav.hasAttribute("data-open");
    if (open) mnav.removeAttribute("data-open"); else mnav.setAttribute("data-open", "");
    btn.setAttribute("aria-expanded", String(!open));
    btn.textContent = open ? "Menu" : "Close";
  });

  /* card rail: moves 1:1 with the page scroll at 1024px and wider */
  var rail = d.querySelector("[data-rail]");
  if (rail) {
    var track = rail.querySelector(".rail-track");
    var cards = [].slice.call(rail.querySelectorAll(".lcard"));
    var num = rail.querySelector("[data-rail-num]");
    var bar = rail.querySelector(".rail-bar i");
    var wide = w.matchMedia("(min-width:1024px)");
    var still = w.matchMedia("(prefers-reduced-motion: reduce)");
    var dist = 0, on = false, ticking = false;
    function setCount(i) {
      if (num) num.textContent = ("0" + (i + 1)).slice(-2);
      if (bar) bar.style.width = ((i + 1) / cards.length * 100) + "%";
    }
    function measure() {
      on = wide.matches && !still.matches;
      d.documentElement.classList.toggle("rail-on", on);
      if (!on) { rail.style.height = ""; track.style.transform = ""; return; }
      track.style.transform = "translate3d(0,0,0)";
      dist = Math.max(0, track.scrollWidth - w.innerWidth);
      rail.style.height = (w.innerHeight + dist) + "px";
      update();
    }
    function update() {
      ticking = false;
      if (!on) return;
      var p = Math.min(Math.max(-rail.getBoundingClientRect().top, 0), dist);
      track.style.transform = "translate3d(" + (-p) + "px,0,0)";
      var i = dist ? Math.min(cards.length - 1, Math.floor(p / dist * cards.length)) : 0;
      setCount(i);
    }
    w.addEventListener("scroll", function () { if (!ticking) { ticking = true; w.requestAnimationFrame(update); } }, { passive: true });
    w.addEventListener("resize", measure);
    w.addEventListener("load", measure);
    track.addEventListener("scroll", function () {
      if (on) return;
      var cw = cards[0] ? cards[0].getBoundingClientRect().width + 20 : 1;
      setCount(Math.min(cards.length - 1, Math.round(track.scrollLeft / cw)));
    }, { passive: true });
    measure();
  }

  /* preselect the line on the quote form from ?line= */
  var q = /[?&]line=([a-z-]+)/.exec(location.search);
  if (q) {
    var sel = d.getElementById("q-line");
    if (sel) [].slice.call(sel.options).forEach(function (o) { if (o.getAttribute("data-key") === q[1]) sel.value = o.value; });
  }

  /* forms */
  function labelOf(el) {
    if (el.getAttribute("data-key")) return el.getAttribute("data-key");
    var l = el.id && d.querySelector('label[for="' + el.id + '"]');
    return l ? l.textContent.replace(/\s+/g, " ").replace(/\(optional\)/i, "").trim() : el.name;
  }
  function collect(form) {
    var lines = [], groups = {};
    [].slice.call(form.elements).forEach(function (el) {
      if (!el.name || el.type === "file" || el.type === "submit" || el.name.charAt(0) === "_") return;
      if (el.type === "checkbox") {
        if (!el.checked) return;
        var g = el.getAttribute("data-group") || "Selected";
        (groups[g] = groups[g] || []).push(el.value);
        return;
      }
      var v = String(el.value || "").trim();
      if (v) lines.push(labelOf(el) + ": " + v);
    });
    Object.keys(groups).forEach(function (g) { lines.push(g + ": " + groups[g].join(", ")); });
    return lines;
  }
  function files(form) {
    var out = [];
    form.querySelectorAll('input[type="file"]').forEach(function (el) { [].slice.call(el.files || []).forEach(function (f) { out.push(f); }); });
    return out;
  }
  function mailto(subject, lines) {
    var body = lines.join("\n") + "\n\nSent from www.simpleinsure.co";
    return "mailto:" + MAIL + "?subject=" + encodeURIComponent("Website: " + subject) + "&body=" + encodeURIComponent(body);
  }
  function validate(form) {
    var bad = null;
    form.querySelectorAll("[aria-invalid]").forEach(function (el) { el.removeAttribute("aria-invalid"); });
    [].slice.call(form.elements).forEach(function (el) {
      if (bad || !el.required) return;
      if (!String(el.value || "").trim() || (el.validity && !el.validity.valid)) bad = [el, "Please fill in " + labelOf(el).toLowerCase() + "."];
    });
    if (!bad) {
      [].slice.call(form.querySelectorAll("input[type=email]")).forEach(function (el) {
        if (!bad && el.value && el.validity && !el.validity.valid) bad = [el, "Please check the email address."];
      });
    }
    if (!bad) {
      var em = form.querySelector('[data-need="email"]'), ph = form.querySelector('[data-need="phone"]');
      if (em && ph && !em.value.trim() && !ph.value.trim()) bad = [em, "Add an email or a phone number so we can reply."];
    }
    if (!bad) {
      var total = files(form).reduce(function (n, f) { return n + f.size; }, 0);
      if (total > MAX_UPLOAD) bad = [form.querySelector('input[type="file"]'), "Those files are over 10 MB together. Send fewer or smaller files, or email them to " + MAIL + "."];
    }
    return bad;
  }
  function done(form, html) {
    var box = d.createElement("div");
    box.className = "sent";
    box.setAttribute("role", "status");
    box.setAttribute("tabindex", "-1");
    box.innerHTML = html;
    form.hidden = true;
    form.parentNode.insertBefore(box, form.nextSibling);
    box.focus();
  }
  function send(form) {
    var subject = form.getAttribute("data-subject") || "Website form";
    var err = form.querySelector(".form-error");
    var submit = form.querySelector('[type="submit"]');
    var label = submit ? submit.textContent : "";
    var bad = validate(form);
    if (bad) {
      err.textContent = bad[1]; err.hidden = false;
      if (bad[0]) { bad[0].setAttribute("aria-invalid", "true"); bad[0].focus(); }
      return;
    }
    err.hidden = true;
    var lines = collect(form);
    if (PREVIEW || !FORM_ENDPOINT) {
      done(form, '<h2>Preview only</h2><p class="lede">This form is turned off on the preview site, so nothing was sent. On the live site this request goes to SimpleINSURE.</p>');
      return;
    }
    var honey = form.querySelector('input[name="_honey"]');
    if (honey && honey.value) { done(form, "<h2>Thanks. We have it.</h2>"); return; }
    var fl = files(form);
    var fields = [["_subject", "Website: " + subject], ["_template", "table"], ["_captcha", "false"], ["_honey", ""], ["_next", location.origin + "/form-sent/"], ["Form", subject]];
    var em = form.querySelector('input[type="email"]');
    if (em && em.value.trim()) fields.push(["_replyto", em.value.trim()]);
    var used = {};
    fields.forEach(function (f) { used[f[0]] = 1; });
    lines.forEach(function (line, i) {
      var k = line.indexOf(": "), key = line.slice(0, k), val = line.slice(k + 2);
      if (used[key]) key += " (" + (i + 1) + ")";
      used[key] = 1;
      fields.push([key, val]);
    });
    if (fl.length) fields.push(["Files attached", fl.map(function (f) { return f.name; }).join(", ")]);
    var name = "fs" + Date.now();
    var frame = d.createElement("iframe");
    frame.name = name; frame.title = "Form transport"; frame.tabIndex = -1;
    frame.setAttribute("aria-hidden", "true");
    frame.style.cssText = "position:absolute;width:0;height:0;border:0;left:-10000px";
    var post = d.createElement("form");
    post.method = "POST"; post.enctype = "multipart/form-data"; post.action = FORM_ENDPOINT; post.target = name; post.hidden = true;
    fields.forEach(function (f) { var i = d.createElement("input"); i.type = "hidden"; i.name = f[0]; i.value = f[1]; post.appendChild(i); });
    var attached = 0;
    try {
      fl.forEach(function (f, i) {
        var dt = new DataTransfer(); dt.items.add(f);
        var inp = d.createElement("input"); inp.type = "file"; inp.name = i === 0 ? "attachment" : "attachment" + (i + 1); inp.files = dt.files;
        post.appendChild(inp); attached++;
      });
    } catch (e) { attached = 0; }
    if (fl.length && !attached) {
      post.querySelectorAll('input[type="file"]').forEach(function (el) { el.remove(); });
      form.querySelectorAll('input[type="file"]').forEach(function (orig) {
        if (!orig.files || !orig.files.length) return;
        var inp = d.createElement("input"); inp.type = "file"; inp.name = attached === 0 ? "attachment" : "attachment" + (attached + 1);
        try { inp.files = orig.files; post.appendChild(inp); attached++; } catch (e) {}
      });
    }
    if (fl.length && !attached) {
      err.textContent = "This browser could not attach your files. Please email them to " + MAIL + " or call (516) 226-7969."; err.hidden = false; return;
    }
    if (submit) { submit.disabled = true; submit.textContent = fl.length ? "Uploading\u2026" : "Sending\u2026"; }
    var settled = false;
    function cleanup() { setTimeout(function () { frame.remove(); post.remove(); }, 1000); }
    function fail() {
      if (settled) return; settled = true; cleanup();
      if (submit) { submit.disabled = false; submit.textContent = label; }
      err.innerHTML = 'We could not send this just now. Please try again, call <a href="tel:+15162267969">(516) 226-7969</a>, or <a href="' + mailto(subject, lines) + '">open an email draft</a>. Email is not encrypted, so leave out Social Security, driver\'s license, birth date, and bank or card numbers.';
      err.hidden = false;
    }
    var timer = setTimeout(fail, 150000);
    frame.addEventListener("load", function () {
      if (settled) return;
      var path; try { path = frame.contentWindow.location.pathname; } catch (e) { path = null; }
      if (path === "blank") return;
      clearTimeout(timer);
      if (path === "/form-sent/") {
        settled = true; cleanup();
        done(form, '<h2>Thanks. We have it.</h2><p class="lede">A broker will read what you sent and reply by phone or email. If it is urgent, call <a href="tel:+15162267969">(516) 226-7969</a>.</p>');
        if (w.gtag) w.gtag("event", "generate_lead", { form_name: subject });
      } else { fail(); }
    });
    d.body.appendChild(frame); d.body.appendChild(post); post.submit();
  }
  d.querySelectorAll("form.fs").forEach(function (form) {
    if (!form.querySelector('input[name="_honey"]')) {
      var h = d.createElement("div");
      h.setAttribute("aria-hidden", "true");
      h.style.cssText = "position:absolute;left:-10000px;width:1px;height:1px;overflow:hidden";
      h.innerHTML = '<label>Leave this empty<input type="text" name="_honey" tabindex="-1" autocomplete="off"></label>';
      form.appendChild(h);
    }
    form.addEventListener("submit", function (e) { e.preventDefault(); send(form); });
  });
})();
