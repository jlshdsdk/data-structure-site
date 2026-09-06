/* =====================================================================
 * checkin.js — 打卡与学习进度公共脚本（全站各页面均引入）
 * 双模式：
 *   1) 云端模式：在下方填入 Supabase 项目 URL + Anon Key 即启用，
 *      通过 Supabase REST(PostgREST) 直连，无需任何后端服务。
 *   2) 本地模式：未配置或网络失败时，自动降级为 localStorage 存储，
 *      同一浏览器的所有页面之间通过 storage 事件实时同步。
 * Supabase 建表SQL（在 Supabase SQL Editor 执行一次即可）：
 *   create table if not exists ds_state (
 *     device text primary key,
 *     data   jsonb default '{}'::jsonb,
 *     updated_at timestamptz default now());
 *   alter table ds_state enable row level security;
 *   create policy "ds_state_open" on ds_state for all using (true) with check (true);
 * ===================================================================== */
window.SUPABASE_URL  = window.SUPABASE_URL  || "";   // 例如 https://xxxx.supabase.co
window.SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY || "";

window.Checkin = (function () {
  var LS_DAYS = "ds_days";      // ["2026-09-06", ...]
  var LS_READS = "ds_reads";    // { wangdao:["wd-c1s1",...], ... }
  var LS_DEV = "ds_device_id";

  var SUPA = {
    url: (window.SUPABASE_URL || "").replace(/\/+$/, ""),
    key: window.SUPABASE_ANON_KEY || ""
  };
  var cloudOn = !!(SUPA.url && SUPA.key);

  var device = null;
  try {
    device = localStorage.getItem(LS_DEV);
    if (!device) {
      device = "dev-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
      localStorage.setItem(LS_DEV, device);
    }
  } catch (e) { device = "dev-anon"; }

  function lget(k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }
  function lset(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }

  var days = lget(LS_DAYS, []);
  var reads = lget(LS_READS, {});
  var listeners = [];
  var pushTimer = null;

  function emit() {
    for (var i = 0; i < listeners.length; i++) { try { listeners[i](); } catch (e) {} }
  }
  function onChange(fn) { listeners.push(fn); }

  function todayStr() {
    var d = new Date();
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
  }
  function pad(n) { return String(n).padStart(2, "0"); }
  function dayStr(y, m, d) { return y + "-" + pad(m + 1) + "-" + pad(d); }

  /* ---------- 本地读写 ---------- */
  function saveLocal() {
    lset(LS_DAYS, days);
    lset(LS_READS, reads);
  }
  function getRead(page) {
    return reads[page] || [];
  }
  function isRead(page, id) {
    return (reads[page] || []).indexOf(id) >= 0;
  }
  function isDay(d) { return days.indexOf(d) >= 0; }

  /* ---------- 云端同步（合并策略：集合并集） ---------- */
  function cloudHeaders() {
    return {
      apikey: SUPA.key,
      Authorization: "Bearer " + SUPA.key,
      "Content-Type": "application/json"
    };
  }
  function cloudPull() {
    if (!cloudOn) return Promise.resolve(null);
    return fetch(SUPA.url + "/rest/v1/ds_state?device=eq." + encodeURIComponent(device) + "&select=data", {
      headers: cloudHeaders()
    }).then(function (r) { return r.ok ? r.json() : null; })
      .then(function (rows) { return (rows && rows.length && rows[0].data) ? rows[0].data : null; })
      .catch(function () { return null; });
  }
  function cloudPush(data) {
    if (!cloudOn) return Promise.resolve(false);
    return fetch(SUPA.url + "/rest/v1/ds_state?on_conflict=device", {
      method: "POST",
      headers: Object.assign({ Prefer: "resolution=merge-duplicates" }, cloudHeaders()),
      body: JSON.stringify([{ device: device, data: data, updated_at: new Date().toISOString() }])
    }).then(function (r) { return r.ok; }).catch(function () { return false; });
  }
  function mergeState(a, b) {
    var out = { days: [], reads: {} };
    var dset = {}, pg, i, idset;
    (a.days || []).concat(b.days || []).forEach(function (d) { dset[d] = 1; });
    out.days = Object.keys(dset).sort();
    var pages = {};
    Object.keys(a.reads || {}).forEach(function (p) { pages[p] = 1; });
    Object.keys(b.reads || {}).forEach(function (p) { pages[p] = 1; });
    Object.keys(pages).forEach(function (p) {
      idset = {};
      ((a.reads || {})[p] || []).concat(((b.reads || {})[p] || [])).forEach(function (id) { idset[id] = 1; });
      out.reads[p] = Object.keys(idset);
    });
    return out;
  }
  function applyState(st) {
    days = st.days || [];
    reads = st.reads || {};
    saveLocal();
  }
  function schedulePush() {
    clearTimeout(pushTimer);
    pushTimer = setTimeout(function () {
      cloudPush({ days: days, reads: reads });
    }, 1500);
  }

  // 启动时云端合并拉取
  if (cloudOn) {
    cloudPull().then(function (remote) {
      if (remote) {
        var merged = mergeState({ days: days, reads: reads }, remote);
        applyState(merged);
        cloudPush(merged);
        emit();
      }
    });
  }
  // 跨标签页同步（同源 storage 事件）
  window.addEventListener("storage", function (e) {
    if (e.key === LS_DAYS || e.key === LS_READS) {
      days = lget(LS_DAYS, []);
      reads = lget(LS_READS, {});
      emit();
    }
  });

  /* ---------- 公开 API ---------- */
  function toggleDay(d) {
    d = d || todayStr();
    var i = days.indexOf(d);
    if (i >= 0) days.splice(i, 1); else days.push(d);
    days.sort();
    saveLocal();
    schedulePush();
    emit();
    return i < 0;   // true=已打卡, false=已取消
  }
  function toggleRead(page, id) {
    var arr = reads[page] || (reads[page] = []);
    var i = arr.indexOf(id);
    if (i >= 0) arr.splice(i, 1); else arr.push(id);
    saveLocal();
    schedulePush();
    emit();
    return i < 0;
  }
  function streak() {
    if (!days.length) return 0;
    var set = {}, d, cursor = new Date(), n = 0;
    days.forEach(function (x) { set[x] = 1; });
    // 今天未打卡则从昨天起算（保留连续记录）
    function ds(dt) { return dt.getFullYear() + "-" + pad(dt.getMonth() + 1) + "-" + pad(dt.getDate()); }
    if (!set[ds(cursor)]) cursor.setDate(cursor.getDate() - 1);
    while (set[ds(cursor)]) { n++; cursor.setDate(cursor.getDate() - 1); }
    return n;
  }
  function monthDays(y, m) {   // m: 0-based
    var pre = y + "-" + pad(m + 1) + "-";
    return days.filter(function (d) { return d.indexOf(pre) === 0; });
  }

  return {
    cloudOn: cloudOn,
    mode: cloudOn ? "cloud" : "local",
    todayStr: todayStr,
    dayStr: dayStr,
    getDays: function () { return days.slice(); },
    isDay: isDay,
    toggleDay: toggleDay,
    totalDays: function () { return days.length; },
    streak: streak,
    monthDays: monthDays,
    getRead: getRead,
    isRead: isRead,
    toggleRead: toggleRead,
    countRead: function (page) { return (reads[page] || []).length; },
    onChange: onChange,
    emit: emit
  };
})();
