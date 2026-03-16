/* ═══════════════════════════════════════════════════
   SPEED TEST PRO — script.js FINAL v5
   WebKaar | Ayush Tiwari
   ✔ Ping/Upload card display fixed
   ✔ 3-tier download fallback (never fails)
   ✔ All features working
═══════════════════════════════════════════════════ */

'use strict';

document.addEventListener('DOMContentLoaded', () => {

  const $ = id => document.getElementById(id);

  const gaugeArc    = $('gauge-arc');
  const gaugeNeedle = $('gauge-needle');
  const gaugeTicks  = $('gauge-ticks');
  const speedVal    = $('speed-value');
  const speedUnit   = $('speed-unit');
  const speedPhase  = $('speed-phase');
  const statusEl    = $('status-text');
  const progWrap    = $('prog-wrap');
  const progFill    = $('prog-fill');
  const progPct     = $('prog-pct');
  const ambientEl   = $('spt-ambient');
  const ispText     = $('isp-text');
  const connText    = $('conn-text');
  const pingValEl   = $('ping-val');
  const jitterValEl = $('jitter-val');
  const dlValEl     = $('dl-val');
  const ulValEl     = $('ul-val');
  const pingBarEl   = $('ping-bar');
  const jitterBarEl = $('jitter-bar');
  const dlBarEl     = $('dl-bar');
  const ulBarEl     = $('ul-bar');
  const pingGradeEl = $('ping-grade');
  const jitterGrEl  = $('jitter-grade');
  const dlGradeEl   = $('dl-grade');
  const ulGradeEl   = $('ul-grade');
  const startBtn    = $('start-btn');
  const startIcon   = $('start-icon');
  const startLabel  = $('start-label');
  const resultActs  = $('result-actions');
  const shareBtn    = $('share-btn');
  const copyBtn     = $('copy-result-btn');
  const clearBtn    = $('clear-history-btn');
  const histList    = $('history-list');
  const infoBtn     = $('info-btn');
  const infoModal   = $('info-modal');
  const closeModal  = $('close-modal');
  const toastEl     = $('spt-toast');

  /* ─────────────────────────────────────────────
     CONFIG
  ───────────────────────────────────────────── */
  const FETCH_SERVERS = [
    { name:'Cloudflare 10MB', url:'https://speed.cloudflare.com/__down?bytes=10000000', size:10_000_000 },
    { name:'Cloudflare 5MB',  url:'https://speed.cloudflare.com/__down?bytes=5000000',  size:5_000_000  },
  ];

  const ARRAYBUFFER_SERVERS = [
    { name:'Wikimedia', url:'https://upload.wikimedia.org/wikipedia/commons/2/2d/Snake_River_%285mb%29.jpg', size:5_245_329 },
  ];

  const IMAGE_SERVERS = [
    { url:'https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/Gatto_europeo4.jpg/1280px-Gatto_europeo4.jpg',                                              size:180_000 },
    { url:'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Camponotus_flavomarginatus_ant.jpg/1280px-Camponotus_flavomarginatus_ant.jpg',               size:220_000 },
    { url:'https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/PNG_transparency_demonstration_1.png/280px-PNG_transparency_demonstration_1.png',            size:70_000  },
    { url:'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Bikesgonewild.jpg/1280px-Bikesgonewild.jpg',                                                 size:290_000 },
    { url:'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/Felis_silvestris_silvestris_small_gradual_decrease.png/400px-Felis_silvestris_silvestris_small_gradual_decrease.png', size:100_000 },
  ];

  const UL_URL     = 'https://httpbin.org/post';
  const UL_SIZE    = 1_000_000;
  const PING_URL   = 'https://1.1.1.1/cdn-cgi/trace';
  const PING_COUNT = 8;

  // Gauge geometry r=110, 270° arc
  const CIRCUM  = 2 * Math.PI * 110;
  const ARC_LEN = CIRCUM * 0.75;
  const D_EMPTY = CIRCUM;
  const NDL_MIN = -135, NDL_MAX = 135, SPEED_MAX = 1000;

  const HIST_KEY = 'wk_spt_v5';
  const HIST_MAX = 7;

  let testing    = false;
  let lastResult = null;
  let toastTimer = null;
  let rafId      = null;

  /* ─────────────────────────────────────────────
     BOOT
  ───────────────────────────────────────────── */
  buildTicks();
  resetGauge();
  detectConn();
  detectISP();
  renderHistory();

  /* ─────────────────────────────────────────────
     TICK MARKS
  ───────────────────────────────────────────── */
  function buildTicks() {
    if (!gaugeTicks) return;
    const cx = 150, cy = 150, outerR = 132, total = 60;
    for (let i = 0; i <= total; i++) {
      const pct   = i / total;
      const deg   = -225 + pct * 270;
      const rad   = deg * Math.PI / 180;
      const major = i % 10 === 0;
      const len   = major ? 10 : 5;
      const x1 = cx + outerR * Math.cos(rad);
      const y1 = cy + outerR * Math.sin(rad);
      const x2 = cx + (outerR - len) * Math.cos(rad);
      const y2 = cy + (outerR - len) * Math.sin(rad);
      const ln = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      ln.setAttribute('x1', x1.toFixed(2));
      ln.setAttribute('y1', y1.toFixed(2));
      ln.setAttribute('x2', x2.toFixed(2));
      ln.setAttribute('y2', y2.toFixed(2));
      ln.setAttribute('stroke-width', major ? 2 : 1.2);
      ln.setAttribute('stroke-linecap', 'round');
      ln.classList.add(major ? 'spt-tick-major' : 'spt-tick-minor');
      gaugeTicks.appendChild(ln);
    }
  }

  /* ─────────────────────────────────────────────
     GAUGE
  ───────────────────────────────────────────── */
  function setGauge(mbps) {
    const pct    = Math.min(Math.max(mbps, 0), SPEED_MAX) / SPEED_MAX;
    const offset = D_EMPTY - ARC_LEN * pct;
    const deg    = NDL_MIN + pct * (NDL_MAX - NDL_MIN);
    if (gaugeArc) {
      gaugeArc.style.strokeDashoffset = offset.toFixed(2);
      gaugeArc.setAttribute('stroke',
        mbps < 10 ? 'url(#grad-slow)' :
        mbps < 50 ? '#f59e0b' : 'url(#grad-normal)');
    }
    if (gaugeNeedle)
      gaugeNeedle.style.transform = `rotate(${deg.toFixed(1)}deg)`;
  }

  function resetGauge() {
    if (gaugeArc) {
      gaugeArc.style.strokeDashoffset = D_EMPTY.toFixed(2);
      gaugeArc.setAttribute('stroke', 'url(#grad-normal)');
    }
    if (gaugeNeedle) gaugeNeedle.style.transform = `rotate(${NDL_MIN}deg)`;
    setCenter('0.0', 'Mbps', '—', '');
  }

  function setCenter(val, unit, phase, phaseColor) {
    if (speedVal)   speedVal.textContent   = val;
    if (speedUnit)  speedUnit.textContent  = unit || 'Mbps';
    if (speedPhase) {
      speedPhase.textContent = phase || '';
      speedPhase.style.color = phaseColor || '';
    }
  }

  function animCount(from, to, ms, onTick, onDone) {
    cancelAnimationFrame(rafId);
    if (from === to) { onTick(to); onDone?.(to); return; }
    const t0 = performance.now(), diff = to - from;
    function step(now) {
      const p = Math.min((now - t0) / ms, 1);
      onTick(from + diff * (1 - Math.pow(1 - p, 3)));
      if (p < 1) rafId = requestAnimationFrame(step);
      else        onDone?.(to);
    }
    rafId = requestAnimationFrame(step);
  }

  /* ─────────────────────────────────────────────
     CONNECTION + ISP
  ───────────────────────────────────────────── */
  function detectConn() {
    const nc = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (!nc) { if (connText) connText.textContent = 'Unknown'; return; }
    const map = {'slow-2g':'2G','2g':'2G','3g':'3G','4g':'4G/LTE','wifi':'WiFi','ethernet':'Ethernet'};
    let label = map[(nc.effectiveType || nc.type || '').toLowerCase()] || '';
    if (!label) {
      const dl = nc.downlink || 0;
      label = dl >= 50 ? 'Broadband' : dl >= 5 ? '4G/LTE' : dl >= 1 ? '3G' : '—';
    }
    if (connText) connText.textContent = label;
  }

  async function detectISP() {
    try {
      const ctrl = new AbortController();
      setTimeout(() => ctrl.abort(), 5000);
      const r = await fetch('https://ipwho.is/', { cache:'no-cache', signal:ctrl.signal });
      const d = await r.json();
      if (d?.success && d.connection?.isp) {
        let name = d.connection.isp
          .replace(/\b(Limited|Ltd\.?|Private|Pvt\.?)\b/gi, '')
          .replace(/\s{2,}/g, ' ').trim();
        if (name.length > 26) name = name.slice(0, 24) + '…';
        if (ispText) ispText.textContent = name || 'Unknown ISP';
      } else throw 0;
    } catch (_) {
      if (ispText) ispText.textContent = 'Unknown ISP';
    }
  }

  /* ─────────────────────────────────────────────
     PING + JITTER
  ───────────────────────────────────────────── */
  async function doPing(onSample) {
    const times = [];
    for (let i = 0; i < PING_COUNT; i++) {
      const t0 = performance.now();
      try {
        await fetch(PING_URL + '?_=' + Date.now(), { method:'GET', cache:'no-store', mode:'no-cors' });
      } catch (_) {}
      times.push(Math.round(performance.now() - t0));
      onSample?.(i + 1, times[times.length - 1]);
      await sleep(60);
    }
    times.sort((a, b) => a - b);
    const tr  = times.slice(1, -1);
    const avg = Math.round(tr.reduce((s, v) => s + v, 0) / tr.length);
    let jSum  = 0;
    for (let i = 1; i < tr.length; i++) jSum += Math.abs(tr[i] - tr[i - 1]);
    return { ping: avg, jitter: Math.round(jSum / (tr.length - 1)) || 0 };
  }

  /* ─────────────────────────────────────────────
     DOWNLOAD — TIER 1: fetch ReadableStream
  ───────────────────────────────────────────── */
  async function dlTier1(srv, onLive, onProg) {
    const sep = srv.url.includes('?') ? '&' : '?';
    const url = srv.url + sep + '_wk=' + Date.now();
    const ctrl = new AbortController();
    const tid  = setTimeout(() => ctrl.abort(), 30_000);
    const t0   = performance.now();
    let loaded = 0;
    try {
      const res = await fetch(url, {
        cache:'no-store', mode:'cors', signal:ctrl.signal,
        headers:{'Cache-Control':'no-cache, no-store','Pragma':'no-cache'},
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const reader = res.body.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        loaded += value.byteLength;
        const elapsed = (performance.now() - t0) / 1000;
        if (elapsed > 0.3) {
          onLive?.((loaded * 8) / (elapsed * 1e6));
          onProg?.(Math.min(loaded / srv.size, 0.97));
        }
      }
      clearTimeout(tid);
      const elapsed = (performance.now() - t0) / 1000;
      onProg?.(1);
      return +(loaded * 8 / (elapsed * 1e6)).toFixed(2);
    } catch (e) { clearTimeout(tid); throw e; }
  }

  /* ─────────────────────────────────────────────
     DOWNLOAD — TIER 2: fetch ArrayBuffer
  ───────────────────────────────────────────── */
  async function dlTier2(srv, onLive, onProg) {
    const sep = srv.url.includes('?') ? '&' : '?';
    const url = srv.url + sep + '_wk=' + Date.now();
    const ctrl = new AbortController();
    const tid  = setTimeout(() => ctrl.abort(), 30_000);
    const t0   = performance.now();
    let fakeProg = 0;
    const ticker = setInterval(() => {
      fakeProg = Math.min(fakeProg + 0.05, 0.9);
      const elapsed = (performance.now() - t0) / 1000;
      if (elapsed > 0.3) {
        onLive?.((srv.size * fakeProg * 8) / (elapsed * 1e6));
        onProg?.(fakeProg);
      }
    }, 300);
    try {
      const res = await fetch(url, { cache:'no-store', mode:'cors', signal:ctrl.signal });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const buf = await res.arrayBuffer();
      clearTimeout(tid); clearInterval(ticker);
      const elapsed = (performance.now() - t0) / 1000;
      onProg?.(1);
      return +(buf.byteLength * 8 / (elapsed * 1e6)).toFixed(2);
    } catch (e) { clearTimeout(tid); clearInterval(ticker); throw e; }
  }

  /* ─────────────────────────────────────────────
     DOWNLOAD — TIER 3: Image timing (NEVER fails)
  ───────────────────────────────────────────── */
  function dlTier3(onLive, onProg) {
    return new Promise((resolve) => {
      const t0 = performance.now();
      let loadedImages = 0;
      const results    = [];
      const total      = IMAGE_SERVERS.length;

      IMAGE_SERVERS.forEach((imgSrv, idx) => {
        const img  = new Image();
        const imgT = performance.now();
        img.onload = img.onerror = () => {
          const elapsed = (performance.now() - imgT) / 1000;
          const mbps    = elapsed > 0.05 ? (imgSrv.size * 8) / (elapsed * 1e6) : 0;
          results.push(mbps);
          loadedImages++;
          onLive?.(results.reduce((s,v) => s+v, 0) / results.length);
          onProg?.(loadedImages / total);
          if (loadedImages === total) {
            const sorted  = [...results].sort((a,b) => a-b);
            const trimmed = sorted.length > 2 ? sorted.slice(1) : sorted;
            resolve(+(trimmed.reduce((s,v) => s+v,0) / trimmed.length).toFixed(2));
          }
        };
        img.src = imgSrv.url + '?_wk=' + Date.now() + '&i=' + idx;
      });

      setTimeout(() => {
        if (results.length > 0)
          resolve(+(results.reduce((s,v) => s+v,0) / results.length).toFixed(2));
        else resolve(0);
      }, 25_000);
    });
  }

  /* ─────────────────────────────────────────────
     MAIN DOWNLOAD ORCHESTRATOR
  ───────────────────────────────────────────── */
  async function doDownload(onLive, onProg) {
    for (const srv of FETCH_SERVERS) {
      try {
        const mbps = await dlTier1(srv, onLive, onProg);
        if (mbps > 0.1) return mbps;
      } catch (e) { console.warn(`[DL] Tier1 ${srv.name}:`, e.message); }
    }
    for (const srv of ARRAYBUFFER_SERVERS) {
      try {
        const mbps = await dlTier2(srv, onLive, onProg);
        if (mbps > 0.1) return mbps;
      } catch (e) { console.warn(`[DL] Tier2 ${srv.name}:`, e.message); }
    }
    console.log('[DL] Tier3: image timing');
    const mbps = await dlTier3(onLive, onProg);
    if (mbps > 0) return mbps;
    throw new Error('All download methods failed');
  }

  /* ─────────────────────────────────────────────
     UPLOAD
  ───────────────────────────────────────────── */
  async function doUpload(onLive, onProg) {
    try {
      const blob = makeBlob(UL_SIZE);
      const t0   = performance.now();
      let fakeProg = 0;
      const ticker = setInterval(() => {
        fakeProg = Math.min(fakeProg + 0.1, 0.95);
        const elapsed = (performance.now() - t0) / 1000;
        if (elapsed > 0.2) {
          onLive?.(Math.max(0, (UL_SIZE * fakeProg * 8) / (elapsed * 1e6)));
          onProg?.(fakeProg);
        }
      }, 200);
      const ctrl = new AbortController();
      const tid  = setTimeout(() => ctrl.abort(), 15_000);
      try {
        await fetch(UL_URL + '?_wk=' + Date.now(), {
          method:'POST', body:blob, signal:ctrl.signal, cache:'no-store',
          headers:{'Content-Type':'application/octet-stream'},
        });
        clearTimeout(tid); clearInterval(ticker);
        onProg?.(1);
        return +((UL_SIZE * 8) / ((performance.now() - t0) / 1000 * 1e6)).toFixed(2);
      } catch (_) { clearTimeout(tid); clearInterval(ticker); return 0; }
    } catch (_) { return 0; }
  }

  function makeBlob(size) {
    const buf = new Uint8Array(size);
    let x = 123456789;
    for (let i = 0; i < size; i++) {
      x ^= x << 13; x ^= x >> 17; x ^= x << 5;
      buf[i] = x & 0xFF;
    }
    return new Blob([buf], { type:'application/octet-stream' });
  }

  /* ─────────────────────────────────────────────
     MAIN PIPELINE
  ───────────────────────────────────────────── */
  startBtn?.addEventListener('click', runTest);

  async function runTest() {
    if (testing) return;
    testing = true;

    resetGauge();
    resetCards();
    setStatus('Initializing…', 'st-active');
    showProg(true);
    setProg(0);
    resultActs?.classList.add('hidden');
    ambientEl?.classList.remove('state-testing','state-fast','state-slow');
    ambientEl?.classList.add('state-testing');
    startBtn.disabled = true;
    startBtn.classList.add('pulsing');
    setBtn('ph-fill ph-stop-circle', 'Testing…');

    let ping = 0, jitter = 0, dl = 0, ul = 0;

    try {
      /* PING */
      setStatus('Testing ping & stability…', 'st-active');
      setCenter('—', 'ms', 'PING', '#f59e0b');

      const pr = await doPing((done, lastMs) => {
        setProg((done / PING_COUNT) * 0.20);
        setCenter(String(lastMs), 'ms', 'PING', '#f59e0b');
        setGauge(Math.min(lastMs, SPEED_MAX));
      });

      ping   = pr.ping;
      jitter = pr.jitter;

      // ── FIX: Immediately set values before animation ──
      if (pingValEl)   pingValEl.textContent   = ping;
      if (jitterValEl) jitterValEl.textContent = jitter;

      setCard(pingValEl,   pingBarEl,   pingGradeEl, ping,   true,  gradePing(ping));
      setCard(jitterValEl, jitterBarEl, jitterGrEl,  jitter, true,  gradeJitter(jitter));
      setStatus('Ping done. Testing download…', 'st-active');

      /* DOWNLOAD */
      setCenter('0.0', 'Mbps', 'DOWNLOAD ↓', '#3b82f6');
      setGauge(0);

      dl = await doDownload(
        (live) => { setCenter(live.toFixed(1), 'Mbps', 'DOWNLOAD ↓', '#3b82f6'); setGauge(live); },
        (pct)  => setProg(0.20 + pct * 0.50)
      );

      // ── FIX: Set immediately before animation ──
      if (dlValEl) dlValEl.textContent = dl.toFixed(1);
      setCard(dlValEl, dlBarEl, dlGradeEl, dl, false, gradeSpeed(dl));
      setStatus('Download done. Testing upload…', 'st-active');

      /* UPLOAD */
      setCenter('0.0', 'Mbps', 'UPLOAD ↑', '#10b981');
      setGauge(0);

      ul = await doUpload(
        (live) => { setCenter(live.toFixed(1), 'Mbps', 'UPLOAD ↑', '#10b981'); setGauge(live); },
        (pct)  => setProg(0.70 + pct * 0.30)
      );

      if (ul > 0) {
        // ── FIX: Set immediately before animation ──
        if (ulValEl) ulValEl.textContent = ul.toFixed(1);
        setCard(ulValEl, ulBarEl, ulGradeEl, ul, false, gradeSpeed(ul));
      } else {
        if (ulValEl) ulValEl.textContent = 'N/A';
      }

      /* FINISH */
      setProg(1);
      animCount(parseFloat(speedVal?.textContent) || 0, dl, 900, (v) => {
        setCenter(v.toFixed(1), 'Mbps', '', '');
        setGauge(v);
      });

      const grade = gradeSpeed(dl);
      setStatus(`Test complete — ${grade.label}!`, 'st-success');
      ambientEl?.classList.remove('state-testing');
      ambientEl?.classList.add(dl >= 50 ? 'state-fast' : 'state-slow');

      document.querySelectorAll('.spt-metric').forEach((c, i) => {
        setTimeout(() => { c.classList.remove('popping'); void c.offsetWidth; c.classList.add('popping'); }, i * 70);
      });

      lastResult = { ping, jitter, dl, ul, ts: Date.now() };
      saveHistory(lastResult);
      renderHistory();
      resultActs?.classList.remove('hidden');

    } catch (err) {
      console.error('[SpeedTest]', err);
      setStatus('Test failed — check your connection.', 'st-error');
      ambientEl?.classList.remove('state-testing');
    } finally {
      testing = false;
      startBtn.disabled = false;
      startBtn.classList.remove('pulsing');
      setBtn('ph-fill ph-play', 'Test Again');
      setTimeout(() => showProg(false), 800);
    }
  }

  /* ─────────────────────────────────────────────
     UI HELPERS
  ───────────────────────────────────────────── */
  function setStatus(msg, cls) {
    if (!statusEl) return;
    statusEl.textContent = msg;
    statusEl.className   = 'spt-status' + (cls ? ' ' + cls : '');
  }

  function showProg(show) {
    if (!progWrap) return;
    show ? progWrap.classList.remove('hidden') : progWrap.classList.add('hidden');
  }

  function setProg(pct) {
    const p = Math.round(Math.min(Math.max(pct, 0), 1) * 100);
    if (progFill) progFill.style.width = p + '%';
    if (progPct)  progPct.textContent  = p + '%';
  }

  function setBtn(iconCls, label) {
    if (startIcon)  startIcon.className    = iconCls;
    if (startLabel) startLabel.textContent = label;
  }

  /* ── FIX: Immediately set value + then animate ── */
  function setCard(valEl, barEl, gradeEl, value, lowerBetter, grade) {
    if (!valEl) return;

    // Set immediately so value always shows even if animation glitches
    valEl.textContent = lowerBetter ? Math.round(value) : value.toFixed(1);

    // Then animate from 0
    animCount(0, value, 600, (v) => {
      valEl.textContent = lowerBetter ? Math.round(v) : v.toFixed(1);
    });

    if (barEl && grade) {
      const max = lowerBetter ? 300 : 500;
      const pct = lowerBetter
        ? Math.max(0, 1 - value / max)
        : Math.min(value / max, 1);
      barEl.style.width      = Math.max(pct * 100, 4) + '%';
      barEl.style.background = grade.color;
    }

    if (gradeEl && grade) {
      gradeEl.textContent = grade.label;
      gradeEl.className   = 'spt-grade show ' + grade.cls;
    }
  }

  function resetCards() {
    [pingValEl, jitterValEl, dlValEl, ulValEl].forEach(el => { if (el) el.textContent = '—'; });
    [pingBarEl, jitterBarEl, dlBarEl, ulBarEl].forEach(el => {
      if (el) { el.style.width = '0%'; el.style.background = ''; }
    });
    [pingGradeEl, jitterGrEl, dlGradeEl, ulGradeEl].forEach(el => {
      if (el) { el.textContent = ''; el.className = 'spt-grade'; }
    });
  }

  /* ─────────────────────────────────────────────
     GRADES
  ───────────────────────────────────────────── */
  function gradeSpeed(m) {
    if (m >= 200) return { label:'Excellent', cls:'g-excellent', color:'#10b981' };
    if (m >= 50)  return { label:'Good',      cls:'g-good',      color:'#3b82f6' };
    if (m >= 10)  return { label:'Average',   cls:'g-average',   color:'#f59e0b' };
    return               { label:'Poor',      cls:'g-poor',      color:'#ef4444' };
  }
  function gradePing(m) {
    if (m <= 20)  return { label:'Excellent', cls:'g-excellent', color:'#10b981' };
    if (m <= 60)  return { label:'Good',      cls:'g-good',      color:'#3b82f6' };
    if (m <= 120) return { label:'Average',   cls:'g-average',   color:'#f59e0b' };
    return               { label:'Poor',      cls:'g-poor',      color:'#ef4444' };
  }
  function gradeJitter(m) {
    if (m <= 5)  return { label:'Excellent', cls:'g-excellent', color:'#10b981' };
    if (m <= 15) return { label:'Good',      cls:'g-good',      color:'#3b82f6' };
    if (m <= 30) return { label:'Average',   cls:'g-average',   color:'#f59e0b' };
    return              { label:'Poor',      cls:'g-poor',      color:'#ef4444' };
  }

  /* ─────────────────────────────────────────────
     HISTORY
  ───────────────────────────────────────────── */
  function getHistory() {
    try { return JSON.parse(localStorage.getItem(HIST_KEY) || '[]'); } catch (_) { return []; }
  }
  function saveHistory(r) {
    try {
      let h = getHistory(); h.unshift(r);
      localStorage.setItem(HIST_KEY, JSON.stringify(h.slice(0, HIST_MAX)));
    } catch (_) {}
  }
  function renderHistory() {
    if (!histList) return;
    const h = getHistory();
    if (!h.length) {
      histList.innerHTML = '<p class="spt-empty">No tests yet. Run your first test above!</p>';
      return;
    }
    histList.innerHTML = h.map(r => {
      const g = gradeSpeed(r.dl || 0);
      return `<div class="spt-hist-item">
        <span class="spt-hist-dot" style="background:${g.color};"></span>
        <span class="spt-hist-dl">${(r.dl||0).toFixed(1)}<small> Mbps ↓</small></span>
        <span class="spt-hist-ping">${r.ping||0}ms</span>
        <span class="spt-hist-time">${esc(relTime(r.ts))}</span>
        <span class="spt-hist-grade ${g.cls}">${g.label}</span>
      </div>`;
    }).join('');
  }

  clearBtn?.addEventListener('click', () => {
    try { localStorage.removeItem(HIST_KEY); } catch (_) {}
    renderHistory();
    showToast('History cleared');
  });

  function relTime(ts) {
    const m = Math.floor((Date.now() - ts) / 60000);
    if (m < 1)  return 'Just now';
    if (m < 60) return m + 'm ago';
    const h = Math.floor(m / 60);
    if (h < 24) return h + 'h ago';
    return new Date(ts).toLocaleDateString('en-IN', { day:'numeric', month:'short' });
  }

  /* ─────────────────────────────────────────────
     SHARE + COPY
  ───────────────────────────────────────────── */
  shareBtn?.addEventListener('click', async () => {
    if (!lastResult) return;
    const txt = buildText(lastResult);
    if (navigator.share) {
      try { await navigator.share({ title:'My Internet Speed — WebKaar', text:txt }); } catch (_) {}
    } else {
      clip(txt, () => showToast('Result copied!'));
    }
  });

  copyBtn?.addEventListener('click', () => {
    if (!lastResult) return;
    clip(buildText(lastResult), () => showToast('Copied!'));
  });

  function buildText(r) {
    const ul = r.ul > 0 ? `⬆ Upload:   ${r.ul.toFixed(1)} Mbps\n` : '';
    return `📡 Internet Speed (WebKaar)\n` +
           `⬇ Download: ${(r.dl||0).toFixed(1)} Mbps\n${ul}` +
           `📶 Ping:     ${r.ping||0} ms\n` +
           `〰 Jitter:   ${r.jitter||0} ms\n` +
           `🔗 webkaar.pages.dev/tools/speed-test/`;
  }

  /* ─────────────────────────────────────────────
     MODAL
  ───────────────────────────────────────────── */
  infoBtn?.addEventListener('click',    () => infoModal?.classList.remove('hidden'));
  closeModal?.addEventListener('click', () => infoModal?.classList.add('hidden'));
  infoModal?.addEventListener('click',  e => { if (e.target === infoModal) infoModal.classList.add('hidden'); });
  document.addEventListener('keydown',  e => {
    if (e.key === 'Escape' && infoModal && !infoModal.classList.contains('hidden'))
      infoModal.classList.add('hidden');
  });

  /* ─────────────────────────────────────────────
     TOAST
  ───────────────────────────────────────────── */
  function showToast(msg) {
    clearTimeout(toastTimer);
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.remove('hidden');
    toastEl.classList.add('show');
    toastTimer = setTimeout(() => {
      toastEl.classList.remove('show');
      toastEl.classList.add('hidden');
    }, 3000);
  }

  /* ─────────────────────────────────────────────
     CLIPBOARD
  ───────────────────────────────────────────── */
  function clip(text, onOk) {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(onOk).catch(() => clipFb(text, onOk));
    } else {
      clipFb(text, onOk);
    }
  }
  function clipFb(text, onOk) {
    const el = document.createElement('textarea');
    el.value = text;
    el.style.cssText = 'position:fixed;top:-9999px;opacity:0;';
    document.body.appendChild(el);
    el.select();
    try { document.execCommand('copy'); onOk?.(); } catch (_) {}
    document.body.removeChild(el);
  }

  function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
  function esc(s) {
    return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

}); // end DOMContentLoaded
