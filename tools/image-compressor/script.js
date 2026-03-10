// Elements
const fileInput = document.getElementById('file-input');
const dropZone = document.getElementById('drop-zone');
const workspace = document.getElementById('workspace');
const qualitySlider = document.getElementById('quality-slider');
const qualityValue = document.getElementById('quality-value');
const formatRadios = document.querySelectorAll('input[name="format"]');

// Preview Elements
const originalPreview = document.getElementById('original-preview');
const compressedPreview = document.getElementById('compressed-preview');
const originalInfo = document.getElementById('original-info');
const compressedInfo = document.getElementById('compressed-info');

// Buttons & Modal
const downloadBtn = document.getElementById('download-btn');
const resetBtn = document.getElementById('reset-btn');
const infoBtn = document.getElementById('info-btn');
const closeModal = document.getElementById('close-modal');
const infoModal = document.getElementById('info-modal');

let originalFile = null;

// --- EVENT LISTENERS ---

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

// Trigger compression on slider OR format change
qualitySlider.addEventListener('input', (e) => {
    qualityValue.innerText = e.target.value + '%';
});
qualitySlider.addEventListener('change', runCompression);

formatRadios.forEach(radio => {
    radio.addEventListener('change', runCompression);
});

resetBtn.addEventListener('click', () => location.reload());

// Modal Logic
infoBtn.addEventListener('click', () => infoModal.classList.remove('hidden'));
closeModal.addEventListener('click', () => infoModal.classList.add('hidden'));
infoModal.addEventListener('click', (e) => {
    if(e.target === infoModal) infoModal.classList.add('hidden');
});

// --- CORE LOGIC ---

function handleFile(file) {
    if (!file || !file.type.startsWith('image/')) {
        alert('Please upload a valid image (JPG, PNG, WEBP).');
        return;
    }

    originalFile = file;
    dropZone.classList.add('hidden');
    workspace.classList.remove('hidden');

    // Show Original
    originalPreview.src = URL.createObjectURL(file);
    originalInfo.innerText = formatSize(file.size);

    runCompression();
}

function runCompression() {
    const quality = parseInt(qualitySlider.value) / 100;
    const selectedFormat = document.querySelector('input[name="format"]:checked').value;
    
    compressImage(quality, selectedFormat);
}

function compressImage(quality, outputMimeType) {
    const reader = new FileReader();
    reader.readAsDataURL(originalFile);
    
    reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            canvas.width = img.width;
            canvas.height = img.height;

            // 🔥 Fix for PNG to JPG (Prevents black background)
            if (outputMimeType === 'image/jpeg') {
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }

            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            // Compress to selected format
            canvas.toBlob((blob) => {
                if(blob) {
                    const url = URL.createObjectURL(blob);
                    compressedPreview.src = url;
                    
                    // Show Size Info
                    let sizeText = formatSize(blob.size);
                    const savedPercent = ((originalFile.size - blob.size) / originalFile.size * 100).toFixed(0);
                    
                    if(savedPercent > 0) {
                        compressedInfo.innerText = `${sizeText} (-${savedPercent}%)`;
                        compressedInfo.style.color = '#10b981'; // Green
                    } else {
                        // Sometimes PNG export is larger than original
                        compressedInfo.innerText = `${sizeText} (+${Math.abs(savedPercent)}%)`;
                        compressedInfo.style.color = '#ef4444'; // Red if larger
                    }

                    // Setup Download Button
                    downloadBtn.onclick = () => {
                        const link = document.createElement('a');
                        link.href = url;
                        
                        // Extract original name and append correct extension
                        const namePart = originalFile.name.substring(0, originalFile.name.lastIndexOf('.')) || 'image';
                        const ext = outputMimeType.split('/')[1] === 'jpeg' ? 'jpg' : outputMimeType.split('/')[1];
                        
                        link.download = `${namePart}-compressed-webkaar.${ext}`;
                        link.click();
                    };
                }
            }, outputMimeType, quality);
        };
    };
}

function formatSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}