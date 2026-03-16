/* ═══════════════════════════════════════════════════
   SPEED TEST PRO — script.js FINAL
   WebKaar | Ayush Tiwari

   Download servers: ThinkBroadband + OVH + Wikimedia
   Upload: httpbin.org POST
   Ping: Cloudflare 1.1.1.1 (8 samples, trim outliers)
   All verified CORS-open on HTTPS deploy.
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

  // ✅ Verified CORS-open download servers (work on HTTPS)
  const DL_SERVERS = [
    {
      name: 'ThinkBroadband UK',
      url:  'https://ipv4.download.thinkbroadband.com/10MB.zip',
      size: 10_485_760,
    },
    {
      name: 'OVH France',
      url:  'https://proof.ovh.net/files/10Mb.dat',
      size: 10_485_760,
    },
    {
      name: 'Wikimedia CDN',
      url:  'https://upload.wikimedia.org/wikipedia/commons/2/2d/Snake_River_%285mb%29.jpg',
      size: 5_245_329,
    },
  ];

  // Upload endpoint
  const UL_URL  = 'https://httpbin.org/post';
  const UL_SIZE = 3_000_000; // 3MB

  // Ping endpoint
  const PING_URL   = 'https://1.1.1.1/cdn-cgi/trace';
  const PING_COUNT = 8;

  // Gauge geometry — r=110, 270° arc, rotate(135)
  // C = 2π×110 = 691.15
  // Arc = 691.15 × (270/360) = 518.36
  // Empty offset = 691.15 (full dasharray = no fill)
  // Full  offset = 691.15 − 518.36 = 172.79
  const CIRCUM     = 2 * Math.PI * 110; // 691.15
  const ARC_LEN    = CIRCUM * 0.75;     // 518.36
  const D_EMPTY    = CIRCUM;
  const D_FULL     = CIRCUM - ARC_LEN;  // 172.79

  // Needle: −135° (empty/0) → +135° (full/1000 Mbps)
  const NDL_MIN    = -135;
  const NDL_MAX    =  135;
  const SPEED_MAX  = 1000;

  // History
  const HIST_KEY   = 'wk_spt_final';
  const HIST_MAX   = 7;

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
     GAUGE TICK MARKS — SVG lines, pixel-perfect
  ───────────────────────────────────────────── */
  function buildTicks() {
    if (!gaugeTicks) return;
    const cx = 150, cy = 150, outerR = 132, total = 60;
    for (let i = 0; i <= total; i++) {
      const pct   = i / total;
      // Arc starts at 225° (bottom-left) and sweeps 270° clockwise
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
     GAUGE UPDATE
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
    if (speedUnit)  speedUnit.textContent  = unit || 'Mbps';
    if (speedPhase) {
      speedPhase.textContent = phase || '';
      speedPhase.style.color = phaseColor || '';
    }
  }

  // Smooth animated number counter
  function animCount(from, to, ms, onTick, onDone) {
    cancelAnimationFrame(rafId);
    if (from === to) { onTick(to); onDone?.(to); return; }
    const t0   = performance.now();
    const diff = to - from;
    function step(now) {
      const p     = Math.min((now - t0) / ms, 1);
      const eased = 1 - Math.pow(1 - p, 3); // ease-out cubic
      onTick(from + diff * eased);
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
      const r = await timedFetch('https://ipwho.is/', 5000);
      if (!r?.ok) throw 0;
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
      const ms = await onePing();
      times.push(ms);
      onSample?.(i + 1, ms);
      await sleep(70);
    }
    times.sort((a, b) => a - b);
    const tr  = times.slice(1, -1); // drop lowest + highest
    const avg = Math.round(tr.reduce((s, v) => s + v, 0) / tr.length);
    let jSum  = 0;
    for (let i = 1; i < tr.length; i++) jSum += Math.abs(tr[i] - tr[i - 1]);
    return { ping: avg, jitter: Math.round(jSum / (tr.length - 1)) || 0 };
  }

  async function onePing() {
    const t0 = performance.now();
    try {
      await fetch(PING_URL + '?_=' + Date.now(), { method: 'HEAD', cache: 'no-store', mode: 'no-cors' });
    } catch (_) { /* no-cors throws — timing still valid */ }
    return Math.round(performance.now() - t0);
  }

  /* ─────────────────────────────────────────────
     DOWNLOAD TEST
  ───────────────────────────────────────────── */
  async function doDownload(onLive, onProg) {
    for (const srv of DL_SERVERS) {
      try {
        const mbps = await dlServer(srv, onLive, onProg);
        if (mbps > 0) return mbps;
      } catch (e) {
        console.warn(`[DL] ${srv.name}:`, e.message);
      }
    }
    throw new Error('All download servers failed');
  }

  function dlServer(srv, onLive, onProg) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const sep = srv.url.includes('?') ? '&' : '?';
      const url = srv.url + sep + '_wk=' + Date.now() + '&r=' + (Math.random() * 1e9 | 0);

      xhr.open('GET', url, true);
      xhr.responseType = 'blob';
      xhr.setRequestHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      xhr.setRequestHeader('Pragma', 'no-cache');

      const t0 = performance.now();
      let lastL = 0, lastT = t0;

      xhr.onprogress = (e) => {
        const now    = performance.now();
        const loaded = e.loaded;
        const elapsed = (now - t0) / 1000;

        const chunkMs   = now - lastT;
        const chunkMbps = chunkMs > 0 ? (loaded - lastL) * 8 / (chunkMs / 1000 * 1e6) : 0;
        const avgMbps   = elapsed > 0.15 ? loaded * 8 / (elapsed * 1e6) : 0;
        // 65% avg + 35% instant = smooth but responsive gauge
        onLive?.(Math.max(0, avgMbps * 0.65 + chunkMbps * 0.35));

        const total = e.lengthComputable ? e.total : srv.size;
        if (total > 0) onProg?.(Math.min(loaded / total, 0.97));

        lastL = loaded; lastT = now;
      };

      xhr.onload = () => {
        const elapsed  = (performance.now() - t0) / 1000;
        const bytes    = xhr.response?.size || srv.size;
        onProg?.(1);
        resolve(+(bytes * 8 / (elapsed * 1e6)).toFixed(2));
      };
      xhr.onerror   = () => reject(new Error('XHR error'));
      xhr.ontimeout = () => reject(new Error('XHR timeout'));
      xhr.timeout   = 30_000;
      xhr.send();
    });
  }

  /* ─────────────────────────────────────────────
     UPLOAD TEST
  ───────────────────────────────────────────── */
  function doUpload(onLive, onProg) {
    return new Promise((resolve) => {
      const blob = makeBlob(UL_SIZE);
      const xhr  = new XMLHttpRequest();
      xhr.open('POST', UL_URL + '?_wk=' + Date.now(), true);
      xhr.setRequestHeader('Content-Type', 'application/octet-stream');

      const t0 = performance.now();
      let lastL = 0, lastT = t0;

      xhr.upload.onprogress = (e) => {
        const now    = performance.now();
        const loaded = e.loaded;
        const elapsed = (now - t0) / 1000;
        const chunkMs   = now - lastT;
        const chunkMbps = chunkMs > 0 ? (loaded - lastL) * 8 / (chunkMs / 1000 * 1e6) : 0;
        const avgMbps   = elapsed > 0.15 ? loaded * 8 / (elapsed * 1e6) : 0;
        onLive?.(Math.max(0, avgMbps * 0.65 + chunkMbps * 0.35));
        if (e.lengthComputable) onProg?.(Math.min(e.loaded / e.total, 0.97));
        lastL = loaded; lastT = now;
      };

      xhr.onload = () => {
        const elapsed = (performance.now() - t0) / 1000;
        onProg?.(1);
        resolve(+(UL_SIZE * 8 / (elapsed * 1e6)).toFixed(2));
      };
      // httpbin can be flaky on some networks — fail gracefully
      xhr.onerror   = () => resolve(0);
      xhr.ontimeout = () => resolve(0);
      xhr.timeout   = 20_000;
      xhr.send(blob);
    });
  }

  // XOR-shift random blob — incompressible (prevents gzip inflating speed)
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

    // Reset
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
      /* ── PHASE 1: PING ── */
      setStatus('Testing ping & stability…', 'st-active');
      setCenter('—', 'ms', 'PING', '#f59e0b');

      const pr = await doPing((done, lastMs) => {
        setProg((done / PING_COUNT) * 0.20);
        setCenter(String(lastMs), 'ms', 'PING', '#f59e0b');
        setGauge(Math.min(lastMs, SPEED_MAX));
      });

      ping   = pr.ping;
      jitter = pr.jitter;
      setCard(pingValEl,   pingBarEl,   pingGradeEl,   ping,   'ms',   gradePing(ping),   true);
      setCard(jitterValEl, jitterBarEl, jitterGrEl,    jitter, 'ms',   gradeJitter(jitter), true);
      setStatus('Ping done. Testing download…', 'st-active');

      /* ── PHASE 2: DOWNLOAD ── */
      setCenter('0.0', 'Mbps', 'DOWNLOAD ↓', '#3b82f6');
      setGauge(0);

      dl = await doDownload(
        (live) => {
          setCenter(live.toFixed(1), 'Mbps', 'DOWNLOAD ↓', '#3b82f6');
          setGauge(live);
        },
        (pct) => setProg(0.20 + pct * 0.50)
      );

      setCard(dlValEl, dlBarEl, dlGradeEl, dl, 'Mbps', gradeSpeed(dl), false);
      setStatus('Download done. Testing upload…', 'st-active');

      /* ── PHASE 3: UPLOAD ── */
      setCenter('0.0', 'Mbps', 'UPLOAD ↑', '#10b981');
      setGauge(0);

      ul = await doUpload(
        (live) => {
          setCenter(live.toFixed(1), 'Mbps', 'UPLOAD ↑', '#10b981');
          setGauge(live);
        },
        (pct) => setProg(0.70 + pct * 0.30)
      );

      if (ul > 0) setCard(ulValEl, ulBarEl, ulGradeEl, ul, 'Mbps', gradeSpeed(ul), false);
      else if (ulValEl) ulValEl.textContent = 'N/A';

      /* ── PHASE 4: FINISH ── */
      setProg(1);

      // Animate gauge back to DL result
      const prev = parseFloat(speedVal?.textContent) || 0;
      animCount(prev, dl, 900, (v) => {
        setCenter(v.toFixed(1), 'Mbps', '', '');
        setGauge(v);
      });

      const grade = gradeSpeed(dl);
      setStatus(`Test complete — ${grade.label}!`, 'st-success');

      ambientEl?.classList.remove('state-testing');
      ambientEl?.classList.add(dl >= 50 ? 'state-fast' : 'state-slow');

      // Pop cards
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
    if (startIcon)  startIcon.className   = iconCls;
    if (startLabel) startLabel.textContent = label;
  }

  function setCard(valEl, barEl, gradeEl, value, unit, grade, lowerBetter) {
    if (!valEl) return;

    animCount(0, value, 550, (v) => {
      valEl.textContent = (unit === 'ms') ? Math.round(v) : v.toFixed(1);
    });

    if (barEl && grade) {
      const maxes = { ms: lowerBetter ? 300 : 100, Mbps: 500 };
      const max   = maxes[unit] || 300;
      const pct   = lowerBetter
        ? Math.max(0, 1 - value / max)   // ping/jitter: lower = longer bar
        : Math.min(value / max, 1);       // speed: higher = longer bar
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
    [pingBarEl, jitterBarEl, dlBarEl, ulBarEl].forEach(el => { if (el) { el.style.width = '0%'; el.style.background = ''; } });
    [pingGradeEl, jitterGrEl, dlGradeEl, ulGradeEl].forEach(el => { if (el) { el.textContent = ''; el.className = 'spt-grade'; } });
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
    try { return JSON.parse(localStorage.getItem(HIST_KEY) || '[]'); } catch (_) { return []; }
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

  /* ─────────────────────────────────────────────
     UTILITIES
  ───────────────────────────────────────────── */
  function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

  function esc(s) {
    return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;')
      .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  async function timedFetch(url, ms) {
    const ctrl = new AbortController();
    const tid  = setTimeout(() => ctrl.abort(), ms);
    try {
      const r = await fetch(url, { signal: ctrl.signal, cache: 'no-cache' });
      clearTimeout(tid);
      return r;
    } catch (_) { clearTimeout(tid); return null; }
  }

}); // end DOMContentLoaded
