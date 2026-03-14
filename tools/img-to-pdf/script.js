document.addEventListener('DOMContentLoaded', () => {
    
    const fileInput = document.getElementById('file-input');
    const dropZone = document.getElementById('drop-zone');
    const workspaceArea = document.getElementById('workspace-area');
    const imageGrid = document.getElementById('image-grid');
    const bottomActionBar = document.getElementById('bottom-action-bar');
    const convertBtn = document.getElementById('convert-btn');
    const clearBtn = document.getElementById('clear-btn');
    const countEl = document.getElementById('count');
    const toast = document.getElementById('toast');

    const pdfFormat = document.getElementById('pdf-format');
    const pdfOrientation = document.getElementById('pdf-orientation');
    const pdfMargin = document.getElementById('pdf-margin');

    const cropModal = document.getElementById('crop-modal');
    const cropImageTarget = document.getElementById('crop-image-target');
    const closeCropModal = document.getElementById('close-crop-modal');
    const rotateLeftBtn = document.getElementById('rotate-left-btn');
    const rotateRightBtn = document.getElementById('rotate-right-btn');
    const resetCropBtn = document.getElementById('reset-crop-btn');
    const saveCropBtn = document.getElementById('save-crop-btn');

    let imagesData = []; 
    let cropperInstance = null;
    let currentEditId = null;

    // --- FILE UPLOAD ---
    fileInput.addEventListener('change', async (e) => {
        await processFiles(e.target.files);
        fileInput.value = ''; 
    });

    dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('dragover'); });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
    dropZone.addEventListener('drop', async (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        await processFiles(e.dataTransfer.files);
    });

    async function processFiles(files) {
        const validFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
        if (validFiles.length === 0) return;

        const newImages = await Promise.all(validFiles.map(async (file) => {
            const dataUrl = await readFileAsDataURL(file);
            return { id: 'img_' + Date.now() + Math.random().toString(36).substr(2, 5), activeUrl: dataUrl };
        }));

        imagesData = [...imagesData, ...newImages];
        updateUI();
    }

    function readFileAsDataURL(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    // --- RENDER GRID ---
    function updateUI() {
        imageGrid.innerHTML = '';
        countEl.textContent = imagesData.length;

        if (imagesData.length > 0) {
            dropZone.classList.add('hidden');
            workspaceArea.classList.remove('hidden');
            bottomActionBar.classList.remove('hidden');
        } else {
            dropZone.classList.remove('hidden');
            workspaceArea.classList.add('hidden');
            bottomActionBar.classList.add('hidden');
        }

        imagesData.forEach((imgObj, index) => {
            const div = document.createElement('div');
            div.className = 'doc-card';
            div.dataset.id = imgObj.id;
            
            div.innerHTML = `
                <div class="page-badge">Pg ${index + 1}</div>
                <img src="${imgObj.activeUrl}" alt="Doc Page">
                <div class="card-overlay">
                    <button class="action-icon-btn edit"><i class="ph-bold ph-crop"></i></button>
                    <button class="action-icon-btn delete"><i class="ph-bold ph-trash"></i></button>
                </div>
            `;
            
            // 🔥 ULTIMATE MOBILE FIX: Kill context menu on touch/hold
            div.addEventListener('contextmenu', (e) => { e.preventDefault(); e.stopPropagation(); return false; });

            imageGrid.appendChild(div);

            div.querySelector('.delete').addEventListener('click', (e) => {
                e.preventDefault(); e.stopPropagation();
                imagesData = imagesData.filter(img => img.id !== imgObj.id);
                updateUI();
            });

            div.querySelector('.edit').addEventListener('click', (e) => {
                e.preventDefault(); e.stopPropagation();
                openEditor(imgObj.id, imgObj.activeUrl);
            });
        });
    }

    // --- SORTABLE.JS ---
    new Sortable(imageGrid, {
        animation: 200,
        ghostClass: 'sortable-ghost',
        delay: 200, 
        delayOnTouchOnly: true,
        touchStartThreshold: 5,
        onEnd: function () {
            const newOrderIds = Array.from(imageGrid.children).map(card => card.dataset.id);
            const newImagesData = [];
            newOrderIds.forEach(id => {
                const imgObj = imagesData.find(img => img.id === id);
                if (imgObj) newImagesData.push(imgObj);
            });
            imagesData = newImagesData;
            updateUI(); 
        }
    });

    // --- CROPPER.JS ---
    function openEditor(id, imageUrl) {
        currentEditId = id;
        cropImageTarget.src = imageUrl;
        cropModal.classList.remove('hidden');

        if (cropperInstance) cropperInstance.destroy();

        // 🔥 FIX: dragMode: 'move' makes cropping SUPER easy on mobile (pan & zoom)
        cropperInstance = new Cropper(cropImageTarget, {
            viewMode: 1,
            dragMode: 'move', 
            autoCropArea: 0.9,
            background: false,
            responsive: true,
            restore: false
        });
    }

    function closeEditor() {
        cropModal.classList.add('hidden');
        if (cropperInstance) { cropperInstance.destroy(); cropperInstance = null; }
        currentEditId = null;
    }

    closeCropModal.addEventListener('click', closeEditor);
    rotateLeftBtn.addEventListener('click', () => { if(cropperInstance) cropperInstance.rotate(-90); });
    rotateRightBtn.addEventListener('click', () => { if(cropperInstance) cropperInstance.rotate(90); });
    resetCropBtn.addEventListener('click', () => { if(cropperInstance) cropperInstance.reset(); });

    saveCropBtn.addEventListener('click', () => {
        if (!cropperInstance || !currentEditId) return;
        const canvas = cropperInstance.getCroppedCanvas({ imageSmoothingQuality: 'high' });
        const targetImg = imagesData.find(img => img.id === currentEditId);
        if (targetImg) targetImg.activeUrl = canvas.toDataURL('image/jpeg', 0.85);
        closeEditor();
        updateUI();
    });

    // --- PDF GENERATION ---
    clearBtn.addEventListener('click', () => { if(confirm("Clear all pages?")) { imagesData = []; updateUI(); } });

    convertBtn.addEventListener('click', () => {
        if (imagesData.length === 0) return;
        
        const originalHTML = convertBtn.innerHTML;
        convertBtn.innerHTML = '<i class="ph-bold ph-spinner ph-spin"></i> Building PDF...';
        convertBtn.disabled = true;

        setTimeout(() => {
            try {
                const { jsPDF } = window.jspdf;
                const formatMode = pdfFormat.value; 
                const orient = pdfOrientation.value; 
                const marginOpt = parseInt(pdfMargin.value); 

                let stdWidth = orient === 'p' ? 210 : 297;
                let stdHeight = orient === 'p' ? 297 : 210;

                let pdf = new jsPDF({ orientation: orient, unit: 'mm', format: formatMode === 'a4' ? 'a4' : [stdWidth, stdHeight] });

                for (let i = 0; i < imagesData.length; i++) {
                    const imgData = imagesData[i].activeUrl;
                    const imgProps = pdf.getImageProperties(imgData);
                    const imgRatio = imgProps.width / imgProps.height;
                    let renderW, renderH, x, y;

                    if (formatMode === 'fit') {
                        let rawMmWidth = imgProps.width * 0.264583;
                        let rawMmHeight = imgProps.height * 0.264583;
                        let finalPageWidth = rawMmWidth + (marginOpt * 2);
                        let finalPageHeight = rawMmHeight + (marginOpt * 2);
                        let dynamicOrient = finalPageWidth > finalPageHeight ? 'l' : 'p';
                        
                        if (i === 0) { pdf.deletePage(1); }
                        pdf.addPage([finalPageWidth, finalPageHeight], dynamicOrient);
                        
                        renderW = rawMmWidth; renderH = rawMmHeight; x = marginOpt; y = marginOpt;
                    } else {
                        if (i > 0) pdf.addPage('a4', orient);
                        const maxW = stdWidth - (marginOpt * 2);
                        const maxH = stdHeight - (marginOpt * 2);
                        const pageRatio = maxW / maxH;

                        if (imgRatio > pageRatio) { renderW = maxW; renderH = maxW / imgRatio; } 
                        else { renderH = maxH; renderW = maxH * imgRatio; }
                        x = marginOpt + ((maxW - renderW) / 2); y = marginOpt + ((maxH - renderH) / 2);
                    }
                    pdf.addImage(imgData, 'JPEG', x, y, renderW, renderH, undefined, 'FAST');
                }
                pdf.save('WebKaar_Document.pdf');
                showToast("PDF Created Successfully!");

            } catch (err) {
                console.error(err); showToast("Error creating PDF. Images might be too large.", true);
            } finally {
                convertBtn.innerHTML = originalHTML; convertBtn.disabled = false;
            }
        }, 150);
    });

    function showToast(msg, isError = false) {
        toast.textContent = msg; toast.style.backgroundColor = isError ? '#ef4444' : '#10b981';
        toast.classList.remove('hidden'); toast.classList.add('visible');
        setTimeout(() => { toast.classList.remove('visible'); toast.classList.add('hidden'); }, 3000);
    }
    
    const infoBtn = document.getElementById('info-btn');
    const infoModal = document.getElementById('info-modal');
    const closeInfoModal = document.getElementById('close-modal');
    if(infoBtn) infoBtn.addEventListener('click', () => infoModal.classList.remove('hidden'));
    if(closeInfoModal) closeInfoModal.addEventListener('click', () => infoModal.classList.add('hidden'));
    if(infoModal) infoModal.addEventListener('click', (e) => { if(e.target === infoModal) infoModal.classList.add('hidden'); });

});