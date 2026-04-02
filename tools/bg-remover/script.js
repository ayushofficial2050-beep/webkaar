// ============================================
//   BG REMOVER PRO - SCRIPT
//   WebKaar Tools | script.js
//   AI: RMBG-1.4 via Transformers.js (CDN)
// ============================================

// Load Transformers.js from CDN
import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.5.2/+esm';

// Disable local model loading — use HuggingFace CDN
env.allowLocalModels = false;

// ── STATE ─────────────────────────────────
let segmentator   = null;
let modelReady    = false;
let currentMask   = null;
let currentSrc    = null;
let selectedBg    = 'transparent';

// ── ELEMENTS ──────────────────────────────
const fileInput        = document.getElementById('file-input');
const uploadArea       = document.getElementById('upload-area');
const uploadBtn        = document.getElementById('upload-btn');
const editorArea       = document.getElementById('editor-area');
const originalImg      = document.getElementById('original-img');
const resultCanvas     = document.getElementById('result-canvas');
const resultCtx        = resultCanvas.getContext('2d');
const processingOvl    = document.getElementById('processing-overlay');
const procText         = document.getElementById('proc-text');
const modelBanner      = document.getElementById('model-banner');
const modelSub         = document.getElementById('model-sub');
const modelFill        = document.getElementById('model-progress-fill');
const bgOptions        = document.getElementById('bg-options');
const downloadSection  = document.getElementById('download-section');
const downloadPng      = document.getElementById('download-png');
const downloadJpg      = document.getElementById('download-jpg');
const newImageBtn      = document.getElementById('new-image-btn');
const retryBtn         = document.getElementById('retry-btn');
const toastEl          = document.getElementById('toast');
const infoBtn          = document.getElementById('info-btn');
const modal            = document.getElementById('info-modal');
const closeModal       = document.getElementById('close-modal');
const customColor      = document.getElementById('custom-color');

// ── TOAST ─────────────────────────────────
let toastTimer = null;
function showToast(msg) {
    if (toastTimer) clearTimeout(toastTimer);
    toastEl.textContent = msg;
    toastEl.classList.remove('hidden');
    void toastEl.offsetWidth;
    toastEl.classList.add('show');
    toastTimer = setTimeout(() => {
        toastEl.classList.remove('show');
        setTimeout(() => toastEl.classList.add('hidden'), 300);
    }, 3000);
}

// ── LOAD AI MODEL ─────────────────────────
async function loadModel() {
    if (modelReady) return true;
    modelBanner.classList.remove('hidden');
    modelSub.textContent = 'Downloading RMBG-1.4 (~45MB) first time only...';

    // Animate progress bar (indeterminate)
    let prog = 0;
    const progInterval = setInterval(() => {
        prog = Math.min(prog + Math.random() * 8, 90);
        modelFill.style.width = prog + '%';
    }, 400);

    try {
        segmentator = await pipeline(
            'image-segmentation',
            'briaai/RMBG-1.4',
            { device: 'wasm' }
        );
        clearInterval(progInterval);
        modelFill.style.width = '100%';
        await new Promise(r => setTimeout(r, 400));
        modelBanner.classList.add('hidden');
        modelReady = true;
        return true;
    } catch (err) {
        clearInterval(progInterval);
        modelBanner.classList.add('hidden');
        showToast('Model load failed. Check connection and retry.');
        console.error('Model load error:', err);
        return false;
    }
}

// ── UPLOAD ────────────────────────────────
uploadBtn.addEventListener('click', () => fileInput.click());
uploadArea.addEventListener('click', (e) => { if (e.target !== uploadBtn) fileInput.click(); });
fileInput.addEventListener('change', (e) => { if (e.target.files[0]) handleFile(e.target.files[0]); });

uploadArea.addEventListener('dragover', (e) => { e.preventDefault(); uploadArea.classList.add('drag-over'); });
uploadArea.addEventListener('dragleave', () => uploadArea.classList.remove('drag-over'));
uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('drag-over');
    const f = e.dataTransfer.files[0];
    if (f && f.type.startsWith('image/')) handleFile(f);
    else showToast('Please drop a valid image file');
});

// ── HANDLE FILE ───────────────────────────
async function handleFile(file) {
    const url = URL.createObjectURL(file);
    currentSrc = url;
    originalImg.src = url;

    // Show editor, hide upload
    uploadArea.classList.add('hidden');
    editorArea.classList.remove('hidden');
    bgOptions.classList.add('hidden');
    downloadSection.classList.add('hidden');
    retryBtn.classList.add('hidden');
    processingOvl.classList.remove('hidden');
    procText.textContent = 'Loading AI model...';

    // Load model if needed
    const ready = await loadModel();
    if (!ready) {
        processingOvl.classList.add('hidden');
        retryBtn.classList.remove('hidden');
        return;
    }

    await removeBackground(url);
}

