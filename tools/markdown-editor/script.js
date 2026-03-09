document.addEventListener('DOMContentLoaded', () => {
    
    // Elements
    const markdownInput = document.getElementById('markdown-input');
    const htmlPreview = document.getElementById('html-preview');
    const toolbarBtns = document.querySelectorAll('.tool-btn');
    const copyHtmlBtn = document.getElementById('copy-html-btn');
    const downloadBtn = document.getElementById('download-btn');
    const toast = document.getElementById('toast');

    // Default Text
    const defaultText = `# Welcome to WebKaar Editor

This is a **live preview** of your markdown.

## Features
- Write in Markdown
- Instant HTML Preview
- Download .md files

> "Code is poetry."

Try typing here!`;

    // 1. Initial Render
    markdownInput.value = defaultText;
    updatePreview();

    // 2. Input Listener (Live Update)
    markdownInput.addEventListener('input', updatePreview);

    function updatePreview() {
        const rawMarkdown = markdownInput.value;
        // Using Marked.js library (loaded in head)
        if (typeof marked !== 'undefined') {
            htmlPreview.innerHTML = marked.parse(rawMarkdown);
        } else {
            htmlPreview.innerHTML = "Error: Parser not loaded.";
        }
    }

    // 3. Toolbar Logic
    toolbarBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const syntax = btn.dataset.markdown;
            if (syntax) {
                insertText(syntax);
            }
        });
    });

    function insertText(syntax) {
        const start = markdownInput.selectionStart;
        const end = markdownInput.selectionEnd;
        const text = markdownInput.value;
        const before = text.substring(0, start);
        const after = text.substring(end, text.length);
        
        markdownInput.value = before + syntax + after;
        
        // Refocus and update
        markdownInput.focus();
        markdownInput.selectionEnd = start + syntax.length;
        updatePreview();
    }

    // 4. Copy HTML
    copyHtmlBtn.addEventListener('click', () => {
        const html = htmlPreview.innerHTML;
        navigator.clipboard.writeText(html).then(() => {
            showToast("HTML Copied to Clipboard!");
        });
    });

    // 5. Download MD
    downloadBtn.addEventListener('click', () => {
        const text = markdownInput.value;
        const blob = new Blob([text], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'document.md';
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