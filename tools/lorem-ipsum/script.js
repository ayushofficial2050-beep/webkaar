document.addEventListener('DOMContentLoaded', () => {
    
    // Elements
    const quantityInput = document.getElementById('quantity');
    const typeSelect = document.getElementById('type');
    const generateBtn = document.getElementById('generate-btn');
    const outputText = document.getElementById('output-text');
    const copyBtn = document.getElementById('copy-btn');
    const toast = document.getElementById('toast');

    // Source Text (Standard Lorem Ipsum)
    const LOREM_TEXT = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem.";

    // Split into sentences for better mixing
    const SENTENCES = LOREM_TEXT.split('. ').map(s => s.trim() + '.');
    const WORDS = LOREM_TEXT.replace(/[.,]/g, '').split(' ');

    // 1. Generate Function
    function generateLorem() {
        const count = parseInt(quantityInput.value) || 5;
        const type = typeSelect.value;
        let result = '';

        if (count > 2000) {
            showToast("Max limit is 2000", true);
            return;
        }

        if (type === 'paragraphs') {
            const paragraphs = [];
            for (let i = 0; i < count; i++) {
                // Generate a paragraph with random sentences (5 to 10 sentences)
                const sentenceCount = Math.floor(Math.random() * 6) + 4;
                let paragraph = '';
                for (let j = 0; j < sentenceCount; j++) {
                    const randomSentence = SENTENCES[Math.floor(Math.random() * SENTENCES.length)];
                    paragraph += randomSentence + ' ';
                }
                paragraphs.push(paragraph.trim());
            }
            result = paragraphs.join('\n\n');

        } else if (type === 'sentences') {
            const sentenceArr = [];
            for (let i = 0; i < count; i++) {
                const randomSentence = SENTENCES[Math.floor(Math.random() * SENTENCES.length)];
                sentenceArr.push(randomSentence);
            }
            result = sentenceArr.join(' ');

        } else if (type === 'words') {
            const wordArr = [];
            // Just loop through words array repeatedly if needed
            for (let i = 0; i < count; i++) {
                wordArr.push(WORDS[i % WORDS.length]);
            }
            result = wordArr.join(' ');
        }

        // Ensure first paragraph starts with "Lorem ipsum" if generating paragraphs
        if (type === 'paragraphs' && !result.startsWith("Lorem ipsum")) {
            result = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. " + result.substring(result.indexOf('.') + 1);
        }

        outputText.value = result;
    }

    // Trigger generate on button click
    generateBtn.addEventListener('click', generateLorem);

    // Initial Generate
    generateLorem();

    // 2. Copy Action
    copyBtn.addEventListener('click', () => {
        if (!outputText.value) return;
        navigator.clipboard.writeText(outputText.value).then(() => {
            showToast("Copied to Clipboard!");
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