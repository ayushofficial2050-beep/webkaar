// DOM Elements
const colorDisplay = document.getElementById('color-display');
const nativePicker = document.getElementById('native-picker');
const hexInput = document.getElementById('hex-input');
const rgbInput = document.getElementById('rgb-input');

// Sliders
const rSlider = document.getElementById('r-slider');
const gSlider = document.getElementById('g-slider');
const bSlider = document.getElementById('b-slider');
const rVal = document.getElementById('r-val');
const gVal = document.getElementById('g-val');
const bVal = document.getElementById('b-val');

// Palette
const paletteGrid = document.getElementById('palette-grid');

// Modal & Toast
const toast = document.getElementById('toast');
const infoBtn = document.getElementById('info-btn');
const infoModal = document.getElementById('info-modal');
const closeModal = document.getElementById('close-modal');

// --- POPULAR COLORS ---
const POPULAR_COLORS = [
    '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981',
    '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#d946ef',
    '#f43f5e', '#0f172a', '#64748b', '#94a3b8', '#ffffff'
];

// --- INIT ---
function init() {
    renderPalette();
    updateUIFromHex(nativePicker.value);
}

// --- CORE FUNCTIONS ---

// 1. Update from Native Picker (Circle Click)
nativePicker.addEventListener('input', (e) => {
    updateUIFromHex(e.target.value);
});

// 2. Update from Sliders
function updateFromSliders() {
    const r = parseInt(rSlider.value);
    const g = parseInt(gSlider.value);
    const b = parseInt(bSlider.value);
    
    // Update Labels
    rVal.innerText = r;
    gVal.innerText = g;
    bVal.innerText = b;

    // Convert to Hex
    const hex = rgbToHex(r, g, b);
    
    // Update UI
    hexInput.value = hex;
    rgbInput.value = `rgb(${r}, ${g}, ${b})`;
    colorDisplay.style.backgroundColor = hex;
    
    // Sync Native Picker (without triggering input event)
    nativePicker.value = hex;
}

// Sliders Event Listeners
[rSlider, gSlider, bSlider].forEach(slider => {
    slider.addEventListener('input', updateFromSliders);
});

// 3. Update from Hex Input (Typing)
hexInput.addEventListener('input', (e) => {
    let hex = e.target.value;
    if (hex.startsWith('#') && (hex.length === 4 || hex.length === 7)) {
        updateUIFromHex(hex);
    }
});

// Helper: Master Update Function
function updateUIFromHex(hex) {
    if (!isValidHex(hex)) return;

    // Set Background
    colorDisplay.style.backgroundColor = hex;
    nativePicker.value = hex; // Sync native input
    hexInput.value = hex;

    // Convert to RGB
    const rgb = hexToRgb(hex);
    if (rgb) {
        rgbInput.value = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
        
        // Sync Sliders
        rSlider.value = rgb.r;
        gSlider.value = rgb.g;
        bSlider.value = rgb.b;
        
        rVal.innerText = rgb.r;
        gVal.innerText = rgb.g;
        bVal.innerText = rgb.b;
    }
}

// --- UTILS ---

function hexToRgb(hex) {
    // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);

    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

function rgbToHex(r, g, b) {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
}

function isValidHex(hex) {
    return /^#([0-9A-F]{3}){1,2}$/i.test(hex);
}

// --- PALETTE RENDER ---
function renderPalette() {
    POPULAR_COLORS.forEach(color => {
        const div = document.createElement('div');
        div.className = 'palette-item';
        div.style.backgroundColor = color;
        div.addEventListener('click', () => updateUIFromHex(color));
        paletteGrid.appendChild(div);
    });
}

// --- COPY TO CLIPBOARD ---
document.querySelectorAll('.copy-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const targetId = btn.dataset.target;
        const input = document.getElementById(targetId);
        
        navigator.clipboard.writeText(input.value).then(() => {
            showToast();
        });
    });
});

function showToast() {
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 2000);
}

// --- MODAL ---
infoBtn.addEventListener('click', () => infoModal.classList.remove('hidden'));
closeModal.addEventListener('click', () => infoModal.classList.add('hidden'));
infoModal.addEventListener('click', (e) => {
    if (e.target === infoModal) infoModal.classList.add('hidden');
});

// Run
init();