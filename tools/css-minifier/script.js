document.addEventListener('DOMContentLoaded', () => {
    
    // Elements
    const inputCode = document.getElementById('input-code');
    const outputCode = document.getElementById('output-code');
    const minifyBtn = document.getElementById('minify-btn');
    const pasteBtn = document.getElementById('paste-btn');
    const copyBtn = document.getElementById('copy-btn');
    const outputCard = document.getElementById('output-card');
    
    const originalSizeEl = document.getElementById('original-size');
    const newSizeEl = document.getElementById('new-size');
    const savingBadge = document.getElementById('saving-badge');
    const toast = document.getElementById('toast');

    // 1. Minify Function
    minifyBtn.addEventListener('click', () => {
        const rawCSS = inputCode.value;
        if(!rawCSS) {
            showToast("Please paste some CSS code first!", true);
            return;
        }

        try {
            // Minification Logic
            let minified = rawCSS
                .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
                .replace(/\s+/g, ' ')             // Collapse whitespace
                .replace(/ ?([{},;:]) ?/g, '$1')  // Remove space around brackets/colons
                .replace(/;}/g, '}')              // Remove last semicolon
                .trim();

            outputCode.value = minified;
            outputCard.classList.remove('hidden');

            // Calculate Stats
            const originalBytes = new Blob([rawCSS]).size;
            const newBytes = new Blob([minified]).size;
            const savedPercent = ((originalBytes - newBytes) / originalBytes * 100).toFixed(1);

            originalSizeEl.textContent = formatBytes(originalBytes);
            newSizeEl.textContent = formatBytes(newBytes);
            savingBadge.textContent = `Saved ${savedPercent}%`;

            // Scroll to output
            outputCard.scrollIntoView({ behavior: 'smooth', block: 'start' });

        } catch (e) {
            showToast("Error minifying CSS", true);
        }
    });

    // 2. Paste Action
    pasteBtn.addEventListener('click', async () => {
        try {
            const text = await navigator.clipboard.readText();
            inputCode.value = text;
            inputCode.focus();
            updateOriginalSize();
        } catch (err) {
            showToast("Failed to read clipboard", true);
        }
    });

    // 3. Copy Action
    copyBtn.addEventListener('click', () => {
        if (!outputCode.value) return;
        navigator.clipboard.writeText(outputCode.value).then(() => {
            showToast("Minified CSS Copied!");
        });
    });

    // Update Original Size on Type
    inputCode.addEventListener('input', updateOriginalSize);

    function updateOriginalSize() {
        const bytes = new Blob([inputCode.value]).size;
        originalSizeEl.textContent = formatBytes(bytes);
    }

    function formatBytes(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

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
        infoBtn.addEventListener('click', () => {
            modal.classList.remove('hidden');
        });
        closeModal.addEventListener('click', () => {
            modal.classList.add('hidden');
        });
        modal.addEventListener('click', (e) => {
            if(e.target === modal) modal.classList.add('hidden');
        });
    }

});