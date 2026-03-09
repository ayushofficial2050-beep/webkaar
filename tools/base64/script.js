// Elements
const inputText = document.getElementById('input-text');
const outputText = document.getElementById('output-text');
const inputLabel = document.getElementById('input-label');
const outputLabel = document.getElementById('output-label');

const modeBtns = document.querySelectorAll('.mode-btn');
const switchContainer = document.querySelector('.mode-switch-container');

const pasteBtn = document.getElementById('paste-btn');
const copyBtn = document.getElementById('copy-btn');
const clearBtn = document.getElementById('clear-btn');
const toast = document.getElementById('toast');

// Modal
const infoBtn = document.getElementById('info-btn');
const infoModal = document.getElementById('info-modal');
const closeModal = document.getElementById('close-modal');

let currentMode = 'encode'; // 'encode' or 'decode'

// --- UNICODE SAFE FUNCTIONS ---
// Standard btoa/atob fails on emojis/Hindi. These wrappers fix that.

function utf8_to_b64(str) {
    return window.btoa(unescape(encodeURIComponent(str)));
}

function b64_to_utf8(str) {
    return decodeURIComponent(escape(window.atob(str)));
}

// --- EVENTS ---

// 1. Mode Switching
modeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        // Update UI Tabs
        modeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // Slide Animation
        if (btn.dataset.mode === 'decode') {
            switchContainer.classList.add('decode-active');
            currentMode = 'decode';
            inputLabel.innerText = 'Base64 to Decode';
            outputLabel.innerText = 'Decoded Text';
        } else {
            switchContainer.classList.remove('decode-active');
            currentMode = 'encode';
            inputLabel.innerText = 'Text to Encode';
            outputLabel.innerText = 'Base64 Result';
        }

        // Trigger conversion on switch
        processText();
    });
});

// 2. Real-time Processing
inputText.addEventListener('input', processText);

function processText() {
    const raw = inputText.value;

    if (!raw) {
        outputText.value = '';
        return;
    }

    try {
        if (currentMode === 'encode') {
            outputText.value = utf8_to_b64(raw);
            inputText.style.color = 'var(--text-main)';
        } else {
            // Decode Logic
            // Clean up whitespace/newlines from Base64 before decoding
            const cleanBase64 = raw.replace(/\s/g, '');
            outputText.value = b64_to_utf8(cleanBase64);
            inputText.style.color = 'var(--text-main)';
        }
    } catch (e) {
        // Error handling (Invalid Base64)
        if (currentMode === 'decode') {
            outputText.value = "Error: Invalid Base64 string";
            inputText.style.color = '#ef4444'; // Red Text indicating error
        }
    }
}

// 3. Actions
pasteBtn.addEventListener('click', async () => {
    try {
        const text = await navigator.clipboard.readText();
        inputText.value = text;
        processText();
    } catch (err) {
        alert('Failed to paste. Please allow clipboard permissions.');
    }
});

copyBtn.addEventListener('click', () => {
    if (!outputText.value || outputText.value.startsWith("Error:")) return;
    navigator.clipboard.writeText(outputText.value).then(showToast);
});

clearBtn.addEventListener('click', () => {
    inputText.value = '';
    outputText.value = '';
    inputText.style.color = 'var(--text-main)';
});

// Modal Logic
infoBtn.addEventListener('click', () => infoModal.classList.remove('hidden'));
closeModal.addEventListener('click', () => infoModal.classList.add('hidden'));
infoModal.addEventListener('click', (e) => {
    if (e.target === infoModal) infoModal.classList.add('hidden');
});

// Helper
function showToast() {
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 2000);
}