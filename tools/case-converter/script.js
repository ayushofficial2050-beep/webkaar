document.addEventListener('DOMContentLoaded', () => {
    
    // Elements
    const inputText = document.getElementById('input-text');
    const buttons = document.querySelectorAll('.control-btn');
    const copyBtn = document.getElementById('copy-btn');
    const pasteBtn = document.getElementById('paste-btn');
    const clearBtn = document.getElementById('clear-btn');
    const downloadBtn = document.getElementById('download-btn');
    const toast = document.getElementById('toast');
    
    // Stats
    const wordCountEl = document.getElementById('word-count');
    const charCountEl = document.getElementById('char-count');

    // 1. Text Transformation Logic
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            const text = inputText.value;
            if (!text) {
                showToast("Please enter some text first", true);
                return;
            }
            
            const action = btn.dataset.action;
            let result = '';

            switch(action) {
                case 'upper':
                    result = text.toUpperCase();
                    break;
                case 'lower':
                    result = text.toLowerCase();
                    break;
                case 'sentence':
                    result = toSentenceCase(text);
                    break;
                case 'capitalized':
                    result = toCapitalizedCase(text);
                    break;
                case 'alternating':
                    result = toAlternatingCase(text);
                    break;
                case 'inverse':
                    result = toInverseCase(text);
                    break;
            }

            inputText.value = result;
            updateStats();
            showToast("Converted to " + btn.innerText);
        });
    });

    // Helper Functions
    function toSentenceCase(str) {
        return str.toLowerCase().replace(/(^\s*\w|[.!?]\s*\w)/g, function(c) {
            return c.toUpperCase();
        });
    }

    function toCapitalizedCase(str) {
        return str.toLowerCase().split(' ').map(word => {
            return word.charAt(0).toUpperCase() + word.slice(1);
        }).join(' ');
    }

    function toAlternatingCase(str) {
        let result = '';
        for (let i = 0; i < str.length; i++) {
            if (i % 2 === 0) {
                result += str.charAt(i).toLowerCase();
            } else {
                result += str.charAt(i).toUpperCase();
            }
        }
        return result;
    }

    function toInverseCase(str) {
        let result = '';
        for (let i = 0; i < str.length; i++) {
            const char = str.charAt(i);
            if (char === char.toUpperCase()) {
                result += char.toLowerCase();
            } else {
                result += char.toUpperCase();
            }
        }
        return result;
    }

    // 2. Stats Update
    function updateStats() {
        const text = inputText.value;
        charCountEl.textContent = text.length + ' characters';
        
        const words = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
        wordCountEl.textContent = words + ' words';
    }

    inputText.addEventListener('input', updateStats);

    // 3. Paste Action
    pasteBtn.addEventListener('click', async () => {
        try {
            const text = await navigator.clipboard.readText();
            inputText.value = text;
            updateStats();
        } catch (err) {
            showToast("Failed to read clipboard", true);
        }
    });

    // 4. Clear Action
    clearBtn.addEventListener('click', () => {
        inputText.value = '';
        updateStats();
        inputText.focus();
    });

    // 5. Copy Action
    copyBtn.addEventListener('click', () => {
        if (!inputText.value) return;
        navigator.clipboard.writeText(inputText.value).then(() => {
            showToast("Text Copied!");
        });
    });

    // 6. Download Action
    downloadBtn.addEventListener('click', () => {
        if (!inputText.value) return;
        const blob = new Blob([inputText.value], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'converted-text.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });

    // Toast Notification
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