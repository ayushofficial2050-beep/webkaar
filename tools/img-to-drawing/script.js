/* ============================================
   DRAWING REFERENCE PRO — script.js
   WebKaar | Ayush Tiwari
   All 8 tools: Canvas API, 100% Offline
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

    // ── DOM References ──────────────────────────────
    const fileInput         = document.getElementById('file-input');
    const dropZone          = document.getElementById('drop-zone');
    const workspaceArea     = document.getElementById('workspace-area');
    const mainCanvas        = document.getElementById('main-canvas');
    const overlayCanvas     = document.getElementById('overlay-canvas');
    const canvasWrapper     = document.getElementById('canvas-wrapper');
    const bottomActionBar   = document.getElementById('bottom-action-bar');
    const downloadBtn       = document.getElementById('download-btn');
    const resetBtn          = document.getElementById('reset-btn');
    const toast             = document.getElementById('toast');
    const infoBtn           = document.getElementById('info-btn');
    const infoModal         = document.getElementById('info-modal');
    const closeModal        = document.getElementById('close-modal');

    const ctx               = mainCanvas.getContext('2d');
    const octx              = overlayCanvas.getContext('2d');

    // ── State ───────────────────────────────────────
    let originalImage   = null;   // HTMLImageElement — never modified
    let currentDataURL  = null;   // current processed result
    let activeTab       = 'sketch';
    let onionImage      = null;   // user's drawing for onion skin

    // ── Slider live value labels ─────────────────────
    const sliderMap = {
        'sketch-intensity':     'sketch-intensity-val',
        'sketch-thickness':     'sketch-thickness-val',
        'contour-sensitivity':  'contour-sensitivity-val',
        'contrast-slider':      'contrast-val',
        'brightness-slider':    'brightness-val',
        'blur-slider':          'blur-val',
        'grid-opacity':         'grid-opacity-val',
        'onion-opacity':        'onion-opacity-val',
        'simplify-slider':      'simplify-val',
    };
    Object.entries(sliderMap).forEach(([sliderId, labelId]) => {
        const slider = document.getElementById(sliderId);
        const label  = document.getElementById(labelId);
        if (slider && label) {
            slider.addEventListener('input', () => { label.textContent = slider.value; });
        }
    });

    // ── File Upload ──────────────────────────────────
    fileInput.addEventListener('change', (e) => {
        if (e.target.files[0]) loadImage(e.target.files[0]);
        fileInput.value = '';
    });

    dropZone.addEventListener('dragover',  (e) => { e.preventDefault(); dropZone.classList.add('dragover'); });
    dropZone.addEventListener('dragleave', ()  => dropZone.classList.remove('dragover'));
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) loadImage(file);
    });
    dropZone.addEventListener('click', () => fileInput.click());

    function loadImage(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                originalImage = img;
                drawOriginalToCanvas();
                showWorkspace();
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    function drawOriginalToCanvas() {
        const maxW = canvasWrapper.clientWidth || 600;
        let w = originalImage.naturalWidth;
        let h = originalImage.naturalHeight;
        const ratio = w / h;

        if (w > maxW) { w = maxW; h = w / ratio; }
        if (h > window.innerHeight * 0.65) { h = window.innerHeight * 0.65; w = h * ratio; }

        mainCanvas.width    = Math.round(w);
        mainCanvas.height   = Math.round(h);
        overlayCanvas.width = Math.round(w);
        overlayCanvas.height= Math.round(h);

        ctx.clearRect(0, 0, mainCanvas.width, mainCanvas.height);
        ctx.drawImage(originalImage, 0, 0, mainCanvas.width, mainCanvas.height);
        currentDataURL = mainCanvas.toDataURL('image/png');
        clearOverlay();
        removeModeTag();
    }

    function showWorkspace() {
        dropZone.classList.add('hidden');
        workspaceArea.classList.remove('hidden');
        bottomActionBar.classList.remove('hidden');
    }

    // ── Tab Switching ────────────────────────────────
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.panel').forEach(p => p.classList.add('hidden'));
            btn.classList.add('active');
            activeTab = btn.dataset.tab;
            document.getElementById('panel-' + activeTab).classList.remove('hidden');
            // Re-draw original when switching tabs (non-destructive UX)
            if (originalImage) drawOriginalToCanvas();
            clearOverlay();
        });
    });

    // ── Reset ────────────────────────────────────────
    resetBtn.addEventListener('click', () => {
        if (!originalImage) return;
        drawOriginalToCanvas();
        clearOverlay();
        removeModeTag();
        showToast('Reset to original!');
    });

    // ── Info Modal ───────────────────────────────────
    if (infoBtn)    infoBtn.addEventListener('click',    () => infoModal.classList.remove('hidden'));
    if (closeModal) closeModal.addEventListener('click', () => infoModal.classList.add('hidden'));
    if (infoModal)  infoModal.addEventListener('click',  (e) => { if (e.target === infoModal) infoModal.classList.add('hidden'); });

    // ── Download ─────────────────────────────────────
    downloadBtn.addEventListener('click', () => {
        if (!currentDataURL) return;
        const a = document.createElement('a');
        a.href     = currentDataURL;
        a.download = 'WebKaar_Drawing_Reference.png';
        a.click();
        showToast('Image downloaded!');
    });

    // ════════════════════════════════════════════════
    //  TOOL 1 — PENCIL SKETCH EFFECT
    // ════════════════════════════════════════════════
    document.getElementById('apply-sketch').addEventListener('click', () => {
        if (!originalImage) return showToast('Please upload an image first!', true);
        showLoading('Applying sketch effect...');
        setTimeout(() => {
            try {
                const style     = document.getElementById('sketch-style').value;
                const intensity = parseInt(document.getElementById('sketch-intensity').value);
                const thickness = parseInt(document.getElementById('sketch-thickness').value);
                const bg        = document.getElementById('sketch-bg').value;

                const w = mainCanvas.width, h = mainCanvas.height;
                const offA = createOffscreen(w, h);
                offA.ctx.drawImage(originalImage, 0, 0, w, h);
                const srcData = offA.ctx.getImageData(0, 0, w, h);

                // Step 1 — Grayscale
                const gray = toGrayscale(srcData);

                // Step 2 — Invert
                const inv  = invertPixels(gray);

                // Step 3 — Gaussian blur on inverted
                const blurred = gaussianBlur(inv, w, h, thickness + 1);

                // Step 4 — Color Dodge blend
                const result = colorDodgeBlend(gray, blurred, w, h);

                // Step 5 — Intensity / contrast
                applyContrast(result, intensity / 50);

                // Step 6 — Style variations
                if (style === 'charcoal') applyCharcoal(result, w, h);
                if (style === 'ink')      applyInkLines(result, w, h, thickness);
                if (style === 'hatching') applyHatching(result, w, h);

                // Step 7 — Background tint
                applyBackground(result, bg, w, h);

                ctx.putImageData(result, 0, 0);
                currentDataURL = mainCanvas.toDataURL('image/png');
                setModeTag('✏️ Sketch');
                hideLoading();
                showToast('Sketch effect applied!');
            } catch(e) { hideLoading(); showToast('Error applying sketch', true); console.error(e); }
        }, 60);
    });

    // ════════════════════════════════════════════════
    //  TOOL 2 — GRID OVERLAY
    // ════════════════════════════════════════════════
    document.getElementById('apply-grid').addEventListener('click', () => {
        if (!originalImage) return showToast('Please upload an image first!', true);

        // First restore original image on main canvas
        ctx.clearRect(0, 0, mainCanvas.width, mainCanvas.height);
        ctx.drawImage(originalImage, 0, 0, mainCanvas.width, mainCanvas.height);

        const type    = document.getElementById('grid-type').value;
        const color   = document.getElementById('grid-color').value;
        const opacity = parseInt(document.getElementById('grid-opacity').value) / 100;
        const labels  = document.getElementById('grid-labels').value === 'on';
        const w = mainCanvas.width, h = mainCanvas.height;

        clearOverlay();
        octx.save();
        octx.globalAlpha = opacity;

        const colorMap = { red:'#ef4444', blue:'#3b82f6', green:'#10b981', white:'#ffffff', black:'#000000' };
        octx.strokeStyle = colorMap[color] || '#3b82f6';
        octx.fillStyle   = colorMap[color] || '#3b82f6';
        octx.lineWidth   = 1.5;

        if (type === 'golden') {
            drawGoldenRatio(w, h);
        } else if (type === 'diagonal') {
            drawDiagonalGuides(w, h);
        } else {
            const parts = type.split('x');
            const cols  = parseInt(parts[0]);
            const rows  = parseInt(parts[1]);
            const cw    = w / cols, rh = h / rows;

            for (let c = 1; c < cols; c++) {
                octx.beginPath(); octx.moveTo(c * cw, 0); octx.lineTo(c * cw, h); octx.stroke();
                if (labels) { octx.globalAlpha = Math.min(opacity + 0.2, 1); octx.font = 'bold 11px Inter, sans-serif'; octx.fillText(c, c * cw + 4, 14); octx.globalAlpha = opacity; }
            }
            for (let r = 1; r < rows; r++) {
                octx.beginPath(); octx.moveTo(0, r * rh); octx.lineTo(w, r * rh); octx.stroke();
                if (labels) { octx.globalAlpha = Math.min(opacity + 0.2, 1); octx.fillText(r, 4, r * rh - 4); octx.globalAlpha = opacity; }
            }
        }
        octx.restore();

        // Merge overlay into main canvas for download
        ctx.drawImage(overlayCanvas, 0, 0);
        currentDataURL = mainCanvas.toDataURL('image/png');
        setModeTag('⊞ Grid');
        showToast('Grid applied!');
    });

    function drawGoldenRatio(w, h) {
        const phi = 1.618;
        const x1 = w / phi, x2 = w - w / phi;
        const y1 = h / phi, y2 = h - h / phi;
        [[x1,0,x1,h],[x2,0,x2,h],[0,y1,w,y1],[0,y2,w,y2]].forEach(([ax,ay,bx,by]) => {
            octx.beginPath(); octx.moveTo(ax,ay); octx.lineTo(bx,by); octx.stroke();
        });
    }
    function drawDiagonalGuides(w, h) {
        [[0,0,w,h],[w,0,0,h],[0,h/2,w,h/2],[w/2,0,w/2,h]].forEach(([ax,ay,bx,by]) => {
            octx.beginPath(); octx.moveTo(ax,ay); octx.lineTo(bx,by); octx.stroke();
        });
    }

    // ════════════════════════════════════════════════
    //  TOOL 3 — CONTOUR / OUTLINE
    // ════════════════════════════════════════════════
    document.getElementById('apply-contour').addEventListener('click', () => {
        if (!originalImage) return showToast('Please upload an image first!', true);
        showLoading('Detecting edges...');
        setTimeout(() => {
            try {
                const sensitivity = parseInt(document.getElementById('contour-sensitivity').value);
                const colorMode   = document.getElementById('contour-color').value;
                const detail      = document.getElementById('contour-detail').value;
                const w = mainCanvas.width, h = mainCanvas.height;

                const off = createOffscreen(w, h);
                off.ctx.drawImage(originalImage, 0, 0, w, h);
                const srcData = off.ctx.getImageData(0, 0, w, h);

                // Blur first for cleaner edges
                const blurAmt = detail === 'low' ? 3 : detail === 'mid' ? 2 : 1;
                const blurred = gaussianBlur(srcData, w, h, blurAmt);

                // Sobel edge detection
                const edges = sobelEdge(blurred, w, h, sensitivity);

                // Color mode
                const bgWhite = (colorMode === 'black' || colorMode === 'blue' || colorMode === 'red');
                const d = edges.data;
                const lineRGB = colorMode === 'white'  ? [255,255,255] :
                                colorMode === 'blue'   ? [59,130,246]  :
                                colorMode === 'red'    ? [239,68,68]   : [0,0,0];

                for (let i = 0; i < d.length; i += 4) {
                    const edge = d[i]; // grayscale value = edge strength
                    if (bgWhite) {
                        // White background, colored lines
                        const strength = edge / 255;
                        d[i]   = Math.round(255 - strength * (255 - lineRGB[0]));
                        d[i+1] = Math.round(255 - strength * (255 - lineRGB[1]));
                        d[i+2] = Math.round(255 - strength * (255 - lineRGB[2]));
                    } else {
                        // Dark background, white lines
                        d[i] = d[i+1] = d[i+2] = edge;
                    }
                    d[i+3] = 255;
                }

                ctx.putImageData(edges, 0, 0);
                currentDataURL = mainCanvas.toDataURL('image/png');
                setModeTag('〰 Contour');
                hideLoading();
                showToast('Contour lines extracted!');
            } catch(e) { hideLoading(); showToast('Error in contour', true); console.error(e); }
        }, 60);
    });

    // ════════════════════════════════════════════════
    //  TOOL 4 — VALUE STUDY (GRAYSCALE)
    // ════════════════════════════════════════════════
    document.getElementById('apply-grayscale').addEventListener('click', () => {
        if (!originalImage) return showToast('Please upload an image first!', true);
        showLoading('Applying value study...');
        setTimeout(() => {
            try {
                const contrast   = parseInt(document.getElementById('contrast-slider').value) / 100;
                const brightness = parseInt(document.getElementById('brightness-slider').value) / 100;
                const mode       = document.getElementById('grayscale-mode').value;
                const blurAmt    = parseInt(document.getElementById('blur-slider').value);
                const w = mainCanvas.width, h = mainCanvas.height;

                const off = createOffscreen(w, h);
                off.ctx.drawImage(originalImage, 0, 0, w, h);
                let imgData = off.ctx.getImageData(0, 0, w, h);

                if (mode === 'sepia') {
                    imgData = applySepia(imgData);
                } else {
                    imgData = toGrayscale(imgData);
                    applyBrightness(imgData, brightness);
                    applyContrast(imgData, contrast);
                    if (mode === 'high-contrast') applyContrast(imgData, 2.5);
                    if (mode === 'posterize')     applyPosterize(imgData, 3);
                }

                if (blurAmt > 0) imgData = gaussianBlur(imgData, w, h, blurAmt);

                ctx.putImageData(imgData, 0, 0);
                currentDataURL = mainCanvas.toDataURL('image/png');
                setModeTag('◑ Value');
                hideLoading();
                showToast('Value study applied!');
            } catch(e) { hideLoading(); showToast('Error in value study', true); console.error(e); }
        }, 60);
    });

    // ════════════════════════════════════════════════
    //  TOOL 5 — SYMMETRY MIRROR
    // ════════════════════════════════════════════════
    document.getElementById('apply-mirror').addEventListener('click', () => {
        if (!originalImage) return showToast('Please upload an image first!', true);
        const axis  = document.getElementById('mirror-axis').value;
        const side  = document.getElementById('mirror-side').value;
        const guide = document.getElementById('mirror-guide').value === 'on';
        const w = mainCanvas.width, h = mainCanvas.height;

        ctx.clearRect(0, 0, w, h);
        ctx.drawImage(originalImage, 0, 0, w, h);
        const srcData = ctx.getImageData(0, 0, w, h);
        const result  = new ImageData(new Uint8ClampedArray(srcData.data), w, h);
        const d = result.data;
        const s = srcData.data;

        if (axis === 'vertical') {
            // Mirror left↔right
            for (let y = 0; y < h; y++) {
                for (let x = 0; x < Math.floor(w / 2); x++) {
                    const srcX   = side === 'left' ? x : w - 1 - x;
                    const dstX   = side === 'left' ? w - 1 - x : x;
                    const si     = (y * w + srcX) * 4;
                    const di     = (y * w + dstX) * 4;
                    d[di] = s[si]; d[di+1] = s[si+1]; d[di+2] = s[si+2]; d[di+3] = s[si+3];
                }
            }
        } else if (axis === 'horizontal') {
            // Mirror top↔bottom
            for (let y = 0; y < Math.floor(h / 2); y++) {
                const srcY = side === 'left' ? y : h - 1 - y;
                const dstY = side === 'left' ? h - 1 - y : y;
                for (let x = 0; x < w; x++) {
                    const si = (srcY * w + x) * 4;
                    const di = (dstY * w + x) * 4;
                    d[di] = s[si]; d[di+1] = s[si+1]; d[di+2] = s[si+2]; d[di+3] = s[si+3];
                }
            }
        } else if (axis === 'both') {
            // Quad mirror
            const hw = Math.floor(w / 2), hh = Math.floor(h / 2);
            for (let y = 0; y < hh; y++) {
                for (let x = 0; x < hw; x++) {
                    const si = (y * w + x) * 4;
                    const rv = [d[si], d[si+1], d[si+2], d[si+3]];
                    const positions = [
                        (y * w + (w - 1 - x)) * 4,
                        ((h - 1 - y) * w + x) * 4,
                        ((h - 1 - y) * w + (w - 1 - x)) * 4
                    ];
                    positions.forEach(pi => {
                        d[pi]=rv[0]; d[pi+1]=rv[1]; d[pi+2]=rv[2]; d[pi+3]=rv[3];
                    });
                }
            }
        }

        ctx.putImageData(result, 0, 0);

        if (guide) {
            ctx.save();
            ctx.strokeStyle = 'rgba(239,68,68,0.85)';
            ctx.lineWidth   = 2;
            ctx.setLineDash([8, 6]);
            if (axis === 'vertical' || axis === 'both') {
                ctx.beginPath(); ctx.moveTo(w/2, 0); ctx.lineTo(w/2, h); ctx.stroke();
            }
            if (axis === 'horizontal' || axis === 'both') {
                ctx.beginPath(); ctx.moveTo(0, h/2); ctx.lineTo(w, h/2); ctx.stroke();
            }
            ctx.restore();
        }

        currentDataURL = mainCanvas.toDataURL('image/png');
        setModeTag('⇔ Mirror');
        showToast('Mirror applied!');
    });

    // ════════════════════════════════════════════════
    //  TOOL 6 — COLOR PALETTE EXTRACTOR
    // ════════════════════════════════════════════════
    document.getElementById('apply-palette').addEventListener('click', () => {
        if (!originalImage) return showToast('Please upload an image first!', true);
        showLoading('Extracting palette...');
        setTimeout(() => {
            try {
                const count  = parseInt(document.getElementById('palette-count').value);
                const style  = document.getElementById('palette-style').value;
                const w = mainCanvas.width, h = mainCanvas.height;

                const off = createOffscreen(w, h);
                off.ctx.drawImage(originalImage, 0, 0, w, h);
                const imgData = off.ctx.getImageData(0, 0, w, h);

                const palette = extractPalette(imgData, count, style);
                renderPalette(palette);

                // Restore original on canvas (palette shown below)
                ctx.clearRect(0, 0, w, h);
                ctx.drawImage(originalImage, 0, 0, w, h);
                currentDataURL = mainCanvas.toDataURL('image/png');
                setModeTag('🎨 Palette');
                hideLoading();
                showToast('Palette extracted! Tap to copy hex.');
            } catch(e) { hideLoading(); showToast('Error extracting palette', true); console.error(e); }
        }, 80);
    });

    function extractPalette(imgData, count, style) {
        const d = imgData.data;
        const step = Math.max(1, Math.floor(d.length / 4 / 3000));
        const pixels = [];
        for (let i = 0; i < d.length; i += 4 * step) {
            const r = d[i], g = d[i+1], b = d[i+2], a = d[i+3];
            if (a < 128) continue;
            const sat = getSaturation(r, g, b);
            const bri = (r + g + b) / 3;
            if (style === 'vibrant' && sat < 0.3) continue;
            if (style === 'muted'   && sat > 0.6) continue;
            pixels.push([r, g, b]);
        }
        if (pixels.length < count) return pixels.slice(0, count).map(p => rgbToHex(...p));
        return kMeans(pixels, count).map(c => rgbToHex(Math.round(c[0]), Math.round(c[1]), Math.round(c[2])));
    }

    function kMeans(pixels, k) {
        // Simple k-means clustering
        let centers = [];
        const step = Math.floor(pixels.length / k);
        for (let i = 0; i < k; i++) centers.push([...pixels[i * step]]);

        for (let iter = 0; iter < 12; iter++) {
            const clusters = Array.from({length: k}, () => []);
            pixels.forEach(p => {
                let best = 0, bestDist = Infinity;
                centers.forEach((c, ci) => {
                    const dist = (p[0]-c[0])**2 + (p[1]-c[1])**2 + (p[2]-c[2])**2;
                    if (dist < bestDist) { bestDist = dist; best = ci; }
                });
                clusters[best].push(p);
            });
            centers = clusters.map(cl => {
                if (!cl.length) return [128,128,128];
                const avg = [0,0,0];
                cl.forEach(p => { avg[0]+=p[0]; avg[1]+=p[1]; avg[2]+=p[2]; });
                return avg.map(v => v / cl.length);
            });
        }
        return centers;
    }

    function renderPalette(hexColors) {
        const container = document.getElementById('palette-result');
        container.classList.remove('hidden');
        container.innerHTML = `
            <div class="palette-swatches">
                ${hexColors.map(hex => `
                    <div class="swatch-item" onclick="copyHex('${hex}')">
                        <div class="swatch-box" style="background:${hex};"></div>
                        <span class="swatch-hex">${hex}</span>
                    </div>
                `).join('')}
            </div>
            <p class="palette-copy-hint"><i class="ph-bold ph-copy"></i> Tap any swatch to copy hex code</p>
        `;
    }

    window.copyHex = function(hex) {
        navigator.clipboard.writeText(hex).then(() => showToast('Copied: ' + hex));
    };

    // ════════════════════════════════════════════════
    //  TOOL 7 — ONION SKIN OVERLAY
    // ════════════════════════════════════════════════
    const onionFileInput = document.getElementById('onion-file-input');
    const onionUploadBtn = document.getElementById('onion-upload-btn');
    const onionFileName  = document.getElementById('onion-file-name');

    onionUploadBtn.addEventListener('click', () => onionFileInput.click());
    onionFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            onionImage = new Image();
            onionImage.onload = () => {
                onionFileName.textContent = file.name;
                showToast('Drawing loaded! Now tap Apply.');
            };
            onionImage.src = ev.target.result;
        };
        reader.readAsDataURL(file);
        onionFileInput.value = '';
    });

    document.getElementById('apply-onion').addEventListener('click', () => {
        if (!originalImage) return showToast('Please upload a reference image first!', true);
        if (!onionImage)    return showToast('Please upload your drawing first!', true);

        const opacity = parseInt(document.getElementById('onion-opacity').value) / 100;
        const blend   = document.getElementById('onion-blend').value;
        const w = mainCanvas.width, h = mainCanvas.height;

        // Draw reference
        ctx.clearRect(0, 0, w, h);
        ctx.drawImage(originalImage, 0, 0, w, h);

        // Overlay drawing
        ctx.save();
        ctx.globalAlpha       = opacity;
        ctx.globalCompositeOperation = blend;
        ctx.drawImage(onionImage, 0, 0, w, h);
        ctx.restore();

        currentDataURL = mainCanvas.toDataURL('image/png');
        setModeTag('◈ Onion');
        showToast('Onion skin applied!');
    });

    // ════════════════════════════════════════════════
    //  TOOL 8 — LINE SIMPLIFIER
    // ════════════════════════════════════════════════
    document.getElementById('apply-simplify').addEventListener('click', () => {
        if (!originalImage) return showToast('Please upload an image first!', true);
        showLoading('Simplifying lines...');
        setTimeout(() => {
            try {
                const level  = parseInt(document.getElementById('simplify-slider').value);
                const style  = document.getElementById('simplify-style').value;
                const weight = document.getElementById('simplify-weight').value;
                const w = mainCanvas.width, h = mainCanvas.height;

                const off = createOffscreen(w, h);
                off.ctx.drawImage(originalImage, 0, 0, w, h);
                let imgData = off.ctx.getImageData(0, 0, w, h);

                // Blur more = more simplified
                const blurAmt = Math.round(level / 15) + 1;
                imgData = gaussianBlur(imgData, w, h, blurAmt);

                // Edge detect
                const threshold = Math.round(255 - (level / 100) * 200);
                imgData = sobelEdge(imgData, w, h, threshold);

                // Invert — black lines on white
                const d = imgData.data;
                for (let i = 0; i < d.length; i += 4) {
                    d[i] = d[i+1] = d[i+2] = d[i] > 40 ? 0 : 255;
                    d[i+3] = 255;
                }

                // Line weight
                if (weight === 'thick') imgData = dilate(imgData, w, h, 2);
                if (weight === 'thin')  imgData = erode(imgData, w, h);

                // Style
                if (style === 'cartoon') {
                    // Blend simplified lines with color
                    const colorOff = createOffscreen(w, h);
                    colorOff.ctx.drawImage(originalImage, 0, 0, w, h);
                    const colorData = colorOff.ctx.getImageData(0, 0, w, h);
                    colorData  = posterizeForCartoon(colorData, 4);
                    ctx.putImageData(colorData, 0, 0);
                    // Multiply lines on top
                    const lineCanvas = createOffscreen(w, h);
                    lineCanvas.ctx.putImageData(imgData, 0, 0);
                    ctx.save();
                    ctx.globalCompositeOperation = 'multiply';
                    ctx.drawImage(lineCanvas.canvas, 0, 0);
                    ctx.restore();
                } else {
                    ctx.putImageData(imgData, 0, 0);
                }

                currentDataURL = mainCanvas.toDataURL('image/png');
                setModeTag('〜 Simplified');
                hideLoading();
                showToast('Lines simplified!');
            } catch(e) { hideLoading(); showToast('Error simplifying', true); console.error(e); }
        }, 80);
    });

    // ════════════════════════════════════════════════
    //  IMAGE PROCESSING HELPERS
    // ════════════════════════════════════════════════

    function createOffscreen(w, h) {
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d');
        return { canvas, ctx };
    }

    function toGrayscale(imgData) {
        const result = new ImageData(new Uint8ClampedArray(imgData.data), imgData.width, imgData.height);
        const d = result.data;
        for (let i = 0; i < d.length; i += 4) {
            const v = 0.299 * d[i] + 0.587 * d[i+1] + 0.114 * d[i+2];
            d[i] = d[i+1] = d[i+2] = v;
        }
        return result;
    }

    function invertPixels(imgData) {
        const result = new ImageData(new Uint8ClampedArray(imgData.data), imgData.width, imgData.height);
        const d = result.data;
        for (let i = 0; i < d.length; i += 4) {
            d[i] = 255 - d[i]; d[i+1] = 255 - d[i+1]; d[i+2] = 255 - d[i+2];
        }
        return result;
    }

    function gaussianBlur(imgData, w, h, radius) {
        if (radius < 1) return imgData;
        const result = new ImageData(new Uint8ClampedArray(imgData.data), w, h);
        const src = imgData.data, dst = result.data;
        const kernel = buildGaussianKernel(radius);
        const kLen   = kernel.length;
        const half   = Math.floor(kLen / 2);

        // Horizontal pass
        const tmp = new Uint8ClampedArray(src.length);
        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                let r=0,g=0,b=0,a=0;
                for (let k = 0; k < kLen; k++) {
                    const px = Math.min(w-1, Math.max(0, x + k - half));
                    const idx = (y * w + px) * 4;
                    r += src[idx]   * kernel[k];
                    g += src[idx+1] * kernel[k];
                    b += src[idx+2] * kernel[k];
                    a += src[idx+3] * kernel[k];
                }
                const di = (y * w + x) * 4;
                tmp[di]=r; tmp[di+1]=g; tmp[di+2]=b; tmp[di+3]=a;
            }
        }
        // Vertical pass
        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                let r=0,g=0,b=0,a=0;
                for (let k = 0; k < kLen; k++) {
                    const py = Math.min(h-1, Math.max(0, y + k - half));
                    const idx = (py * w + x) * 4;
                    r += tmp[idx]   * kernel[k];
                    g += tmp[idx+1] * kernel[k];
                    b += tmp[idx+2] * kernel[k];
                    a += tmp[idx+3] * kernel[k];
                }
                const di = (y * w + x) * 4;
                dst[di]=r; dst[di+1]=g; dst[di+2]=b; dst[di+3]=a;
            }
        }
        return result;
    }

    function buildGaussianKernel(radius) {
        const size = radius * 2 + 1;
        const sigma = radius / 2;
        const kernel = [];
        let sum = 0;
        for (let i = 0; i < size; i++) {
            const x = i - radius;
            const val = Math.exp(-(x*x) / (2*sigma*sigma));
            kernel.push(val); sum += val;
        }
        return kernel.map(v => v / sum);
    }

    function colorDodgeBlend(base, blend, w, h) {
        const result = new ImageData(new Uint8ClampedArray(base.data), w, h);
        const d = result.data, b = blend.data;
        for (let i = 0; i < d.length; i += 4) {
            for (let c = 0; c < 3; c++) {
                const bottom = d[i+c], top = b[i+c];
                d[i+c] = top === 255 ? 255 : Math.min(255, Math.floor((bottom * 255) / (255 - top)));
            }
        }
        return result;
    }

    function applyContrast(imgData, factor) {
        const d = imgData.data;
        const offset = 128 * (1 - factor);
        for (let i = 0; i < d.length; i += 4) {
            d[i]   = clamp(d[i]   * factor + offset);
            d[i+1] = clamp(d[i+1] * factor + offset);
            d[i+2] = clamp(d[i+2] * factor + offset);
        }
        return imgData;
    }

    function applyBrightness(imgData, factor) {
        const d = imgData.data;
        for (let i = 0; i < d.length; i += 4) {
            d[i]   = clamp(d[i]   * factor);
            d[i+1] = clamp(d[i+1] * factor);
            d[i+2] = clamp(d[i+2] * factor);
        }
        return imgData;
    }

    function applyBackground(imgData, bg, w, h) {
        const d = imgData.data;
        for (let i = 0; i < d.length; i += 4) {
            if (bg === 'cream') {
                d[i]   = Math.min(255, d[i]   + 15);
                d[i+1] = Math.min(255, d[i+1] + 10);
                d[i+2] = Math.max(0,   d[i+2] - 5);
            } else if (bg === 'dark') {
                d[i] = 255 - d[i]; d[i+1] = 255 - d[i+1]; d[i+2] = 255 - d[i+2];
            }
        }
    }

    function applyCharcoal(imgData, w, h) {
        const d = imgData.data;
        for (let i = 0; i < d.length; i += 4) {
            const v = d[i];
            // Smudge effect — clamp to mid-tones
            d[i] = d[i+1] = d[i+2] = v < 60 ? v * 0.7 : v > 200 ? 220 : v * 0.9;
        }
    }

    function applyInkLines(imgData, w, h, thickness) {
        const d = imgData.data;
        for (let i = 0; i < d.length; i += 4) {
            // Hard threshold for crisp ink lines
            const v = d[i] > 160 ? 255 : 0;
            d[i] = d[i+1] = d[i+2] = v;
        }
    }

    function applyHatching(imgData, w, h) {
        const d = imgData.data;
        for (let i = 0; i < d.length; i += 4) {
            const pixIdx = i / 4;
            const x = pixIdx % w, y = Math.floor(pixIdx / w);
            // Add diagonal hatching pattern based on value
            const v = d[i];
            if (v < 80) {
                // Dark area — cross hatch
                const hatch = ((x + y) % 6 === 0) || ((x - y + w) % 6 === 0);
                d[i] = d[i+1] = d[i+2] = hatch ? 0 : 20;
            } else if (v < 150) {
                // Mid — single hatch
                const hatch = ((x + y) % 8 === 0);
                d[i] = d[i+1] = d[i+2] = hatch ? 30 : 200;
            } else {
                d[i] = d[i+1] = d[i+2] = 255;
            }
        }
    }

    function sobelEdge(imgData, w, h, threshold) {
        const gray = toGrayscale(imgData);
        const src  = gray.data;
        const result = new ImageData(new Uint8ClampedArray(imgData.data.length), w, h);
        const d = result.data;

        for (let y = 1; y < h-1; y++) {
            for (let x = 1; x < w-1; x++) {
                const idx = (y * w + x) * 4;
                const tl = src[((y-1)*w+(x-1))*4], tm = src[((y-1)*w+x)*4], tr = src[((y-1)*w+(x+1))*4];
                const ml = src[(y*w+(x-1))*4],                                mr = src[(y*w+(x+1))*4];
                const bl = src[((y+1)*w+(x-1))*4], bm = src[((y+1)*w+x)*4], br = src[((y+1)*w+(x+1))*4];

                const gx = -tl - 2*ml - bl + tr + 2*mr + br;
                const gy = -tl - 2*tm - tr + bl + 2*bm + br;
                const mag = Math.min(255, Math.sqrt(gx*gx + gy*gy));

                const edge = mag > threshold ? mag : 0;
                d[idx] = d[idx+1] = d[idx+2] = edge;
                d[idx+3] = 255;
            }
        }
        return result;
    }

    function applySepia(imgData) {
        const result = new ImageData(new Uint8ClampedArray(imgData.data), imgData.width, imgData.height);
        const d = result.data;
        for (let i = 0; i < d.length; i += 4) {
            const r = d[i], g = d[i+1], b = d[i+2];
            d[i]   = clamp(r * 0.393 + g * 0.769 + b * 0.189);
            d[i+1] = clamp(r * 0.349 + g * 0.686 + b * 0.168);
            d[i+2] = clamp(r * 0.272 + g * 0.534 + b * 0.131);
        }
        return result;
    }

    function applyPosterize(imgData, levels) {
        const d = imgData.data;
        const step = 255 / (levels - 1);
        for (let i = 0; i < d.length; i += 4) {
            d[i]   = Math.round(Math.round(d[i]   / step) * step);
            d[i+1] = Math.round(Math.round(d[i+1] / step) * step);
            d[i+2] = Math.round(Math.round(d[i+2] / step) * step);
        }
        return imgData;
    }

    function posterizeForCartoon(imgData, levels) {
        const d = imgData.data;
        const step = 255 / (levels - 1);
        for (let i = 0; i < d.length; i += 4) {
            d[i]   = Math.round(Math.round(d[i]   / step) * step);
            d[i+1] = Math.round(Math.round(d[i+1] / step) * step);
            d[i+2] = Math.round(Math.round(d[i+2] / step) * step);
        }
        return imgData;
    }

    function dilate(imgData, w, h, radius) {
        const src = imgData.data;
        const result = new ImageData(new Uint8ClampedArray(src), w, h);
        const d = result.data;
        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                const idx = (y * w + x) * 4;
                if (src[idx] === 0) { // black pixel
                    for (let dy = -radius; dy <= radius; dy++) {
                        for (let dx = -radius; dx <= radius; dx++) {
                            const nx = clampV(x+dx, 0, w-1), ny = clampV(y+dy, 0, h-1);
                            const ni = (ny * w + nx) * 4;
                            d[ni] = d[ni+1] = d[ni+2] = 0;
                        }
                    }
                }
            }
        }
        return result;
    }

    function erode(imgData, w, h) {
        const src = imgData.data;
        const result = new ImageData(new Uint8ClampedArray(src), w, h);
        const d = result.data;
        for (let y = 1; y < h-1; y++) {
            for (let x = 1; x < w-1; x++) {
                const idx = (y * w + x) * 4;
                const neighbors = [
                    src[((y-1)*w+x)*4], src[((y+1)*w+x)*4],
                    src[(y*w+x-1)*4],   src[(y*w+x+1)*4]
                ];
                if (neighbors.some(v => v === 255)) {
                    d[idx] = d[idx+1] = d[idx+2] = 255;
                }
            }
        }
        return result;
    }

    function getSaturation(r, g, b) {
        const max = Math.max(r,g,b)/255, min = Math.min(r,g,b)/255;
        return max === 0 ? 0 : (max - min) / max;
    }

    function rgbToHex(r, g, b) {
        return '#' + [r,g,b].map(v => Math.round(v).toString(16).padStart(2,'0')).join('');
    }

    function clamp(v)       { return Math.max(0, Math.min(255, Math.round(v))); }
    function clampV(v,a,b)  { return Math.max(a, Math.min(b, v)); }

    // ── UI Helpers ───────────────────────────────────

    let loadingEl = null;
    function showLoading(msg) {
        removeEl('.canvas-loading');
        loadingEl = document.createElement('div');
        loadingEl.className = 'canvas-loading';
        loadingEl.innerHTML = `<div class="spinner"></div><span>${msg}</span>`;
        canvasWrapper.appendChild(loadingEl);
    }
    function hideLoading() { removeEl('.canvas-loading'); }
    function removeEl(sel) { const el = canvasWrapper.querySelector(sel); if(el) el.remove(); }

    function setModeTag(label) {
        removeModeTag();
        const tag = document.createElement('div');
        tag.className = 'mode-badge'; tag.id = 'mode-badge';
        tag.innerHTML = label;
        canvasWrapper.appendChild(tag);
    }
    function removeModeTag() { const t = document.getElementById('mode-badge'); if(t) t.remove(); }

    function clearOverlay() {
        octx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
    }

    function showToast(msg, isError = false) {
        toast.textContent = msg;
        toast.style.backgroundColor = isError ? '#ef4444' : '#10b981';
        toast.classList.remove('hidden');
        toast.classList.add('visible');
        setTimeout(() => { toast.classList.remove('visible'); toast.classList.add('hidden'); }, 3000);
    }

}); // end DOMContentLoaded