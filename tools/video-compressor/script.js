// Elements
const dropZone = document.getElementById('dropZone');
const videoInput = document.getElementById('videoInput');
const uploadCard = document.getElementById('upload-card');
const editorCard = document.getElementById('editor-card');
const videoPreview = document.getElementById('videoPreview');
const originalSize = document.getElementById('originalSize');

const qualitySlider = document.getElementById('qualitySlider');
const qualityText = document.getElementById('qualityText');
const estimatedSizeTag = document.getElementById('estimatedSize'); 
const compressBtn = document.getElementById('compressBtn');
const downloadBtn = document.getElementById('downloadBtn');
const resetBtn = document.getElementById('resetBtn');

const progressWrapper = document.getElementById('progress-wrapper');
const progressBar = document.getElementById('progress-bar');
const progressPercent = document.getElementById('progress-percent');

// Modal
const infoBtn = document.getElementById('info-btn');
const infoModal = document.getElementById('info-modal');
const closeModal = document.getElementById('close-modal');

let originalFile = null;
let mediaRecorder = null;
let recordedChunks = [];
let videoDuration = 0;
let originalBitrate = 0; // 🔥 New Variable

// 1. Modal Logic
infoBtn.addEventListener('click', () => infoModal.classList.remove('hidden'));
closeModal.addEventListener('click', () => infoModal.classList.add('hidden'));
infoModal.addEventListener('click', (e) => {
    if (e.target === infoModal) infoModal.classList.add('hidden');
});

// 2. Upload Logic
dropZone.addEventListener('click', () => videoInput.click());

videoInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    originalFile = file;
    const url = URL.createObjectURL(file);
    videoPreview.src = url;
    originalSize.innerText = formatBytes(file.size);

    // Get Duration & Calculate Original Bitrate
    videoPreview.onloadedmetadata = () => {
        videoDuration = videoPreview.duration;
        if(videoDuration > 0) {
            // Formula: (Bytes * 8) / Seconds = Bits Per Second (bps)
            originalBitrate = (file.size * 8) / videoDuration;
        }
        updateEstimatedSize(); // Calculate initial estimate immediately
    };

    uploadCard.classList.add('hidden');
    editorCard.classList.remove('hidden');
});

// 3. Slider Logic
qualitySlider.addEventListener('input', () => {
    updateEstimatedSize(); 
});

// 🔥 SMART ESTIMATION LOGIC (FIXED BUG HERE)
function getTargetBitrate() {
    const sliderVal = parseInt(qualitySlider.value);
    
    // Default Algorithm: 2.5 Mbps (High) -> 50 Kbps (Low)
    // Decreased floor from 100k to 50k for small files
    let targetBitrate = Math.max(50000, 2500000 - (sliderVal * 48000));
    
    // 🛡️ SAFETY CHECK: Never increase size
    // If calculated bitrate is higher than original, force it to be lower (e.g., 60-90% of original)
    if (originalBitrate > 0 && targetBitrate >= originalBitrate) {
        // Map slider (1-50) to percentage (90% down to 40% of original)
        // This ensures small files get smaller, not bigger
        const reductionFactor = 0.9 - ((sliderVal / 50) * 0.5); 
        targetBitrate = originalBitrate * reductionFactor;
    }

    return targetBitrate;
}

function updateEstimatedSize() {
    const sliderVal = parseInt(qualitySlider.value);
    
    // Update Text
    if(sliderVal < 15) {
        qualityText.innerText = "High Quality";
        qualityText.style.color = "var(--accent-green)";
    } else if(sliderVal < 35) {
        qualityText.innerText = "Balanced";
        qualityText.style.color = "var(--primary-blue)";
    } else {
        qualityText.innerText = "Smallest Size";
        qualityText.style.color = "var(--accent-orange)";
    }

    const bitrate = getTargetBitrate();
    
    // Estimate: (Bitrate * Duration) / 8 = Bytes
    if(videoDuration > 0) {
        const estimatedBytes = (bitrate * videoDuration) / 8;
        estimatedSizeTag.innerText = `Est: ~${formatBytes(estimatedBytes)}`;
    }
}

// 4. Compression Logic
compressBtn.addEventListener('click', () => {
    compressBtn.classList.add('hidden');
    progressWrapper.classList.remove('hidden');
    downloadBtn.classList.add('hidden');

    videoPreview.currentTime = 0;
    
    let stream;
    if (videoPreview.captureStream) stream = videoPreview.captureStream();
    else if (videoPreview.mozCaptureStream) stream = videoPreview.mozCaptureStream();
    else { alert("Browser not supported."); return; }

    // 🔥 Use the Safe Bitrate
    const bitrate = getTargetBitrate();

    const options = {
        mimeType: 'video/webm;codecs=vp9',
        bitsPerSecond: bitrate
    };

    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options.mimeType = 'video/webm';
        if (!MediaRecorder.isTypeSupported(options.mimeType)) options.mimeType = 'video/mp4';
    }

    try {
        mediaRecorder = new MediaRecorder(stream, options);
    } catch (e) {
        alert("Compression error.");
        location.reload();
        return;
    }

    recordedChunks = [];
    mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunks.push(e.data);
    };

    mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunks, { type: options.mimeType });
        const url = URL.createObjectURL(blob);
        
        let ext = options.mimeType.includes('mp4') ? 'mp4' : 'webm';
        
        downloadBtn.href = url;
        downloadBtn.download = `compressed_${originalFile.name.split('.')[0]}.${ext}`;
        
        // Show actual size compared to original
        const savedPercent = Math.round(((originalFile.size - blob.size) / originalFile.size) * 100);
        const savedText = savedPercent > 0 ? `(-${savedPercent}%)` : '';
        
        downloadBtn.innerText = `Download ${formatBytes(blob.size)} ${savedText}`;
        
        downloadBtn.classList.remove('hidden');
        progressWrapper.classList.add('hidden');
        
        videoPreview.pause();
    };

    mediaRecorder.start();
    videoPreview.play();

    // Progress Bar
    const trackProgress = setInterval(() => {
        if(videoPreview.paused || videoPreview.ended) {
            clearInterval(trackProgress);
            if(mediaRecorder.state === 'recording') mediaRecorder.stop();
        } else {
            const percent = Math.min(100, Math.round((videoPreview.currentTime / videoDuration) * 100));
            progressBar.style.width = `${percent}%`;
            progressPercent.innerText = `${percent}%`;
        }
    }, 200);

    videoPreview.onended = () => {
        if(mediaRecorder.state === 'recording') mediaRecorder.stop();
    };
});

// 5. Reset
resetBtn.addEventListener('click', () => {
    location.reload();
});

// Helper
function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
