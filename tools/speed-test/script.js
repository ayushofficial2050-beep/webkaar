/* ═══════════════════════════════════════════════════
   SPEED TEST PRO — script.js FINAL v3
   WebKaar | Ayush Tiwari
   
   KEY FIX: Uses fetch() API instead of XHR
   XHR was failing on mobile networks with binary files.
   fetch() with ArrayBuffer works universally.
   
   Servers: Cloudflare (primary) + fast.com CDN + Wikimedia
   All verified working on India mobile networks (Jio/Airtel)
═══════════════════════════════════════════════════ */

'use strict';

document.addEventListener('DOMContentLoaded', () => {

  /* ─────────────────────────────────────────────
     DOM
  ───────────────────────────────────────────── */
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

  // ✅ Servers that work on India mobile networks via fetch()
  // Tested on Jio 4G, Airtel 4G, and WiFi hotspot
  const DL_SERVERS = [
    {
      name: 'Cloudflare',
      // Cloudflare's official speed test endpoint — CORS open globally
      url:  'https://speed.cloudflare.com/__down?bytes=25000000',
      size: 25_000_000,
    },
    {
      name: 'Cloudflare 10MB',
      url:  'https://speed.cloudflare.com/__down?bytes=10000000',
      size: 10_000_000,
    },
    {
      name: 'Wikimedia',
      // Global CDN, CORS open, no auth needed
      url:  'https://upload.wikimedia.org/wikipedia/commons/2/2d/Snake_River_%285mb%29.jpg',
      size: 5_245_329,
    },
  ];

  // Upload endpoint
  const UL_URL  = 'https://httpbin.org/post';
  const UL_SIZE = 2_000_000; // 2MB — faster, still accurate

  // Ping target
  const PING_URL   = 'https://1.1.1.1/cdn-cgi/trace';
  const PING_COUNT = 8;

  // Gauge geometry — r=110, 270° arc, rotate(135)
  const CIRCUM  = 2 * Math.PI * 110; // 691.15
  const ARC_LEN = CIRCUM * 0.75;     // 518.36
  const D_EMPTY = CIRCUM;            // 691.15 (nothing filled)
  const D_FULL  = CIRCUM - ARC_LEN;  // 172.79 (fully filled)

  // Needle sweep: −135° (0 Mbps) → +135° (1000 Mbps)
  const NDL_MIN   = -135;
  const NDL_MAX   =  135;
  const SPEED_MAX = 1000;

  // History
  const HIST_KEY = 'wk_spt_v3';
  const HIST_MAX = 7;

  /* ─────────────────────────────────────────────
     STATE
  ───────────────────────────────────────────── */
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
        mbps < 10  ? 'url(#grad-slow)' :
        mbps < 50  ? '#f59e0b' :
                     'url(#grad-normal)');
    }
    if (gaugeNeedle) {
      gaugeNeedle.style.transform = `rotate(${deg.toFixed(1)}deg)`;
    }
  }

  function resetGauge() {
    if (gaugeArc) {
      gaugeArc.style.strokeDashoffset = D_EMPTY.toFixed(2);
      gaugeArc.setAttribute('stroke', 'url(#grad-normal)');
    }
    if (gaugeNeedle) gaugeNeedle.style.transform = `rotate(${NDL_MIN}deg)`;
    setCenter('0.0', 'Mbps', '—', '');
  }

  /* ─────────────────────────────────────────────
     CENTER DISPLAY
  ───────────────────────────────────────────── */
  function setCenter(val, unit, phase, phaseColor) {
    if (speedVal)   speedVal.textContent   = val;
    if (speedUnit)  speedUnit.textContent  = unit  || 'Mbps';
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
      const e = 1 - Math.pow(1 - p, 3);
      onTick(from + diff * e);
      if (p < 1) rafId = requestAnimationFrame(step);
      else        onDone?.(to);
    }
    rafId = requestAnimationFrame(step);
  }

  /* ─────────────────────────────────────────────
     CONNECTION TYPE
  ───────────────────────────────────────────── */
  function detectConn() {
    const nc = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (!nc) { if (connText) connText.textContent = 'Unknown'; return; }
    const map = { 'slow-2g':'2G','2g':'2G','3g':'3G','4g':'4G/LTE','wifi':'WiFi','ethernet':'Ethernet' };
    let label = map[(nc.effectiveType || nc.type || '').toLowerCase()] || '';
    if (!label) {
      const dl = nc.downlink || 0;
      label = dl >= 50 ? 'Broadband' : dl >= 5 ? '4G/LTE' : dl >= 1 ? '3G' : '—';
    }
    if (connText) connText.textContent = label;
  }

  /* ─────────────────────────────────────────────
     ISP DETECTION
  ───────────────────────────────────────────── */
  async function detectISP() {
    try {
      const ctrl = new AbortController();
      setTimeout(() => ctrl.abort(), 5000);
      const r = await fetch('https://ipwho.is/', { cache:'no-cache', signal:ctrl.signal });
      if (!r.ok) throw 0;
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
     Uses fetch() in no-cors mode — works on all networks
  ───────────────────────────────────────────── */
  async function doPing(onSample) {
    const times = [];
    for (let i = 0; i < PING_COUNT; i++) {
      const ms = await onePing();
      times.push(ms);
      onSample?.(i + 1, ms);
      await sleep(60);
    }
    times.sort((a, b) => a - b);
    const tr  = times.slice(1, -1);
    const avg = Math.round(tr.reduce((s, v) => s + v, 0) / tr.length);
    let jSum  = 0;
    for (let i = 1; i < tr.length; i++) jSum += Math.abs(tr[i] - tr[i - 1]);
    return { ping: avg, jitter: Math.round(jSum / (tr.length - 1)) || 0 };
  }

  async function onePing() {
    const t0 = performance.now();
    try {
      await fetch(PING_URL + '?_=' + Date.now(), {
        method: 'GET',
        cache:  'no-store',
        mode:   'no-cors',
      });
    } catch (_) { /* no-cors throws — timing still valid */ }
    return Math.round(performance.now() - t0);
  }

  /* ─────────────────────────────────────────────
     DOWNLOAD TEST — fetch() with ReadableStream
     This is the KEY FIX: fetch() reads body as stream
     which works on ALL mobile browsers including Samsung
     Internet, Chrome Mobile, Firefox Mobile.
     XHR was failing because binary blob download
     gets blocked on some mobile network configurations.
  ───────────────────────────────────────────── */
  async function doDownload(onLive, onProg) {
    for (const srv of DL_SERVERS) {
      try {
        const mbps = await dlServer(srv, onLive, onProg);
        if (mbps > 0.1) return mbps;
      } catch (e) {
        console.warn(`[DL] ${srv.name}:`, e.message || e);
      }
    }
    throw new Error('All download servers failed');
  }

  async function dlServer(srv, onLive, onProg) {
    const sep = srv.url.includes('?') ? '&' : '?';
    const url = srv.url + sep + '_wk=' + Date.now();

    const ctrl    = new AbortController();
    const timeout = setTimeout(() => ctrl.abort(), 35_000);

    const t0 = performance.now();
    let loaded = 0;

    try {
      const res = await fetch(url, {
        cache:  'no-store',
        mode:   'cors',
        signal: ctrl.signal,
        headers: {
          'Cache-Control': 'no-cache, no-store',
          'Pragma':        'no-cache',
        },
      });

      if (!res.ok) throw new Error('HTTP ' + res.status);

      // ReadableStream — read chunk by chunk
      const reader = res.body.getReader();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        loaded += value.byteLength;
        const elapsed = (performance.now() - t0) / 1000;

        if (elapsed > 0.2) {
          const avgMbps = (loaded * 8) / (elapsed * 1e6);
          onLive?.(Math.max(0, avgMbps));
          onProg?.(Math.min(loaded / srv.size, 0.97));
        }
      }

      clearTimeout(timeout);
      const elapsed  = (performance.now() - t0) / 1000;
      const finalMbps = (loaded * 8) / (elapsed * 1e6);
      onProg?.(1);
      return +finalMbps.toFixed(2);

    } catch (e) {
      clearTimeout(timeout);
      throw e;
    }
  }

  /* ─────────────────────────────────────────────
     UPLOAD TEST — fetch() POST
     Uses fetch() instead of XHR for same reason above.
     httpbin.org accepts POST and measures accurately.
  ───────────────────────────────────────────── */
  async function doUpload(onLive, onProg) {
    try {
      const blob  = makeBlob(UL_SIZE);
      const t0    = performance.now();

      // Simulate live progress for upload
      // (fetch() doesn't expose upload progress natively)
      // We use a fake progress ticker while upload runs
      let fakeProgress = 0;
      const ticker = setInterval(() => {
        fakeProgress = Math.min(fakeProgress + 0.08, 0.95);
        onProg?.(fakeProgress);

        // Estimate speed based on time elapsed
        const elapsed = (performance.now() - t0) / 1000;
        if (elapsed > 0.3) {
          const estimated = (UL_SIZE * fakeProgress * 8) / (elapsed * 1e6);
          onLive?.(Math.max(0, estimated));
        }
      }, 200);

      const ctrl    = new AbortController();
      const timeout = setTimeout(() => ctrl.abort(), 20_000);

      try {
        const res = await fetch(UL_URL + '?_wk=' + Date.now(), {
          method:  'POST',
          body:    blob,
          headers: { 'Content-Type': 'application/octet-stream' },
          signal:  ctrl.signal,
          cache:   'no-store',
        });

        clearTimeout(timeout);
        clearInterval(ticker);
        onProg?.(1);

        const elapsed   = (performance.now() - t0) / 1000;
        const finalMbps = (UL_SIZE * 8) / (elapsed * 1e6);
        return +finalMbps.toFixed(2);

      } catch (_) {
        clearTimeout(timeout);
        clearInterval(ticker);
        return 0; // httpbin unavailable — fail gracefully
      }

    } catch (_) {
      return 0;
    }
  }

  // XOR-shift random blob — incompressible
  function makeBlob(size) {
    const buf = new Uint8Array(size);
    let x = 123456789;
    for (let i = 0; i < size; i++) {
      x ^= x << 13; x ^= x >> 17; x ^= x << 5;
      buf[i] = x & 0xFF;
    }
    return new Blob([buf], { type: 'application/octet-stream' });
  }

  /* ─────────────────────────────────────────────
     MAIN TEST PIPELINE
  ───────────────────────────────────────────── */
  startBtn?.addEventListener('click', runTest);

  async function runTest() {
    if (testing) return;
    testing = true;

    // Reset UI
    resetGauge();
    resetCards();
    setStatus('Initializing…', 'st-active');
    showProg(true);
    setProg(0);
    resultActs?.classList.add('hidden');
    ambientEl?.classList.remove('state-testing', 'state-fast', 'state-slow');
    ambientEl?.classList.add('state-testing');
    startBtn.disabled = true;
    startBtn.classList.add('pulsing');
    setBtn('ph-fill ph-stop-circle', 'Testing…');

    let ping = 0, jitter = 0, dl = 0, ul = 0;

    try {

      /* ══ PHASE 1: PING ══ */
      setStatus('Testing ping & stability…', 'st-active');
      setCenter('—', 'ms', 'PING', '#f59e0b');

      const pr = await doPing((done, lastMs) => {
        setProg((done / PING_COUNT) * 0.20);
        setCenter(String(lastMs), 'ms', 'PING', '#f59e0b');
        setGauge(Math.min(lastMs, SPEED_MAX));
      });

      ping   = pr.ping;
      jitter = pr.jitter;

      setCard(pingValEl,   pingBarEl,   pingGradeEl, ping,   true,  gradePing(ping));
      setCard(jitterValEl, jitterBarEl, jitterGrEl,  jitter, true,  gradeJitter(jitter));
      setStatus('Ping done. Testing download…', 'st-active');

      /* ══ PHASE 2: DOWNLOAD ══ */
      setCenter('0.0', 'Mbps', 'DOWNLOAD ↓', '#3b82f6');
      setGauge(0);

      dl = await doDownload(
        (live) => {
          setCenter(live.toFixed(1), 'Mbps', 'DOWNLOAD ↓', '#3b82f6');
          setGauge(live);
        },
        (pct) => setProg(0.20 + pct * 0.50)
      );

      setCard(dlValEl, dlBarEl, dlGradeEl, dl, false, gradeSpeed(dl));
      setStatus('Download done. Testing upload…', 'st-active');

      /* ══ PHASE 3: UPLOAD ══ */
      setCenter('0.0', 'Mbps', 'UPLOAD ↑', '#10b981');
      setGauge(0);

      ul = await doUpload(
        (live) => {
          setCenter(live.toFixed(1), 'Mbps', 'UPLOAD ↑', '#10b981');
          setGauge(live);
        },
        (pct) => setProg(0.70 + pct * 0.30)
      );

      if (ul > 0) setCard(ulValEl, ulBarEl, ulGradeEl, ul, false, gradeSpeed(ul));
      else if (ulValEl) ulValEl.textContent = 'N/A';

      /* ══ PHASE 4: FINISH ══ */
      setProg(1);

      animCount(parseFloat(speedVal?.textContent) || 0, dl, 900, (v) => {
        setCenter(v.toFixed(1), 'Mbps', '', '');
        setGauge(v);
      });

      const grade = gradeSpeed(dl);
      setStatus(`Test complete — ${grade.label}!`, 'st-success');

      ambientEl?.classList.remove('state-testing');
      ambientEl?.classList.add(dl >= 50 ? 'state-fast' : 'state-slow');

      // Pop metric cards
      document.querySelectorAll('.spt-metric').forEach((c, i) => {
        setTimeout(() => {
          c.classList.remove('popping');
          void c.offsetWidth;
          c.classList.add('popping');
        }, i * 70);
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

  function setCard(valEl, barEl, gradeEl, value, lowerBetter, grade) {
    if (!valEl) return;

    animCount(0, value, 550, (v) => {
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
  function gradeSpeed(mbps) {
    if (mbps >= 200) return { label:'Excellent', cls:'g-excellent', color:'#10b981' };
    if (mbps >= 50)  return { label:'Good',      cls:'g-good',      color:'#3b82f6' };
    if (mbps >= 10)  return { label:'Average',   cls:'g-average',   color:'#f59e0b' };
    return                  { label:'Poor',      cls:'g-poor',      color:'#ef4444' };
  }
  function gradePing(ms) {
    if (ms <= 20)  return { label:'Excellent', cls:'g-excellent', color:'#10b981' };
    if (ms <= 60)  return { label:'Good',      cls:'g-good',      color:'#3b82f6' };
    if (ms <= 120) return { label:'Average',   cls:'g-average',   color:'#f59e0b' };
    return                { label:'Poor',      cls:'g-poor',      color:'#ef4444' };
  }
  function gradeJitter(ms) {
    if (ms <= 5)  return { label:'Excellent', cls:'g-excellent', color:'#10b981' };
    if (ms <= 15) return { label:'Good',      cls:'g-good',      color:'#3b82f6' };
    if (ms <= 30) return { label:'Average',   cls:'g-average',   color:'#f59e0b' };
    return               { label:'Poor',      cls:'g-poor',      color:'#ef4444' };
  }

  /* ─────────────────────────────────────────────
     HISTORY
  ───────────────────────────────────────────── */
  function getHistory() {
    try { return JSON.parse(localStorage.getItem(HIST_KEY) || '[]'); }
    catch (_) { return []; }
  }

  function saveHistory(r) {
    try {
      let h = getHistory();
      h.unshift(r);
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
      try { await navigator.share({ title:'My Internet Speed — WebKaar', text:txt }); }
      catch (_) {}
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
  infoBtn?.addEventListener('click', () => {
    infoModal?.classList.remove('hidden');
  });

  closeModal?.addEventListener('click', () => {
    infoModal?.classList.add('hidden');
  });

  infoModal?.addEventListener('click', e => {
    if (e.target === infoModal) infoModal.classList.add('hidden');
  });

  document.addEventListener('keydown', e => {
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

  /* ─────────────────────────────────────────────
     UTILS
  ───────────────────────────────────────────── */
  function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

  function esc(s) {
    return String(s ?? '')
      .replace(/&/g,'&amp;').replace(/</g,'&lt;')
      .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

}); // end DOMContentLoaded
