// Elements
const jsonInput = document.getElementById('json-input');
const jsonOutput = document.getElementById('json-output');
const formatBtn = document.getElementById('format-btn');
const minifyBtn = document.getElementById('minify-btn');
const copyBtn = document.getElementById('copy-btn');
const clearBtn = document.getElementById('clear-btn');
const errorBox = document.getElementById('error-box');
const errorText = document.getElementById('error-text');
const toast = document.getElementById('toast');

// Modal Elements
const infoBtn = document.getElementById('info-btn');
const infoModal = document.getElementById('info-modal');
const closeModal = document.getElementById('close-modal');

// --- EVENTS ---

formatBtn.addEventListener('click', () => processJSON(2)); // 2 spaces indentation
minifyBtn.addEventListener('click', () => processJSON(0)); // 0 spaces (Minify)

clearBtn.addEventListener('click', () => {
    jsonInput.value = '';
    jsonOutput.value = '';
    hideError();
    jsonInput.focus();
});

copyBtn.addEventListener('click', () => {
    if (!jsonOutput.value) return;
    navigator.clipboard.writeText(jsonOutput.value).then(() => {
        showToast();
    });
});

// Enable Tab Key in Textarea
jsonInput.addEventListener('keydown', function(e) {
    if (e.key === 'Tab') {
        e.preventDefault();
        const start = this.selectionStart;
        const end = this.selectionEnd;

        // Insert 2 spaces
        this.value = this.value.substring(0, start) + "  " + this.value.substring(end);

        // Put caret at right position again
        this.selectionStart = this.selectionEnd = start + 2;
    }
});

// Auto-format on paste (Optional, maybe annoying, keeping it manual for now)
// jsonInput.addEventListener('paste', () => setTimeout(() => processJSON(2), 100));

// Modal Logic
infoBtn.addEventListener('click', () => infoModal.classList.remove('hidden'));
closeModal.addEventListener('click', () => infoModal.classList.add('hidden'));
infoModal.addEventListener('click', (e) => {
    if (e.target === infoModal) infoModal.classList.add('hidden');
});

// --- CORE LOGIC ---

function processJSON(indent) {
    const raw = jsonInput.value.trim();
    
    if (!raw) {
        // Allow formatting empty to clear output
        jsonOutput.value = ''; 
        hideError();
        return;
    }

    try {
        const parsed = JSON.parse(raw);
        // Success: Format or Minify
        jsonOutput.value = JSON.stringify(parsed, null, indent);
        hideError();
    } catch (e) {
        // Error: Show message
        showError(e.message);
    }
}

function showError(msg) {
    errorText.innerText = msg;
    errorBox.classList.remove('hidden');
    jsonInput.style.borderColor = '#ef4444';
}

function hideError() {
    errorBox.classList.add('hidden');
    jsonInput.style.borderColor = 'transparent'; // Reset to default border logic
}

function showToast() {
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 2000);
}