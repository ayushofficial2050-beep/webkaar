document.addEventListener('DOMContentLoaded', () => {
    
    // Elements
    const fileInput = document.getElementById('file-input');
    const dropZone = document.getElementById('drop-zone');
    const imageGrid = document.getElementById('image-grid');
    const previewContainer = document.getElementById('preview-container');
    const actionArea = document.getElementById('action-area');
    const convertBtn = document.getElementById('convert-btn');
    const clearBtn = document.getElementById('clear-btn');
    const countEl = document.getElementById('count');
    const fitPageCheckbox = document.getElementById('fit-page');
    const toast = document.getElementById('toast');

    let selectedImages = []; // Store File objects

    // 1. File Handling
    fileInput.addEventListener('change', (e) => {
        handleFiles(e.target.files);
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
        handleFiles(e.dataTransfer.files);
    });

    function handleFiles(files) {
        for (const file of files) {
            if (file.type.startsWith('image/')) {
                selectedImages.push(file);
            } else {
                showToast("Only Image files allowed!", true);
            }
        }
        renderImages();
    }

    // 2. Render Thumbnails
    function renderImages() {
        imageGrid.innerHTML = '';
        countEl.textContent = selectedImages.length;

        if (selectedImages.length > 0) {
            previewContainer.classList.remove('hidden');
            actionArea.classList.remove('hidden');
        } else {
            previewContainer.classList.add('hidden');
            actionArea.classList.add('hidden');
        }

        selectedImages.forEach((file, index) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const div = document.createElement('div');
                div.className = 'img-card';
                div.innerHTML = `
                    <img src="${e.target.result}" alt="img">
                    <button class="delete-img" data-index="${index}">✕</button>
                `;
                imageGrid.appendChild(div);
                
                // Add delete listener immediately
                div.querySelector('.delete-img').addEventListener('click', () => {
                    selectedImages.splice(index, 1);
                    renderImages();
                });
            };
            reader.readAsDataURL(file);
        });
    }

    // 3. Clear All
    clearBtn.addEventListener('click', () => {
        selectedImages = [];
        renderImages();
    });

    // 4. Convert Logic (The Magic Part)
    convertBtn.addEventListener('click', async () => {
        const btnText = convertBtn.innerHTML;
        convertBtn.innerHTML = "Generating...";
        convertBtn.disabled = true;

        try {
            const { jsPDF } = window.jspdf;
            // Create PDF (A4 size, unit: mm)
            const pdf = new jsPDF({
                orientation: 'p',
                unit: 'mm',
                format: 'a4'
            });

            const PageWidth = 210;
            const PageHeight = 297;
            const fitToPage = fitPageCheckbox.checked;

            for (let i = 0; i < selectedImages.length; i++) {
                if (i > 0) pdf.addPage();

                const imgData = await readFileAsDataURL(selectedImages[i]);
                const imgProps = pdf.getImageProperties(imgData);
                
                let w = imgProps.width;
                let h = imgProps.height;

                // Calculate dimensions to fit A4
                if (fitToPage) {
                    const ratio = w / h;
                    const pageRatio = PageWidth / PageHeight;

                    // Subtract small margin (10mm)
                    const margin = 10;
                    const maxW = PageWidth - (margin * 2);
                    const maxH = PageHeight - (margin * 2);

                    if (ratio > pageRatio) {
                        w = maxW;
                        h = maxW / ratio;
                    } else {
                        h = maxH;
                        w = maxH * ratio;
                    }
                    
                    const x = (PageWidth - w) / 2;
                    const y = (PageHeight - h) / 2;
                    pdf.addImage(imgData, 'JPEG', x, y, w, h);
                } else {
                    // Just center it, maybe scale down if HUGE
                    // Converting px to mm approx (1px = 0.264mm)
                    w = w * 0.264;
                    h = h * 0.264;
                    
                    // If still bigger than page, scale down
                    if(w > PageWidth) {
                        const scale = PageWidth / w;
                        w = PageWidth;
                        h = h * scale;
                    }
                    
                    pdf.addImage(imgData, 'JPEG', 0, 0, w, h);
                }
            }

            pdf.save('WebKaar-Images.pdf');
            showToast("PDF Downloaded Successfully!");

        } catch (err) {
            console.error(err);
            showToast("Error generating PDF", true);
        } finally {
            convertBtn.innerHTML = btnText;
            convertBtn.disabled = false;
        }
    });

    // Helper: Read File
    function readFileAsDataURL(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

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