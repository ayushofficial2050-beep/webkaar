/* ═══════════════════════════════════════════════════
   DRAWING REFERENCE PRO — script.js
   WebKaar | Ayush Tiwari | Ultimate Edition
   All 8 tools: Canvas API, 100% Offline
   Bugs fixed:
    ✔ Sketch — proper blur radius, contrast, vivid output
    ✔ Cartoon mode — const reassign crash fixed
    ✔ Mirror "both" — source pixel read from s not d
    ✔ Contour — bgWhite logic corrected
    ✔ Simplify — threshold direction fixed
    ✔ kMeans — crash on low pixel count fixed
    ✔ clipboard — HTTP fallback added
    ✔ Tab switch — no accidental canvas wipe
    ✔ Canvas size — clientWidth race condition fixed
    ✔ Max image size guard added
    ✔ copyHex — event delegation, no global pollution
═══════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {

  /* ─────────────────────────────────────────────────
     DOM REFERENCES
  ───────────────────────────────────────────────── */
  const fileInput       = document.getElementById('file-input');
  const dropZone        = document.getElementById('drop-zone');
  const workspaceArea   = document.getElementById('workspace-area');
  const mainCanvas      = document.getElementById('main-canvas');
  const overlayCanvas   = document.getElementById('overlay-canvas');
  const canvasWrapper   = document.getElementById('canvas-wrapper');
  const bottomBar       = document.getElementById('bottom-action-bar');
  const downloadBtn     = document.getElementById('download-btn');
  const resetBtn        = document.getElementById('reset-btn');
  const toastEl         = document.getElementById('toast');
  const infoBtn         = document.getElementById('info-btn');
  const infoModal       = document.getElementById('info-modal');
  const closeModalBtn   = document.getElementById('close-modal');
  const paletteResult   = document.getElementById('palette-result');

  const ctx   = mainCanvas.getContext('2d', { willReadFrequently: true });
  const octx  = overlayCanvas.getContext('2d', { willReadFrequently: true });

  /* ─────────────────────────────────────────────────
     STATE
  ───────────────────────────────────────────────── */
  let originalImage  = null;   // HTMLImageElement — never modified
  let currentDataURL = null;   // latest processed result for download
  let onionImage     = null;   // user drawing for onion skin
  let activeTab      = 'sketch';
  let toastTimer     = null;

  /* ─────────────────────────────────────────────────
     SLIDER LIVE VALUE LABELS
  ───────────────────────────────────────────────── */
  const SLIDER_MAP = {
    'sketch-intensity':    'sketch-intensity-val',
    'sketch-thickness':    'sketch-thickness-val',
    'contour-sensitivity': 'contour-sensitivity-val',
    'contrast-slider':     'contrast-val',
    'brightness-slider':   'brightness-val',
    'blur-slider':         'blur-val',
    'grid-opacity':        'grid-opacity-val',
    'onion-opacity':       'onion-opacity-val',
    'simplify-slider':     'simplify-val',
  };

  Object.entries(SLIDER_MAP).forEach(([sliderId, labelId]) => {
    const slider = document.getElementById(sliderId);
    const label  = document.getElementById(labelId);
    if (!slider || !label) return;

    // Update filled-track visual (CSS background-size trick)
    const updateFill = () => {
      const pct = ((slider.value - slider.min) / (slider.max - slider.min)) * 100;
      slider.style.backgroundSize = pct + '% 100%';
      label.textContent = slider.value;
    };

    slider.addEventListener('input', updateFill);
    updateFill(); // init on load
  });

  /* ─────────────────────────────────────────────────
     FILE UPLOAD & DRAG-DROP
  ───────────────────────────────────────────────── */
  fileInput.addEventListener('change', (e) => {
    if (e.target.files[0]) loadImageFile(e.target.files[0]);
    fileInput.value = '';
  });

  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
  });
  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) loadImageFile(file);
  });
  dropZone.addEventListener('click', (e) => {
    if (e.target.closest('button')) return;
    fileInput.click();
  });
  dropZone.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') fileInput.click();
  });

  /* ─────────────────────────────────────────────────
     LOAD IMAGE
  ───────────────────────────────────────────────── */
  const MAX_PIXELS = 2400 * 2400; // ~5.7MP limit — prevents browser crash

  function loadImageFile(file) {
    // File size guard (25MB)
    if (file.size > 25 * 1024 * 1024) {
      return showToast('Image too large. Max 25MB.', true);
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Pixel count guard
        if (img.naturalWidth * img.naturalHeight > MAX_PIXELS) {
          showToast('Image very large — resizing for performance.', false);
        }
        originalImage = img;
        drawOriginalToCanvas();
        showWorkspace();
        onionImage = null; // clear stale onion
        document.getElementById('onion-file-name').textContent = 'No file chosen';
      };
      img.onerror = () => showToast('Could not load image.', true);
      img.src = e.target.result;
    };
    reader.onerror = () => showToast('Could not read file.', true);
    reader.readAsDataURL(file);
  }

  function drawOriginalToCanvas() {
    if (!originalImage) return;

    // Use offsetWidth for reliable pre-paint width
    const maxW = canvasWrapper.offsetWidth || canvasWrapper.clientWidth || 360;
    let w = originalImage.naturalWidth;
    let h = originalImage.naturalHeight;

    // Downscale if over pixel limit
    const pixels = w * h;
    if (pixels > MAX_PIXELS) {
      const scale = Math.sqrt(MAX_PIXELS / pixels);
      w = Math.floor(w * scale);
      h = Math.floor(h * scale);
    }

    const ratio = w / h;
    if (w > maxW) { w = maxW; h = Math.round(w / ratio); }

    const maxH = Math.round(window.innerHeight * 0.62);
    if (h > maxH) { h = maxH; w = Math.round(h * ratio); }

    mainCanvas.width    = w;
    mainCanvas.height   = h;
    overlayCanvas.width = w;
    overlayCanvas.height = h;

    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(originalImage, 0, 0, w, h);
    currentDataURL = mainCanvas.toDataURL('image/png');
    clearOverlay();
    removeModeTag();
  }

  function showWorkspace() {
    dropZone.classList.add('hidden');
    workspaceArea.classList.remove('hidden');
    bottomBar.classList.remove('hidden');
  }

  /* ─────────────────────────────────────────────────
     TAB SWITCHING
     NOTE: Does NOT reset canvas — non-destructive UX
  ───────────────────────────────────────────────── */
  document.querySelectorAll('.drp-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.drp-tab').forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      document.querySelectorAll('.drp-panel').forEach(p => p.classList.add('hidden'));

      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
      activeTab = btn.dataset.tab;

      const panel = document.getElementById('panel-' + activeTab);
      if (panel) panel.classList.remove('hidden');

      // Only clear the vector overlay (grid lines etc.) — never wipe the pixel result
      clearOverlay();
    });
  });

  /* ─────────────────────────────────────────────────
     RESET
  ───────────────────────────────────────────────── */
  resetBtn.addEventListener('click', () => {
    if (!originalImage) return;
    drawOriginalToCanvas();
    removeModeTag();
    clearOverlay();
    paletteResult.classList.add('hidden');
    paletteResult.innerHTML = '';
    showToast('Reset to original ✓');
  });

  /* ─────────────────────────────────────────────────
     INFO MODAL
  ───────────────────────────────────────────────── */
  infoBtn?.addEventListener('click',       () => infoModal.classList.remove('hidden'));
  closeModalBtn?.addEventListener('click', () => infoModal.classList.add('hidden'));
  infoModal?.addEventListener('click', (e) => {
    if (e.target === infoModal) infoModal.classList.add('hidden');
  });

  /* ─────────────────────────────────────────────────
     DOWNLOAD
  ───────────────────────────────────────────────── */
  downloadBtn.addEventListener('click', () => {
    if (!currentDataURL) return showToast('Nothing to download yet.', true);
    const a = document.createElement('a');
    a.href     = currentDataURL;
    a.download = 'WebKaar_Drawing_Reference.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast('Downloaded! ✓');
  });

  /* ═══════════════════════════════════════════════
     TOOL 1 — PENCIL SKETCH
  ═══════════════════════════════════════════════ */
  document.getElementById('apply-sketch').addEventListener('click', () => {
    if (!originalImage) return showToast('Upload an image first!', true);
    showLoading('Applying sketch...');

    requestAnimationFrame(() => setTimeout(() => {
      try {
        const style     = document.getElementById('sketch-style').value;
        const intensity = parseInt(document.getElementById('sketch-intensity').value); // 10–100
        const blurR     = parseInt(document.getElementById('sketch-thickness').value); // 1–8
        const bg        = document.getElementById('sketch-bg').value;
        const w = mainCanvas.width, h = mainCanvas.height;

        const off = createOffscreen(w, h);
        off.ctx.drawImage(originalImage, 0, 0, w, h);
        const srcData = off.ctx.getImageData(0, 0, w, h);

        // Step 1 — Grayscale source
        const gray = toGrayscale(srcData);

        // Step 2 — Invert grayscale
        const inv = invertPixels(gray);

        // Step 3 — Gaussian blur on inverted layer
        //   Minimum effective radius for color-dodge is ~6
        //   User slider 1–8 maps to radius 6–20
        const effectiveRadius = 6 + (blurR - 1) * 2; // 6,8,10,12,14,16,18,20
        const blurred = gaussianBlur(inv, w, h, effectiveRadius);

        // Step 4 — Color dodge blend (gray ÷ (1 - blurred))
        const sketch = colorDodgeBlend(gray, blurred, w, h);

        // Step 5 — Intensity: map 10–100 → contrast factor 0.8–2.4
        //   Default 50 → factor 1.6 (visible, not flat)
        const contrastFactor = 0.8 + (intensity / 100) * 1.6;
        applyContrast(sketch, contrastFactor);

        // Step 6 — Style variations
        if (style === 'charcoal') applyCharcoal(sketch);
        if (style === 'ink')      applyInkLines(sketch);
        if (style === 'hatching') applyHatching(sketch, w, h);

        // Step 7 — Background tint
        applyBackground(sketch, bg);

        ctx.putImageData(sketch, 0, 0);
        currentDataURL = mainCanvas.toDataURL('image/png');
        setModeTag('✏️ Sketch');
        hideLoading();
        showToast('Sketch applied ✓');
      } catch (err) {
        hideLoading();
        showToast('Sketch failed.', true);
        console.error('[Sketch]', err);
      }
    }, 30));
  });

  /* ═══════════════════════════════════════════════
     TOOL 2 — GRID OVERLAY
  ═══════════════════════════════════════════════ */
  document.getElementById('apply-grid').addEventListener('click', () => {
    if (!originalImage) return showToast('Upload an image first!', true);

    // Always redraw original first so grid isn't baked on top of a prior effect
    ctx.clearRect(0, 0, mainCanvas.width, mainCanvas.height);
    ctx.drawImage(originalImage, 0, 0, mainCanvas.width, mainCanvas.height);
    clearOverlay();

    const type    = document.getElementById('grid-type').value;
    const color   = document.getElementById('grid-color').value;
    const opacity = parseInt(document.getElementById('grid-opacity').value) / 100;
    const labels  = document.getElementById('grid-labels').value === 'on';
    const w = mainCanvas.width, h = mainCanvas.height;

    const colorMap = {
      red: '#ef4444', blue: '#3b82f6', green: '#22c55e',
      white: '#ffffff', black: '#000000'
    };
    const lineColor = colorMap[color] || '#3b82f6';

    octx.save();
    octx.strokeStyle = lineColor;
    octx.fillStyle   = lineColor;
    octx.lineWidth   = 1.5;
    octx.globalAlpha = opacity;

    if (type === 'golden') {
      drawGoldenRatio(w, h);
    } else if (type === 'diagonal') {
      drawDiagonalGuides(w, h);
    } else {
      const [cols, rows] = type.split('x').map(Number);
      const cw = w / cols, rh = h / rows;

      for (let c = 1; c < cols; c++) {
        octx.beginPath();
        octx.moveTo(c * cw, 0);
        octx.lineTo(c * cw, h);
        octx.stroke();
        if (labels) {
          octx.save();
          octx.globalAlpha = Math.min(opacity + 0.3, 1);
          octx.font = 'bold 11px DM Sans, sans-serif';
          octx.fillText(String(c), c * cw + 4, 14);
          octx.restore();
        }
      }
      for (let r = 1; r < rows; r++) {
        octx.beginPath();
        octx.moveTo(0, r * rh);
        octx.lineTo(w, r * rh);
        octx.stroke();
        if (labels) {
          octx.save();
          octx.globalAlpha = Math.min(opacity + 0.3, 1);
          octx.font = 'bold 11px DM Sans, sans-serif';
          octx.fillText(String(r), 4, r * rh - 4);
          octx.restore();
        }
      }
    }

    octx.restore();

    // Bake overlay into main canvas for download
    ctx.drawImage(overlayCanvas, 0, 0);
    currentDataURL = mainCanvas.toDataURL('image/png');
    setModeTag('⊞ Grid');
    showToast('Grid applied ✓');
  });

  function drawGoldenRatio(w, h) {
    const phi = 1.61803398875;
    const x1 = w / phi, x2 = w - w / phi;
    const y1 = h / phi, y2 = h - h / phi;
    [
      [x1, 0, x1, h], [x2, 0, x2, h],
      [0, y1, w, y1], [0, y2, w, y2]
    ].forEach(([ax, ay, bx, by]) => {
      octx.beginPath(); octx.moveTo(ax, ay); octx.lineTo(bx, by); octx.stroke();
    });
  }

  function drawDiagonalGuides(w, h) {
    [
      [0, 0, w, h], [w, 0, 0, h],
      [0, h / 2, w, h / 2], [w / 2, 0, w / 2, h]
    ].forEach(([ax, ay, bx, by]) => {
      octx.beginPath(); octx.moveTo(ax, ay); octx.lineTo(bx, by); octx.stroke();
    });
  }

  /* ═══════════════════════════════════════════════
     TOOL 3 — CONTOUR / OUTLINE
  ═══════════════════════════════════════════════ */
  document.getElementById('apply-contour').addEventListener('click', () => {
    if (!originalImage) return showToast('Upload an image first!', true);
    showLoading('Detecting edges...');

    requestAnimationFrame(() => setTimeout(() => {
      try {
        const sensitivity = parseInt(document.getElementById('contour-sensitivity').value);
        const colorMode   = document.getElementById('contour-color').value;
        const detail      = document.getElementById('contour-detail').value;
        const w = mainCanvas.width, h = mainCanvas.height;

        const off = createOffscreen(w, h);
        off.ctx.drawImage(originalImage, 0, 0, w, h);
        const srcData = off.ctx.getImageData(0, 0, w, h);

        // More blur = cleaner, less noisy edges
        const blurAmt = detail === 'low' ? 4 : detail === 'mid' ? 2 : 1;
        const blurred = gaussianBlur(srcData, w, h, blurAmt);
        const edges   = sobelEdge(blurred, w, h, sensitivity);

        // --- BUG FIX: was inverted. darkBg = true when user wants white lines on dark bg ---
        const darkBg = (colorMode === 'white'); // "White on Black" → dark background

        const lineRGB =
          colorMode === 'white' ? [255, 255, 255] :
          colorMode === 'blue'  ? [59, 130, 246]  :
          colorMode === 'red'   ? [239, 68, 68]   :
                                  [0, 0, 0];        // black

        const d = edges.data;
        for (let i = 0; i < d.length; i += 4) {
          const edgeStrength = d[i] / 255; // 0.0 – 1.0
          if (darkBg) {
            // Dark background, light lines
            d[i] = d[i + 1] = d[i + 2] = Math.round(edgeStrength * 255);
          } else {
            // White/light background, dark colored lines
            d[i]     = Math.round(255 - edgeStrength * (255 - lineRGB[0]));
            d[i + 1] = Math.round(255 - edgeStrength * (255 - lineRGB[1]));
            d[i + 2] = Math.round(255 - edgeStrength * (255 - lineRGB[2]));
          }
          d[i + 3] = 255;
        }

        ctx.putImageData(edges, 0, 0);
        currentDataURL = mainCanvas.toDataURL('image/png');
        setModeTag('〰 Contour');
        hideLoading();
        showToast('Contour extracted ✓');
      } catch (err) {
        hideLoading();
        showToast('Contour failed.', true);
        console.error('[Contour]', err);
      }
    }, 30));
  });

  /* ═══════════════════════════════════════════════
     TOOL 4 — VALUE STUDY (GRAYSCALE)
  ═══════════════════════════════════════════════ */
  document.getElementById('apply-grayscale').addEventListener('click', () => {
    if (!originalImage) return showToast('Upload an image first!', true);
    showLoading('Applying value study...');

    requestAnimationFrame(() => setTimeout(() => {
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
        showToast('Value study applied ✓');
      } catch (err) {
        hideLoading();
        showToast('Value study failed.', true);
        console.error('[Value]', err);
      }
    }, 30));
  });

  /* ═══════════════════════════════════════════════
     TOOL 5 — SYMMETRY MIRROR
  ═══════════════════════════════════════════════ */
  document.getElementById('apply-mirror').addEventListener('click', () => {
    if (!originalImage) return showToast('Upload an image first!', true);

    const axis  = document.getElementById('mirror-axis').value;
    const side  = document.getElementById('mirror-side').value;
    const guide = document.getElementById('mirror-guide').value === 'on';
    const w = mainCanvas.width, h = mainCanvas.height;

    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(originalImage, 0, 0, w, h);

    const srcData = ctx.getImageData(0, 0, w, h);
    const s = srcData.data; // read from source — never modified
    const result = new ImageData(new Uint8ClampedArray(s), w, h);
    const d = result.data;

    if (axis === 'vertical') {
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < Math.floor(w / 2); x++) {
          const srcX = side === 'left' ? x : w - 1 - x;
          const dstX = side === 'left' ? w - 1 - x : x;
          const si   = (y * w + srcX) * 4;
          const di   = (y * w + dstX) * 4;
          d[di]     = s[si];
          d[di + 1] = s[si + 1];
          d[di + 2] = s[si + 2];
          d[di + 3] = s[si + 3];
        }
      }
    } else if (axis === 'horizontal') {
      for (let y = 0; y < Math.floor(h / 2); y++) {
        const srcY = side === 'left' ? y : h - 1 - y;
        const dstY = side === 'left' ? h - 1 - y : y;
        for (let x = 0; x < w; x++) {
          const si   = (srcY * w + x) * 4;
          const di   = (dstY * w + x) * 4;
          d[di]     = s[si];
          d[di + 1] = s[si + 1];
          d[di + 2] = s[si + 2];
          d[di + 3] = s[si + 3];
        }
      }
    } else if (axis === 'both') {
      // --- BUG FIX: read from s (original), not d (being modified) ---
      const hw = Math.floor(w / 2);
      const hh = Math.floor(h / 2);
      for (let y = 0; y < hh; y++) {
        for (let x = 0; x < hw; x++) {
          const si = (y * w + x) * 4;
          const rv = [s[si], s[si + 1], s[si + 2], s[si + 3]];
          const targets = [
            (y       * w + (w - 1 - x)) * 4,
            ((h - 1 - y) * w + x)       * 4,
            ((h - 1 - y) * w + (w - 1 - x)) * 4
          ];
          for (const pi of targets) {
            d[pi]     = rv[0];
            d[pi + 1] = rv[1];
            d[pi + 2] = rv[2];
            d[pi + 3] = rv[3];
          }
        }
      }
    }

    ctx.putImageData(result, 0, 0);

    // Draw guide lines on top
    if (guide) {
      ctx.save();
      ctx.strokeStyle = 'rgba(239,68,68,0.9)';
      ctx.lineWidth   = 2;
      ctx.setLineDash([8, 6]);
      ctx.lineDashOffset = 0;
      if (axis === 'vertical' || axis === 'both') {
        ctx.beginPath(); ctx.moveTo(w / 2, 0); ctx.lineTo(w / 2, h); ctx.stroke();
      }
      if (axis === 'horizontal' || axis === 'both') {
        ctx.beginPath(); ctx.moveTo(0, h / 2); ctx.lineTo(w, h / 2); ctx.stroke();
      }
      ctx.restore();
    }

    currentDataURL = mainCanvas.toDataURL('image/png');
    setModeTag('⇔ Mirror');
    showToast('Mirror applied ✓');
  });

  /* ═══════════════════════════════════════════════
     TOOL 6 — COLOR PALETTE EXTRACTOR
  ═══════════════════════════════════════════════ */
  document.getElementById('apply-palette').addEventListener('click', () => {
    if (!originalImage) return showToast('Upload an image first!', true);
    showLoading('Extracting palette...');

    requestAnimationFrame(() => setTimeout(() => {
      try {
        const count      = parseInt(document.getElementById('palette-count').value);
        const styleMode  = document.getElementById('palette-style').value;
        const w = mainCanvas.width, h = mainCanvas.height;

        const off = createOffscreen(w, h);
        off.ctx.drawImage(originalImage, 0, 0, w, h);
        const imgData = off.ctx.getImageData(0, 0, w, h);

        const palette = extractPalette(imgData, count, styleMode);
        renderPalette(palette);

        // Restore original on canvas (palette shown as UI below)
        ctx.clearRect(0, 0, w, h);
        ctx.drawImage(originalImage, 0, 0, w, h);
        currentDataURL = mainCanvas.toDataURL('image/png');
        setModeTag('🎨 Palette');
        hideLoading();
        showToast('Tap any color to copy hex ✓');
      } catch (err) {
        hideLoading();
        showToast('Palette extraction failed.', true);
        console.error('[Palette]', err);
      }
    }, 50));
  });

  function extractPalette(imgData, count, styleMode) {
    const d    = imgData.data;
    const step = Math.max(1, Math.floor(d.length / 4 / 4000));
    const pixels = [];

    for (let i = 0; i < d.length; i += 4 * step) {
      const r = d[i], g = d[i + 1], b = d[i + 2], a = d[i + 3];
      if (a < 128) continue;
      const sat = getSaturation(r, g, b);
      if (styleMode === 'vibrant' && sat < 0.25) continue;
      if (styleMode === 'muted'   && sat > 0.65) continue;
      pixels.push([r, g, b]);
    }

    // --- BUG FIX: guard against too few pixels ---
    if (pixels.length === 0) return ['#888888'];
    if (pixels.length < count) {
      return pixels.map(p => rgbToHex(p[0], p[1], p[2]));
    }

    return kMeans(pixels, count).map(c =>
      rgbToHex(Math.round(c[0]), Math.round(c[1]), Math.round(c[2]))
    );
  }

  function kMeans(pixels, k) {
    // Safe initial centers using evenly spaced samples
    const step = Math.max(1, Math.floor(pixels.length / k));
    let centers = [];
    for (let i = 0; i < k; i++) {
      const idx = Math.min(i * step, pixels.length - 1);
      centers.push([...pixels[idx]]);
    }

    for (let iter = 0; iter < 14; iter++) {
      const clusters = Array.from({ length: k }, () => []);
      for (const p of pixels) {
        let best = 0, bestDist = Infinity;
        for (let ci = 0; ci < k; ci++) {
          const c    = centers[ci];
          const dist = (p[0]-c[0])**2 + (p[1]-c[1])**2 + (p[2]-c[2])**2;
          if (dist < bestDist) { bestDist = dist; best = ci; }
        }
        clusters[best].push(p);
      }
      centers = clusters.map(cl => {
        if (!cl.length) return [128, 128, 128];
        const avg = [0, 0, 0];
        for (const p of cl) { avg[0] += p[0]; avg[1] += p[1]; avg[2] += p[2]; }
        return avg.map(v => v / cl.length);
      });
    }
    return centers;
  }

  function renderPalette(hexColors) {
    paletteResult.classList.remove('hidden');
    paletteResult.innerHTML = `
      <div class="drp-palette-swatches">
        ${hexColors.map(hex => `
          <div class="drp-swatch" data-hex="${hex}" role="button" tabindex="0" aria-label="Copy ${hex}">
            <div class="drp-swatch-box" style="background:${hex};"></div>
            <span class="drp-swatch-hex">${hex}</span>
          </div>
        `).join('')}
      </div>
      <p class="drp-palette-hint">
        <i class="ph-bold ph-copy"></i>
        Tap any swatch to copy hex
      </p>
    `;
  }

  // --- BUG FIX: Event delegation instead of window.copyHex global ---
  paletteResult.addEventListener('click', (e) => {
    const swatch = e.target.closest('.drp-swatch');
    if (!swatch) return;
    const hex = swatch.dataset.hex;
    copyToClipboard(hex, () => showToast('Copied ' + hex + ' ✓'));
  });
  paletteResult.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      const swatch = e.target.closest('.drp-swatch');
      if (!swatch) return;
      copyToClipboard(swatch.dataset.hex, () => showToast('Copied ' + swatch.dataset.hex + ' ✓'));
    }
  });

  /* ═══════════════════════════════════════════════
     TOOL 7 — ONION SKIN
  ═══════════════════════════════════════════════ */
  const onionFileInput = document.getElementById('onion-file-input');
  const onionUploadBtn = document.getElementById('onion-upload-btn');
  const onionFileName  = document.getElementById('onion-file-name');

  onionUploadBtn.addEventListener('click', () => onionFileInput.click());

  onionFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        onionImage = img;
        onionFileName.textContent = file.name;
        showToast('Drawing loaded — tap Apply ✓');
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
    onionFileInput.value = '';
  });

  document.getElementById('apply-onion').addEventListener('click', () => {
    if (!originalImage) return showToast('Upload a reference image first!', true);
    if (!onionImage)    return showToast('Upload your drawing first!', true);

    const opacity = parseInt(document.getElementById('onion-opacity').value) / 100;
    const blend   = document.getElementById('onion-blend').value;
    const w = mainCanvas.width, h = mainCanvas.height;

    // Draw reference
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(originalImage, 0, 0, w, h);

    // Overlay drawing
    ctx.save();
    ctx.globalAlpha              = opacity;
    ctx.globalCompositeOperation = blend;
    ctx.drawImage(onionImage, 0, 0, w, h);
    ctx.restore();

    currentDataURL = mainCanvas.toDataURL('image/png');
    setModeTag('◈ Onion');
    showToast('Onion skin applied ✓');
  });

  /* ═══════════════════════════════════════════════
     TOOL 8 — LINE SIMPLIFIER
  ═══════════════════════════════════════════════ */
  document.getElementById('apply-simplify').addEventListener('click', () => {
    if (!originalImage) return showToast('Upload an image first!', true);
    showLoading('Simplifying lines...');

    requestAnimationFrame(() => setTimeout(() => {
      try {
        const level  = parseInt(document.getElementById('simplify-slider').value); // 10–100
        const style  = document.getElementById('simplify-style').value;
        const weight = document.getElementById('simplify-weight').value;
        const w = mainCanvas.width, h = mainCanvas.height;

        const off = createOffscreen(w, h);
        off.ctx.drawImage(originalImage, 0, 0, w, h);
        let imgData = off.ctx.getImageData(0, 0, w, h);

        // Blur amount — more simplification = more blur first
        const blurAmt = Math.max(1, Math.round(level / 12));
        imgData = gaussianBlur(imgData, w, h, blurAmt);

        // --- BUG FIX: higher level = higher threshold = fewer edges (correct direction) ---
        const threshold = 30 + Math.round((level / 100) * 180);
        imgData = sobelEdge(imgData, w, h, threshold);

        // Invert to black lines on white
        const d = imgData.data;
        for (let i = 0; i < d.length; i += 4) {
          const v = d[i] > 40 ? 0 : 255;
          d[i] = d[i + 1] = d[i + 2] = v;
          d[i + 3] = 255;
        }

        // Line weight morphology
        if (weight === 'thick') imgData = dilate(imgData, w, h, 2);
        if (weight === 'thin')  imgData = erode(imgData, w, h);

        if (style === 'cartoon') {
          // --- BUG FIX: use let not const for reassignable ---
          const colorOff = createOffscreen(w, h);
          colorOff.ctx.drawImage(originalImage, 0, 0, w, h);
          let colorData = colorOff.ctx.getImageData(0, 0, w, h);
          colorData = posterize(colorData, 4); // fixed: was calling wrong fn name

          ctx.putImageData(colorData, 0, 0);

          const lineOff = createOffscreen(w, h);
          lineOff.ctx.putImageData(imgData, 0, 0);
          ctx.save();
          ctx.globalCompositeOperation = 'multiply';
          ctx.drawImage(lineOff.canvas, 0, 0);
          ctx.restore();
        } else {
          ctx.putImageData(imgData, 0, 0);
        }

        currentDataURL = mainCanvas.toDataURL('image/png');
        setModeTag('〜 Simplified');
        hideLoading();
        showToast('Lines simplified ✓');
      } catch (err) {
        hideLoading();
        showToast('Simplify failed.', true);
        console.error('[Simplify]', err);
      }
    }, 50));
  });

  /* ═══════════════════════════════════════════════
     IMAGE PROCESSING HELPERS
  ═══════════════════════════════════════════════ */

  function createOffscreen(w, h) {
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const c = canvas.getContext('2d', { willReadFrequently: true });
    return { canvas, ctx: c };
  }

  function toGrayscale(imgData) {
    const out = new ImageData(new Uint8ClampedArray(imgData.data), imgData.width, imgData.height);
    const d = out.data;
    for (let i = 0; i < d.length; i += 4) {
      // Perceptual luminance weights
      const v = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
      d[i] = d[i + 1] = d[i + 2] = v;
    }
    return out;
  }

  function invertPixels(imgData) {
    const out = new ImageData(new Uint8ClampedArray(imgData.data), imgData.width, imgData.height);
    const d = out.data;
    for (let i = 0; i < d.length; i += 4) {
      d[i]     = 255 - d[i];
      d[i + 1] = 255 - d[i + 1];
      d[i + 2] = 255 - d[i + 2];
    }
    return out;
  }

  function gaussianBlur(imgData, w, h, radius) {
    if (radius < 1) return imgData;
    const kernel = buildGaussKernel(radius);
    const kLen   = kernel.length;
    const half   = Math.floor(kLen / 2);
    const src    = imgData.data;
    const tmp    = new Float32Array(src.length);
    const dst    = new Uint8ClampedArray(src.length);

    // Horizontal pass
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        let r = 0, g = 0, b = 0, a = 0;
        for (let k = 0; k < kLen; k++) {
          const px  = clampV(x + k - half, 0, w - 1);
          const idx = (y * w + px) * 4;
          const kv  = kernel[k];
          r += src[idx]     * kv;
          g += src[idx + 1] * kv;
          b += src[idx + 2] * kv;
          a += src[idx + 3] * kv;
        }
        const di = (y * w + x) * 4;
        tmp[di] = r; tmp[di + 1] = g; tmp[di + 2] = b; tmp[di + 3] = a;
      }
    }
    // Vertical pass
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        let r = 0, g = 0, b = 0, a = 0;
        for (let k = 0; k < kLen; k++) {
          const py  = clampV(y + k - half, 0, h - 1);
          const idx = (py * w + x) * 4;
          const kv  = kernel[k];
          r += tmp[idx]     * kv;
          g += tmp[idx + 1] * kv;
          b += tmp[idx + 2] * kv;
          a += tmp[idx + 3] * kv;
        }
        const di = (y * w + x) * 4;
        dst[di] = r; dst[di + 1] = g; dst[di + 2] = b; dst[di + 3] = a;
      }
    }
    return new ImageData(dst, w, h);
  }

  function buildGaussKernel(radius) {
    const size  = radius * 2 + 1;
    const sigma = radius / 2.5;
    const kernel = new Float32Array(size);
    let sum = 0;
    for (let i = 0; i < size; i++) {
      const x    = i - radius;
      const val  = Math.exp(-(x * x) / (2 * sigma * sigma));
      kernel[i]  = val;
      sum       += val;
    }
    for (let i = 0; i < size; i++) kernel[i] /= sum;
    return kernel;
  }

  function colorDodgeBlend(base, blend, w, h) {
    const out = new ImageData(new Uint8ClampedArray(base.data), w, h);
    const d   = out.data;
    const b   = blend.data;
    for (let i = 0; i < d.length; i += 4) {
      for (let c = 0; c < 3; c++) {
        const bottom = d[i + c];
        const top    = b[i + c];
        // Dodge: bottom / (1 - top/255)
        d[i + c] = top >= 255
          ? 255
          : Math.min(255, Math.round((bottom * 255) / (255 - top)));
      }
      // Alpha stays as-is
    }
    return out;
  }

  function applyContrast(imgData, factor) {
    const d      = imgData.data;
    const offset = 128 * (1 - factor);
    for (let i = 0; i < d.length; i += 4) {
      d[i]     = clamp(d[i]     * factor + offset);
      d[i + 1] = clamp(d[i + 1] * factor + offset);
      d[i + 2] = clamp(d[i + 2] * factor + offset);
    }
    return imgData;
  }

  function applyBrightness(imgData, factor) {
    const d = imgData.data;
    for (let i = 0; i < d.length; i += 4) {
      d[i]     = clamp(d[i]     * factor);
      d[i + 1] = clamp(d[i + 1] * factor);
      d[i + 2] = clamp(d[i + 2] * factor);
    }
    return imgData;
  }

  function applyBackground(imgData, bg) {
    const d = imgData.data;
    for (let i = 0; i < d.length; i += 4) {
      if (bg === 'cream') {
        d[i]     = Math.min(255, d[i]     + 18);
        d[i + 1] = Math.min(255, d[i + 1] + 12);
        d[i + 2] = Math.max(0,   d[i + 2] - 8);
      } else if (bg === 'dark') {
        d[i]     = 255 - d[i];
        d[i + 1] = 255 - d[i + 1];
        d[i + 2] = 255 - d[i + 2];
      }
      // 'white' = no change needed
    }
  }

  function applyCharcoal(imgData) {
    const d = imgData.data;
    for (let i = 0; i < d.length; i += 4) {
      const v = d[i];
      // Compress midtones, soften highlights for smudged look
      d[i] = d[i + 1] = d[i + 2] =
        v < 60  ? Math.round(v * 0.65) :
        v > 210 ? 215 :
        Math.round(v * 0.88);
    }
  }

  function applyInkLines(imgData) {
    const d = imgData.data;
    for (let i = 0; i < d.length; i += 4) {
      // Hard threshold — crisp ink
      const v = d[i] > 155 ? 255 : 0;
      d[i] = d[i + 1] = d[i + 2] = v;
    }
  }

  function applyHatching(imgData, w, h) {
    const d = imgData.data;
    for (let i = 0; i < d.length; i += 4) {
      const pixIdx = i / 4;
      const x = pixIdx % w;
      const y = Math.floor(pixIdx / w);
      const v = d[i];

      if (v < 70) {
        // Very dark — cross hatch
        const hatch = ((x + y) % 5 === 0) || ((x - y + w * 2) % 5 === 0);
        d[i] = d[i + 1] = d[i + 2] = hatch ? 0 : 15;
      } else if (v < 145) {
        // Mid — single diagonal
        const hatch = ((x + y) % 7 === 0);
        d[i] = d[i + 1] = d[i + 2] = hatch ? 20 : 210;
      } else {
        d[i] = d[i + 1] = d[i + 2] = 255;
      }
    }
  }

  function sobelEdge(imgData, w, h, threshold) {
    const gray = toGrayscale(imgData);
    const src  = gray.data;
    const dst  = new Uint8ClampedArray(w * h * 4);

    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const tl = src[((y-1)*w+(x-1))*4];
        const tm = src[((y-1)*w+ x   )*4];
        const tr = src[((y-1)*w+(x+1))*4];
        const ml = src[( y   *w+(x-1))*4];
        const mr = src[( y   *w+(x+1))*4];
        const bl = src[((y+1)*w+(x-1))*4];
        const bm = src[((y+1)*w+ x   )*4];
        const br = src[((y+1)*w+(x+1))*4];

        const gx = -tl - 2*ml - bl + tr + 2*mr + br;
        const gy = -tl - 2*tm - tr + bl + 2*bm + br;
        const mag = Math.min(255, Math.sqrt(gx*gx + gy*gy));

        const idx = (y * w + x) * 4;
        const val = mag > threshold ? mag : 0;
        dst[idx] = dst[idx+1] = dst[idx+2] = val;
        dst[idx+3] = 255;
      }
    }
    return new ImageData(dst, w, h);
  }

  function applySepia(imgData) {
    const out = new ImageData(new Uint8ClampedArray(imgData.data), imgData.width, imgData.height);
    const d   = out.data;
    for (let i = 0; i < d.length; i += 4) {
      const r = d[i], g = d[i+1], b = d[i+2];
      d[i]     = clamp(r * 0.393 + g * 0.769 + b * 0.189);
      d[i + 1] = clamp(r * 0.349 + g * 0.686 + b * 0.168);
      d[i + 2] = clamp(r * 0.272 + g * 0.534 + b * 0.131);
    }
    return out;
  }

  function applyPosterize(imgData, levels) {
    const d    = imgData.data;
    const step = 255 / (levels - 1);
    for (let i = 0; i < d.length; i += 4) {
      d[i]     = Math.round(Math.round(d[i]     / step) * step);
      d[i + 1] = Math.round(Math.round(d[i + 1] / step) * step);
      d[i + 2] = Math.round(Math.round(d[i + 2] / step) * step);
    }
    return imgData;
  }

  // --- BUG FIX: unified posterize fn (was duplicated as posterizeForCartoon) ---
  function posterize(imgData, levels) {
    return applyPosterize(
      new ImageData(new Uint8ClampedArray(imgData.data), imgData.width, imgData.height),
      levels
    );
  }

  function dilate(imgData, w, h, radius) {
    const src = imgData.data;
    const dst = new Uint8ClampedArray(src);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (src[(y * w + x) * 4] === 0) {
          for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
              const nx = clampV(x + dx, 0, w - 1);
              const ny = clampV(y + dy, 0, h - 1);
              const ni = (ny * w + nx) * 4;
              dst[ni] = dst[ni+1] = dst[ni+2] = 0;
              dst[ni+3] = 255;
            }
          }
        }
      }
    }
    return new ImageData(dst, w, h);
  }

  function erode(imgData, w, h) {
    const src = imgData.data;
    const dst = new Uint8ClampedArray(src);
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const idx = (y * w + x) * 4;
        const neighbors = [
          src[((y-1)*w+x)*4], src[((y+1)*w+x)*4],
          src[(y*w+(x-1))*4], src[(y*w+(x+1))*4]
        ];
        if (neighbors.some(v => v === 255)) {
          dst[idx] = dst[idx+1] = dst[idx+2] = 255;
          dst[idx+3] = 255;
        }
      }
    }
    return new ImageData(dst, w, h);
  }

  function getSaturation(r, g, b) {
    const max = Math.max(r, g, b) / 255;
    const min = Math.min(r, g, b) / 255;
    return max === 0 ? 0 : (max - min) / max;
  }

  function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(v => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');
  }

  function clamp(v)         { return Math.max(0, Math.min(255, Math.round(v))); }
  function clampV(v, lo, hi){ return v < lo ? lo : v > hi ? hi : v; }

  /* ─────────────────────────────────────────────────
     CLIPBOARD HELPER
     BUG FIX: HTTP fallback for navigator.clipboard
  ───────────────────────────────────────────────── */
  function copyToClipboard(text, onSuccess) {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(onSuccess).catch(() => fallbackCopy(text, onSuccess));
    } else {
      fallbackCopy(text, onSuccess);
    }
  }

  function fallbackCopy(text, onSuccess) {
    const el = document.createElement('textarea');
    el.value = text;
    el.setAttribute('readonly', '');
    el.style.cssText = 'position:fixed;top:-999px;left:-999px;opacity:0;';
    document.body.appendChild(el);
    el.focus();
    el.select();
    try { document.execCommand('copy'); onSuccess?.(); } catch (_) {}
    document.body.removeChild(el);
  }

  /* ─────────────────────────────────────────────────
     UI HELPERS
  ───────────────────────────────────────────────── */
  function showLoading(msg) {
    removeLoading();
    const el = document.createElement('div');
    el.className = 'drp-loading';
    el.id = 'drp-loading';
    el.innerHTML = `
      <div class="drp-spinner"></div>
      <span class="drp-loading-text">${msg}</span>
    `;
    canvasWrapper.appendChild(el);
  }

  function hideLoading() { removeLoading(); }

  function removeLoading() {
    const el = document.getElementById('drp-loading');
    if (el) el.remove();
  }

  function setModeTag(label) {
    removeModeTag();
    const tag = document.createElement('div');
    tag.className = 'drp-mode-badge';
    tag.id        = 'drp-mode-badge';
    tag.innerHTML = label;
    canvasWrapper.appendChild(tag);
  }

  function removeModeTag() {
    const el = document.getElementById('drp-mode-badge');
    if (el) el.remove();
  }

  function clearOverlay() {
    octx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
  }

  function showToast(msg, isError = false) {
    clearTimeout(toastTimer);
    toastEl.textContent = msg;
    toastEl.className   = 'drp-toast drp-toast--visible' + (isError ? ' drp-toast--error' : '');

    toastTimer = setTimeout(() => {
      toastEl.className = 'drp-toast';
    }, 3000);
  }

}); // end DOMContentLoaded