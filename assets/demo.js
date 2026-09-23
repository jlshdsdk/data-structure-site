/* 给站内每一段既有代码配分步演示。不改代码原文，只按它的语句往下走。 */
(function () {
  function linesOf(code) { return code.replace(/\n$/, "").split("\n"); }
  function lineNo(code, re) {
    var ls = linesOf(code);
    for (var i = 0; i < ls.length; i++) if (re.test(ls[i])) return i + 1;
    return 1;
  }
  function F(note, line, extra) {
    var o = { note: note, line: line || 1 };
    if (extra) for (var k in extra) o[k] = extra[k];
    return o;
  }
  function cap(frames) { return frames.slice(0, 16); }

  function fallback(code) {
    var ls = linesOf(code);
    var frames = [];
    for (var i = 0; i < ls.length; i++) {
      var t = ls[i].trim();
      if (!t || t === "{" || t === "}" || /^\/\//.test(t) || /^\/\*/.test(t) || /^\*/.test(t)) continue;
      frames.push(F(t, i + 1, { kind: "text", lines: [t], cur: 0 }));
      if (frames.length >= 12) break;
    }
    if (!frames.length) frames.push(F(ls[0] || "空代码", 1, { kind: "text", lines: ["这段代码没有可执行语句"], cur: 0 }));
    return frames;
  }

  function seqEdit(code) {
    var shift = lineNo(code, /data\[j\]\s*=\s*\w+\.data\[j\s*-\s*1\]/);
    var put = lineNo(code, /data\[i\s*-\s*1\]\s*=\s*e/);
    var inc = lineNo(code, /length\+\+/);
    var save = lineNo(code, /=\s*\w+\.data\[i\s*-\s*1\]/);
    var pull = lineNo(code, /data\[j\s*-\s*1\]\s*=\s*\w+\.data\[j\]/);
    var dec = lineNo(code, /length--/);
    var cells = ["12", "7", "9", "4"];
    var frames = [F("按 ListInsert：位序 i=2，插入 5。先看后移循环。", shift, { kind: "array", cells: cells.slice() })];
    var cur = cells.slice();
    cur.push(cur[3]);
    frames.push(F("j 从 length 往前：data[4] = data[3]", shift, { kind: "array", cells: cur.slice(), hl: [4] }));
    cur[3] = cur[2];
    frames.push(F("data[3] = data[2]，9 后移", shift, { kind: "array", cells: cur.slice(), hl: [3] }));
    cur[2] = cur[1];
    frames.push(F("data[2] = data[1]，7 后移", shift, { kind: "array", cells: cur.slice(), hl: [2] }));
    cur[1] = "5";
    frames.push(F("空出的位序 2 写入 e", put, { kind: "array", cells: cur.slice(), hl: [1] }));
    frames.push(F("length++，得到 [12,5,7,9,4]", inc, { kind: "array", cells: cur.slice(), done: [1] }));
    var d = ["12", "5", "7", "9", "4"];
    frames.push(F("接 ListDelete，位序 i=4，e 先带走 9", save, { kind: "array", cells: d.slice(), hl: [3] }));
    d = ["12", "5", "7", "4", "4"];
    frames.push(F("data[j-1] = data[j]，后面的元素前移", pull, { kind: "array", cells: d.slice(), hl: [3] }));
    frames.push(F("length--，逻辑上是 [12,5,7,4]", dec, { kind: "array", cells: ["12", "5", "7", "4"] }));
    return frames;
  }

  function listInsert(code) {
    var a = lineNo(code, /->next\s*=\s*\w+->next/);
    var b = lineNo(code, /->next\s*=\s*s/);
    var nodes = [{ v: "1" }, { v: "2" }, { v: "4" }];
    return [
      F("链是 1→2→4，要在 p（值为 2）后面插入 3", a, { kind: "list", nodes: nodes.slice() }),
      F("先让新结点 s 的 next 指向 p 原来的后继 4", a, { kind: "list", nodes: [{ v: "1" }, { v: "2" }, { v: "3", tag: "new" }, { v: "4" }], hl: [2] }),
      F("再让 p 的 next 指向 s。顺序反了会把后继弄丢", b, { kind: "list", nodes: [{ v: "1" }, { v: "2" }, { v: "3" }, { v: "4" }], hl: [2] })
    ];
  }

  function listBuild(code) {
    var head = lineNo(code, /头插|s->next\s*=\s*L->next|s->next=L->next/);
    var tail = lineNo(code, /尾插|r->next\s*=\s*s|r->next=s/);
    return [
      F("头插法：依次来 1、2、3，每次插到头结点后面", head, { kind: "list", nodes: [{ v: "1" }] }),
      F("2 插到最前", head, { kind: "list", nodes: [{ v: "2", tag: "new" }, { v: "1" }], hl: [0] }),
      F("3 再插到最前，头插结果是 3→2→1", head, { kind: "list", nodes: [{ v: "3" }, { v: "2" }, { v: "1" }] }),
      F("尾插法从空表开始，r 一直指向表尾", tail, { kind: "list", nodes: [{ v: "1" }] }),
      F("2 接到尾后", tail, { kind: "list", nodes: [{ v: "1" }, { v: "2", tag: "new" }], hl: [1] }),
      F("3 接到尾后，尾插结果是 1→2→3", tail, { kind: "list", nodes: [{ v: "1" }, { v: "2" }, { v: "3" }] })
    ];
  }

  function stackDemo(code) {
    var push = lineNo(code, /top\+\+|data\[.*top|Push/);
    var pop = lineNo(code, /top--|Pop|return/);
    return [
      F("空栈，top = -1", lineNo(code, /top\s*=\s*-1/), { kind: "stack", cells: [], top: -1, out: "" }),
      F("Push 7", push, { kind: "stack", cells: ["7"], top: 0, out: "" }),
      F("Push 3", push, { kind: "stack", cells: ["7", "3"], top: 1, out: "" }),
      F("Push 9", push, { kind: "stack", cells: ["7", "3", "9"], top: 2, out: "" }),
      F("Pop 得到 9，后进先出", pop, { kind: "stack", cells: ["7", "3"], top: 1, out: "9" })
    ];
  }

  function queueDemo(code) {
    var en = lineNo(code, /rear|EnQueue|入队/);
    return [
      F("循环队列 front = rear = 0，空", lineNo(code, /front/), { kind: "array", cells: ["_", "_", "_", "_"], hl: [0] }),
      F("入队 7，rear 前进一步", en, { kind: "array", cells: ["7", "_", "_", "_"], hl: [0] }),
      F("入队 3", en, { kind: "array", cells: ["7", "3", "_", "_"], hl: [1] }),
      F("入队 9", en, { kind: "array", cells: ["7", "3", "9", "_"], hl: [2] }),
      F("出队拿 7，front 前进。队满要少用一个格子", lineNo(code, /front\s*=|DeQueue|出队/), { kind: "array", cells: ["_", "3", "9", "_"], hl: [1] })
    ];
  }

  function sortFrames(code, kindName, run) {
    var mark = lineNo(code, /if\s*\(|swap|a\[j\]|A\[j\]|L\.data/);
    return run(mark);
  }

  function bubble(code) {
    var mark = lineNo(code, /if\s*\(|swap|>/);
    var a = [5, 2, 8, 1, 9, 3];
    var frames = [F("冒泡：相邻比较，逆序就交换。数组 5 2 8 1 9 3", mark, { kind: "bars", vals: a.slice(), hl: [0, 1] })];
    var n = a.length;
    for (var i = 0; i < n - 1 && frames.length < 14; i++) {
      for (var j = 0; j < n - 1 - i && frames.length < 14; j++) {
        if (a[j] > a[j + 1]) {
          var t = a[j]; a[j] = a[j + 1]; a[j + 1] = t;
          frames.push(F(a.slice().join(" ") + "  交换下标 " + j + " 和 " + (j + 1), mark, { kind: "bars", vals: a.slice(), hl: [j, j + 1] }));
        }
      }
    }
    frames.push(F("有序：" + a.join(" "), mark, { kind: "bars", vals: a.slice(), done: [0, 1, 2, 3, 4, 5] }));
    return cap(frames);
  }

  function insertSort(code) {
    var mark = lineNo(code, /while|for\s*\(|data\[/);
    var a = [5, 2, 8, 1, 9, 3];
    var frames = [F("直接插入：把当前元素插进前面已经有序的一段", mark, { kind: "bars", vals: a.slice(), hl: [1] })];
    for (var i = 1; i < a.length; i++) {
      var key = a[i], j = i - 1;
      while (j >= 0 && a[j] > key) { a[j + 1] = a[j]; j--; }
      a[j + 1] = key;
      frames.push(F("第 " + i + " 趟后 " + a.join(" "), mark, { kind: "bars", vals: a.slice(), hl: [j + 1], done: range(0, i) }));
    }
    return frames;
  }

  function selectSort(code) {
    var mark = lineNo(code, /if\s*\(|min|swap/);
    var a = [5, 2, 8, 1, 9, 3];
    var frames = [];
    for (var i = 0; i < a.length; i++) {
      var m = i;
      for (var j = i + 1; j < a.length; j++) if (a[j] < a[m]) m = j;
      var t = a[i]; a[i] = a[m]; a[m] = t;
      frames.push(F("第 " + (i + 1) + " 趟把最小的 " + a[i] + " 换到下标 " + i, mark, { kind: "bars", vals: a.slice(), hl: [i] }));
    }
    return frames;
  }

  function quick(code) {
    var mark = lineNo(code, /Partition|pivot|while/);
    var a = [5, 2, 8, 1, 9, 3];
    var frames = [];
    function rec(l, r) {
      if (l >= r || frames.length > 12) return;
      var pivot = a[l], i = l, j = r;
      while (i < j) {
        while (i < j && a[j] >= pivot) j--;
        while (i < j && a[i] <= pivot) i++;
        if (i < j) { var t = a[i]; a[i] = a[j]; a[j] = t; }
      }
      a[l] = a[i]; a[i] = pivot;
      frames.push(F("枢轴 " + pivot + " 落到下标 " + i + "：" + a.join(" "), mark, { kind: "bars", vals: a.slice(), pivot: i }));
      rec(l, i - 1); rec(i + 1, r);
    }
    rec(0, a.length - 1);
    frames.push(F("有序 " + a.join(" "), mark, { kind: "bars", vals: a.slice(), done: range(0, 5) }));
    return cap(frames);
  }

  function shell(code) {
    var mark = lineNo(code, /gap|dk|d\/|while|for/);
    var a = [5, 2, 8, 1, 9, 3];
    var frames = [];
    for (var gap = 3; gap > 0; gap = Math.floor(gap / 2) || (gap === 1 ? 0 : 1)) {
      if (gap === 0) break;
      for (var i = gap; i < a.length; i++) {
        var key = a[i], j = i;
        while (j >= gap && a[j - gap] > key) { a[j] = a[j - gap]; j -= gap; }
        a[j] = key;
      }
      frames.push(F("增量 " + gap + " 之后 " + a.join(" "), mark, { kind: "bars", vals: a.slice() }));
      if (gap === 1) break;
    }
    return frames;
  }

  function heap(code) {
    var mark = lineNo(code, /while|if\s*\(|sift|Adjust|Heap/);
    var a = [5, 2, 8, 1, 9, 3];
    function sift(n, i) {
      while (true) {
        var l = i * 2 + 1, r = l + 1, m = i;
        if (l < n && a[l] > a[m]) m = l;
        if (r < n && a[r] > a[m]) m = r;
        if (m === i) break;
        var t = a[i]; a[i] = a[m]; a[m] = t;
        i = m;
      }
    }
    var frames = [];
    for (var i = Math.floor(a.length / 2) - 1; i >= 0; i--) sift(a.length, i);
    frames.push(F("建成大根堆 " + a.join(" "), mark, { kind: "bars", vals: a.slice(), hl: [0] }));
    for (var n = a.length - 1; n > 0; n--) {
      var t = a[0]; a[0] = a[n]; a[n] = t;
      sift(n, 0);
      frames.push(F("取出堆顶后 " + a.join(" "), mark, { kind: "bars", vals: a.slice(), done: range(n, a.length - 1) }));
    }
    return cap(frames);
  }

  function merge(code) {
    var mark = lineNo(code, /Merge|while/);
    var a = [5, 2, 8, 1, 9, 3];
    var frames = [];
    function rec(l, r) {
      if (l >= r) return;
      var m = (l + r) >> 1;
      rec(l, m); rec(m + 1, r);
      var tmp = [], i = l, j = m + 1;
      while (i <= m && j <= r) tmp.push(a[i] <= a[j] ? a[i++] : a[j++]);
      while (i <= m) tmp.push(a[i++]);
      while (j <= r) tmp.push(a[j++]);
      for (var k = 0; k < tmp.length; k++) a[l + k] = tmp[k];
      if (frames.length < 12) frames.push(F("归并 [" + l + "," + r + "] → " + a.join(" "), mark, { kind: "bars", vals: a.slice(), hl: range(l, r) }));
    }
    rec(0, a.length - 1);
    return frames;
  }

  function range(a, b) { var s = []; for (var i = a; i <= b; i++) s.push(i); return s; }

  function bsearch(code) {
    var mid = lineNo(code, /mid/);
    var a = [2, 5, 8, 12, 16, 23, 38];
    var frames = [];
    var low = 0, high = a.length - 1, key = 16;
    while (low <= high && frames.length < 8) {
      var m = (low + high) >> 1;
      frames.push(F("low=" + low + " mid=" + m + " high=" + high + "，中点是 " + a[m], mid, { kind: "array", cells: a.map(String), hl: [m] }));
      if (a[m] === key) break;
      if (a[m] < key) low = m + 1; else high = m - 1;
    }
    return frames;
  }

  function seqSearch(code) {
    var mark = lineNo(code, /if\s*\(|==/);
    var a = ["4", "7", "2", "9", "1", "6"];
    var frames = [];
    for (var i = 0; i < a.length; i++) {
      frames.push(F("顺序比较下标 " + i + "，值 " + a[i] + (a[i] === "9" ? "，找到，位序 " + (i + 1) : ""), mark, { kind: "array", cells: a, hl: [i] }));
      if (a[i] === "9") break;
    }
    return frames;
  }

  function graphDemo(code, order, note) {
    var mark = lineNo(code, /visit|Visit|for\s*\(|while/);
    var nodes = [
      { id: "A", v: "A", x: 0.18, y: 0.62 },
      { id: "B", v: "B", x: 0.4, y: 0.28 },
      { id: "C", v: "C", x: 0.4, y: 0.78 },
      { id: "D", v: "D", x: 0.68, y: 0.45 },
      { id: "E", v: "E", x: 0.86, y: 0.72 }
    ];
    var edges = [
      { u: "A", v: "B", dir: false }, { u: "A", v: "C", dir: false },
      { u: "B", v: "D", dir: false }, { u: "C", v: "D", dir: false }, { u: "C", v: "E", dir: false }
    ];
    var seen = [];
    return order.map(function (id, i) {
      seen.push(id);
      return F(note + " 访问 " + id + "（" + seen.join(" ") + "）", mark, { kind: "graph", nodes: nodes, edges: edges, hl: seen.slice() });
    });
  }

  function dijkstra(code) {
    var mark = lineNo(code, /dist|if\s*\(/);
    var nodes = [
      { id: "A", v: "A", x: 0.15, y: 0.4 }, { id: "B", v: "B", x: 0.4, y: 0.22 },
      { id: "C", v: "C", x: 0.4, y: 0.72 }, { id: "D", v: "D", x: 0.68, y: 0.4 },
      { id: "E", v: "E", x: 0.88, y: 0.62 }
    ];
    var edges = [
      { u: "A", v: "B", w: "2" }, { u: "A", v: "C", w: "5" }, { u: "B", v: "C", w: "1" },
      { u: "B", v: "D", w: "4" }, { u: "C", v: "D", w: "1" }, { u: "C", v: "E", w: "3" }, { u: "D", v: "E", w: "1" }
    ];
    var steps = [["A", "0"], ["B", "2"], ["C", "3"], ["D", "4"], ["E", "5"]];
    var hl = [];
    return steps.map(function (s) {
      hl.push(s[0]);
      return F("确定 " + s[0] + " 的最短路 " + s[1] + "。负权不能用这段 Dijkstra。", mark, { kind: "graph", nodes: nodes, edges: edges, hl: hl.slice() });
    });
  }

  function floyd(code) {
    var mark = lineNo(code, /for|\[k\]|\[i\]/);
    var rows = [["0", "3", "8", "∞"], ["∞", "0", "2", "5"], ["∞", "∞", "0", "1"], ["∞", "∞", "∞", "0"]];
    return [
      F("初始距离矩阵，∞ 表示没有直接边", mark, { kind: "matrix", rows: rows, colHead: ["0", "1", "2", "3"], rowHead: ["0", "1", "2", "3"] }),
      F("k=1 时，0 经 1 到 2：3+2=5，比 8 短", mark, { kind: "matrix", rows: [["0", "3", "5", "∞"], ["∞", "0", "2", "5"], ["∞", "∞", "0", "1"], ["∞", "∞", "∞", "0"]], hl: [[0, 2]], colHead: ["0", "1", "2", "3"], rowHead: ["0", "1", "2", "3"] }),
      F("k=2 后 0 到 3 变成 5+1=6", mark, { kind: "matrix", rows: [["0", "3", "5", "6"], ["∞", "0", "2", "3"], ["∞", "∞", "0", "1"], ["∞", "∞", "∞", "0"]], hl: [[0, 3]], colHead: ["0", "1", "2", "3"], rowHead: ["0", "1", "2", "3"] })
    ];
  }

  function hashDemo(code) {
    var mark = lineNo(code, /%|hash|if\s*\(/);
    return [
      F("H(key)=key%7。先放 14", mark, { kind: "hash", buckets: [["14"], [], [], [], [], [], []], hl: { b: 0, i: 0 } }),
      F("8%7=1", mark, { kind: "hash", buckets: [["14"], ["8"], [], [], [], [], []], hl: { b: 1, i: 0 } }),
      F("21%7=0，拉链挂在 14 后面", mark, { kind: "hash", buckets: [["14", "21"], ["8"], [], [], [], [], []], hl: { b: 0, i: 1 } }),
      F("15%7=1，挂在 8 后面", mark, { kind: "hash", buckets: [["14", "21"], ["8", "15"], [], [], [], [], []], hl: { b: 1, i: 1 } }),
      F("7%7=0，链变成 14→21→7", mark, { kind: "hash", buckets: [["14", "21", "7"], ["8", "15"], [], [], [], [], []], hl: { b: 0, i: 2 } })
    ];
  }

  function kmp(code) {
    var mark = lineNo(code, /next|while|if\s*\(/);
    return [
      F("主串 ababc，模式 abc。i、j 都从开头比", mark, { kind: "text", lines: ["主串 a b a b c", "模式 a b c", "j 指向 a"], cur: 2 }),
      F("前两个相等，第三个主串 a 对不上 c", mark, { kind: "text", lines: ["主串 a b a b c", "      ↑", "模式失配，看 next"], cur: 1 }),
      F("next 把模式滑到还能接着比的位置，不用主串回退", mark, { kind: "text", lines: ["next 告诉模式该退到哪", "主串指针 i 不回退"], cur: 0 }),
      F("继续比到模式走完，匹配成功", mark, { kind: "text", lines: ["主串 a b a b c", "模式     a b c", "匹配"], cur: 2 })
    ];
  }

  function bst(code) {
    var mark = lineNo(code, /->lchild|->rchild|->left|->right|Insert|if\s*\(/);
    function node(id, v, x, y) { return { id: id, v: v, x: x, y: y }; }
    var base = [node("8", "8", 0.5, 0.22)];
    var e1 = [{ u: "8", v: "3" }, { u: "8", v: "10" }];
    return [
      F("插入 8，成为根", mark, { kind: "graph", nodes: base, edges: [], hl: ["8"] }),
      F("3 比 8 小，去左边；10 比 8 大，去右边", mark, { kind: "graph", nodes: base.concat([node("3", "3", 0.28, 0.55), node("10", "10", 0.72, 0.55)]), edges: e1, hl: ["3", "10"] }),
      F("1 和 6 都挂在 3 下面，14 挂在 10 下面", mark, { kind: "graph", nodes: base.concat([node("3", "3", 0.28, 0.48), node("10", "10", 0.74, 0.48), node("1", "1", 0.14, 0.78), node("6", "6", 0.4, 0.78), node("14", "14", 0.88, 0.78)]), edges: e1.concat([{ u: "3", v: "1" }, { u: "3", v: "6" }, { u: "10", v: "14" }]), hl: ["1", "6", "14"] }),
      F("中序就是从小到大：1 3 6 8 10 14", mark, { kind: "text", lines: ["中序 1 3 6 8 10 14", "左 < 根 < 右"], cur: 0 })
    ];
  }

  function fields(code) {
    var ls = linesOf(code);
    var frames = [];
    for (var i = 0; i < ls.length; i++) {
      var t = ls[i].trim();
      if (!t || /^\/\//.test(t)) continue;
      frames.push(F(t, i + 1, { kind: "text", lines: ls.filter(function (x) { return x.trim() && !/^\/\//.test(x.trim()); }).slice(0, 8), cur: Math.min(frames.length, 7) }));
      if (frames.length >= 8) break;
    }
    return frames.length ? frames : fallback(code);
  }

  function makeFrames(title, code) {
    var blob = title + "\n" + code;
    if (/data\[j\]\s*=\s*\w*\.?data\[j\s*-\s*1\]/.test(code) && /length--/.test(code)) return seqEdit(code);
    if (/->next\s*=\s*\w+->next/.test(code) && /插入/.test(blob)) return listInsert(code);
    if (/头插/.test(blob) && /尾插/.test(blob)) return listBuild(code);
    if (/冒泡/.test(blob)) return bubble(code);
    if (/快速排序|Partition/.test(blob)) return quick(code);
    if (/简单选择|选择排序/.test(blob)) return selectSort(code);
    if (/折半插入|二分插入/.test(blob)) return insertSort(code);
    if (/直接插入/.test(blob)) return insertSort(code);
    if (/希尔/.test(blob)) return shell(code);
    if (/堆排序|堆的插入|向下调整|建堆/.test(blob)) return heap(code);
    if (/归并/.test(blob)) return merge(code);
    if (/折半查找|二分查找/.test(blob)) return bsearch(code);
    if (/顺序查找|按值查找/.test(blob) && /for\s*\(/.test(code)) return seqSearch(code);
    if (/Dijkstra|迪杰斯特拉/.test(blob)) return dijkstra(code);
    if (/Floyd|弗洛伊德/.test(blob)) return floyd(code);
    if (/广度优先|BFS/.test(blob)) return graphDemo(code, ["A", "B", "C", "D", "E"], "BFS");
    if (/深度优先|DFS/.test(blob)) return graphDemo(code, ["A", "B", "D", "C", "E"], "DFS");
    if (/Prim|Kruskal|最小生成树/.test(blob)) return graphDemo(code, ["A", "B", "C", "D", "E"], "最小生成树生长");
    if (/拓扑/.test(blob)) return graphDemo(code, ["A", "B", "C", "D", "E"], "拓扑");
    if (/KMP|next/.test(blob)) return kmp(code);
    if (/散列|哈希|Hash/.test(blob)) return hashDemo(code);
    if (/二叉排序|二叉搜索|BST/.test(blob)) return bst(code);
    if (/Push|进栈|入栈|SqStack|链栈|链式栈/.test(blob) && /top|Push/.test(code)) return stackDemo(code);
    if (/队列|EnQueue|入队/.test(blob)) return queueDemo(code);
    if (/typedef\s+struct/.test(code) && !/for\s*\(/.test(code)) return fields(code);
    return fallback(code);
  }

  function draw(canvas, frame) {
    var ctx = canvas.getContext("2d");
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = canvas.clientWidth || 640;
    var h = canvas.clientHeight || 168;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, w, h);
    ctx.font = '14px system-ui,"Segoe UI","Microsoft YaHei",sans-serif';
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";
    var kind = frame.kind || "text";
    if (kind === "array") drawArray(ctx, frame, w, h);
    else if (kind === "bars") drawBars(ctx, frame, w, h);
    else if (kind === "list") drawList(ctx, frame, w, h);
    else if (kind === "stack") drawStack(ctx, frame, w, h);
    else if (kind === "graph") drawGraph(ctx, frame, w, h);
    else if (kind === "matrix") drawMatrix(ctx, frame, w, h);
    else if (kind === "hash") drawHash(ctx, frame, w, h);
    else drawText(ctx, frame, w, h);
  }

  function has(arr, v) { return Array.isArray(arr) && arr.indexOf(v) >= 0; }
  function box(ctx, x, y, w, h, fill) {
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.fill();
  }
  function label(ctx, text, x, y, color) {
    ctx.fillStyle = color || "#e2e8f0";
    ctx.fillText(String(text), x, y);
  }
  function drawArray(ctx, f, w, h) {
    var cells = f.cells || [];
    var n = Math.max(cells.length, 1);
    var bw = Math.min(64, (w - 24) / n - 6);
    var total = n * bw + (n - 1) * 6;
    var x = (w - total) / 2, y = h / 2 - 18;
    cells.forEach(function (c, i) {
      box(ctx, x, y, bw, 36, has(f.hl, i) ? "#f59e0b" : has(f.done, i) ? "#166534" : "#1e293b");
      label(ctx, c, x + bw / 2, y + 18, has(f.hl, i) ? "#111827" : "#e2e8f0");
      x += bw + 6;
    });
  }
  function drawBars(ctx, f, w, h) {
    var vals = f.vals || [];
    var n = Math.max(vals.length, 1);
    var max = Math.max.apply(null, vals.concat([1]));
    var bw = Math.min(36, (w - 24) / n - 6);
    var total = n * bw + (n - 1) * 6;
    var x = (w - total) / 2;
    vals.forEach(function (v, i) {
      var bh = Math.max(8, (h - 46) * (v / max));
      var y = h - 16 - bh;
      var fill = f.pivot === i ? "#38bdf8" : has(f.hl, i) ? "#f59e0b" : has(f.done, i) ? "#22c55e" : "#334155";
      box(ctx, x, y, bw, bh, fill);
      label(ctx, v, x + bw / 2, y - 10, "#e2e8f0");
      x += bw + 6;
    });
  }
  function drawList(ctx, f, w, h) {
    var nodes = f.nodes || [];
    var bw = 46, gap = 28;
    var total = nodes.length * bw + (nodes.length - 1) * gap;
    var x = Math.max(12, (w - total) / 2), y = h / 2 - 16;
    nodes.forEach(function (node, i) {
      box(ctx, x, y, bw, 32, has(f.hl, i) ? "#f59e0b" : node.tag === "new" ? "#5b21b6" : "#1e293b");
      label(ctx, node.v, x + bw / 2, y + 16, has(f.hl, i) ? "#111827" : "#e2e8f0");
      if (i < nodes.length - 1) label(ctx, "→", x + bw + gap / 2, y + 16, "#94a3b8");
      x += bw + gap;
    });
  }
  function drawStack(ctx, f, w, h) {
    var cells = f.cells || [];
    var x = w * 0.36, y = h - 28;
    cells.forEach(function (c, i) {
      box(ctx, x, y, 72, 26, i === f.top ? "#f59e0b" : "#1e293b");
      label(ctx, c, x + 36, y + 13, i === f.top ? "#111827" : "#e2e8f0");
      y -= 30;
    });
    label(ctx, "栈", x + 36, h - 12, "#94a3b8");
    if (f.out) label(ctx, "出栈 " + f.out, w * 0.72, h / 2, "#e2e8f0");
  }
  function arrow(ctx, x1, y1, x2, y2, color) {
    ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  }
  function drawGraph(ctx, f, w, h) {
    var by = {};
    (f.nodes || []).forEach(function (n) { by[n.id] = n; });
    (f.edges || []).forEach(function (e) {
      var a = by[e.u], b = by[e.v];
      if (!a || !b) return;
      arrow(ctx, a.x * w, a.y * h, b.x * w, b.y * h, e.hl ? "#f59e0b" : "#64748b");
      if (e.w) label(ctx, e.w, (a.x + b.x) * w / 2, (a.y + b.y) * h / 2 - 10, "#fde68a");
    });
    (f.nodes || []).forEach(function (n) {
      var on = has(f.hl, n.id);
      ctx.beginPath(); ctx.arc(n.x * w, n.y * h, 14, 0, Math.PI * 2);
      ctx.fillStyle = on ? "#f59e0b" : "#1e293b"; ctx.fill();
      label(ctx, n.v, n.x * w, n.y * h, on ? "#111827" : "#e2e8f0");
    });
  }
  function drawMatrix(ctx, f, w, h) {
    var rows = f.rows || [];
    var R = rows.length || 1, C = (rows[0] || []).length || 1;
    var cw = Math.min(42, (w - 36) / (C + 1)), ch = Math.min(26, (h - 16) / (R + 1));
    var ox = (w - cw * (C + 1)) / 2, oy = (h - ch * (R + 1)) / 2;
    rows.forEach(function (row, r) {
      row.forEach(function (cell, c) {
        var on = (f.hl || []).some(function (p) { return p[0] === r && p[1] === c; });
        box(ctx, ox + (c + 1) * cw, oy + (r + 1) * ch, cw - 3, ch - 3, on ? "#f59e0b" : "#1e293b");
        label(ctx, cell, ox + (c + 1) * cw + cw / 2, oy + (r + 1) * ch + ch / 2, on ? "#111827" : "#e2e8f0");
      });
    });
  }
  function drawHash(ctx, f, w, h) {
    var buckets = f.buckets || [];
    var col = Math.min(78, (w - 12) / Math.max(buckets.length, 1));
    buckets.forEach(function (chain, b) {
      label(ctx, String(b), 16 + b * col + 24, 16, "#94a3b8");
      (chain || []).forEach(function (val, k) {
        var on = f.hl && f.hl.b === b && f.hl.i === k;
        box(ctx, 8 + b * col, 28 + k * 28, 52, 22, on ? "#f59e0b" : "#1e293b");
        label(ctx, val, 8 + b * col + 26, 39 + k * 28, on ? "#111827" : "#e2e8f0");
      });
    });
  }
  function drawText(ctx, f, w, h) {
    ctx.textAlign = "left";
    (f.lines || []).forEach(function (line, i) {
      ctx.fillStyle = i === f.cur ? "#fde68a" : "#e2e8f0";
      ctx.fillText(line, 16, 28 + i * 24);
    });
  }

  function mount(pre, raw) {
    if (pre._demo) return;
    pre._demo = true;
    var frames = makeFrames(pre.getAttribute("data-t") || "", raw);
    var panel = document.createElement("div");
    panel.className = "demo-panel";
    panel.innerHTML = '<canvas></canvas><p class="demo-note"></p><div class="demo-controls"><button type="button" data-act="prev">上一步</button><button type="button" data-act="play">播放</button><button type="button" data-act="next">下一步</button><span class="demo-step"></span></div>';
    pre.parentNode.insertBefore(panel, pre);
    var canvas = panel.querySelector("canvas");
    var note = panel.querySelector(".demo-note");
    var step = panel.querySelector(".demo-step");
    var i = 0, timer = null;
    function show() {
      var f = frames[i];
      note.textContent = f.note;
      step.textContent = (i + 1) + " / " + frames.length;
      draw(canvas, f);
      pre.querySelectorAll(".c-line.on").forEach(function (el) { el.classList.remove("on"); });
      var row = pre.querySelector('.c-line[data-n="' + f.line + '"]');
      if (row) {
        row.classList.add("on");
        if (row.scrollIntoView) row.scrollIntoView({ block: "nearest", inline: "nearest" });
      }
    }
    function stop() { if (timer) clearInterval(timer); timer = null; panel.querySelector('[data-act="play"]').textContent = "播放"; }
    panel.querySelector('[data-act="prev"]').onclick = function () { stop(); i = Math.max(0, i - 1); show(); };
    panel.querySelector('[data-act="next"]').onclick = function () { stop(); i = Math.min(frames.length - 1, i + 1); show(); };
    panel.querySelector('[data-act="play"]').onclick = function (ev) {
      if (timer) { stop(); return; }
      if (i >= frames.length - 1) i = 0;
      ev.target.textContent = "暂停";
      timer = setInterval(function () {
        if (i >= frames.length - 1) { stop(); return; }
        i++; show();
      }, 900);
    };
    var started = false;
    function kick() { if (started) return; started = true; show(); }
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (ents) {
        if (ents.some(function (e) { return e.isIntersecting; })) { kick(); io.disconnect(); }
      }, { rootMargin: "160px" });
      io.observe(panel);
    } else kick();
  }

  window.DSDemo = { mount: mount, makeFrames: makeFrames };
})();
