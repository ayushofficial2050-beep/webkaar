// DOM Elements
const passwordOutput = document.getElementById('password-output');
const lengthSlider = document.getElementById('length-slider');
const lengthVal = document.getElementById('length-val');
const generateBtn = document.getElementById('generate-btn');
const copyBtn = document.getElementById('copy-btn');
const copyMsg = document.getElementById('copy-msg');

// Checkboxes
const incUpper = document.getElementById('inc-upper');
const incLower = document.getElementById('inc-lower');
const incNumber = document.getElementById('inc-number');
const incSymbol = document.getElementById('inc-symbol');

// Modal Elements
const infoBtn = document.getElementById('info-btn');
const infoModal = document.getElementById('info-modal');
const closeModal = document.getElementById('close-modal');

// Character Sets
const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const LOWER = 'abcdefghijklmnopqrstuvwxyz';
const NUMBERS = '0123456789';
const SYMBOLS = '!@#$%^&*()_+~`|}{[]:;?><,./-=';

// --- EVENTS ---

// 1. Slider Update
lengthSlider.addEventListener('input', (e) => {
    lengthVal.innerText = e.target.value;
});

// 2. Generate Password
generateBtn.addEventListener('click', generatePassword);

// 3. Copy Password
copyBtn.addEventListener('click', () => {
    const pass = passwordOutput.innerText;
    if (!pass || pass === 'Click Generate') return;

    navigator.clipboard.writeText(pass).then(() => {
        showToast();
    });
});

// 4. Modal Logic (Info Button)
infoBtn.addEventListener('click', () => {
    infoModal.classList.remove('hidden');
});

closeModal.addEventListener('click', () => {
    infoModal.classList.add('hidden');
});

// Close modal if clicked outside
infoModal.addEventListener('click', (e) => {
    if (e.target === infoModal) {
        infoModal.classList.add('hidden');
    }
});

// --- FUNCTIONS ---

function generatePassword() {
    let length = lengthSlider.value;
    let chars = '';
    
    // Build character pool based on checkboxes
    if (incUpper.checked) chars += UPPER;
    if (incLower.checked) chars += LOWER;
    if (incNumber.checked) chars += NUMBERS;
    if (incSymbol.checked) chars += SYMBOLS;

    // Safety: If nothing checked, force Lowercase
    if (chars === '') {
        incLower.checked = true;
        chars = LOWER;
    }

    let password = '';
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * chars.length);
        password += chars[randomIndex];
    }

    passwordOutput.innerText = password;
    passwordOutput.style.color = 'var(--text-main)';
}

function showToast() {
    copyMsg.classList.remove('hidden');
    setTimeout(() => {
        copyMsg.classList.add('hidden');
    }, 2000);
}

// Initial Generate on Load
generatePassword();