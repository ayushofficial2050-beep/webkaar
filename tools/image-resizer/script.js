// Elements
const dropZone = document.getElementById('dropZone');
const imageInput = document.getElementById('imageInput');
const uploadCard = document.getElementById('upload-card');
const editorCard = document.getElementById('editor-card');
const imagePreview = document.getElementById('imagePreview');
const originalDimensions = document.getElementById('originalDimensions');
const widthInput = document.getElementById('widthInput');
const heightInput = document.getElementById('heightInput');
const lockRatio = document.getElementById('lockRatio');
const resizeBtn = document.getElementById('resizeBtn');
const resetBtn = document.getElementById('resetBtn');

// Modal Elements
const infoBtn = document.getElementById('info-btn');
const infoModal = document.getElementById('info-modal');
const closeModal = document.getElementById('close-modal');

let originalImageRatio = 0;

// 1. Modal Logic
infoBtn.addEventListener('click', () => infoModal.classList.remove('hidden'));
closeModal.addEventListener('click', () => infoModal.classList.add('hidden'));
infoModal.addEventListener('click', (e) => {
    if (e.target === infoModal) infoModal.classList.add('hidden');
});

// 2. Upload Logic
dropZone.addEventListener('click', () => imageInput.click());

imageInput.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(event) {
        imagePreview.src = event.target.result;
        
        // Load Image Logic
        const img = new Image();
        img.onload = function() {
            widthInput.value = img.width;
            heightInput.value = img.height;
            originalDimensions.innerText = `${img.width} x ${img.height} px`;
            originalImageRatio = img.width / img.height;
            
            // Switch Cards
            uploadCard.classList.add('hidden');
            editorCard.classList.remove('hidden');
        }
        img.src = event.target.result;
    }
    reader.readAsDataURL(file);
});

// 3. Aspect Ratio Logic
widthInput.addEventListener('input', () => {
    if(lockRatio.checked && widthInput.value) {
        heightInput.value = Math.round(widthInput.value / originalImageRatio);
    }
});

heightInput.addEventListener('input', () => {
    if(lockRatio.checked && heightInput.value) {
        widthInput.value = Math.round(heightInput.value * originalImageRatio);
    }
});

// 4. Resize & Download
resizeBtn.addEventListener('click', () => {
    if (!widthInput.value || !heightInput.value) return;

    // Create Canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    canvas.width = parseInt(widthInput.value);
    canvas.height = parseInt(heightInput.value);

    // Draw Resized Image
    ctx.drawImage(imagePreview, 0, 0, canvas.width, canvas.height);

    // Download
    const link = document.createElement('a');
    link.download = 'resized-image-webkaar.png';
    link.href = canvas.toDataURL('image/png', 0.9);
    link.click();
});

// 5. Reset Tool
resetBtn.addEventListener('click', () => {
    imageInput.value = '';
    editorCard.classList.add('hidden');
    uploadCard.classList.remove('hidden');
});