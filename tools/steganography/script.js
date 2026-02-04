document.addEventListener('DOMContentLoaded', () => {

    /* --- DOM ELEMENTS --- */
    const tabs = document.querySelectorAll('.tab-btn');
    const panels = document.querySelectorAll('.panel');
    const canvas = document.getElementById('processor-canvas');
    const ctx = canvas.getContext('2d');
    const toast = document.getElementById('toast');

    // Encode Elements
    const encDrop = document.getElementById('encode-dropzone');
    const encFile = document.getElementById('encode-file');
    const encWorkspace = document.getElementById('encode-workspace');
    const encPreview = document.getElementById('encode-preview');
    const encMeta = document.getElementById('encode-meta');
    const secretInput = document.getElementById('secret-message');
    const charCounter = document.getElementById('char-counter');
    const encryptBtn = document.getElementById('encrypt-btn');

    // Decode Elements
    const decDrop = document.getElementById('decode-dropzone');
    const decFile = document.getElementById('decode-file');
    const decWorkspace = document.getElementById('decode-workspace');
    const decPreview = document.getElementById('decode-preview');
    const decryptBtn = document.getElementById('decrypt-btn');
    const resultContainer = document.getElementById('result-container');
    const decodedText = document.getElementById('decoded-text');
    const copyBtn = document.getElementById('copy-btn');

    /* --- TABS SYSTEM --- */
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            panels.forEach(p => p.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById(`${tab.dataset.tab}-panel`).classList.add('active');
        });
    });

    /* --- CHARACTER COUNT --- */
    secretInput.addEventListener('input', () => {
        const len = secretInput.value.length;
        charCounter.textContent = len;
        if(len > 1000) charCounter.style.color = '#ef4444';
        else charCounter.style.color = 'var(--text-muted)';
    });

    /* --- FILE HANDLING --- */
    encDrop.addEventListener('click', () => encFile.click());
    decDrop.addEventListener('click', () => decFile.click());

    // Encode File Load
    encFile.addEventListener('change', (e) => handleFile(e.target.files[0], 'encode'));
    // Decode File Load
    decFile.addEventListener('change', (e) => handleFile(e.target.files[0], 'decode'));

    function handleFile(file, mode) {
        if(!file) return;
        if(!file.type.startsWith('image/')) {
            alert('Please upload an image file (JPG/PNG).');
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            if(mode === 'encode') {
                encPreview.src = event.target.result;
                encWorkspace.classList.remove('hidden');
                encDrop.classList.add('hidden');
                // Wait for image load to get dimensions
                encPreview.onload = () => {
                    encMeta.textContent = `${encPreview.naturalWidth} x ${encPreview.naturalHeight} px`;
                }
            } else {
                decPreview.src = event.target.result;
                decWorkspace.classList.remove('hidden');
                decDrop.classList.add('hidden');
                resultContainer.classList.add('hidden');
            }
        };
        reader.readAsDataURL(file);
    }

    /* --- ENCRYPTION LOGIC --- */
    encryptBtn.addEventListener('click', () => {
        const text = secretInput.value;
        if (!text) return alert("Please type a message!");
        if (text.length > 1000) return alert("Message too long (Max 1000 chars)");

        encryptBtn.disabled = true;
        encryptBtn.querySelector('.btn-text').textContent = "Processing...";

        // Small timeout to let UI update
        setTimeout(() => {
            hideTextInImage(encPreview, text);
            encryptBtn.disabled = false;
            encryptBtn.querySelector('.btn-text').textContent = "🔒 Encrypt & Download Image";
        }, 100);
    });

    function hideTextInImage(img, text) {
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        ctx.drawImage(img, 0, 0);

        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;

        // Convert text to binary + Terminator (00000000)
        let binary = '';
        for (let i = 0; i < text.length; i++) {
            binary += text.charCodeAt(i).toString(2).padStart(8, '0');
        }
        binary += '00000000'; // Null terminator to mark end

        // Capacity Check
        if (binary.length > (data.length / 4)) {
            alert("Image is too small for this text! Use a larger image.");
            return;
        }

        let binIdx = 0;
        // Use Blue Channel LSB (Index i+2)
        for (let i = 0; i < data.length; i += 4) {
            if (binIdx < binary.length) {
                const bit = binary[binIdx];
                // Reset LSB to 0 then set to bit value
                data[i + 2] = (data[i + 2] & ~1) | parseInt(bit);
                binIdx++;
            } else {
                break;
            }
        }

        ctx.putImageData(imgData, 0, 0);
        
        // Auto Download
        const link = document.createElement('a');
        link.download = `secret_${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        
        showToast("Image Downloaded! Don't compress it.");
    }

    /* --- DECRYPTION LOGIC --- */
    decryptBtn.addEventListener('click', () => {
        try {
            const text = revealTextFromImage(decPreview);
            if (text && text.length > 0) {
                decodedText.textContent = text;
                resultContainer.classList.remove('hidden');
                showToast("Message Found!");
            } else {
                alert("No hidden message found, or image was compressed.");
            }
        } catch (e) {
            console.error(e);
            alert("Error reading image.");
        }
    });

    function revealTextFromImage(img) {
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        ctx.drawImage(img, 0, 0);

        const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        let binary = '';
        let text = '';
        let currentByte = '';

        for (let i = 0; i < data.length; i += 4) {
            // Read Blue Channel LSB
            const bit = (data[i + 2] & 1).toString();
            currentByte += bit;

            if (currentByte.length === 8) {
                if (currentByte === '00000000') return text; // Terminator found
                
                const charCode = parseInt(currentByte, 2);
                // Basic ASCII check (printable)
                if (charCode === 0) return text; 
                
                text += String.fromCharCode(charCode);
                currentByte = '';
            }
        }
        return ""; // Nothing found
    }

    /* --- UTILS --- */
    copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(decodedText.textContent);
        showToast("Copied to clipboard!");
    });

    function showToast(msg) {
        toast.textContent = msg;
        toast.classList.add('visible');
        setTimeout(() => toast.classList.remove('visible'), 3000);
    }

    // Modal
    const infoBtn = document.getElementById('info-btn');
    const modal = document.getElementById('info-modal');
    const close = document.getElementById('close-modal');

    if (infoBtn) {
        infoBtn.onclick = () => modal.classList.remove('hidden');
        close.onclick = () => modal.classList.add('hidden');
    }
});

