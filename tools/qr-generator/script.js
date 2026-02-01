// Elements
const qrText = document.getElementById('qr-text');
const colorDark = document.getElementById('color-dark');
const colorLight = document.getElementById('color-light');
const generateBtn = document.getElementById('generate-btn');
const resultArea = document.getElementById('result-area');
const qrContainer = document.getElementById('qrcode');
const downloadBtn = document.getElementById('download-btn');
const resetBtn = document.getElementById('reset-btn');

// Info Modal Elements
const infoBtn = document.getElementById('info-btn');
const infoModal = document.getElementById('info-modal');
const closeModal = document.getElementById('close-modal');

let qrcode = null; 

// --- EVENTS ---

generateBtn.addEventListener('click', generateQR);

resetBtn.addEventListener('click', () => {
    qrText.value = '';
    resultArea.classList.add('hidden');
    qrText.focus();
    // Reset container
    qrContainer.innerHTML = "";
});

downloadBtn.addEventListener('click', downloadQR);

// Modal Logic
infoBtn.addEventListener('click', () => infoModal.classList.remove('hidden'));
closeModal.addEventListener('click', () => infoModal.classList.add('hidden'));
infoModal.addEventListener('click', (e) => {
    if(e.target === infoModal) infoModal.classList.add('hidden');
});

// --- FUNCTIONS ---

function generateQR() {
    const text = qrText.value.trim();

    if (!text) {
        alert("Please enter text or URL");
        return;
    }

    // Clear previous QR
    qrContainer.innerHTML = "";
    resultArea.classList.remove('hidden');

    // Create New QR
    // Hum thoda wait karenge taaki DOM clear ho jaye
    setTimeout(() => {
        qrcode = new QRCode(qrContainer, {
            text: text,
            width: 256,
            height: 256,
            colorDark : colorDark.value,
            colorLight : colorLight.value,
            correctLevel : QRCode.CorrectLevel.H
        });
    }, 50);
}

// --- FIXED DOWNLOAD FUNCTION ---
function downloadQR() {
    let url = "";
    
    // 1. Pehle <img> tag check karo (Standard approach)
    const img = qrContainer.querySelector('img');
    
    // 2. Agar Image nahi mili ya load nahi hui, toh <canvas> check karo
    if (img && img.src) {
        url = img.src;
    } else {
        const canvas = qrContainer.querySelector('canvas');
        if (canvas) {
            url = canvas.toDataURL("image/png");
        }
    }

    // 3. Ab Download karo
    if (url) {
        const link = document.createElement('a');
        link.href = url;
        link.download = `qrcode-webkaar.png`;
        document.body.appendChild(link); // Firefox fix
        link.click();
        document.body.removeChild(link);
    } else {
        alert("Processing... Please click download again in 1 second.");
    }
}