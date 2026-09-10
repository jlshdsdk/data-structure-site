/* =====================================================================
 * app.js — 全站公共脚本（MPA版）
 * 依赖：页面先引入 nav.js（SITE_NAV）与 checkin.js（window.Checkin）
 * 页面通过 window.PAGE = { page:'wangdao'|...|'home'|'progress' } 声明自身。
 * 功能：夜间模式/字号(localStorage)、侧栏多级导航、滚动高亮、代码高亮(分批)、
 *       一键复制、搜索(本页/全网)、难度与章节筛选、速查卡、回到顶部、
 *       「已学」标记(接 Checkin)、进度页渲染、首页打卡小组件。
 * ===================================================================== */
(function () {
  "use strict";
  var PAGE = window.PAGE || { page: "home" };
  var NAV = window.SITE_NAV || { parts: [], files: {} };
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ================= 0. 公共配置：夜间模式 + 字号（localStorage 持久化） ================= */
  var htmlEl = document.documentElement;
  var FZ = [1, 1.1, 1.22, 1.35];
  var fzIdx = 0;
  try { fzIdx = Math.min(3, Math.max(0, +localStorage.getItem("ds_font") || 0)); } catch (e) {}
  function applyFont() {
    for (var i = 1; i <= 3; i++) htmlEl.classList.remove("fz" + i);
    if (fzIdx > 0) htmlEl.classList.add("fz" + fzIdx);
    try { localStorage.setItem("ds_font", String(fzIdx)); } catch (e) {}
    var fp = $("#fontPlus"), fm = $("#fontMinus");
    if (fp) fp.textContent = "A" + (fzIdx > 0 ? "+" + fzIdx : "+");
    if (fm) fm.textContent = "A-";
  }
  function applyNight() {
    var on = false;
    try { on = localStorage.getItem("ds_night") === "1"; } catch (e) {}
    htmlEl.classList.toggle("night", on);
    var b = $("#nightBtn");
    if (b) b.textContent = on ? "☀️" : "🌙";
  }
  function wireTheme() {
    var nb = $("#nightBtn");
    if (nb) nb.addEventListener("click", function () {
      try { localStorage.setItem("ds_night", localStorage.getItem("ds_night") === "1" ? "0" : "1"); } catch (e) {}
      applyNight();
    });
    var fp = $("#fontPlus"), fm = $("#fontMinus");
    if (fp) fp.addEventListener("click", function () { fzIdx = Math.min(3, fzIdx + 1); applyFont(); });
    if (fm) fm.addEventListener("click", function () { fzIdx = Math.max(0, fzIdx - 1); applyFont(); });
    applyFont();
    applyNight();
  }

  /* ================= 1. 侧边栏导航（全部页面共用，跨页链接） ================= */
  var BRAND_HOME = "index.html";
  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
  function hrefFor(id) {
    var f = NAV.files && NAV.files[id];
    if (!f || f === PAGE.page) return "#" + id;
    return f + ".html#" + id;
  }
  function renderNav() {
    var nav = $("#nav");
    if (!nav || !NAV.parts) return;
    NAV.parts.forEach(function (part) {
      var pd = document.createElement("div");
      pd.className = "nav-part";
      pd.textContent = part.t;
      nav.appendChild(pd);
      part.ch.forEach(function (ch) {
        var chDiv = document.createElement("div");
        chDiv.className = "nav-ch";
        var head = document.createElement("div");
        head.className = "nav-ch-head";
        var isOpen = (part.file === PAGE.page);   // 当前模块默认展开
        if (isOpen) chDiv.classList.add("open");
        head.innerHTML = "<span>" + esc(ch.t) + "</span><span class=\"arrow\">▶</span>";
        var items = document.createElement("div");
        items.className = "nav-items";
        ch.items.forEach(function (it) {
          var a = document.createElement("a");
          a.href = hrefFor(it[0]);
          a.textContent = it[1];
          a.setAttribute("data-target", it[0]);
          items.appendChild(a);
        });
        chDiv.appendChild(head);
        chDiv.appendChild(items);
        nav.appendChild(chDiv);
        head.addEventListener("click", function () { chDiv.classList.toggle("open"); });
      });
    });
  }
  function renderSideBadge() {
    var side = $("#sidebar");
    if (!side || $(".thu-side", side)) return;
    var d = document.createElement("div");
    d.className = "thu-side";
    d.innerHTML = "<div class=\"t1\">学而时习</div><div class=\"t2\">数据结构 · 自学手册<br><b>循序渐进 · 学练结合</b></div>";
    side.insertBefore(d, side.firstChild);
  }

  /* ================= 2. 滚动侦测（仅本页锚点参与） ================= */
  var secEls = $$(".sec, .part-head, .chap-head");
  var navTargetSet = {}, navLinks = [], lastCur = null;
  function anchorOf(id) {
    var el = document.getElementById(id);
    if (el && el.classList.contains("prob")) {
      var chap = el.closest ? el.closest(".chap-head") : null;
      if (chap && chap.id) return chap.id;
    }
    return id;
  }
  function setActive(cur) {
    if (cur === lastCur) return;
    lastCur = cur;
    for (var i = 0; i < navLinks.length; i++)
      navLinks[i].el.classList.toggle("active", navLinks[i].t === cur);
  }
  function initSpy() {
    $$(".nav-items a").forEach(function (a) {
      var t = a.getAttribute("data-target");
      navTargetSet[t] = true;
      navLinks.push({ el: a, t: t });
    });
    if (!("onscroll" in window)) return;
    var ticking = false;
    window.addEventListener("scroll", function () {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(function () {
          var pos = window.scrollY + 100, cur = null;
          for (var i = 0; i < secEls.length; i++) {
            if (secEls[i].offsetTop <= pos) {
              var sid = secEls[i].id;
              if (sid && (navTargetSet[sid] || secEls[i].classList.contains("prob"))) cur = sid;
            } else break;
          }
          if (cur) cur = anchorOf(cur);
          setActive(cur);
          ticking = false;
        });
      }
    });
    spyOnce();
  }
  function spyOnce() {
    var pos = window.scrollY + 100, cur = null;
    for (var i = 0; i < secEls.length; i++) {
      if (secEls[i].offsetTop <= pos) {
        var sid = secEls[i].id;
        if (sid && (navTargetSet[sid] || secEls[i].classList.contains("prob"))) cur = sid;
      } else break;
    }
    if (cur) cur = anchorOf(cur);
    setActive(cur);
  }

  /* ================= 3. 代码块：包装 + 复制 + 分批高亮 ================= */
  var HL_RE = /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|("(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*')|(#[^\n]*)|\b(alignas|auto|bool|break|case|catch|char|class|const|constexpr|continue|default|delete|do|double|else|enum|explicit|extern|false|float|for|friend|goto|if|inline|int|long|mutable|namespace|new|noexcept|nullptr|operator|private|protected|public|register|return|short|signed|sizeof|static|struct|switch|template|this|throw|true|try|typedef|typename|union|unsigned|using|virtual|void|volatile|while)\b|\b(cerr|cin|cout|deque|endl|greater|less|list|make_pair|make_tuple|map|multimap|multiset|pair|priority_queue|queue|set|stack|string|stringstream|tuple|unordered_map|unordered_set|vector|getline|isdigit|stoi)\b|\b(\d+\.?\d*(?:[eE][+-]?\d+)?|0x[0-9a-fA-F]+)\b/g;
  function escHtml(s) { return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
  function highlight(codeEl) {
    var raw = codeEl.textContent, out = "", last = 0, m;
    HL_RE.lastIndex = 0;
    while ((m = HL_RE.exec(raw)) !== null) {
      if (m.index > last) out += escHtml(raw.slice(last, m.index));
      var cls = m[1] ? "cm" : m[2] ? "st" : m[3] ? "pp" : m[4] ? "kw" : m[5] ? "tp" : "num";
      out += '<span class="tk-' + cls + '">' + escHtml(m[0]) + "</span>";
      last = m.index + m[0].length;
    }
    out += escHtml(raw.slice(last));
    codeEl.innerHTML = out;
  }
  function fallbackCopy(text) {
    var ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed"; ta.style.opacity = "0";
    document.body.appendChild(ta); ta.select();
    try { document.execCommand("copy"); } catch (e) {}
    document.body.removeChild(ta);
  }
  function initCode() {
    var queue = [];
    $$("pre.code").forEach(function (pre) {
      var box = document.createElement("div"); box.className = "codebox";
      var head = document.createElement("div"); head.className = "cb-head";
      var title = document.createElement("span"); title.textContent = pre.getAttribute("data-t") || "C++";
      var btn = document.createElement("button"); btn.className = "copy-btn"; btn.textContent = "复制";
      head.appendChild(title); head.appendChild(btn);
      pre.parentNode.insertBefore(box, pre);
      box.appendChild(head); box.appendChild(pre);
      btn.addEventListener("click", function () {
        var text = pre.textContent;
        function done() {
          btn.textContent = "已复制 ✓"; btn.classList.add("ok");
          setTimeout(function () { btn.textContent = "复制"; btn.classList.remove("ok"); }, 1600);
        }
        if (navigator.clipboard && navigator.clipboard.writeText)
          navigator.clipboard.writeText(text).then(done, function () { fallbackCopy(text); done(); });
        else { fallbackCopy(text); done(); }
      });
      var code = pre.querySelector("code");
      if (code) queue.push(code);
    });
    (function batch() {
      var n = Math.min(14, queue.length);
      for (var i = 0; i < n; i++) highlight(queue.shift());
      if (queue.length) setTimeout(batch, 0);
    })();
  }

  /* ================= 4. 搜索：本页索引 + 首页全网索引 ================= */
  var searchBox = $("#searchBox"), searchList = $("#searchList");
  var INDEX = [], INDEX_READY = false;
  function indexOne(el) {
    if (!el.id) return;
    var raw = el.textContent;
    if (el.classList.contains("prob")) {
      var num = el.querySelector(".pnum"), name = el.querySelector(".pname");
      INDEX.push({ id: el.id, file: PAGE.page, title: (num ? num.textContent : "") + " " + (name ? name.textContent : ""), text: raw.toLowerCase(), raw: raw });
    } else {
      var h = el.querySelector("h3") || el.querySelector("h2");
      INDEX.push({ id: el.id, file: PAGE.page, title: h ? h.textContent : el.id, text: raw.toLowerCase(), raw: raw });
    }
  }
  function buildLocalIndex() {
    secEls.forEach(indexOne);
    $$(".prob").forEach(indexOne);
    INDEX_READY = true;
  }
  function fetchGlobalIndex(cb) {
    fetch("assets/search-index.json").then(function (r) { return r.json(); }).then(function (data) {
      INDEX = [];
      Object.keys(data.pages).forEach(function (pg) {
        data.pages[pg].items.forEach(function (it) {
          INDEX.push({ id: it.id, file: pg, title: it.title, text: it.text });
        });
      });
      INDEX_READY = true;
      cb();
    }).catch(function () {
      searchList.innerHTML = '<div class="search-empty">全网索引加载失败，请刷新重试</div>';
      searchList.classList.add("show");
    });
  }
  function jumpTo(item) {
    if (item.file && item.file !== PAGE.page) {
      location.href = item.file + ".html#" + item.id;
      return;
    }
    var el = document.getElementById(item.id);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    el.classList.remove("flash"); void el.offsetWidth; el.classList.add("flash");
  }
  function renderResults(q) {
    if (!INDEX_READY) { renderPending = q; return; }
    if (!q) { searchList.classList.remove("show"); searchList.innerHTML = ""; return; }
    var kw = q.toLowerCase();
    var skipSnipHL = /^(amp|lt|gt|quot|nbsp|#\d+)$/.test(kw);
    var hits = [];
    for (var i = 0; i < INDEX.length && hits.length < 60; i++) {
      var it = INDEX[i];
      var inTitle = it.title.toLowerCase().indexOf(kw) >= 0;
      var at = it.text.indexOf(kw);
      if (inTitle || at >= 0) {
        var src = inTitle ? it.title : (it.raw || it.text);
        var s0 = Math.max(0, (inTitle ? it.title.toLowerCase().indexOf(kw) : at) - 18);
        hits.push({ id: it.id, file: it.file, title: it.title, snip: (s0 > 0 ? "…" : "") + src.substr(s0, 60) });
      }
    }
    if (!hits.length) {
      var extra = PAGE.search === "local"
        ? ' <a href="index.html?q=' + encodeURIComponent(q) + '" style="color:#2563eb">在全网搜索「' + esc(q) + "」→</a>"
        : "";
      searchList.innerHTML = '<div class="search-empty">本页未找到与「' + esc(q) + "」相关的内容。" + extra + "</div>";
    } else {
      var re = new RegExp(kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
      searchList.innerHTML = hits.slice(0, 15).map(function (h) {
        var t = escHtml(h.title), s = escHtml(h.snip);
        if (!skipSnipHL) s = s.replace(re, function (mm) { return "<b>" + mm + "</b>"; });
        var tag = (h.file && h.file !== PAGE.page) ? '<span class="path">📍 ' + esc(h.file) + "</span>" : "";
        return '<div class="search-item" data-id="' + esc(h.id) + '" data-file="' + esc(h.file || PAGE.page) + '"><b>' + t + "</b>" + tag + '<span class="path">' + s + "</span></div>";
      }).join("");
    }
    searchList.classList.add("show");
  }
  var renderPending = null;
  function wireSearch() {
    if (!searchBox || !searchList) return;
    if (PAGE.search === "global") {
      searchBox.addEventListener("input", function () {
        var q = searchBox.value.trim();
        if (!q) { searchList.classList.remove("show"); searchList.innerHTML = ""; return; }
        if (!INDEX_READY && !renderPending) { renderPending = q; fetchGlobalIndex(function () { var p = renderPending; renderPending = null; renderResults(p); }); }
        else if (INDEX_READY) renderResults(q);
      });
      var q0 = new URLSearchParams(location.search).get("q");
      if (q0) { searchBox.value = q0; fetchGlobalIndex(function () { renderResults(q0); }); }
    } else {
      buildLocalIndex();
      var timer = null;
      searchBox.addEventListener("input", function () {
        clearTimeout(timer);
        timer = setTimeout(function () { renderResults(searchBox.value.trim()); }, 120);
      });
    }
    searchBox.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        var first = searchList.querySelector(".search-item");
        if (first) { jumpTo({ id: first.getAttribute("data-id"), file: first.getAttribute("data-file") }); searchList.classList.remove("show"); }
      }
      if (e.key === "Escape") searchList.classList.remove("show");
    });
    searchList.addEventListener("click", function (e) {
      var item = e.target.closest(".search-item");
      if (item) { jumpTo({ id: item.getAttribute("data-id"), file: item.getAttribute("data-file") }); searchList.classList.remove("show"); searchBox.blur(); }
    });
    document.addEventListener("click", function (e) {
      if (!e.target.closest(".search-wrap")) searchList.classList.remove("show");
    });
  }

  /* ================= 5. 筛选器（真题/力扣，按元素存在性自动启用） ================= */
  function wireExamFilter() {
    var examBar = $("#examBar");
    if (!examBar) return;
    var exType = "all", exCh = "all";
    var eCnt = $("#examCount");
    var eBtns = $$(".fbtn", examBar);
    function apply() {
      var shown = 0, total = 0;
      $$(".prob").forEach(function (p) {
        total++;
        var okT = exType === "all" || p.getAttribute("data-type") === exType;
        var okC = exCh === "all" || p.getAttribute("data-ch") === exCh;
        p.classList.toggle("hide", !(okT && okC));
        if (okT && okC) shown++;
      });
      if (eCnt) eCnt.textContent = "当前显示 " + shown + " / " + total + " 题";
    }
    eBtns.forEach(function (b) {
      b.addEventListener("click", function () {
        var f = b.getAttribute("data-f") || "";
        if (f === "all") { exType = "all"; exCh = "all"; }
        else if (f.charAt(0) === "t") exType = f.slice(2);
        else if (f.charAt(0) === "c") exCh = f.slice(2);
        eBtns.forEach(function (x) {
          var fx = x.getAttribute("data-f") || "";
          var on = fx === "all" ? (exType === "all" && exCh === "all")
            : fx.charAt(0) === "t" ? fx.slice(2) === exType
            : fx.slice(2) === exCh;
          x.classList.toggle("active", on);
        });
        apply();
      });
    });
    apply();
  }
  function wireLcFilter() {
    var lcCount = $("#lcCount");
    var fbtns = $$(".lcbar .fbtn");
    if (!fbtns.length || !lcCount) return;
    var filter = "all";
    function apply() {
      var shown = 0, total = 0;
      $$(".prob").forEach(function (p) {
        total++;
        var show = filter === "all" || p.getAttribute("data-diff") === filter;
        p.classList.toggle("hide", !show);
        if (show) shown++;
      });
      lcCount.textContent = "当前显示 " + shown + " / " + total + " 题";
    }
    fbtns.forEach(function (b) {
      b.addEventListener("click", function () {
        fbtns.forEach(function (x) { x.classList.remove("active"); });
        b.classList.add("active");
        filter = b.getAttribute("data-f");
        apply();
      });
    });
    apply();
  }

  /* ================= 6. 速查卡（注入所有页面，链接跨页跳转） ================= */
  var CHEAT_LINKS = [
    ["wd-c2s6", "链表插删"], ["wd-c3s9", "表达式求值"], ["wd-c4s5", "KMP的next"],
    ["wd-c5s15", "哈夫曼树"], ["wd-c6s10", "Dijkstra"], ["wd-c7s3", "折半查找"],
    ["wd-c8s5", "快排"], ["c-l26", "L26不考清单"], ["ex-overview", "期末真题总览"]
  ];
  function injectCheat() {
    if ($("#cheatPanel")) return;
    var fab = document.createElement("button");
    fab.className = "cheat-fab"; fab.id = "cheatFab"; fab.textContent = "📋 速查卡";
    var panel = document.createElement("div");
    panel.className = "cheat-panel"; panel.id = "cheatPanel";
    var quick = CHEAT_LINKS.map(function (p) {
      return '<a href="' + hrefFor(p[0]) + '">' + p[1] + "</a>";
    }).join(" · ");
    panel.innerHTML =
      '<button class="cheat-close" id="cheatClose">✕</button>' +
      '<h4>⚡ 复杂度速查</h4><table>' +
      "<tr><th>结构/算法</th><th>查找</th><th>插入/删除</th></tr>" +
      "<tr><td>顺序表</td><td>O(n)/按位O(1)</td><td>O(n)</td></tr>" +
      "<tr><td>单/双链表</td><td>O(n)</td><td>已知结点O(1)</td></tr>" +
      "<tr><td>折半查找</td><td>O(log₂n)</td><td>—</td></tr>" +
      "<tr><td>平衡BST</td><td>O(log₂n)</td><td>O(log₂n)</td></tr>" +
      "<tr><td>哈希表</td><td>O(1)均摊</td><td>O(1)均摊</td></tr></table>" +
      '<h4>🔢 排序对比</h4><table>' +
      "<tr><th>算法</th><th>平均</th><th>最坏</th><th>空间</th><th>稳定</th></tr>" +
      "<tr><td>冒泡/插入</td><td>O(n²)</td><td>O(n²)</td><td>O(1)</td><td>✔</td></tr>" +
      "<tr><td>希尔</td><td>≈O(n^1.3)</td><td>O(n²)</td><td>O(1)</td><td>✘</td></tr>" +
      "<tr><td>快排</td><td>O(nlog₂n)</td><td>O(n²)</td><td>O(log₂n)</td><td>✘</td></tr>" +
      "<tr><td>堆排</td><td>O(nlog₂n)</td><td>O(nlog₂n)</td><td>O(1)</td><td>✘</td></tr>" +
      "<tr><td>归并</td><td>O(nlog₂n)</td><td>O(nlog₂n)</td><td>O(n)</td><td>✔</td></tr>" +
      "<tr><td>基数</td><td>O(d(n+r))</td><td>O(d(n+r))</td><td>O(r)</td><td>✔</td></tr></table>" +
      "<h4>📐 必背公式</h4>" +
      '<div class="cline">· n₀ = n₂ + 1 ｜ 满二叉树 2ʰ−1 ｜ 完全二叉树高 ⌈log₂(n+1)⌉</div>' +
      '<div class="cline">· 循环队列元素数 (rear−front+MaxSize) % MaxSize</div>' +
      '<div class="cline">· 完全无向图边 n(n−1)/2 ｜ 邻接表无向 2e 条边结点</div>' +
      '<div class="cline">· KMP next[j]：最长相等前后缀；折半 ⌊(low+high)/2⌋</div>' +
      '<h4>🧭 快速跳转</h4><div class="cline">' + quick + "</div>";
    document.body.appendChild(fab);
    document.body.appendChild(panel);
    fab.addEventListener("click", function () { panel.classList.toggle("show"); });
    panel.querySelector("#cheatClose").addEventListener("click", function () { panel.classList.remove("show"); });
    panel.addEventListener("click", function (e) { if (e.target.closest("a")) panel.classList.remove("show"); });
  }

  /* ================= 7. 回到顶部 ================= */
  function wireBacktop() {
    var backtop = $("#backtop");
    if (!backtop) return;
    var shown = false;
    window.addEventListener("scroll", function () {
      var s = window.scrollY > 480;
      if (s !== shown) { shown = s; backtop.style.display = s ? "block" : "none"; }
    });
    backtop.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: "smooth" }); });
  }

  /* ================= 8. 「已学」标记 + 侧栏进度（接 Checkin） ================= */
  function refreshMarks() {
    $$(".mark-btn").forEach(function (b) {
      var on = window.Checkin.isRead(PAGE.page, b.getAttribute("data-sec"));
      b.classList.toggle("done", on);
      b.textContent = on ? "✓ 已学" : "◻ 已学";
    });
    refreshSideProgress();
  }
  function refreshSideProgress() {
    if (!window.MANIFEST) return;
    NAV.parts.forEach(function (part) {
      var meta = window.MANIFEST.pages[part.file];
      if (!meta) return;
      var el = document.querySelector('[data-sidecnt="' + part.file + '"]');
      if (el) el.textContent = Checkin.countRead(part.file) + "/" + meta.ids.length;
    });
  }
  function injectMarks() {
    if (PAGE.page === "home" || PAGE.page === "progress") return;
    $$(".sec > h3").forEach(function (h3) {
      var sec = h3.closest(".sec");
      if (!sec || !sec.id || $(".mark-btn", h3)) return;
      var b = document.createElement("button");
      b.className = "mark-btn"; b.setAttribute("data-sec", sec.id);
      b.addEventListener("click", function () { Checkin.toggleRead(PAGE.page, sec.id); });
      h3.appendChild(b);
    });
    $$(".prob .prob-head").forEach(function (ph) {
      var prob = ph.closest(".prob");
      if (!prob || !prob.id || $(".mark-btn", ph)) return;
      var b = document.createElement("button");
      b.className = "mark-btn"; b.setAttribute("data-sec", prob.id);
      b.addEventListener("click", function () { Checkin.toggleRead(PAGE.page, prob.id); });
      ph.appendChild(b);
    });
  }
  function wireSideProgressMeta() {
    // 侧栏每个模块标题旁显示 已学/总数
    NAV.parts.forEach(function (part) {
      var pd = $$(".nav-part").find(function (el) { return el.textContent === part.t; });
      if (!pd) return;
      var sp = document.createElement("span");
      sp.className = "side-cnt";
      sp.setAttribute("data-sidecnt", part.file);
      sp.textContent = "";
      pd.appendChild(sp);
    });
  }

  /* ================= 9. 进度页（日历 + 模块进度条） ================= */
  function initProgressPage() {
    if (PAGE.page !== "progress" || !window.Checkin) return;
    var calTitle = $("#calTitle"), calGrid = $("#calendar");
    var view = new Date(); view.setDate(1);
    function renderCal() {
      var y = view.getFullYear(), m = view.getMonth();
      calTitle.textContent = y + " 年 " + (m + 1) + " 月";
      var first = new Date(y, m, 1).getDay();
      var dim = new Date(y, m + 1, 0).getDate();
      var set = {};
      Checkin.monthDays(y, m).forEach(function (d) { set[d] = 1; });
      var tstr = Checkin.todayStr();
      var html = "";
      "日一二三四五六".split("").forEach(function (w) { html += '<div class="cal-w">' + w + "</div>"; });
      for (var i = 0; i < first; i++) html += "<div></div>";
      for (var d = 1; d <= dim; d++) {
        var ds = Checkin.dayStr(y, m, d);
        var cls = "cal-d" + (set[ds] ? " on" : "") + (ds === tstr ? " today" : "");
        html += '<div class="' + cls + '" data-d="' + ds + '">' + d + "</div>";
      }
      calGrid.innerHTML = html;
      $$(".cal-d", calGrid).forEach(function (cell) {
        cell.addEventListener("click", function () { Checkin.toggleDay(cell.getAttribute("data-d")); });
      });
    }
    function renderStats() {
      $("#streakNum").textContent = Checkin.streak();
      $("#totalNum").textContent = Checkin.totalDays();
      var btn = $("#todayBtn"), t = Checkin.todayStr();
      var on = Checkin.isDay(t);
      btn.classList.toggle("done", on);
      btn.textContent = on ? "✅ 今日已打卡（点击取消）" : "✅ 今日打卡";
      $("#modeBadge").innerHTML = Checkin.cloudOn
        ? "☁️ 云端同步已启用（Supabase）——换设备登录同一浏览器或配置同设备ID即可同步"
        : "💾 本地模式：打卡与进度保存在本浏览器 localStorage；配置 assets/checkin.js 顶部的 Supabase URL/Key 后可云端同步";
    }
    function renderBars() {
      var host = $("#partBars");
      if (!host || !window.MANIFEST) return;
      host.innerHTML = NAV.parts.map(function (part) {
        var meta = window.MANIFEST.pages[part.file] || { ids: [], title: part.t };
        var c = Checkin.countRead(part.file), n = meta.ids.length;
        var pct = n ? Math.round(c / n * 100) : 0;
        return '<div class="pbar-row"><div class="pbar-t"><a href="' + part.file + '.html">' + esc(part.t) +
          '</a><span>' + c + " / " + n + "（" + pct + "%）</span></div>" +
          '<div class="pbar"><i style="width:' + pct + '%"></i></div></div>';
      }).join("");
    }
    $("#prevM").addEventListener("click", function () { view.setMonth(view.getMonth() - 1); renderCal(); });
    $("#nextM").addEventListener("click", function () { view.setMonth(view.getMonth() + 1); renderCal(); });
    $("#todayBtn").addEventListener("click", function () { Checkin.toggleDay(Checkin.todayStr()); });
    function renderAll() { renderStats(); renderCal(); renderBars(); refreshSideProgress(); }
    Checkin.onChange(renderAll);
    document.addEventListener("manifest:ready", renderAll);
    renderAll();
  }

  /* ================= 10. 首页打卡小组件 ================= */
  function initHomeWidget() {
    if (PAGE.page !== "index" || !window.Checkin) return;
    var btn = $("#h_todayBtn");
    if (!btn) return;
    function render() {
      var on = Checkin.isDay(Checkin.todayStr());
      btn.classList.toggle("done", on);
      btn.textContent = on ? "✅ 今日已打卡" : "✅ 今日打卡";
      $("#h_streak").textContent = Checkin.streak();
      $("#h_total").textContent = Checkin.totalDays();
    }
    btn.addEventListener("click", function () { Checkin.toggleDay(Checkin.todayStr()); });
    Checkin.onChange(render);
    render();
  }

  /* ================= 启动 ================= */
  document.addEventListener("DOMContentLoaded", function () {
    renderSideBadge();
    renderNav();
    wireSideProgressMeta();
    wireTheme();
    initSpy();
    initCode();
    wireSearch();
    wireExamFilter();
    wireLcFilter();
    injectCheat();
    wireBacktop();
    injectMarks();
    refreshMarks();
    initProgressPage();
    initHomeWidget();
    if (window.Checkin) Checkin.onChange(refreshMarks);
    // 全站加载可标记清单：侧栏「已学/总数」计数 + 进度条数据源
    fetch("assets/manifest.json").then(function (r) { return r.json(); }).then(function (m) {
      window.MANIFEST = m;
      refreshSideProgress();
      document.dispatchEvent(new Event("manifest:ready"));
    }).catch(function () {});
  });
})();