// ── REMOVE BACKGROUND ─────────────────────
async function removeBackground(imgUrl) {
    processingOvl.classList.remove('hidden');
    procText.textContent = 'Removing background...';

    try {
        const result = await segmentator(imgUrl, {
            threshold: 0.5,
            mask_threshold: 0.5,
            overlap_mask_area_threshold: 0.8
        });

        // result[0].mask is the foreground mask
        const mask = result[0].mask;
        currentMask = mask;

        // Draw result on canvas
        await applyMaskToCanvas(imgUrl, mask);

        processingOvl.classList.add('hidden');
        bgOptions.classList.remove('hidden');
        downloadSection.classList.remove('hidden');
        retryBtn.classList.remove('hidden');
        showToast('Background removed!');

    } catch (err) {
        processingOvl.classList.add('hidden');
        retryBtn.classList.remove('hidden');
        showToast('Processing failed. Tap Retry.');
        console.error('BG removal error:', err);
    }
}

// ── APPLY MASK ────────────────────────────
async function applyMaskToCanvas(imgUrl, mask) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            const w = img.naturalWidth;
            const h = img.naturalHeight;

            resultCanvas.width  = w;
            resultCanvas.height = h;

            // Draw original image
            resultCtx.clearRect(0, 0, w, h);
            resultCtx.drawImage(img, 0, 0);

            // Apply mask — make bg transparent
            const imageData = resultCtx.getImageData(0, 0, w, h);
            const data = imageData.data;

            // mask.data is Float32Array of values 0-1
            const maskData = mask.data;
            const mW = mask.width;
            const mH = mask.height;

            for (let y = 0; y < h; y++) {
                for (let x = 0; x < w; x++) {
                    const imgIdx  = (y * w + x) * 4;

                    // Scale mask coords to image coords
                    const mx = Math.round((x / w) * mW);
                    const my = Math.round((y / h) * mH);
                    const mIdx = my * mW + mx;

                    const alpha = maskData[mIdx]; // 0 = bg, 1 = fg
                    data[imgIdx + 3] = Math.round(alpha * 255);
                }
            }

            resultCtx.putImageData(imageData, 0, 0);

            // Apply background color if needed
            applyBackground();
            resolve();
        };
        img.src = imgUrl;
    });
}

// ── APPLY BACKGROUND ──────────────────────
function applyBackground() {
    if (!currentMask || !currentSrc) return;
    if (selectedBg === 'transparent') {
        // Re-apply just the mask (already done)
        // Redraw with transparent bg
        applyMaskToCanvas(currentSrc, currentMask);
        return;
    }

    // Draw background color under the masked image
    const w = resultCanvas.width;
    const h = resultCanvas.height;

    // Get current masked image
    const maskedData = resultCtx.getImageData(0, 0, w, h);

    // Fill background
    resultCtx.clearRect(0, 0, w, h);
    resultCtx.fillStyle = selectedBg;
    resultCtx.fillRect(0, 0, w, h);

    // Draw masked image on top
    resultCtx.putImageData(maskedData, 0, 0);
}

// We need a separate approach for bg color:
// Store the RGBA masked canvas data, then composite
let maskedImageData = null;

async function applyMaskToCanvasFull(imgUrl, mask) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            const w = img.naturalWidth;
            const h = img.naturalHeight;
            resultCanvas.width  = w;
            resultCanvas.height = h;

            // Offscreen canvas for masked image
            const offscreen = document.createElement('canvas');
            offscreen.width  = w;
            offscreen.height = h;
            const offCtx = offscreen.getContext('2d');

            offCtx.drawImage(img, 0, 0);
            const imageData = offCtx.getImageData(0, 0, w, h);
            const data = imageData.data;
            const maskData = mask.data;
            const mW = mask.width;
            const mH = mask.height;

            for (let y = 0; y < h; y++) {
                for (let x = 0; x < w; x++) {
                    const idx = (y * w + x) * 4;
                    const mx  = Math.round((x / w) * mW);
                    const my  = Math.round((y / h) * mH);
                    const alpha = maskData[my * mW + mx];
                    data[idx + 3] = Math.round(alpha * 255);
                }
            }

            offCtx.putImageData(imageData, 0, 0);
            maskedImageData = offscreen; // Store for bg changes

            // Now draw to result canvas with current bg
            renderWithBackground();
            resolve();
        };
        img.src = imgUrl;
    });
}

function renderWithBackground() {
    if (!maskedImageData) return;
    const w = maskedImageData.width;
    const h = maskedImageData.height;
    resultCanvas.width  = w;
    resultCanvas.height = h;
    resultCtx.clearRect(0, 0, w, h);

    if (selectedBg !== 'transparent') {
        resultCtx.fillStyle = selectedBg;
        resultCtx.fillRect(0, 0, w, h);
    }

    resultCtx.drawImage(maskedImageData, 0, 0);
}

