document.addEventListener('DOMContentLoaded', () => {
    
    // Elements
    const inputCode = document.getElementById('input-code');
    const outputCode = document.getElementById('output-code');
    const formatBtn = document.getElementById('format-btn');
    const minifyBtn = document.getElementById('minify-btn');
    const pasteBtn = document.getElementById('paste-btn');
    const copyBtn = document.getElementById('copy-btn');
    const clearBtn = document.getElementById('clear-btn');
    const outputCard = document.getElementById('output-card');
    const toast = document.getElementById('toast');

    // 1. Format (Beautify) Logic
    formatBtn.addEventListener('click', () => {
        const rawHTML = inputCode.value;
        if (!rawHTML) {
            showToast("Please paste HTML first!", true);
            return;
        }

        try {
            const formatted = beautifyHTML(rawHTML);
            outputCode.value = formatted;
            outputCard.classList.remove('hidden');
            outputCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } catch (e) {
            showToast("Error formatting HTML", true);
        }
    });

    // 2. Minify Logic
    minifyBtn.addEventListener('click', () => {
        const rawHTML = inputCode.value;
        if (!rawHTML) {
            showToast("Please paste HTML first!", true);
            return;
        }

        try {
            // Remove newlines and extra spaces
            const minified = rawHTML
                .replace(/\n/g, '')
                .replace(/[\t ]+\</g, "<")
                .replace(/\>[\t ]+\</g, "><")
                .replace(/\>[\t ]+$/g, ">")
                .replace(/\s+/g, ' '); // Collapse spaces

            outputCode.value = minified;
            outputCard.classList.remove('hidden');
            outputCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } catch (e) {
            showToast("Error minifying HTML", true);
        }
    });

    // Helper: Simple HTML Beautifier (Vanilla JS)
    function beautifyHTML(html) {
        let tab = '    '; // 4 spaces
        let result = '';
        let indent = '';
        
        // Remove spaces between tags
        html = html.replace(/>\s+</g, '><').trim();
        
        // Add newlines around tags
        // This regex splits by tags
        const tokens = html.split(/(<[^>]+>)/g).filter(e => e.trim() !== '');

        tokens.forEach(token => {
            let isClosing = token.match(/^<\//);
            let isSelfClosing = token.match(/\/>$/) || token.match(/^<(input|img|br|hr|meta|link)/);
            let isOpening = token.match(/^<[^\/]/);

            if (isClosing) {
                // If closing tag, decrease indent
                indent = indent.substring(tab.length);
            }

            result += indent + token + '\n';

            if (isOpening && !isClosing && !isSelfClosing) {
                // If opening tag (and not self-closing), increase indent
                indent += tab;
            }
        });

        return result.trim();
    }


    // 3. Paste Action
    pasteBtn.addEventListener('click', async () => {
        try {
            const text = await navigator.clipboard.readText();
            inputCode.value = text;
            inputCode.focus();
        } catch (err) {
            showToast("Failed to read clipboard", true);
        }
    });

    // 4. Copy Action
    copyBtn.addEventListener('click', () => {
        if (!outputCode.value) return;
        navigator.clipboard.writeText(outputCode.value).then(() => {
            showToast("Code Copied!");
        });
    });

    // 5. Clear Action
    clearBtn.addEventListener('click', () => {
        inputCode.value = '';
        outputCode.value = '';
        outputCard.classList.add('hidden');
        inputCode.focus();
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