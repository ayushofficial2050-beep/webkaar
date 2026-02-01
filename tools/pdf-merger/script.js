document.addEventListener('DOMContentLoaded', () => {
    
    // Elements
    const fileInput = document.getElementById('file-input');
    const dropZone = document.getElementById('drop-zone');
    const fileListEl = document.getElementById('file-list');
    const fileListContainer = document.getElementById('file-list-container');
    const actionArea = document.getElementById('action-area');
    const mergeBtn = document.getElementById('merge-btn');
    const clearBtn = document.getElementById('clear-all');
    const toast = document.getElementById('toast');

    let pdfFiles = []; // Store File objects

    // 1. Handle File Selection
    fileInput.addEventListener('change', (e) => {
        handleFiles(e.target.files);
        fileInput.value = ''; // Reset input
    });

    // 2. Drag & Drop Support
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('dragover');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        handleFiles(e.dataTransfer.files);
    });

    function handleFiles(files) {
        let added = false;
        for (const file of files) {
            if (file.type === 'application/pdf') {
                pdfFiles.push(file);
                added = true;
            } else {
                showToast("Only PDF files allowed!", true);
            }
        }
        if (added) renderFileList();
    }

    // 3. Render List
    function renderFileList() {
        fileListEl.innerHTML = '';
        if (pdfFiles.length > 0) {
            fileListContainer.classList.remove('hidden');
            actionArea.classList.remove('hidden');
        } else {
            fileListContainer.classList.add('hidden');
            actionArea.classList.add('hidden');
        }

        pdfFiles.forEach((file, index) => {
            const li = document.createElement('li');
            li.className = 'file-item';
            li.innerHTML = `
                <div class="file-info">
                    <svg class="pdf-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="12" y1="18" x2="12" y2="12"></line><line x1="9" y1="15" x2="15" y2="15"></line></svg>
                    <span class="file-name">${file.name}</span>
                </div>
                <button class="remove-btn" data-index="${index}" aria-label="Remove">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
            `;
            fileListEl.appendChild(li);
        });

        // Add event listeners to remove buttons
        document.querySelectorAll('.remove-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = parseInt(btn.dataset.index);
                pdfFiles.splice(idx, 1);
                renderFileList();
            });
        });
    }

    // 4. Merge Logic
    mergeBtn.addEventListener('click', async () => {
        if (pdfFiles.length < 2) {
            showToast("Please select at least 2 PDFs", true);
            return;
        }

        const btnText = mergeBtn.innerHTML;
        mergeBtn.innerHTML = "Processing...";
        mergeBtn.disabled = true;

        try {
            const PDFLib = window.PDFLib;
            const mergedPdf = await PDFLib.PDFDocument.create(); 

            for (const file of pdfFiles) {
                const arrayBuffer = await file.arrayBuffer();
                const pdf = await PDFLib.PDFDocument.load(arrayBuffer);
                const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
                copiedPages.forEach((page) => mergedPdf.addPage(page));
            }

            const pdfBytes = await mergedPdf.save();
            
            // Download the file
            download(pdfBytes, "merged-document.pdf", "application/pdf");
            
            showToast("PDFs Merged Successfully!");
            
            // Cleanup
            pdfFiles = [];
            renderFileList();

        } catch (error) {
            console.error(error);
            showToast("Error merging files. Are they valid PDFs?", true);
        } finally {
            mergeBtn.innerHTML = btnText;
            mergeBtn.disabled = false;
        }
    });

    // 5. Clear All
    clearBtn.addEventListener('click', () => {
        pdfFiles = [];
        renderFileList();
    });

    // Toast Notification
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

    // Modal Logic
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