// Elements
const fileInput = document.getElementById('file-input');
const dropZone = document.getElementById('drop-zone');
const workspace = document.getElementById('workspace');
const qualitySlider = document.getElementById('quality-slider');
const qualityValue = document.getElementById('quality-value');

// Preview Elements
const originalPreview = document.getElementById('original-preview');
const compressedPreview = document.getElementById('compressed-preview');
const originalInfo = document.getElementById('original-info');
const compressedInfo = document.getElementById('compressed-info');

// Buttons
const downloadBtn = document.getElementById('download-btn');
const resetBtn = document.getElementById('reset-btn');

let originalFile = null;

// --- EVENT LISTENERS ---

// File Select
fileInput.addEventListener('change', (e) => handleFile(e.target.files[0]));

// Drag & Drop
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

// Slider Change
qualitySlider.addEventListener('input', (e) => {
    const quality = e.target.value;
    qualityValue.innerText = quality + '%';
    compressImage(quality / 100);
});

// Reset
resetBtn.addEventListener('click', () => {
    location.reload();
});

// --- CORE LOGIC ---

function handleFile(file) {
    if (!file || !file.type.startsWith('image/')) {
        alert('Please upload a valid image (JPG, PNG).');
        return;
    }

    originalFile = file;
    
    // Show Workspace, Hide Upload
    dropZone.classList.add('hidden');
    workspace.classList.remove('hidden');

    // Display Original Info
    originalPreview.src = URL.createObjectURL(file);
    originalInfo.innerText = formatSize(file.size);

    // Initial Compression (80%)
    compressImage(0.8);
}

function compressImage(quality) {
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

            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            // Compress
            canvas.toBlob((blob) => {
                if(blob) {
                    // Update Preview
                    const url = URL.createObjectURL(blob);
                    compressedPreview.src = url;
                    compressedInfo.innerText = formatSize(blob.size);
                    
                    // Show saved %
                    const saved = ((originalFile.size - blob.size) / originalFile.size * 100).toFixed(0);
                    if(saved > 0) {
                        compressedInfo.innerText += ` (-${saved}%)`;
                    }

                    // Setup Download
                    downloadBtn.onclick = () => {
                        const link = document.createElement('a');
                        link.href = url;
                        // Keep original name but add -compressed
                        const namePart = originalFile.name.split('.')[0];
                        link.download = `${namePart}-compressed-webkaar.jpg`;
                        link.click();
                    };
                }
            }, 'image/jpeg', quality); // Output as JPEG for better compression
        };
    };
}

function formatSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}