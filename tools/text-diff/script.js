document.addEventListener('DOMContentLoaded', () => {
    
    // Elements
    const originalText = document.getElementById('original-text');
    const modifiedText = document.getElementById('modified-text');
    const compareBtn = document.getElementById('compare-btn');
    const clearBtn = document.getElementById('clear-btn');
    const outputCard = document.getElementById('output-card');
    const diffOutput = document.getElementById('diff-output');
    
    const pasteOriginalBtn = document.getElementById('paste-original');
    const pasteModifiedBtn = document.getElementById('paste-modified');
    const toast = document.getElementById('toast');

    // 1. Compare Logic
    compareBtn.addEventListener('click', () => {
        const text1 = originalText.value;
        const text2 = modifiedText.value;

        if (!text1 && !text2) {
            showToast("Please enter text to compare", true);
            return;
        }

        const diffHTML = computeDiff(text1, text2);
        diffOutput.innerHTML = diffHTML;
        outputCard.classList.remove('hidden');
        outputCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    // 2. Clear Logic
    clearBtn.addEventListener('click', () => {
        originalText.value = '';
        modifiedText.value = '';
        diffOutput.innerHTML = '';
        outputCard.classList.add('hidden');
        originalText.focus();
    });

    // 3. Paste Actions
    async function handlePaste(targetInput) {
        try {
            const text = await navigator.clipboard.readText();
            targetInput.value = text;
        } catch (err) {
            showToast("Failed to read clipboard", true);
        }
    }

    pasteOriginalBtn.addEventListener('click', () => handlePaste(originalText));
    pasteModifiedBtn.addEventListener('click', () => handlePaste(modifiedText));


    // --- CORE DIFF ALGORITHM (Word Based) ---
    function computeDiff(str1, str2) {
        // Simple word-by-word diff algorithm
        const words1 = str1.split(/\s+/);
        const words2 = str2.split(/\s+/);
        
        // This uses a simple LCS (Longest Common Subsequence) approach for words
        // Note: For a very robust diff (like Git), we'd need Myers algorithm. 
        // This is a simplified version suitable for web tools.
        
        let matrix = Array(words1.length + 1).fill(null).map(() => Array(words2.length + 1).fill(0));

        for (let i = 1; i <= words1.length; i++) {
            for (let j = 1; j <= words2.length; j++) {
                if (words1[i - 1] === words2[j - 1]) {
                    matrix[i][j] = matrix[i - 1][j - 1] + 1;
                } else {
                    matrix[i][j] = Math.max(matrix[i - 1][j], matrix[i][j - 1]);
                }
            }
        }

        let i = words1.length;
        let j = words2.length;
        let result = [];

        while (i > 0 || j > 0) {
            if (i > 0 && j > 0 && words1[i - 1] === words2[j - 1]) {
                result.unshift(escapeHTML(words1[i - 1]));
                i--;
                j--;
            } else if (j > 0 && (i === 0 || matrix[i][j - 1] >= matrix[i - 1][j])) {
                result.unshift(`<ins>${escapeHTML(words2[j - 1])}</ins>`);
                j--;
            } else if (i > 0 && (j === 0 || matrix[i][j - 1] < matrix[i - 1][j])) {
                result.unshift(`<del>${escapeHTML(words1[i - 1])}</del>`);
                i--;
            }
        }

        return result.join(' ');
    }

    function escapeHTML(str) {
        return str.replace(/&/g, "&amp;")
                  .replace(/</g, "&lt;")
                  .replace(/>/g, "&gt;")
                  .replace(/"/g, "&quot;")
                  .replace(/'/g, "&#039;");
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
        infoBtn.addEventListener('click', () => modal.classList.remove('hidden'));
        closeModal.addEventListener('click', () => modal.classList.add('hidden'));
        modal.addEventListener('click', (e) => {
            if(e.target === modal) modal.classList.add('hidden');
        });
    }

});