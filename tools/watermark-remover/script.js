// ============================================
//   WATERMARK REMOVER - SCRIPT
//   WebKaar Tools | script.js
//   Algorithm: Patch-based inpainting (no blur)
// ============================================

document.addEventListener('DOMContentLoaded', () => {

    // ── ELEMENTS ──────────────────────────────
    const fileInput          = document.getElementById('file-input');
    const uploadArea         = document.getElementById('upload-area');
    const uploadBtn          = document.getElementById('upload-btn');
    const editorArea         = document.getElementById('editor-area');
    const canvas             = document.getElementById('main-canvas');
    const ctx                = canvas.getContext('2d', { willReadFrequently: true });
    const undoBtn            = document.getElementById('undo-btn');
    const resetBtn           = document.getElementById('reset-btn');
    const newImageBtn        = document.getElementById('new-image-btn');
    const removeBtn          = document.getElementById('remove-btn');
    const downloadSection    = document.getElementById('download-section');
    const downloadPng        = document.getElementById('download-png');
    const downloadJpg        = document.getElementById('download-jpg');
    const selectionInfo      = document.getElementById('selection-info');
    const selectionCount     = document.getElementById('selection-count');
    const processingOverlay  = document.getElementById('processing-overlay');
    const toastEl            = document.getElementById('toast');
    const infoBtn            = document.getElementById('info-btn');
    const modal              = document.getElementById('info-modal');
    const closeModal         = document.getElementById('close-modal');

    // ── STATE ─────────────────────────────────
    let originalImageData = null;
    let workingImageData  = null;
    let selections        = [];
    let isDrawing         = false;
    let startX = 0, startY = 0;
    let currentRect       = null;
    let toastTimer        = null;

    // ── TOAST ─────────────────────────────────
    function showToast(msg) {
        if (toastTimer) clearTimeout(toastTimer);
        toastEl.textContent = msg;
        toastEl.classList.remove('hidden');
        void toastEl.offsetWidth;
        toastEl.classList.add('show');
        toastTimer = setTimeout(() => {
            toastEl.classList.remove('show');
            setTimeout(() => toastEl.classList.add('hidden'), 300);
        }, 2500);
    }

    // ── UPLOAD ────────────────────────────────
    uploadBtn.addEventListener('click', () => fileInput.click());
    uploadArea.addEventListener('click', (e) => {
        if (e.target !== uploadBtn) fileInput.click();
    });
    fileInput.addEventListener('change', (e) => {
        if (e.target.files[0]) loadImage(e.target.files[0]);
    });
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('drag-over');
    });
    uploadArea.addEventListener('dragleave', () => uploadArea.classList.remove('drag-over'));
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('drag-over');
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) loadImage(file);
        else showToast('Please drop a valid image file');
    });

    // ── LOAD IMAGE ────────────────────────────
    function loadImage(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                // Set canvas to actual image dimensions
                canvas.width  = img.naturalWidth;
                canvas.height = img.naturalHeight;
                ctx.drawImage(img, 0, 0);

                // Save original pixel data
                originalImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                workingImageData  = null;
                selections        = [];

                uploadArea.classList.add('hidden');
                editorArea.classList.remove('hidden');
                downloadSection.classList.add('hidden');
                removeBtn.classList.add('hidden');
                selectionInfo.classList.add('hidden');
                updateUndoBtn();
                showToast('Image loaded — draw over the watermark');
            };
            img.onerror = () => showToast('Could not load image. Try another file.');
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    // ── CANVAS COORDS ─────────────────────────
    function getCoords(e) {
        const rect   = canvas.getBoundingClientRect();
        const scaleX = canvas.width  / rect.width;
        const scaleY = canvas.height / rect.height;
        const src    = e.touches ? e.touches[0] : e;
        return {
            x: (src.clientX - rect.left) * scaleX,
            y: (src.clientY - rect.top)  * scaleY
        };
    }

    // ── DRAWING ───────────────────────────────
    canvas.addEventListener('mousedown',  onStart);
    canvas.addEventListener('mousemove',  onMove);
    canvas.addEventListener('mouseup',    onEnd);
    canvas.addEventListener('mouseleave', onEnd);
    canvas.addEventListener('touchstart',  onStart, { passive: false });
    canvas.addEventListener('touchmove',   onMove,  { passive: false });
    canvas.addEventListener('touchend',    onEnd,   { passive: false });

    function onStart(e) {
        e.preventDefault();
        if (!originalImageData) return;
        isDrawing = true;
        const c = getCoords(e);
        startX = c.x; startY = c.y;
        currentRect = null;
    }

    function onMove(e) {
        e.preventDefault();
        if (!isDrawing) return;
        const c = getCoords(e);
        currentRect = {
            x: Math.min(startX, c.x),
            y: Math.min(startY, c.y),
            w: Math.abs(c.x - startX),
            h: Math.abs(c.y - startY)
        };
        redraw();
    }

    function onEnd(e) {
        e.preventDefault();
        if (!isDrawing) return;
        isDrawing = false;
        if (currentRect && currentRect.w > 5 && currentRect.h > 5) {
            selections.push({ ...currentRect });
            updateSelectionUI();
        }
        currentRect = null;
        redraw();
        updateUndoBtn();
    }

    // ── REDRAW ────────────────────────────────
    function redraw() {
        // Put current base image
        const base = workingImageData || originalImageData;
        ctx.putImageData(base, 0, 0);

        // Draw committed selections
        ctx.setLineDash([6, 3]);
        ctx.lineWidth = Math.max(1, canvas.width / 400);

        selections.forEach(r => {
            ctx.strokeStyle = 'rgba(37,99,235,0.9)';
            ctx.fillStyle   = 'rgba(37,99,235,0.15)';
            ctx.strokeRect(r.x, r.y, r.w, r.h);
            ctx.fillRect(r.x, r.y, r.w, r.h);
        });

        // Live preview
        if (currentRect) {
            ctx.strokeStyle = '#2563eb';
            ctx.fillStyle   = 'rgba(37,99,235,0.1)';
            ctx.strokeRect(currentRect.x, currentRect.y, currentRect.w, currentRect.h);
            ctx.fillRect(currentRect.x, currentRect.y, currentRect.w, currentRect.h);
        }

        ctx.setLineDash([]);
    }

    // ── UI HELPERS ────────────────────────────
    function updateSelectionUI() {
        if (selections.length > 0) {
            selectionInfo.classList.remove('hidden');
            selectionCount.textContent = selections.length;
            removeBtn.classList.remove('hidden');
        } else {
            selectionInfo.classList.add('hidden');
            removeBtn.classList.add('hidden');
        }
    }

    function updateUndoBtn() {
        undoBtn.disabled = selections.length === 0;
    }

    // ── UNDO ──────────────────────────────────
    undoBtn.addEventListener('click', () => {
        if (!selections.length) return;
        selections.pop();
        updateSelectionUI();
        updateUndoBtn();
        redraw();
        showToast('Last selection removed');
    });

    // ── RESET ─────────────────────────────────
    resetBtn.addEventListener('click', () => {
        if (!originalImageData) return;
        workingImageData = null;
        ctx.putImageData(originalImageData, 0, 0);
        selections = [];
        currentRect = null;
        updateSelectionUI();
        updateUndoBtn();
        downloadSection.classList.add('hidden');
        showToast('Reset to original');
    });

    // ── NEW IMAGE ─────────────────────────────
    newImageBtn.addEventListener('click', () => {
        originalImageData = null;
        workingImageData  = null;
        selections        = [];
        fileInput.value   = '';
        editorArea.classList.add('hidden');
        uploadArea.classList.remove('hidden');
        downloadSection.classList.add('hidden');
    });

    // ── REMOVE WATERMARK ──────────────────────
    removeBtn.addEventListener('click', () => {
        if (!selections.length) { showToast('Draw a selection first'); return; }

        processingOverlay.classList.remove('hidden');
        removeBtn.disabled = true;

        // Use setTimeout so overlay renders before heavy processing
        setTimeout(() => {
            const base    = workingImageData || originalImageData;
            const imgData = new ImageData(
                new Uint8ClampedArray(base.data),
                base.width,
                base.height
            );

            selections.forEach(rect => patchInpaint(imgData, rect));

            workingImageData = imgData;
            ctx.putImageData(imgData, 0, 0);

            selections = [];
            updateSelectionUI();
            updateUndoBtn();

            processingOverlay.classList.add('hidden');
            removeBtn.disabled = false;
            removeBtn.classList.add('hidden');
            selectionInfo.classList.add('hidden');

            downloadSection.classList.remove('hidden');
            showToast('Done! Download your image below');
            downloadSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 80);
    });

    // ── PATCH-BASED INPAINTING ────────────────
    // For each pixel in the selected region:
    // 1. Look at the surrounding border ring pixels
    // 2. Find the best matching patch (most similar neighborhood)
    // 3. Copy that patch's center pixel — no blending = no blur
    function patchInpaint(imgData, rect) {
        const data   = imgData.data;
        const W      = imgData.width;
        const H      = imgData.height;

        const x1 = Math.max(0,   Math.round(rect.x));
        const y1 = Math.max(0,   Math.round(rect.y));
        const x2 = Math.min(W-1, Math.round(rect.x + rect.w));
        const y2 = Math.min(H-1, Math.round(rect.y + rect.h));

        const rw = x2 - x1;
        const rh = y2 - y1;
        if (rw <= 0 || rh <= 0) return;

        // Sample source patches from a border ring outside the selection
        const ring     = Math.max(6, Math.round(Math.min(rw, rh) * 0.3));
        const patchR   = 2; // patch radius for matching (5x5)
        const step     = Math.max(1, Math.round(Math.min(ring, 20) / 5));

        // Collect candidate source pixels (outside the rect + within ring)
        const candidates = [];

        for (let sy = Math.max(0, y1-ring); sy <= Math.min(H-1, y2+ring); sy += step) {
            for (let sx = Math.max(0, x1-ring); sx <= Math.min(W-1, x2+ring); sx += step) {
                // Must be outside the rectangle
                if (sx >= x1 && sx <= x2 && sy >= y1 && sy <= y2) continue;
                candidates.push({ sx, sy });
            }
        }

        if (candidates.length === 0) return;

        // For each pixel inside the rectangle, find best matching candidate
        for (let py = y1; py <= y2; py++) {
            for (let px = x1; px <= x2; px++) {

                // Collect neighborhood of current pixel (from ORIGINAL data edges)
                // We use source pixels outside the rect to compare
                let bestScore = Infinity;
                let bestSx = candidates[0].sx;
                let bestSy = candidates[0].sy;

                // Sample a subset of candidates for performance
                const sampleSize = Math.min(candidates.length, 60);
                const sampleStep = Math.max(1, Math.floor(candidates.length / sampleSize));

                for (let ci = 0; ci < candidates.length; ci += sampleStep) {
                    const { sx, sy } = candidates[ci];

                    // Compare patchR neighborhood
                    let score = 0;
                    let count = 0;

                    for (let dy = -patchR; dy <= patchR; dy++) {
                        for (let dx = -patchR; dx <= patchR; dx++) {
                            const qx = px + dx;
                            const qy = py + dy;
                            const rx = sx + dx;
                            const ry = sy + dy;

                            // Only compare pixels that are OUTSIDE the rect (known pixels)
                            if (qx < x1 || qx > x2 || qy < y1 || qy > y2) {
                                if (qx >= 0 && qx < W && qy >= 0 && qy < H &&
                                    rx >= 0 && rx < W && ry >= 0 && ry < H) {
                                    const qi = (qy * W + qx) * 4;
                                    const ri = (ry * W + rx) * 4;
                                    const dr = data[qi]   - data[ri];
                                    const dg = data[qi+1] - data[ri+1];
                                    const db = data[qi+2] - data[ri+2];
                                    score += dr*dr + dg*dg + db*db;
                                    count++;
                                }
                            }
                        }
                    }

                    if (count > 0) score /= count;

                    if (score < bestScore) {
                        bestScore = score;
                        bestSx    = sx;
                        bestSy    = sy;
                    }
                }

                // Copy best matching pixel
                const destIdx   = (py * W + px) * 4;
                const srcIdx    = (bestSy * W + bestSx) * 4;
                data[destIdx]   = data[srcIdx];
                data[destIdx+1] = data[srcIdx+1];
                data[destIdx+2] = data[srcIdx+2];
                data[destIdx+3] = data[srcIdx+3];
            }
        }
    }

    // ── DOWNLOAD ──────────────────────────────
    function download(mime, filename) {
        const link      = document.createElement('a');
        link.download   = filename;
        link.href       = canvas.toDataURL(mime, 0.95);
        link.click();
        showToast('Downloaded: ' + filename);
    }

    downloadPng.addEventListener('click', () => download('image/png',  'webkaar-no-watermark.png'));
    downloadJpg.addEventListener('click', () => download('image/jpeg', 'webkaar-no-watermark.jpg'));

    // ── INFO MODAL ────────────────────────────
    if (infoBtn && modal && closeModal) {
        infoBtn.addEventListener('click',  () => modal.classList.remove('hidden'));
        closeModal.addEventListener('click', () => modal.classList.add('hidden'));
        modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.add('hidden'); });
    }

});
