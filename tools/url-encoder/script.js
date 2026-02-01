document.addEventListener('DOMContentLoaded', () => {
    
    // Elements
    const inputText = document.getElementById('input-text');
    const outputText = document.getElementById('output-text');
    const encodeBtn = document.getElementById('encode-btn');
    const decodeBtn = document.getElementById('decode-btn');
    const pasteBtn = document.getElementById('paste-btn');
    const copyBtn = document.getElementById('copy-btn');
    const clearBtn = document.getElementById('clear-btn');
    const toast = document.getElementById('toast');

    // 1. Encode Function
    encodeBtn.addEventListener('click', () => {
        const val = inputText.value;
        if(!val) return;
        
        try {
            // encodeURIComponent is safer for URL parameters
            const encoded = encodeURIComponent(val).replace(/'/g,"%27").replace(/"/g,"%22");
            outputText.value = encoded;
        } catch (e) {
            showToast("Error encoding text", true);
        }
    });

    // 2. Decode Function
    decodeBtn.addEventListener('click', () => {
        const val = inputText.value;
        if(!val) return;

        try {
            const decoded = decodeURIComponent(val.replace(/\+/g,  " "));
            outputText.value = decoded;
        } catch (e) {
            outputText.value = "Error: Invalid URL format";
            showToast("Invalid URL format", true);
        }
    });

    // 3. Paste Action
    pasteBtn.addEventListener('click', async () => {
        try {
            const text = await navigator.clipboard.readText();
            inputText.value = text;
        } catch (err) {
            showToast("Failed to read clipboard", true);
        }
    });

    // 4. Copy Action
    copyBtn.addEventListener('click', () => {
        if (!outputText.value) return;
        
        navigator.clipboard.writeText(outputText.value).then(() => {
            showToast("Copied to Clipboard!");
        });
    });

    // 5. Clear Action
    clearBtn.addEventListener('click', () => {
        inputText.value = '';
        outputText.value = '';
        inputText.focus();
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

    // Modal Logic (Standard WebKaar Modal)
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