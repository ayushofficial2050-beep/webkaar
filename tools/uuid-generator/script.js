document.addEventListener('DOMContentLoaded', () => {
    
    // Elements
    const quantityInput = document.getElementById('quantity');
    const increaseBtn = document.getElementById('increase-btn');
    const decreaseBtn = document.getElementById('decrease-btn');
    const generateBtn = document.getElementById('generate-btn');
    const outputText = document.getElementById('output-text');
    const copyBtn = document.getElementById('copy-btn');
    const toast = document.getElementById('toast');

    // 1. UUID v4 Logic (RFC 4122)
    function generateUUID() {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            return crypto.randomUUID();
        }
        // Fallback for older browsers
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    // 2. Generate Action
    function runGeneration() {
        let count = parseInt(quantityInput.value) || 1;
        if (count > 50) count = 50; // Max limit
        if (count < 1) count = 1;

        const uuids = [];
        for(let i = 0; i < count; i++) {
            uuids.push(generateUUID());
        }

        outputText.value = uuids.join('\n');
    }

    generateBtn.addEventListener('click', runGeneration);

    // Initial Run
    runGeneration();

    // 3. Stepper Logic
    increaseBtn.addEventListener('click', () => {
        let val = parseInt(quantityInput.value) || 1;
        if(val < 50) quantityInput.value = val + 1;
    });

    decreaseBtn.addEventListener('click', () => {
        let val = parseInt(quantityInput.value) || 1;
        if(val > 1) quantityInput.value = val - 1;
    });

    // 4. Copy Action
    copyBtn.addEventListener('click', () => {
        if (!outputText.value) return;
        navigator.clipboard.writeText(outputText.value).then(() => {
            showToast("UUIDs Copied!");
        });
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