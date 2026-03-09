// DOM Elements
const minutesEl = document.getElementById('minutes');
const secondsEl = document.getElementById('seconds');
const millisecondsEl = document.getElementById('milliseconds');
const startStopBtn = document.getElementById('startStopBtn');
const lapResetBtn = document.getElementById('lapResetBtn');
const lapsList = document.getElementById('lapsList');
const lapsSection = document.getElementById('lapsSection');
const targetBadge = document.getElementById('target-badge');
const targetVal = document.getElementById('target-val');
const soundToggle = document.getElementById('soundToggle');
const themeSelect = document.getElementById('themeSelect');
const customInput = document.getElementById('customInput');

// Modal Elements
const infoBtn = document.getElementById('info-btn');
const infoModal = document.getElementById('info-modal');
const closeModal = document.getElementById('close-modal');

// State
let startTime = 0;
let elapsedTime = 0;
let timerInterval;
let isRunning = false;
let lapCounter = 1;
let targetTime = 0; // minutes
let targetAlerted = false;

// --- AUDIO API ---
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playSound(type) {
    if (!soundToggle.checked) return;
    if (audioCtx.state === 'suspended') audioCtx.resume();

    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    if (type === 'tick') {
        osc.type = 'sine'; osc.frequency.value = 800;
        gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.03);
        osc.start(); osc.stop(audioCtx.currentTime + 0.03);
    } else {
        osc.type = 'square'; osc.frequency.setValueAtTime(600, audioCtx.currentTime);
        osc.frequency.setValueAtTime(800, audioCtx.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
        osc.start(); osc.stop(audioCtx.currentTime + 0.5);
    }
}

// --- TARGET LOGIC ---
window.setTarget = function(min) {
    targetTime = min;
    targetAlerted = false;
    
    // UI Updates
    document.querySelectorAll('.chip').forEach(btn => btn.classList.remove('active'));
    
    // If selecting a preset, clear custom input styling
    if (min > 0) {
        event.target.classList.add('active');
        customInput.classList.remove('active');
        customInput.value = ''; // Clear custom input
        targetVal.innerText = min;
        targetBadge.classList.remove('hidden');
    } else {
        // Off
        event.target.classList.add('active');
        customInput.classList.remove('active');
        customInput.value = '';
        targetBadge.classList.add('hidden');
    }
    playSound('tick');
};

// Custom Input Logic
window.setCustomTarget = function(val) {
    const min = parseInt(val);
    
    // Deselect all presets
    document.querySelectorAll('.chip').forEach(btn => btn.classList.remove('active'));
    
    if (min > 0) {
        targetTime = min;
        targetAlerted = false;
        targetVal.innerText = min;
        targetBadge.classList.remove('hidden');
        customInput.classList.add('active'); // Highlight input
    } else {
        targetBadge.classList.add('hidden');
        customInput.classList.remove('active');
    }
};

// --- STOPWATCH ENGINE ---
function formatTime(ms) {
    const date = new Date(ms);
    return {
        m: String(date.getUTCMinutes()).padStart(2, '0'),
        s: String(date.getUTCSeconds()).padStart(2, '0'),
        ms: String(Math.floor(date.getUTCMilliseconds() / 10)).padStart(2, '0')
    };
}

function updateTimer() {
    const now = Date.now();
    const diff = now - startTime + elapsedTime;
    const time = formatTime(diff);

    minutesEl.innerText = time.m;
    secondsEl.innerText = time.s;
    millisecondsEl.innerText = time.ms;

    // Check Alert
    if (targetTime > 0 && parseInt(time.m) === targetTime && parseInt(time.s) === 0 && !targetAlerted) {
        playSound('alert');
        targetAlerted = true;
        if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
    }
}

// Controls
startStopBtn.addEventListener('click', () => {
    playSound('tick');
    if (!isRunning) {
        isRunning = true;
        startTime = Date.now();
        timerInterval = setInterval(updateTimer, 10);
        startStopBtn.innerText = 'Stop';
        startStopBtn.classList.add('running');
        lapResetBtn.innerText = 'Lap';
    } else {
        isRunning = false;
        clearInterval(timerInterval);
        elapsedTime += Date.now() - startTime;
        startStopBtn.innerText = 'Start';
        startStopBtn.classList.remove('running');
        lapResetBtn.innerText = 'Reset';
    }
});

lapResetBtn.addEventListener('click', () => {
    playSound('tick');
    if (isRunning) {
        const timeStr = `${minutesEl.innerText}:${secondsEl.innerText}.${millisecondsEl.innerText}`;
        const li = document.createElement('li');
        li.className = 'lap-item';
        li.innerHTML = `<span>Lap ${lapCounter++}</span> <span>${timeStr}</span>`;
        lapsList.prepend(li);
        lapsSection.classList.remove('hidden');
    } else {
        clearInterval(timerInterval);
        elapsedTime = 0; startTime = 0; lapCounter = 1; targetAlerted = false;
        minutesEl.innerText = '00'; secondsEl.innerText = '00'; millisecondsEl.innerText = '00';
        lapsList.innerHTML = '';
        lapsSection.classList.add('hidden');
        lapResetBtn.innerText = 'Lap';
    }
});

// Settings & Modal
themeSelect.addEventListener('change', (e) => document.body.setAttribute('data-theme', e.target.value));

infoBtn.addEventListener('click', () => {
    infoModal.classList.remove('hidden');
    setTimeout(() => infoModal.classList.add('active'), 10);
});
closeModal.addEventListener('click', () => {
    infoModal.classList.remove('active');
    setTimeout(() => infoModal.classList.add('hidden'), 200);
});
infoModal.addEventListener('click', (e) => {
    if (e.target === infoModal) {
        infoModal.classList.remove('active');
        setTimeout(() => infoModal.classList.add('hidden'), 200);
    }
});