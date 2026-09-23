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
  function cap(frames) { return frames.slice(0, 22); }

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
    var base = [8, 5, 11, 2, 9, 4];
    var frames = [F("表长 6：[8,5,11,2,9,4]。在位序 3 插入 3，对应 for(j=length; j>=i; j--)。", lineNo(code, /for\s*\(/), { kind: "array", cells: base.map(String), focus: "插入前" })];
    var cur = base.slice();
    cur.push("");
    for (var j = 6; j >= 3; j--) {
      frames.push(F("j=" + j + "，准备执行 data[" + j + "]=data[" + (j - 1) + "]，源是 " + cur[j - 1], shift, { kind: "array", cells: cur.map(String), hl: [j - 1], move: { from: j - 1, to: j } }));
      cur[j] = cur[j - 1];
      frames.push(F("data[" + j + "] 已经写成 " + cur[j] + "。必须从后往前，否则会盖掉还没搬走的数。", shift, { kind: "array", cells: cur.map(String), hl: [j], done: [j] }));
    }
    cur[2] = 3;
    frames.push(F("腾出的下标 2（位序 3）写入 e=3。", put, { kind: "array", cells: cur.map(String), hl: [2] }));
    frames.push(F("length++，长度变成 7：[8,5,3,11,2,9,4]。", inc, { kind: "array", cells: cur.map(String), done: [2] }));
    frames.push(F("接着删除位序 3。先 e = data[2]，把 3 带走。", save, { kind: "array", cells: cur.map(String), hl: [2] }));
    for (var j2 = 3; j2 < cur.length; j2++) {
      frames.push(F("j=" + j2 + "，data[" + (j2 - 1) + "]=data[" + j2 + "]，" + cur[j2] + " 前移。", pull, { kind: "array", cells: cur.map(String), hl: [j2], move: { from: j2, to: j2 - 1 } }));
      cur[j2 - 1] = cur[j2];
    }
    cur.pop();
    frames.push(F("length--，逻辑长度回到 6：[8,5,11,2,9,4]。", dec, { kind: "array", cells: cur.map(String) }));
    return frames;
  }

  function listInsert(code) {
    var scan = lineNo(code, /p\s*=\s*p->next|p=p->next/);
    var link1 = lineNo(code, /->next\s*=\s*\w+->next/);
    var link2 = lineNo(code, /->next\s*=\s*s/);
    var H = { id: "H", v: "头", head: true };
    var a = { id: "a", v: "10" }, b = { id: "b", v: "16" }, c = { id: "c", v: "27" };
    var s = { id: "s", v: "8", tag: "new" };
    var chain = [H, a, b, c];
    var edges0 = [{ from: "H", to: "a" }, { from: "a", to: "b" }, { from: "b", to: "c" }];
    return [
      F("带头结点。要在位序 i=2 插入 8。开始 p=L，j=0，p 停在头结点。", lineNo(code, /p\s*=\s*L/), { kind: "list", nodes: chain, edges: edges0, ptrs: [{ name: "L", id: "H" }, { name: "p", id: "H" }] }),
      F("while 里 j<i-1，p 沿 next 走到 10，j 变成 1。这就是第 i-1 个结点。", scan, { kind: "list", nodes: chain, edges: edges0, ptrs: [{ name: "L", id: "H" }, { name: "p", id: "a" }], hl: ["a"] }),
      F("malloc 出 s，s->data=8。s 还没进链，原来的 10→16 还在。", lineNo(code, /s->data|->data\s*=\s*e/), { kind: "list", nodes: chain.concat([s]), edges: edges0, ptrs: [{ name: "p", id: "a" }, { name: "s", id: "s" }], hl: ["s"] }),
      F("先写 s->next = p->next。s 接到 16。若先改 p->next，16 就丢了。", link1, { kind: "list", nodes: chain.concat([s]), edges: edges0.concat([{ from: "s", to: "b", style: "new" }]), ptrs: [{ name: "p", id: "a" }, { name: "s", id: "s" }], hl: ["s", "b"] }),
      F("再写 p->next = s。10 改指向 8，8 再指向 16。", link2, { kind: "list", nodes: [H, a, s, b, c], edges: [{ from: "H", to: "a" }, { from: "a", to: "s", style: "new" }, { from: "s", to: "b" }, { from: "b", to: "c" }], ptrs: [{ name: "p", id: "a" }, { name: "s", id: "s" }], hl: ["a", "s"] }),
      F("插入完成：头 → 10 → 8 → 16 → 27。", link2, { kind: "list", nodes: [H, a, { id: "s", v: "8" }, b, c], edges: [{ from: "H", to: "a" }, { from: "a", to: "s" }, { from: "s", to: "b" }, { from: "b", to: "c" }] })
    ];
  }

  function listBuild(code) {
    var tailLink = lineNo(code, /r->next\s*=\s*s|r->next=s/);
    var tailMove = lineNo(code, /r\s*=\s*s/);
    var headLink = lineNo(code, /s->next\s*=\s*L->next|s->next=L->next/);
    var headHang = lineNo(code, /L->next\s*=\s*s|L->next=s/);
    var H = { id: "H", v: "头", head: true };
    function tail(vals, rId) {
      var nodes = [H];
      var edges = [];
      var prev = "H";
      vals.forEach(function (v, i) {
        var id = "t" + i;
        nodes.push({ id: id, v: String(v) });
        edges.push({ from: prev, to: id });
        prev = id;
      });
      return { nodes: nodes, edges: edges, ptrs: [{ name: "r", id: rId }] };
    }
    var t0 = tail([], "H");
    var t1 = tail([10], "t0");
    var t2 = tail([10, 16], "t1");
    var t3 = tail([10, 16, 27], "t2");
    function head(vals) {
      var nodes = [H];
      var edges = [];
      vals.forEach(function (v, i) { nodes.push({ id: "h" + i, v: String(v) }); });
      if (vals.length) edges.push({ from: "H", to: "h0" });
      for (var i = 0; i < vals.length - 1; i++) edges.push({ from: "h" + i, to: "h" + (i + 1) });
      return { nodes: nodes, edges: edges, ptrs: [{ name: "L", id: "H" }] };
    }
    return [
      F("尾插：r 先指着头结点。输入 10、16、27，9999 结束。", lineNo(code, /r\s*=\s*L/), { kind: "list", nodes: t0.nodes, edges: t0.edges, ptrs: t0.ptrs }),
      F("10 挂到 r 后面，再 r=s，r 改指 10。", tailMove, Object.assign({ kind: "list" }, t1)),
      F("16 挂到当前表尾 10 后面，r 再后移。", tailLink, Object.assign({ kind: "list" }, t2)),
      F("27 同样后插。尾插得到 10→16→27，和输入顺序一样。", tailMove, Object.assign({ kind: "list" }, t3)),
      F("头插另起一表。先 L->next=NULL，否则第一结点会接上脏指针。", lineNo(code, /L->next\s*=\s*NULL|next\s*=\s*NULL/), { kind: "list", nodes: [H], edges: [], ptrs: [{ name: "L", id: "H" }] }),
      F("输入 10：s->next=L->next（空），再 L->next=s。", headHang, Object.assign({ kind: "list" }, head([10]))),
      F("输入 16：新结点插到头结点后面，next 指向原来的 10。", headLink, Object.assign({ kind: "list" }, head([16, 10]))),
      F("输入 27 再插到最前。头插得到 27→16→10，顺序和输入相反。", headHang, Object.assign({ kind: "list" }, head([27, 16, 10])))
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
    var cmp = lineNo(code, /A\[j\s*-\s*1\]\s*>\s*A\[j\]|a\[j\s*-\s*1\]|>/);
    var sw = lineNo(code, /swap\s*\(/);
    var a = [49, 38, 65, 97, 76, 13, 27, 49];
    var frames = [F("王道这组数：49 38 65 97 76 13 27 49。代码从后往前扫，只有 A[j-1] > A[j] 才交换。", cmp, { kind: "bars", vals: a.slice() })];
    var n = a.length;
    for (var i = 0; i < n - 1; i++) {
      if (frames.length > 28) break;
      var flag = false, complete = true;
      for (var j = n - 1; j > i; j--) {
        if (frames.length > 28) { complete = false; break; }
        var left = a[j - 1], right = a[j];
        if (left > right) {
          frames.push(F("j=" + j + "，比较下标 " + (j - 1) + " 和 " + j + "：" + left + " > " + right + "，进入 swap。", cmp, { kind: "bars", vals: a.slice(), hl: [j - 1, j], tag: left + " > " + right + "  要交换" }));
          var t = a[j - 1]; a[j - 1] = a[j]; a[j] = t; flag = true;
          frames.push(F("swap 用 temp 交换后，这一对变成 " + a[j - 1] + " , " + a[j] + "。", sw, { kind: "bars", vals: a.slice(), hl: [j - 1, j], tag: "交换完成" }));
        } else {
          frames.push(F("j=" + j + "，" + left + " ≤ " + right + "，if 不成立，这一对不动。", cmp, { kind: "bars", vals: a.slice(), hl: [j - 1, j], tag: left + " ≤ " + right + "  不交换" }));
        }
      }
      if (!complete) break;
      frames.push(F("第 " + (i + 1) + " 趟走完。下标 " + i + " 固定为 " + a[i] + "。" + (flag ? "有交换，还要继续。" : "本趟没有交换，flag 仍是 false，函数 return。"), lineNo(code, /flag\s*==\s*false|return/), { kind: "bars", vals: a.slice(), done: range(0, i), tag: "第 " + (i + 1) + " 趟结束" }));
      if (!flag) break;
    }
    return frames;
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
  function round(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
  function label(ctx, text, x, y, color, size) {
    ctx.fillStyle = color || "#e2e8f0";
    if (size) ctx.font = size + ' system-ui,"Segoe UI","Microsoft YaHei",sans-serif';
    ctx.fillText(String(text), x, y);
    ctx.font = '14px system-ui,"Segoe UI","Microsoft YaHei",sans-serif';
  }
  function box(ctx, x, y, w, h, fill) {
    ctx.fillStyle = fill;
    round(ctx, x, y, w, h, 6);
    ctx.fill();
  }
  function arrow(ctx, x1, y1, x2, y2, color) {
    var ang = Math.atan2(y2 - y1, x2 - x1);
    var len = Math.hypot(x2 - x1, y2 - y1);
    if (len < 6) return;
    ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 1.8;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - 8 * Math.cos(ang - 0.45), y2 - 8 * Math.sin(ang - 0.45));
    ctx.lineTo(x2 - 8 * Math.cos(ang + 0.45), y2 - 8 * Math.sin(ang + 0.45));
    ctx.closePath(); ctx.fill();
  }
  function drawArray(ctx, f, w, h) {
    var cells = f.cells || [];
    var n = Math.max(cells.length, 1);
    var bw = Math.min(58, (w - 36) / n - 8);
    var gap = 8;
    var total = n * bw + (n - 1) * gap;
    var x0 = (w - total) / 2, y = h / 2 - 8;
    var xs = [];
    cells.forEach(function (c, i) {
      var x = x0 + i * (bw + gap);
      xs.push(x);
      var on = has(f.hl, i), done = has(f.done, i), empty = c === "";
      ctx.fillStyle = on ? "#f59e0b" : done ? "#166534" : "#1e293b";
      ctx.strokeStyle = empty ? "#64748b" : on ? "#fde68a" : "#334155";
      ctx.setLineDash(empty ? [4, 3] : []);
      round(ctx, x, y, bw, 40, 8); ctx.fill(); ctx.stroke();
      ctx.setLineDash([]);
      label(ctx, empty ? "" : c, x + bw / 2, y + 20, on ? "#111827" : "#f8fafc", "16px");
      label(ctx, "位" + (i + 1), x + bw / 2, y - 16, "#93c5fd", "11px");
      label(ctx, "下标" + i, x + bw / 2, y + 56, "#94a3b8", "11px");
    });
    if (f.move && xs[f.move.from] != null && xs[f.move.to] != null) {
      var yA = y - 28;
      arrow(ctx, xs[f.move.from] + bw / 2, yA, xs[f.move.to] + bw / 2, yA, "#fb7185");
    }
    if (f.tag) label(ctx, f.tag, w / 2, h - 14, "#fde68a", "13px");
  }
  function drawBars(ctx, f, w, h) {
    var vals = f.vals || [];
    var n = Math.max(vals.length, 1);
    var max = Math.max.apply(null, vals.concat([1]));
    var bw = Math.min(42, (w - 28) / n - 8);
    var gap = 8;
    var total = n * bw + (n - 1) * gap;
    var x0 = (w - total) / 2;
    vals.forEach(function (v, i) {
      var bh = Math.max(10, (h - 78) * (v / max));
      var x = x0 + i * (bw + gap);
      var y = h - 36 - bh;
      var fill = f.pivot === i ? "#38bdf8" : has(f.hl, i) ? "#f59e0b" : has(f.done, i) ? "#22c55e" : "#334155";
      round(ctx, x, y, bw, bh, 5); ctx.fillStyle = fill; ctx.fill();
      label(ctx, v, x + bw / 2, y - 12, "#f8fafc", "13px");
      label(ctx, i, x + bw / 2, h - 16, has(f.done, i) ? "#86efac" : "#94a3b8", "11px");
    });
    if (f.tag) label(ctx, f.tag, w / 2, 16, "#fde68a", "13px");
  }
  function drawList(ctx, f, w, h) {
    var nodes = f.nodes || [];
    if (!nodes.length) return;
    if (!nodes[0].id) {
      nodes = nodes.map(function (n, i) { return { id: "n" + i, v: n.v, head: n.head, tag: n.tag }; });
      f = Object.assign({}, f, { nodes: nodes, edges: nodes.slice(0, -1).map(function (_, i) { return { from: "n" + i, to: "n" + (i + 1) }; }) });
    }
    var bw = 54, bh = 36, gap = 36;
    var total = nodes.length * bw + (nodes.length - 1) * gap;
    var x0 = Math.max(16, (w - total) / 2);
    var y = h / 2 - 6;
    var pos = {};
    nodes.forEach(function (n, i) { pos[n.id] = { x: x0 + i * (bw + gap), y: n.tag === "new" ? y - 58 : y }; });
    (f.edges || []).forEach(function (e) {
      var a = pos[e.from], b = pos[e.to];
      if (!a || !b) return;
      var color = e.style === "new" ? "#f472b6" : "#94a3b8";
      arrow(ctx, a.x + bw, a.y + bh / 2, b.x, b.y + bh / 2, color);
    });
    nodes.forEach(function (n) {
      var p = pos[n.id];
      var on = has(f.hl, n.id);
      ctx.fillStyle = n.head ? "#1e3a5f" : on ? "#f59e0b" : n.tag === "new" ? "#4c1d95" : "#1e293b";
      ctx.strokeStyle = on ? "#fde68a" : "#475569";
      round(ctx, p.x, p.y, bw, bh, 7); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(p.x + bw * 0.62, p.y); ctx.lineTo(p.x + bw * 0.62, p.y + bh); ctx.stroke();
      label(ctx, n.v, p.x + bw * 0.31, p.y + bh / 2, on ? "#111827" : "#f8fafc", "14px");
      label(ctx, "next", p.x + bw * 0.82, p.y + bh / 2, "#94a3b8", "10px");
    });
    (f.ptrs || []).forEach(function (p) {
      var at = pos[p.id];
      if (!at) return;
      label(ctx, p.name, at.x + bw / 2, at.y - 14, "#7dd3fc", "13px");
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
      }, 1200);
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
