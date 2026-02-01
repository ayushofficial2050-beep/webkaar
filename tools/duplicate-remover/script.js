document.addEventListener('DOMContentLoaded', () => {
    
    // Elements
    const inputText = document.getElementById('input-text');
    const outputText = document.getElementById('output-text');
    
    // Buttons
    const processBtn = document.getElementById('process-btn'); // For mobile
    const clearBtn = document.getElementById('clear-btn');
    const pasteBtn = document.getElementById('paste-btn');
    const copyBtn = document.getElementById('copy-btn');
    
    // Checkboxes
    const chkEmpty = document.getElementById('chk-empty');
    const chkTrim = document.getElementById('chk-trim');
    const chkSort = document.getElementById('chk-sort');
    
    // Stats
    const countOriginal = document.getElementById('count-original');
    const countUnique = document.getElementById('count-unique');
    const removedCount = document.getElementById('removed-count');
    
    const toast = document.getElementById('toast');

    // 1. Core Logic (Run on every input)
    function processText() {
        const raw = inputText.value;
        if (!raw) {
            updateStats(0, 0);
            outputText.value = '';
            return;
        }

        // Split by new line
        let lines = raw.split(/\r?\n/);
        const originalCount = lines.length;

        // Process Lines
        if (chkTrim.checked) {
            lines = lines.map(line => line.trim());
        }

        if (chkEmpty.checked) {
            lines = lines.filter(line => line !== '');
        }

        // Remove Duplicates (Using Set)
        let uniqueLines = [...new Set(lines)];

        // Sort if checked
        if (chkSort.checked) {
            uniqueLines.sort((a, b) => a.localeCompare(b));
        }

        // Update Output
        outputText.value = uniqueLines.join('\n');
        
        // Update Stats
        updateStats(originalCount, uniqueLines.length);
    }

    function updateStats(orig, uniq) {
        countOriginal.textContent = `${orig} Lines`;
        countUnique.textContent = `${uniq} Lines`;
        
        const removed = orig - uniq;
        if (orig > 0) {
            removedCount.textContent = `${removed} duplicates removed`;
        } else {
            removedCount.textContent = '0 removed';
        }
    }

    // 2. Event Listeners (Real-time processing)
    inputText.addEventListener('input', processText);
    
    // Checkbox Listeners
    chkEmpty.addEventListener('change', processText);
    chkTrim.addEventListener('change', processText);
    chkSort.addEventListener('change', processText);

    // Mobile Button (Just triggers same logic + scroll)
    processBtn.addEventListener('click', () => {
        processText();
        outputText.scrollIntoView({ behavior: 'smooth' });
    });

    // 3. Helper Buttons
    clearBtn.addEventListener('click', () => {
        inputText.value = '';
        processText();
        inputText.focus();
    });

    pasteBtn.addEventListener('click', async () => {
        try {
            const text = await navigator.clipboard.readText();
            inputText.value = text;
            processText();
        } catch (err) {
            showToast("Failed to paste!", true);
        }
    });

    copyBtn.addEventListener('click', () => {
        if (!outputText.value) return;
        navigator.clipboard.writeText(outputText.value);
        showToast("Copied Unique List!");
    });

    // Toast Logic
    function showToast(msg, isError = false) {
        toast.textContent = msg;
        toast.style.backgroundColor = isError ? '#ef4444' : '#10b981';
        toast.classList.remove('hidden');
        toast.classList.add('visible');
        setTimeout(() => {
            toast.classList.remove('visible');
            toast.classList.add('hidden');
        }, 2000);
    }

    // Modal Logic
    const infoBtn = document.getElementById('info-btn');
    const modal = document.getElementById('info-modal');
    const closeModal = document.getElementById('close-modal');

    if(infoBtn && modal && closeModal) {
        infoBtn.addEventListener('click', () => modal.classList.remove('hidden'));
        closeModal.addEventListener('click', () => modal.classList.add('hidden'));
        modal.addEventListener('click', (e) => {
            if(e.target === modal) modal.classList.add('hidden');
        });
    }
});