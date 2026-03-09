document.addEventListener('DOMContentLoaded', () => {
    
    // Setup PDF.js Worker
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

    // Elements
    const fileInput = document.getElementById('file-input');
    const dropZone = document.getElementById('drop-zone');
    const actionArea = document.getElementById('action-area');
    const fileNameEl = document.getElementById('file-name');
    const fileSizeEl = document.getElementById('file-size');
    const compressBtn = document.getElementById('compress-btn');
    const progressContainer = document.getElementById('progress-container');
    const progressFill = document.getElementById('progress-fill');
    const progressText = document.getElementById('progress-text');
    const toast = document.getElementById('toast');

    // Slider Elements
    const qualitySlider = document.getElementById('quality-slider');
    const qualityValDisplay = document.getElementById('quality-val');

    let currentFile = null;

    // 1. Slider Update Logic
    qualitySlider.addEventListener('input', (e) => {
        const val = Math.round(e.target.value * 100);
        qualityValDisplay.textContent = `${val}%`;
    });

    // 2. File Handling
    fileInput.addEventListener('change', (e) => handleFile(e.target.files[0]));
    
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });
    
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
    
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        handleFile(e.dataTransfer.files[0]);
    });

    function handleFile(file) {
        if (!file || file.type !== 'application/pdf') {
            showToast("Please select a PDF file!", true);
            return;
        }

        currentFile = file;
        fileNameEl.textContent = file.name;
        fileSizeEl.textContent = formatBytes(file.size);
        actionArea.classList.remove('hidden');
        progressContainer.classList.add('hidden');
    }

    // 3. Compression Logic
    compressBtn.addEventListener('click', async () => {
        if (!currentFile) return;

        compressBtn.disabled = true;
        compressBtn.innerHTML = "Processing...";
        progressContainer.classList.remove('hidden');
        
        try {
            // Get quality from slider (0.1 to 1.0)
            const quality = parseFloat(qualitySlider.value);
            const arrayBuffer = await currentFile.arrayBuffer();
            
            // Load PDF
            const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
            const totalPages = pdf.numPages;
            
            // Create New PDF Writer
            const { jsPDF } = window.jspdf;
            let newPdf = null; 

            for (let i = 1; i <= totalPages; i++) {
                // Update Progress
                const percent = Math.round((i / totalPages) * 100);
                progressFill.style.width = `${percent}%`;
                progressText.textContent = `Compressing Page ${i} of ${totalPages}...`;

                // Render Page to Canvas
                const page = await pdf.getPage(i);
                
                // Scale factor affects initial resolution before compression
                // 1.5 is a good balance for reading text
                const viewport = page.getViewport({ scale: 1.5 }); 
                
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                canvas.height = viewport.height;
                canvas.width = viewport.width;

                await page.render({ canvasContext: context, viewport: viewport }).promise;

                // Compress Image (JPEG with slider quality)
                const imgData = canvas.toDataURL('image/jpeg', quality);

                // Initialize PDF doc on first page to match size
                if (i === 1) {
                    const orientation = viewport.width > viewport.height ? 'l' : 'p';
                    newPdf = new jsPDF({
                        orientation: orientation,
                        unit: 'px',
                        format: [viewport.width, viewport.height]
                    });
                } else {
                    const orientation = viewport.width > viewport.height ? 'l' : 'p';
                    newPdf.addPage([viewport.width, viewport.height], orientation);
                }

                newPdf.addImage(imgData, 'JPEG', 0, 0, viewport.width, viewport.height);
            }

            // Save
            newPdf.save(`compressed-${currentFile.name}`);
            showToast("PDF Compressed & Downloaded!");
            
        } catch (error) {
            console.error(error);
            showToast("Error during compression.", true);
        } finally {
            compressBtn.disabled = false;
            compressBtn.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="4 14 10 14 10 20"></polyline><polyline points="20 10 14 10 14 4"></polyline><line x1="14" y1="10" x2="21" y2="3"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg>
                Compress PDF
            `;
            progressText.textContent = "Done!";
        }
    });

    // Helper: Format Bytes
    function formatBytes(bytes, decimals = 2) {
        if (!+bytes) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
    }

    // Toast & Modal
    function showToast(msg, isError = false) {
        toast.textContent = msg;
        toast.style.backgroundColor = isError ? '#ef4444' : '#10b981';
        toast.classList.remove('hidden');
        toast.classList.add('visible');
        setTimeout(() => {
            toast.classList.remove('visible');
            toast.classList.add('hidden');
        }, 3000);
    }

    const infoBtn = document.getElementById('info-btn');
    const modal = document.getElementById('info-modal');
    const closeModal = document.getElementById('close-modal');

    if(infoBtn && modal && closeModal) {
        infoBtn.addEventListener('click', () => modal.classList.remove('hidden'));
        closeModal.addEventListener('click', () => modal.classList.add('hidden'));
        modal.addEventListener('click', (e) => {
            if(e.target === modal) modal.classList.add('hidden');
        });
    }
});