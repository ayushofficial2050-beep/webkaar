/* ═══════════════════════════════════════════════════
   IP CHECKER PRO — api.js
   WebKaar | Ayush Tiwari | Ultimate Edition
   Rock-solid API handler:
    ✔ 3-endpoint fallback chain
    ✔ Per-request AbortController timeout
    ✔ ipwho.is success === true guard
    ✔ ipapi.co country_code fix (flag URL)
    ✔ IPv4 & IPv6 separate fetch (api4/api6.ipify.org)
    ✔ Normalized output schema — always same shape
    ✔ Graceful degradation — partial data shown
    ✔ No crashes on missing fields
═══════════════════════════════════════════════════ */

'use strict';

(function (global) {

  /* ─────────────────────────────────────────────
     CONFIG
  ───────────────────────────────────────────── */
  const TIMEOUT_MS = 5000; // 5s per request — safe for mobile

  const ENDPOINTS = {
    // Primary — richest free IP data (VPN, ASN, security)
    ipwho:   'https://ipwho.is/',
    // Secondary fallback
    ipapi:   'https://ipapi.co/json/',
    // Last resort — IP only
    ipify:   'https://api.ipify.org?format=json',
    // IPv4 forced
    ipify4:  'https://api4.ipify.org?format=json',
    // IPv6 forced (returns error object if device has no IPv6)
    ipify6:  'https://api6.ipify.org?format=json',
  };

  /* ─────────────────────────────────────────────
     CORE FETCH WITH TIMEOUT
  ───────────────────────────────────────────── */
  async function fetchWithTimeout(url) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(url, {
        signal: controller.signal,
        // Prevent stale cached responses
        cache: 'no-cache',
      });
      clearTimeout(timer);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return await res.json();
    } catch (err) {
      clearTimeout(timer);
      // AbortError = timeout, TypeError = offline
      return null;
    }
  }

  /* ─────────────────────────────────────────────
     NORMALIZE: ipwho.is → standard schema
  ───────────────────────────────────────────── */
  function normalizeIpwho(d) {
    // BUG FIX: guard success === true explicitly
    if (!d || d.success !== true) return null;

    const conn = d.connection || {};
    const sec  = d.security   || {};
    const tz   = d.timezone   || {};
    const flag = d.flag       || {};

    return {
      ip:          d.ip           || '',
      ipVersion:   d.type         || (d.ip && d.ip.includes(':') ? 'IPv6' : 'IPv4'),
      city:        d.city         || '',
      region:      d.region       || '',
      country:     d.country      || '',
      countryCode: (d.country_code || '').toLowerCase(),
      flagImg:     flag.img       || '',
      timezone:    tz.id          || d.timezone || '',
      lat:         d.latitude     || null,
      lon:         d.longitude    || null,
      isp:         conn.isp       || conn.org || '',
      asn:         conn.asn       ? 'AS' + conn.asn : '',
      asnDomain:   conn.domain    || '',
      isVpn:       sec.vpn        === true,
      isProxy:     sec.proxy      === true,
      isTor:       sec.tor        === true,
      isRelay:     sec.relay      === true,
      source:      'ipwho.is',
    };
  }

  /* ─────────────────────────────────────────────
     NORMALIZE: ipapi.co → standard schema
  ───────────────────────────────────────────── */
  function normalizeIpapi(d) {
    if (!d || d.error) return null;
    // BUG FIX: use country_code not country for flag URL
    const cc = (d.country_code || '').toLowerCase();
    return {
      ip:          d.ip              || '',
      ipVersion:   d.ip && d.ip.includes(':') ? 'IPv6' : 'IPv4',
      city:        d.city            || '',
      region:      d.region          || '',
      country:     d.country_name    || d.country || '',
      countryCode: cc,
      flagImg:     cc ? `https://flagcdn.com/24x18/${cc}.png` : '',
      timezone:    d.timezone        || '',
      lat:         d.latitude        || null,
      lon:         d.longitude       || null,
      isp:         d.org             || d.asn || '',
      asn:         d.asn             || '',
      asnDomain:   '',
      isVpn:       false,  // ipapi.co free tier has no security data
      isProxy:     false,
      isTor:       false,
      isRelay:     false,
      source:      'ipapi.co',
    };
  }

  /* ─────────────────────────────────────────────
     NORMALIZE: ipify (bare IP fallback)
  ───────────────────────────────────────────── */
  function normalizeIpify(d) {
    if (!d || !d.ip) return null;
    return {
      ip:          d.ip,
      ipVersion:   d.ip.includes(':') ? 'IPv6' : 'IPv4',
      city:        '',
      region:      '',
      country:     '',
      countryCode: '',
      flagImg:     '',
      timezone:    '',
      lat:         null,
      lon:         null,
      isp:         '',
      asn:         '',
      asnDomain:   '',
      isVpn:       false,
      isProxy:     false,
      isTor:       false,
      isRelay:     false,
      source:      'ipify',
    };
  }

  /* ─────────────────────────────────────────────
     MAIN: GET NETWORK INFO
     Returns normalized object or { success: false }
  ───────────────────────────────────────────── */
  async function getNetworkInfo() {
    // 1. Try ipwho.is
    const ipwhoData = await fetchWithTimeout(ENDPOINTS.ipwho);
    const fromIpwho = normalizeIpwho(ipwhoData);
    if (fromIpwho) return { success: true, ...fromIpwho };

    // 2. Try ipapi.co
    const ipapiData = await fetchWithTimeout(ENDPOINTS.ipapi);
    const fromIpapi = normalizeIpapi(ipapiData);
    if (fromIpapi) return { success: true, ...fromIpapi };

    // 3. Last resort — bare IP from ipify
    const ipifyData = await fetchWithTimeout(ENDPOINTS.ipify);
    const fromIpify = normalizeIpify(ipifyData);
    if (fromIpify) return { success: true, ...fromIpify };

    // All failed
    return { success: false, error: 'All APIs failed — check your connection.' };
  }

  /* ─────────────────────────────────────────────
     IPv4 / IPv6 SEPARATE FETCH
     Returns { ipv4: '...', ipv6: '...' | null }
  ───────────────────────────────────────────── */
  async function getBothIPVersions() {
    const [r4, r6] = await Promise.allSettled([
      fetchWithTimeout(ENDPOINTS.ipify4),
      fetchWithTimeout(ENDPOINTS.ipify6),
    ]);

    const ipv4 = (r4.status === 'fulfilled' && r4.value?.ip) ? r4.value.ip : null;
    const ipv6 = (r6.status === 'fulfilled' && r6.value?.ip && r6.value.ip.includes(':'))
      ? r6.value.ip
      : null;

    return { ipv4, ipv6 };
  }

  /* ─────────────────────────────────────────────
     BLACKLIST CHECK
     Checks against free public DNS blacklist APIs.
     Returns { clean: bool, checked: number, listed: number, lists: [] }
  ───────────────────────────────────────────── */
  async function checkBlacklist(ip) {
    // We use the free stopforumspam.org API — no key needed
    // Returns { success, appears } for the IP
    const url = `https://api.stopforumspam.org/api?ip=${encodeURIComponent(ip)}&json`;

    try {
      const data = await fetchWithTimeout(url);
      if (!data) return { clean: null, checked: 1, listed: 0, source: 'unavailable' };

      const appears = data?.ip?.appears === 1;
      return {
        clean:   !appears,
        checked: 1,
        listed:  appears ? 1 : 0,
        source:  'StopForumSpam',
        frequency: data?.ip?.frequency || 0,
      };
    } catch (_) {
      return { clean: null, checked: 0, listed: 0, source: 'unavailable' };
    }
  }

  /* ─────────────────────────────────────────────
     LATENCY TEST
     Pings multiple endpoints via fetch HEAD request
     and measures round-trip time using performance.now()
  ───────────────────────────────────────────── */
  const LATENCY_TARGETS = [
    { name: 'Google',     icon: '🔵', url: 'https://www.google.com/generate_204',    color: '#4285f4' },
    { name: 'Cloudflare', icon: '🟠', url: 'https://1.1.1.1/cdn-cgi/trace',          color: '#f48120' },
    { name: 'GitHub',     icon: '⚫', url: 'https://github.com/favicon.ico',          color: '#333' },
    { name: 'Fastly CDN', icon: '🟣', url: 'https://www.fastly.com/favicon.ico',     color: '#ff282d' },
  ];

  async function measureLatency(url) {
    const REPS = 3; // Average of 3 pings for accuracy
    const times = [];

    for (let i = 0; i < REPS; i++) {
      try {
        const start = performance.now();
        await fetch(url + '?_t=' + Date.now(), {
          method: 'HEAD',
          mode: 'no-cors',
          cache: 'no-store',
        });
        const end = performance.now();
        times.push(Math.round(end - start));
      } catch (_) {
        // ignore individual rep failure
      }
    }

    if (times.length === 0) return null;
    // Drop highest outlier if we have 3 results
    if (times.length === 3) times.sort((a,b) => a-b).pop();
    return Math.round(times.reduce((a,b) => a+b, 0) / times.length);
  }

  async function runLatencyTests() {
    const results = await Promise.all(
      LATENCY_TARGETS.map(async (target) => {
        const ms = await measureLatency(target.url);
        return { ...target, ms };
      })
    );
    return results;
  }

  /* ─────────────────────────────────────────────
     EXPORT — attach to window
  ───────────────────────────────────────────── */
  global.WebKaarAPI = {
    getNetworkInfo,
    getBothIPVersions,
    checkBlacklist,
    runLatencyTests,
    LATENCY_TARGETS,
  };

})(window);