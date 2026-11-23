(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* theme */
  var root = document.documentElement, themeBtn = $("#themeBtn");
  function setTheme(t) {
    root.dataset.theme = t;
    themeBtn.textContent = t === "dark" ? "☀️" : "🌙";
    $("#themeBtnSide").textContent = t === "dark" ? "☀️ Light mode" : "🌙 Dark mode";
    try { localStorage.setItem("theme", t); } catch (e) {}
  }
  setTheme(root.dataset.theme || "light");
  $$(".themeBtn").forEach(function (b) { b.addEventListener("click", function () { setTheme(root.dataset.theme === "dark" ? "light" : "dark"); }); });

  /* mobile menu */
  var menuBtn = $("#menuBtn");
  function menu(open) {
    document.body.classList.toggle("menu", open);
    menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
  }
  menuBtn.addEventListener("click", function () { menu(!document.body.classList.contains("menu")); });
  $("#overlay").addEventListener("click", function () { menu(false); });
  $$("#sidebar a").forEach(function (a) { a.addEventListener("click", function () { menu(false); }); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") menu(false); });

  /* scroll spy: highlight the current section and open its sub-menu */
  var links = {};
  $$("#sidebar a[data-spy]").forEach(function (a) { links[a.dataset.spy] = a; });
  var secs = $$("main > section.topic");
  var spy = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      var id = en.target.id;
      $$("#sidebar a.active").forEach(function (a) { a.classList.remove("active"); a.parentNode.classList.remove("open"); });
      if (links[id]) { links[id].classList.add("active"); links[id].parentNode.classList.add("open"); }
    });
  }, { rootMargin: "-20% 0px -70% 0px" });
  secs.forEach(function (s) { spy.observe(s); });

  /* back to top */
  var toTop = $("#toTop");
  window.addEventListener("scroll", function () { toTop.hidden = window.scrollY < 600; }, { passive: true });
  toTop.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: "smooth" }); });

  /* expand / collapse all */
  $("#expandAll").addEventListener("click", function () { $$("details.det").forEach(function (d) { d.open = true; }); });
  $("#collapseAll").addEventListener("click", function () { $$("details.det").forEach(function (d) { d.open = false; }); });

  /* quizzes */
  $$(".quiz").forEach(function (quiz) {
    var qs = $$(".q", quiz), scoreEl = $(".score", quiz);
    function update() {
      var answered = 0, right = 0;
      qs.forEach(function (q) {
        if (q.dataset.done) { answered++; if (q.dataset.ok === "1") right++; }
      });
      scoreEl.textContent = "Score: " + right + " / " + qs.length + " (answered " + answered + ")";
      if (answered === qs.length) scoreEl.textContent += right === qs.length ? " – perfect!" : " – review the red ones.";
    }
    qs.forEach(function (q) {
      var ans = parseInt(q.dataset.answer, 10);
      $$(".opt", q).forEach(function (btn) {
        btn.addEventListener("click", function () {
          if (q.dataset.done) return;
          var pick = parseInt(btn.dataset.i, 10);
          q.dataset.done = "1"; q.dataset.ok = pick === ans ? "1" : "0";
          $$(".opt", q).forEach(function (b) {
            b.disabled = true;
            if (parseInt(b.dataset.i, 10) === ans) b.classList.add("correct");
          });
          if (pick !== ans) btn.classList.add("wrong");
          $(".why", q).hidden = false;
          update();
        });
      });
    });
    $(".reset", quiz).addEventListener("click", function () {
      qs.forEach(function (q) {
        delete q.dataset.done; delete q.dataset.ok;
        $$(".opt", q).forEach(function (b) { b.disabled = false; b.classList.remove("correct", "wrong"); });
        $(".why", q).hidden = true;
      });
      update();
      quiz.scrollIntoView({ block: "start" });
    });
    update();
  });


  /* exam-format exercises: heading match, chart fill, reference self-check */
  function norm(t) { return (t || "").toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim(); }
  $$(".ex").forEach(function (ex) {
    var res = $(".res", ex), chk = $(".chk", ex);
    var fields = $$("select, input", ex);
    function mark(el, ok) {
      el.classList.remove("ok", "no"); el.classList.add(ok ? "ok" : "no");
      var m = el.parentNode.querySelector(".mark");
      if (m) { m.textContent = ok ? "✓" : "✗"; m.className = "mark " + (ok ? "okm" : "nom"); }
    }
    if (chk) chk.addEventListener("click", function () {
      var right = 0;
      fields.forEach(function (el) {
        var ok;
        if (el.tagName === "SELECT") ok = el.value !== "" && el.value === el.dataset.answer;
        else {
          var v = norm(el.value), acc = (el.dataset.accept || "").split("|").map(norm);
          ok = v !== "" && acc.some(function (a) { return a && v.indexOf(a) > -1; });
        }
        mark(el, ok); if (ok) right++;
      });
      res.textContent = right + " / " + fields.length + " correct" + (right === fields.length ? " – perfect!" : "");
    });
    $(".show", ex).addEventListener("click", function () { ex.classList.toggle("showans"); });
    $(".rst", ex).addEventListener("click", function () {
      fields.forEach(function (el) {
        el.value = ""; el.classList.remove("ok", "no");
        var m = el.parentNode.querySelector(".mark"); if (m) { m.textContent = ""; m.className = "mark"; }
      });
      ex.classList.remove("showans"); res.textContent = "";
    });
  });

  /* glossary search + topic filter */
  var gs = $("#gsearch"), items = $$(".gitem"), gcount = $("#gcount"), gnone = $("#gnone"), filter = "all";
  function applyG() {
    var q = gs.value.trim().toLowerCase(), shown = 0;
    items.forEach(function (it) {
      var text = (it.textContent || "").toLowerCase();
      var okT = filter === "all" || it.dataset.topics.split(" ").indexOf(filter) > -1;
      var okQ = !q || text.indexOf(q) > -1;
      it.hidden = !(okT && okQ);
      if (!it.hidden) shown++;
    });
    gcount.textContent = shown + " / " + items.length + " terms";
    gnone.hidden = shown !== 0;
  }
  gs.addEventListener("input", applyG);
  $$(".fchip").forEach(function (c) {
    c.addEventListener("click", function () {
      $$(".fchip").forEach(function (x) { x.classList.remove("active"); });
      c.classList.add("active"); filter = c.dataset.f; applyG();
    });
  });
  applyG();

  /* print only the cheat sheet */
  window.printCheat = function () {
    document.body.classList.add("printcheat");
    window.print();
    setTimeout(function () { document.body.classList.remove("printcheat"); }, 500);
  };

  /* deep link: open details if hash targets inside one */
  function openHash() {
    if (!location.hash) return;
    var t = document.getElementById(decodeURIComponent(location.hash.slice(1)));
    if (!t) return;
    var d = t.closest("details"); if (d) d.open = true;
  }
  window.addEventListener("hashchange", openHash); openHash();
})();