// Override the apply mask function
async function removeBackgroundFull(imgUrl) {
    processingOvl.classList.remove('hidden');
    procText.textContent = 'Removing background...';
    try {
        const result = await segmentator(imgUrl, {
            threshold: 0.5,
            mask_threshold: 0.5,
            overlap_mask_area_threshold: 0.8
        });
        const mask = result[0].mask;
        currentMask = mask;
        await applyMaskToCanvasFull(imgUrl, mask);
        processingOvl.classList.add('hidden');
        bgOptions.classList.remove('hidden');
        downloadSection.classList.remove('hidden');
        retryBtn.classList.remove('hidden');
        showToast('Background removed!');
    } catch (err) {
        processingOvl.classList.add('hidden');
        retryBtn.classList.remove('hidden');
        showToast('Processing failed. Tap Retry.');
        console.error(err);
    }
}

// Override handleFile to use full version
async function handleFileFull(file) {
    const url = URL.createObjectURL(file);
    currentSrc = url;
    originalImg.src = url;
    maskedImageData = null;

    uploadArea.classList.add('hidden');
    editorArea.classList.remove('hidden');
    bgOptions.classList.add('hidden');
    downloadSection.classList.add('hidden');
    retryBtn.classList.add('hidden');
    processingOvl.classList.remove('hidden');
    procText.textContent = 'Loading AI model...';

    const ready = await loadModel();
    if (!ready) {
        processingOvl.classList.add('hidden');
        retryBtn.classList.remove('hidden');
        return;
    }
    await removeBackgroundFull(url);
}

// Override the event listener
fileInput.removeEventListener('change', () => {});
fileInput.addEventListener('change', (e) => { if (e.target.files[0]) handleFileFull(e.target.files[0]); });
uploadArea.removeEventListener('drop', () => {});
uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('drag-over');
    const f = e.dataTransfer.files[0];
    if (f && f.type.startsWith('image/')) handleFileFull(f);
    else showToast('Please drop a valid image file');
});

// ── BG OPTIONS ────────────────────────────
document.querySelectorAll('.bg-opt').forEach(btn => {
    btn.addEventListener('click', () => {
        const bg = btn.dataset.bg;
        if (bg === 'custom') return; // handled by color input
        document.querySelectorAll('.bg-opt').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedBg = bg;
        renderWithBackground();
    });
});

customColor.addEventListener('input', (e) => {
    selectedBg = e.target.value;
    document.querySelectorAll('.bg-opt').forEach(b => b.classList.remove('active'));
    document.querySelector('[data-bg="custom"]').classList.add('active');
    renderWithBackground();
});

// ── RETRY ─────────────────────────────────
retryBtn.addEventListener('click', () => {
    if (currentSrc) {
        retryBtn.classList.add('hidden');
        removeBackgroundFull(currentSrc);
    }
});

// ── NEW IMAGE ─────────────────────────────
newImageBtn.addEventListener('click', () => {
    currentSrc      = null;
    currentMask     = null;
    maskedImageData = null;
    fileInput.value = '';
    editorArea.classList.add('hidden');
    uploadArea.classList.remove('hidden');
    downloadSection.classList.add('hidden');
    bgOptions.classList.add('hidden');
});

// ── DOWNLOAD ──────────────────────────────
downloadPng.addEventListener('click', () => {
    // PNG with transparency — render without bg
    const w = maskedImageData ? maskedImageData.width : resultCanvas.width;
    const h = maskedImageData ? maskedImageData.height : resultCanvas.height;
    const tmp = document.createElement('canvas');
    tmp.width = w; tmp.height = h;
    const tCtx = tmp.getContext('2d');
    tCtx.clearRect(0, 0, w, h);
    if (maskedImageData) tCtx.drawImage(maskedImageData, 0, 0);
    else tCtx.drawImage(resultCanvas, 0, 0);
    const link = document.createElement('a');
    link.download = 'webkaar-bg-removed.png';
    link.href = tmp.toDataURL('image/png');
    link.click();
    showToast('Downloaded: PNG with transparency');
});

downloadJpg.addEventListener('click', () => {
    const w = resultCanvas.width;
    const h = resultCanvas.height;
    const tmp = document.createElement('canvas');
    tmp.width = w; tmp.height = h;
    const tCtx = tmp.getContext('2d');
    // Fill white if transparent selected
    const bg = selectedBg === 'transparent' ? '#ffffff' : selectedBg;
    tCtx.fillStyle = bg;
    tCtx.fillRect(0, 0, w, h);
    if (maskedImageData) tCtx.drawImage(maskedImageData, 0, 0);
    else tCtx.drawImage(resultCanvas, 0, 0);
    const link = document.createElement('a');
    link.download = 'webkaar-bg-removed.jpg';
    link.href = tmp.toDataURL('image/jpeg', 0.95);
    link.click();
    showToast('Downloaded: JPG');
});

// ── INFO MODAL ────────────────────────────
infoBtn.addEventListener('click',    () => modal.classList.remove('hidden'));
closeModal.addEventListener('click', () => modal.classList.add('hidden'));
modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.add('hidden'); });

// ── PRELOAD MODEL ON PAGE LOAD ─────────────
// Start loading model in background silently
setTimeout(() => {
    if (!modelReady) {
        loadModel().catch(() => {});
    }
}, 1000);
