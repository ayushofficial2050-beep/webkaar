// Elements
const textInput = document.getElementById('text-input');
const copyBtn = document.getElementById('copy-btn');
const clearBtn = document.getElementById('clear-btn');
const toast = document.getElementById('toast');

// Stats Elements
const statWords = document.getElementById('stat-words');
const statChars = document.getElementById('stat-chars');
const statSentences = document.getElementById('stat-sentences');
const statReadTime = document.getElementById('stat-read-time');

// Detailed Stats
const statParagraphs = document.getElementById('stat-paragraphs');
const statCharsNoSpace = document.getElementById('stat-chars-no-space');
const statSpeakTime = document.getElementById('stat-speak-time');

// Modal
const infoBtn = document.getElementById('info-btn');
const infoModal = document.getElementById('info-modal');
const closeModal = document.getElementById('close-modal');

// --- EVENTS ---

textInput.addEventListener('input', analyzeText);

clearBtn.addEventListener('click', () => {
    if(confirm('Are you sure you want to clear the text?')) {
        textInput.value = '';
        analyzeText();
    }
});

copyBtn.addEventListener('click', () => {
    if (!textInput.value) return;
    navigator.clipboard.writeText(textInput.value).then(() => {
        showToast();
    });
});

// Modal Logic
infoBtn.addEventListener('click', () => infoModal.classList.remove('hidden'));
closeModal.addEventListener('click', () => infoModal.classList.add('hidden'));
infoModal.addEventListener('click', (e) => {
    if (e.target === infoModal) infoModal.classList.add('hidden');
});

// --- CORE LOGIC ---

function analyzeText() {
    const text = textInput.value;
    
    // 1. Character Counts
    const chars = text.length;
    const charsNoSpace = text.replace(/\s/g, '').length;

    // 2. Word Count (Splits by whitespace, filters empty strings)
    // Using simple regex to match non-whitespace chunks
    const words = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;

    // 3. Sentence Count (Rough approximation via . ! ?)
    // Filter out empty entries
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;

    // 4. Paragraph Count (Splits by newline)
    const paragraphs = text.split(/\n+/).filter(p => p.trim().length > 0).length;

    // 5. Time Calculations
    // Avg reading speed: 200 words/min
    // Avg speaking speed: 130 words/min
    const readSeconds = Math.ceil(words / (200 / 60));
    const speakSeconds = Math.ceil(words / (130 / 60));

    // UPDATE UI
    statChars.innerText = chars.toLocaleString();
    statWords.innerText = words.toLocaleString();
    statSentences.innerText = sentences.toLocaleString();
    statReadTime.innerText = formatTime(readSeconds);

    statParagraphs.innerText = paragraphs.toLocaleString();
    statCharsNoSpace.innerText = charsNoSpace.toLocaleString();
    statSpeakTime.innerText = formatTime(speakSeconds);
}

// Helper to format time (e.g., "1m 20s" or "45s")
function formatTime(seconds) {
    if (seconds < 60) return `${seconds}s`;
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

function showToast() {
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 2000);
}

// Init
analyzeText();