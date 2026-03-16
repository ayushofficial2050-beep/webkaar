/* ═══════════════════════════════════════════════════
   IP CHECKER PRO — script.js
   WebKaar | Ayush Tiwari | Ultimate Edition
   All bugs fixed. 7 new features implemented:
    ✔ VPN / Proxy / Tor detector
    ✔ IPv4 ↔ IPv6 toggle
    ✔ ASN & routing info
    ✔ Geolocation accuracy meter
    ✔ Blacklist checker (StopForumSpam)
    ✔ Latency test (4 servers, averaged)
    ✔ IP history (localStorage, last 5)
   Bug fixes:
    ✔ All DOM queries inside DOMContentLoaded
    ✔ Clipboard HTTP fallback
    ✔ Refresh clears stale map + data
    ✔ showError hides details box
    ✔ Modal animation — no display:none conflict
    ✔ iPadOS detection fix
    ✔ window.WebKaarAPI race condition guard
    ✔ Map bbox lat/lon bounds clamped
    ✔ Timeout reduced to 5s
═══════════════════════════════════════════════════ */

'use strict';

document.addEventListener('DOMContentLoaded', () => {

  /* ─────────────────────────────────────────────
     DOM REFERENCES
     BUG FIX: All inside DOMContentLoaded —
     no more null crashes on missing elements
  ───────────────────────────────────────────── */
  const get = (id) => document.getElementById(id);

  const ipDisplay       = get('ip-display');
  const ispDisplay      = get('isp-display');
  const typeDisplay     = get('type-display');
  const vpnBadge        = get('vpn-badge');
  const detailsBox      = get('details-box');
  const refreshBtn      = get('refresh-btn');
  const mainCard        = get('ip-card-main');
  const copyBtn         = get('copy-ip-btn');
  const mapFrame        = get('map-frame');
  const mapContainer    = get('map-container');

  // Network info
  const locationVal     = get('location-val');
  const countryVal      = get('country-val');
  const flagIcon        = get('flag-icon');
  const timezoneVal     = get('timezone-val');
  const connectionVal   = get('connection-val');
  const regionVal       = get('region-val');

  // ASN
  const ispVal          = get('isp-val');
  const asnVal          = get('asn-val');
  const asnDomainVal    = get('asn-domain-val');

  // Security
  const secVpn          = get('sec-vpn');
  const secProxy        = get('sec-proxy');
  const secTor          = get('sec-tor');
  const geoAccuracy     = get('geo-accuracy');

  // Blacklist
  const blacklistBox    = get('blacklist-box');

  // Latency
  const latencyGrid     = get('latency-grid');

  // Device
  const osVal           = get('os-val');
  const browserVal      = get('browser-val');
  const langVal         = get('lang-val');
  const screenVal       = get('screen-val');

  // IP History
  const ipHistoryBox    = get('ip-history-box');
  const clearHistoryBtn = get('clear-history-btn');

  // IPv4/IPv6 toggle
  const btnIpv4         = get('btn-ipv4');
  const btnIpv6         = get('btn-ipv6');

  // Modal
  const infoBtn         = get('info-btn');
  const closeModalBtn   = get('close-modal');
  const infoModal       = get('info-modal');

  // Toast
  const toastEl         = get('toast');

  /* ─────────────────────────────────────────────
     STATE
  ───────────────────────────────────────────── */
  let currentData   = null;  // latest normalized API result
  let ipv4Address   = null;  // from forced ipify4
  let ipv6Address   = null;  // from forced ipify6
  let activeVersion = 'ipv4'; // which IP is shown
  let toastTimer    = null;
  let isLoading     = false;

  const HISTORY_KEY  = 'wk_ip_history';
  const HISTORY_LIMIT = 5;

  /* ─────────────────────────────────────────────
     INIT
  ───────────────────────────────────────────── */
  detectDevice();
  renderHistory();

  // BUG FIX: Guard against api.js race condition
  if (window.WebKaarAPI) {
    startFetch();
  } else {
    // Wait for api.js to finish loading (max 3s)
    let waited = 0;
    const waitForApi = setInterval(() => {
      waited += 100;
      if (window.WebKaarAPI) {
        clearInterval(waitForApi);
        startFetch();
      } else if (waited >= 3000) {
        clearInterval(waitForApi);
        showError('API module failed to load.');
      }
    }, 100);
  }

  /* ─────────────────────────────────────────────
     FETCH PIPELINE
  ───────────────────────────────────────────── */
  async function startFetch() {
    if (isLoading) return;
    isLoading = true;
    setLoadingState();

    try {
      // Run main IP fetch + IPv4/IPv6 versions in parallel
      const [mainResult, versions] = await Promise.all([
        window.WebKaarAPI.getNetworkInfo(),
        window.WebKaarAPI.getBothIPVersions(),
      ]);

      ipv4Address = versions.ipv4;
      ipv6Address = versions.ipv6;

      if (mainResult.success) {
        currentData = mainResult;
        updateUI(mainResult);
        saveToHistory(mainResult.ip);
        renderHistory();

        // Run secondary tasks after UI is shown
        runBlacklistCheck(mainResult.ip);
        runLatencyTests();
      } else {
        showError('Check your connection');
      }
    } catch (err) {
      console.error('[IP Checker]', err);
      showError('Unexpected error');
    } finally {
      isLoading = false;
    }
  }

  function setLoadingState() {
    setText(ipDisplay, 'Detecting...');
    setHTML(ispDisplay, '<i class="ph-bold ph-spinner ph-spin"></i> Fetching Network...');
    typeDisplay.classList.add('hidden');
    vpnBadge.classList.add('hidden');
    mainCard.classList.remove('offline-mode');

    // BUG FIX: Clear stale data on refresh
    detailsBox.classList.add('hidden');
    mapFrame.src = 'about:blank';
    blacklistBox.innerHTML = '<div class="blacklist-loading"><i class="ph-bold ph-spinner ph-spin"></i> Checking blacklists...</div>';
    latencyGrid.innerHTML  = '<div class="latency-placeholder"><i class="ph-bold ph-spinner ph-spin"></i> Testing connections...</div>';
  }

  /* ─────────────────────────────────────────────
     UPDATE UI
  ───────────────────────────────────────────── */
  function updateUI(d) {
    mainCard.classList.remove('offline-mode');

    // IP display — show primary IP
    const displayIP = d.ip || 'Unknown';
    setText(ipDisplay, displayIP);

    // ISP badge
    setHTML(ispDisplay,
      `<i class="ph-bold ph-wifi-high"></i> ${escapeHtml(d.isp || 'Unknown ISP')}`
    );

    // IP version badge
    typeDisplay.classList.remove('hidden');
    setText(typeDisplay, d.ipVersion || 'IPv4');

    // VPN / Proxy / Tor badge
    const isSuspect = d.isVpn || d.isProxy || d.isTor || d.isRelay;
    if (isSuspect) {
      vpnBadge.classList.remove('hidden');
      const label = d.isTor ? 'Tor Detected' : d.isProxy ? 'Proxy Detected' : 'VPN Detected';
      setHTML(vpnBadge, `<i class="ph-bold ph-shield-warning"></i> ${label}`);
    } else {
      vpnBadge.classList.add('hidden');
    }

    // Show details section
    detailsBox.classList.remove('hidden');

    // Map
    updateMap(d.lat, d.lon);

    // Network info
    setText(locationVal,  [d.city, d.country].filter(Boolean).join(', ') || '—');
    setText(countryVal,   d.country || '—');
    setText(timezoneVal,  d.timezone || '—');
    setText(regionVal,    d.region || '—');
    setText(connectionVal, d.ipVersion || '—');

    // Flag
    if (d.flagImg) {
      setHTML(flagIcon, `<img src="${escapeHtml(d.flagImg)}" width="22" height="16" style="border-radius:3px;box-shadow:0 1px 4px rgba(0,0,0,0.15);" alt="${escapeHtml(d.country || '')}">`);
    } else if (d.countryCode) {
      // Emoji flag fallback
      const emoji = countryCodeToEmoji(d.countryCode.toUpperCase());
      setText(flagIcon, emoji);
    } else {
      setText(flagIcon, '🌐');
    }

    // ASN info
    setText(ispVal,       d.isp        || '—');
    setText(asnVal,       d.asn        || '—');
    setText(asnDomainVal, d.asnDomain  || '—');

    // Security
    setSecField(secVpn,   d.isVpn,   'VPN Active',   'No VPN');
    setSecField(secProxy, d.isProxy,  'Proxy Active', 'No Proxy');
    setSecField(secTor,   d.isTor,    'Tor Active',   'No Tor');

    // Geo accuracy estimate
    setText(geoAccuracy, estimateGeoAccuracy(d));

    // Update IPv4/IPv6 toggle
    updateVersionToggle();
  }

  /* ─────────────────────────────────────────────
     IPv4 / IPv6 TOGGLE
  ───────────────────────────────────────────── */
  btnIpv4?.addEventListener('click', () => switchVersion('ipv4'));
  btnIpv6?.addEventListener('click', () => switchVersion('ipv6'));

  function switchVersion(version) {
    activeVersion = version;
    updateVersionToggle();
  }

  function updateVersionToggle() {
    // Button active states
    btnIpv4?.classList.toggle('active', activeVersion === 'ipv4');
    btnIpv6?.classList.toggle('active', activeVersion === 'ipv6');

    if (activeVersion === 'ipv6') {
      if (ipv6Address) {
        setText(ipDisplay, ipv6Address);
        typeDisplay.textContent = 'IPv6';
      } else {
        setText(ipDisplay, 'No IPv6');
        typeDisplay.textContent = 'IPv6 N/A';
      }
    } else {
      // IPv4
      const ip4 = ipv4Address || currentData?.ip || 'Unknown';
      setText(ipDisplay, ip4);
      typeDisplay.textContent = 'IPv4';
    }
  }

  /* ─────────────────────────────────────────────
     MAP
     BUG FIX: Lat/lon clamped — no invalid bbox
  ───────────────────────────────────────────── */
  function updateMap(lat, lon) {
    if (lat == null || lon == null) {
      mapContainer.style.display = 'none';
      return;
    }
    mapContainer.style.display = 'block';

    const OFFSET = 0.4;
    // Clamp bbox to valid ranges
    const minLon = Math.max(-180, lon - OFFSET);
    const minLat = Math.max(-90,  lat - OFFSET);
    const maxLon = Math.min(180,  lon + OFFSET);
    const maxLat = Math.min(90,   lat + OFFSET);

    mapFrame.src =
      `https://www.openstreetmap.org/export/embed.html` +
      `?bbox=${minLon},${minLat},${maxLon},${maxLat}` +
      `&layer=mapnik&marker=${lat},${lon}`;
  }

  /* ─────────────────────────────────────────────
     SECURITY FIELD HELPER
  ───────────────────────────────────────────── */
  function setSecField(el, isActive, warnLabel, safeLabel) {
    if (!el) return;
    if (isActive) {
      el.className = 'detail-value sec-warn';
      setHTML(el, `<i class="ph-bold ph-warning-circle"></i> ${warnLabel}`);
    } else {
      el.className = 'detail-value sec-safe';
      setHTML(el, `<i class="ph-bold ph-check-circle"></i> ${safeLabel}`);
    }
  }

  /* ─────────────────────────────────────────────
     GEO ACCURACY ESTIMATE
  ───────────────────────────────────────────── */
  function estimateGeoAccuracy(d) {
    if (!d.city && !d.region) return 'Country level';
    if (!d.city)              return 'Region level (~100km)';
    if (d.source === 'ipwho.is') return 'City level (~25km)';
    return 'City level (~50km)';
  }

  /* ─────────────────────────────────────────────
     BLACKLIST CHECK
  ───────────────────────────────────────────── */
  async function runBlacklistCheck(ip) {
    if (!ip || !blacklistBox) return;

    try {
      const result = await window.WebKaarAPI.checkBlacklist(ip);

      if (result.source === 'unavailable') {
        blacklistBox.innerHTML = `
          <div class="blacklist-result">
            <span class="blacklist-status" style="color:var(--text-muted);">
              <i class="ph-bold ph-warning"></i> Service unavailable
            </span>
            <span class="blacklist-meta">Try again later</span>
          </div>`;
        return;
      }

      if (result.clean === true) {
        blacklistBox.innerHTML = `
          <div class="blacklist-result">
            <span class="blacklist-status clean">
              <i class="ph-bold ph-check-circle"></i> Clean — Not blacklisted
            </span>
            <span class="blacklist-meta">via ${escapeHtml(result.source)}</span>
          </div>`;
      } else if (result.clean === false) {
        blacklistBox.innerHTML = `
          <div class="blacklist-result">
            <span class="blacklist-status listed">
              <i class="ph-bold ph-warning-circle"></i> Listed (${result.frequency} reports)
            </span>
            <span class="blacklist-meta">via ${escapeHtml(result.source)}</span>
          </div>`;
      } else {
        blacklistBox.innerHTML = `
          <div class="blacklist-result">
            <span class="blacklist-status" style="color:var(--text-muted);">
              <i class="ph-bold ph-question"></i> Unknown
            </span>
            <span class="blacklist-meta">API unavailable</span>
          </div>`;
      }
    } catch (err) {
      blacklistBox.innerHTML = `
        <div class="blacklist-result">
          <span class="blacklist-status" style="color:var(--text-muted);">
            <i class="ph-bold ph-warning"></i> Check failed
          </span>
        </div>`;
    }
  }

  /* ─────────────────────────────────────────────
     LATENCY TESTS
  ───────────────────────────────────────────── */
  async function runLatencyTests() {
    if (!latencyGrid) return;

    // Show skeleton cards first
    const targets = window.WebKaarAPI.LATENCY_TARGETS;
    latencyGrid.innerHTML = targets.map(t => `
      <div class="latency-item" id="lat-${t.name.replace(/\s/g,'_')}">
        <div class="latency-icon" style="background:${t.color}22;">
          <span style="font-size:18px;">${t.icon}</span>
        </div>
        <div class="latency-info">
          <div class="latency-server">${escapeHtml(t.name)}</div>
          <div class="latency-ms" style="color:var(--text-muted);">
            <i class="ph-bold ph-spinner ph-spin" style="font-size:14px;"></i>
          </div>
          <div class="latency-bar-wrap">
            <div class="latency-bar" style="width:0%; background:${t.color};"></div>
          </div>
        </div>
      </div>
    `).join('');

    // Run all tests in parallel
    const results = await window.WebKaarAPI.runLatencyTests();

    for (const r of results) {
      const card = document.getElementById('lat-' + r.name.replace(/\s/g,'_'));
      if (!card) continue;

      const msEl  = card.querySelector('.latency-ms');
      const barEl = card.querySelector('.latency-bar');

      if (r.ms === null) {
        msEl.innerHTML = `<span class="latency-fail">Timeout</span>`;
        barEl.style.width = '0%';
        continue;
      }

      const cls   = r.ms < 80  ? 'latency-fast' :
                    r.ms < 200 ? 'latency-medium' : 'latency-slow';
      const pct   = Math.min(100, Math.round((r.ms / 400) * 100));
      const color = r.ms < 80  ? '#10b981' :
                    r.ms < 200 ? '#f59e0b' : '#ef4444';

      msEl.innerHTML = `<span class="${cls}">${r.ms} ms</span>`;
      barEl.style.width      = pct + '%';
      barEl.style.background = color;
    }
  }

  /* ─────────────────────────────────────────────
     DEVICE FINGERPRINT
     BUG FIX: iPadOS 13+ detected as Mac fix
  ───────────────────────────────────────────── */
  function detectDevice() {
    const ua      = navigator.userAgent;
    const platform = navigator.platform || '';
    let browser = 'Unknown';
    let os      = 'Unknown';

    // Browser detection
    if      (ua.includes('Firefox'))      browser = 'Mozilla Firefox';
    else if (ua.includes('SamsungBrowser')) browser = 'Samsung Internet';
    else if (ua.includes('OPR') || ua.includes('Opera')) browser = 'Opera';
    else if (ua.includes('Edg'))           browser = 'Microsoft Edge';
    else if (ua.includes('Chrome'))        browser = 'Google Chrome';
    else if (ua.includes('Safari'))        browser = 'Apple Safari';

    // OS detection — order matters
    if (ua.includes('Android')) {
      os = 'Android';
      const m = ua.match(/Android\s[\d.]+;\s([^;)]+)/);
      if (m) os += ' (' + m[1].trim() + ')';
    }
    // BUG FIX: iPadOS 13+ has Macintosh in UA — check maxTouchPoints
    else if (
      (ua.includes('Mac') || platform.includes('Mac')) &&
      navigator.maxTouchPoints > 1
    ) {
      os = 'iPadOS';
    }
    else if (ua.includes('iPhone') || ua.includes('like Mac OS')) {
      os = 'iOS';
      const m = ua.match(/OS ([\d_]+) like/);
      if (m) os += ' ' + m[1].replace(/_/g,'.');
    }
    else if (ua.includes('Win'))           os = 'Windows';
    else if (ua.includes('Mac'))           os = 'macOS';
    else if (ua.includes('Linux'))         os = 'Linux';
    else if (ua.includes('CrOS'))          os = 'ChromeOS';

    setText(osVal,      os);
    setText(browserVal, browser);
    setText(langVal,    navigator.language || '—');
    setText(screenVal,  `${screen.width}×${screen.height}`);
  }

  /* ─────────────────────────────────────────────
     IP HISTORY — localStorage
  ───────────────────────────────────────────── */
  function getHistory() {
    try {
      return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    } catch (_) {
      return [];
    }
  }

  function saveToHistory(ip) {
    if (!ip || ip === 'Unknown') return;
    try {
      let hist = getHistory();
      // Remove duplicates
      hist = hist.filter(e => e.ip !== ip);
      // Add to front
      hist.unshift({ ip, ts: Date.now() });
      // Trim to limit
      hist = hist.slice(0, HISTORY_LIMIT);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(hist));
    } catch (_) { /* localStorage blocked — fail silently */ }
  }

  function renderHistory() {
    if (!ipHistoryBox) return;
    const hist = getHistory();

    if (!hist.length) {
      ipHistoryBox.innerHTML = '<p class="history-empty">No history yet.</p>';
      return;
    }

    const currentIp = currentData?.ip || null;
    ipHistoryBox.innerHTML = hist.map((entry, i) => {
      const isCurrent = entry.ip === currentIp;
      const time      = formatHistoryTime(entry.ts);
      return `
        <div class="history-item">
          <span class="history-dot ${isCurrent ? 'current' : ''}"></span>
          <span class="history-ip">${escapeHtml(entry.ip)}</span>
          <span class="history-meta">${escapeHtml(time)}</span>
          <button class="history-copy" data-ip="${escapeHtml(entry.ip)}" aria-label="Copy ${escapeHtml(entry.ip)}">
            <i class="ph-bold ph-copy"></i>
          </button>
        </div>
      `;
    }).join('');

    // Copy buttons via event delegation
    ipHistoryBox.querySelectorAll('.history-copy').forEach(btn => {
      btn.addEventListener('click', () => {
        copyToClipboard(btn.dataset.ip, () => showToast('Copied ' + btn.dataset.ip + ' ✓'));
      });
    });
  }

  clearHistoryBtn?.addEventListener('click', () => {
    try { localStorage.removeItem(HISTORY_KEY); } catch (_) {}
    renderHistory();
    showToast('History cleared');
  });

  function formatHistoryTime(ts) {
    if (!ts) return '';
    const d   = new Date(ts);
    const now = new Date();
    const diffMs  = now - d;
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1)  return 'Just now';
    if (diffMin < 60) return diffMin + 'm ago';
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24)   return diffH + 'h ago';
    return d.toLocaleDateString();
  }

  /* ─────────────────────────────────────────────
     REFRESH
  ───────────────────────────────────────────── */
  refreshBtn?.addEventListener('click', () => {
    if (isLoading) return;
    currentData   = null;
    ipv4Address   = null;
    ipv6Address   = null;
    activeVersion = 'ipv4';
    startFetch();
  });

  /* ─────────────────────────────────────────────
     ERROR STATE
     BUG FIX: hides details box on error
  ───────────────────────────────────────────── */
  function showError(msg) {
    setText(ipDisplay, 'Offline');
    setHTML(ispDisplay, `<i class="ph-bold ph-warning-circle"></i> ${escapeHtml(msg)}`);
    typeDisplay.classList.add('hidden');
    vpnBadge.classList.add('hidden');
    mainCard.classList.add('offline-mode');
    // BUG FIX: hide stale data
    detailsBox.classList.add('hidden');
  }

  /* ─────────────────────────────────────────────
     COPY IP BUTTON
     BUG FIX: HTTP clipboard fallback
  ───────────────────────────────────────────── */
  copyBtn?.addEventListener('click', () => {
    const ip = ipDisplay.textContent.trim();
    if (!ip || ip === 'Offline' || ip === 'Detecting...' || ip === 'No IPv6') return;

    copyToClipboard(ip, () => {
      const orig = copyBtn.innerHTML;
      copyBtn.innerHTML = '<i class="ph-bold ph-check" style="color:#10b981;"></i>';
      setTimeout(() => { copyBtn.innerHTML = orig; }, 2000);
      showToast('Copied: ' + ip + ' ✓');
    });
  });

  /* ─────────────────────────────────────────────
     MODAL
     BUG FIX: no display:none — uses opacity+visibility
     so CSS transition works properly
  ───────────────────────────────────────────── */
  infoBtn?.addEventListener('click',       () => infoModal?.classList.remove('hidden'));
  closeModalBtn?.addEventListener('click', () => infoModal?.classList.add('hidden'));
  infoModal?.addEventListener('click', (e) => {
    if (e.target === infoModal) infoModal.classList.add('hidden');
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && infoModal && !infoModal.classList.contains('hidden')) {
      infoModal.classList.add('hidden');
    }
  });

  /* ─────────────────────────────────────────────
     TOAST
  ───────────────────────────────────────────── */
  function showToast(msg, isError = false) {
    clearTimeout(toastTimer);
    toastEl.textContent = msg;
    toastEl.className   = 'toast toast--visible' + (isError ? ' toast--error' : '');
    toastTimer = setTimeout(() => {
      toastEl.className = 'toast';
    }, 3000);
  }

  /* ─────────────────────────────────────────────
     CLIPBOARD HELPER
     BUG FIX: HTTP + old browser fallback
  ───────────────────────────────────────────── */
  function copyToClipboard(text, onSuccess) {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text)
        .then(() => onSuccess?.())
        .catch(() => fallbackCopy(text, onSuccess));
    } else {
      fallbackCopy(text, onSuccess);
    }
  }

  function fallbackCopy(text, onSuccess) {
    const el = document.createElement('textarea');
    el.value = text;
    el.setAttribute('readonly', '');
    el.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0;';
    document.body.appendChild(el);
    el.focus();
    el.select();
    try { document.execCommand('copy'); onSuccess?.(); } catch (_) {}
    document.body.removeChild(el);
  }

  /* ─────────────────────────────────────────────
     COUNTRY CODE → EMOJI FLAG
  ───────────────────────────────────────────── */
  function countryCodeToEmoji(cc) {
    if (!cc || cc.length !== 2) return '🌐';
    try {
      return String.fromCodePoint(
        ...cc.toUpperCase().split('').map(c => 0x1F1E0 - 65 + c.charCodeAt(0))
      );
    } catch (_) { return '🌐'; }
  }

  /* ─────────────────────────────────────────────
     DOM HELPERS
  ───────────────────────────────────────────── */
  function setText(el, val) {
    if (el) el.textContent = val ?? '—';
  }
  function setHTML(el, val) {
    if (el) el.innerHTML = val ?? '';
  }
  function escapeHtml(str) {
    if (typeof str !== 'string') return String(str ?? '');
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

}); // end DOMContentLoaded