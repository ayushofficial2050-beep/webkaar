/**
 * Pro IP Checker Script (Fixed OS Detection & Modal)
 */
const ipDisplay = document.getElementById('ip-display');
const ispDisplay = document.getElementById('isp-display');
const typeDisplay = document.getElementById('type-display');
const detailsBox = document.getElementById('details-box');
const refreshBtn = document.getElementById('refresh-btn');
const mainCard = document.getElementById('ip-card-main');
const copyBtn = document.getElementById('copy-ip-btn');
const mapFrame = document.getElementById('map-frame');

// Detail Fields
const locationVal = document.getElementById('location-val');
const countryVal = document.getElementById('country-val');
const flagIcon = document.getElementById('flag-icon');
const timezoneVal = document.getElementById('timezone-val');
const osVal = document.getElementById('os-val');
const browserVal = document.getElementById('browser-val');

// Modal Elements
const infoBtn = document.getElementById('info-btn');
const closeModal = document.getElementById('close-modal');
const infoModal = document.getElementById('info-modal');

document.addEventListener('DOMContentLoaded', () => {
    fetchIPData();
    detectDevice();
});

refreshBtn.addEventListener('click', () => {
    ipDisplay.innerHTML = "Loading...";
    ispDisplay.innerHTML = '<i class="ph-bold ph-spinner ph-spin"></i> Fetching...';
    typeDisplay.classList.add('hidden');
    mainCard.classList.remove('offline-mode');
    detailsBox.classList.add('hidden');
    fetchIPData();
});

async function fetchIPData() {
    if (!window.WebKaarAPI) {
        showError("API Module Missing");
        return;
    }

    try {
        const data = await window.WebKaarAPI.getNetworkInfo();
        if (data.success) {
            updateUI(data);
        } else {
            throw new Error(data.error);
        }
    } catch (error) {
        console.error(error);
        showError("Check Connection");
    }
}

function updateUI(data) {
    mainCard.classList.remove('offline-mode');
    
    ipDisplay.innerText = data.ip;
    ispDisplay.innerHTML = `<i class="ph-bold ph-wifi-high"></i> ${data.isp || "Unknown ISP"}`;
    
    typeDisplay.classList.remove('hidden');
    typeDisplay.innerText = data.ip.includes(':') ? 'IPv6' : 'IPv4';

    locationVal.innerText = `${data.city || 'Hidden'}, ${data.country || 'Hidden'}`;
    countryVal.innerText = data.country || 'Unknown';
    
    if(data.flag) {
        flagIcon.innerHTML = `<img src="${data.flag}" width="22" style="border-radius:3px; box-shadow:0 2px 4px rgba(0,0,0,0.1);">`;
    } else {
        flagIcon.innerText = "🌐";
    }

    timezoneVal.innerText = data.timezone || '-';
    
    if(data.lat && data.lon) {
        const bboxOffset = 0.5;
        const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${data.lon - bboxOffset},${data.lat - bboxOffset},${data.lon + bboxOffset},${data.lat + bboxOffset}&layer=mapnik&marker=${data.lat},${data.lon}`;
        mapFrame.src = mapUrl;
        mapFrame.parentElement.style.display = 'block';
    } else {
        mapFrame.parentElement.style.display = 'none';
    }

    detailsBox.classList.remove('hidden');
}

function showError(msg) {
    ipDisplay.innerText = "Offline";
    ispDisplay.innerHTML = `<i class="ph-bold ph-warning-circle"></i> ${msg}`;
    typeDisplay.classList.add('hidden');
    mainCard.classList.add('offline-mode');
}

// Copy IP Logic
copyBtn.addEventListener('click', () => {
    if(ipDisplay.innerText !== "Offline" && ipDisplay.innerText !== "Loading..." && ipDisplay.innerText !== "Detecting...") {
        navigator.clipboard.writeText(ipDisplay.innerText);
        const originalHtml = copyBtn.innerHTML;
        copyBtn.innerHTML = '<i class="ph-bold ph-check" style="color:#10b981;"></i>';
        setTimeout(() => copyBtn.innerHTML = originalHtml, 2000);
    }
});

// Fixed Device Fingerprint Detection
function detectDevice() {
    const ua = navigator.userAgent;
    let browser = "Unknown";
    let os = "Unknown";

    // Detect Browser
    if (ua.includes("Firefox")) browser = "Mozilla Firefox";
    else if (ua.includes("SamsungBrowser")) browser = "Samsung Internet";
    else if (ua.includes("Opera") || ua.includes("OPR")) browser = "Opera";
    else if (ua.includes("Edge") || ua.includes("Edg")) browser = "Microsoft Edge";
    else if (ua.includes("Chrome")) browser = "Google Chrome";
    else if (ua.includes("Safari")) browser = "Apple Safari";

    // Detect OS (Order matters!)
    if (ua.includes("Android")) {
        os = "Android";
        // Attempt to extract mobile model if present in UA string
        const match = ua.match(/Android\s[0-9\.]+;\s([^;]+)\sBuild/);
        if (match) os += ` (${match[1]})`;
    } 
    else if (ua.includes("Win")) os = "Windows";
    else if (ua.includes("like Mac")) os = "iOS";
    else if (ua.includes("Mac")) os = "Mac OS";
    else if (ua.includes("Linux")) os = "Linux";

    osVal.innerText = os;
    browserVal.innerText = browser;
}

// Modal Logic
if(infoBtn) infoBtn.addEventListener('click', () => infoModal.classList.remove('hidden'));
if(closeModal) closeModal.addEventListener('click', () => infoModal.classList.add('hidden'));
if(infoModal) infoModal.addEventListener('click', (e) => {
    if(e.target === infoModal) infoModal.classList.add('hidden');
});