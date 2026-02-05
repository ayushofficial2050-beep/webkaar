document.addEventListener('DOMContentLoaded', () => {

    /* --- DOM ELEMENTS --- */
    const tabs = document.querySelectorAll('.tab-btn');
    const panels = document.querySelectorAll('.panel');
    const canvas = document.getElementById('processor-canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const toast = document.getElementById('toast');

    // Encode
    const encDrop = document.getElementById('encode-dropzone');
    const encFile = document.getElementById('encode-file');
    const encWorkspace = document.getElementById('encode-workspace');
    const encPreview = document.getElementById('encode-preview');
    const encMeta = document.getElementById('encode-meta');
    const secretInput = document.getElementById('secret-message');
    const charCounter = document.getElementById('char-counter');
    const shareBtn = document.getElementById('share-btn');
    const downloadBtn = document.getElementById('download-btn');

    // Decode
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
            
            const targetId = tab.dataset.tab === 'encode' ? 'encode-panel' : 'decode-panel';
            document.getElementById(targetId).classList.add('active');
            
            resetWorkspaces();
        });
    });

    /* --- INPUT COUNT --- */
    secretInput.addEventListener('input', () => {
        const len = secretInput.value.length;
        charCounter.textContent = len;
        if(len > 1000) charCounter.style.color = '#ef4444';
        else charCounter.style.color = 'var(--text-muted)';
    });

    /* --- FILE HANDLING --- */
    encDrop.addEventListener('click', () => encFile.click());
    decDrop.addEventListener('click', () => decFile.click());

    encFile.addEventListener('change', (e) => handleFile(e.target.files[0], 'encode'));
    decFile.addEventListener('change', (e) => handleFile(e.target.files[0], 'decode'));

    function handleFile(file, mode) {
        if(!file) return;
        
        // 🔥 MAGIC: Accept .webkaar / .enc files as Images for decoding
        let blob = file;
        
        // Force browser to read .webkaar as PNG
        if (mode === 'decode') {
            blob = new Blob([file], { type: 'image/png' });
        } else if(!file.type.startsWith('image/')) {
            showToast("⚠️ Please upload a valid image (JPG/PNG)");
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const imgObj = new Image();
            imgObj.onload = () => {
                if(mode === 'encode') {
                    encPreview.src = imgObj.src;
                    encWorkspace.classList.remove('hidden');
                    encDrop.classList.add('hidden');
                    encMeta.textContent = `${imgObj.width} x ${imgObj.height} px`;
                } else {
                    decPreview.src = imgObj.src;
                    decWorkspace.classList.remove('hidden');
                    decDrop.classList.add('hidden');
                    resultContainer.classList.add('hidden');
                }
            };
            imgObj.src = event.target.result;
        };
        reader.readAsDataURL(blob);
    }

    function resetWorkspaces() {
        encWorkspace.classList.add('hidden');
        encDrop.classList.remove('hidden');
        encFile.value = '';
        secretInput.value = '';
        charCounter.textContent = '0';
        
        decWorkspace.classList.add('hidden');
        decDrop.classList.remove('hidden');
        decFile.value = '';
        resultContainer.classList.add('hidden');
    }

    /* --- 🔥 SHARE & DOWNLOAD HANDLERS --- */
    shareBtn.addEventListener('click', () => processImage('share'));
    downloadBtn.addEventListener('click', () => processImage('download'));

    function processImage(action) {
        const text = secretInput.value;
        if (!text) return showToast("⚠️ Type a secret message first!");
        
        // UTF-8 Encoder (Emoji Fix)
        const encoder = new TextEncoder();
        const bytes = encoder.encode(text);
        if (bytes.length > 5000) return showToast("⚠️ Message too long!");

        toggleLoading(action === 'share' ? shareBtn : downloadBtn, true);

        setTimeout(() => {
            try {
                hideData(encPreview, text, action);
            } catch (error) {
                console.error(error);
                showToast("❌ Error hiding data. Try a larger image.");
                toggleLoading(action === 'share' ? shareBtn : downloadBtn, false);
            }
        }, 100);
    }

    function hideData(img, text, action) {
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        ctx.drawImage(img, 0, 0);

        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;

        // 1. Convert Text to Binary (UTF-8)
        const encoder = new TextEncoder();
        const uint8Array = encoder.encode(text);
        
        let binaryString = "";
        for (let byte of uint8Array) {
            binaryString += byte.toString(2).padStart(8, '0');
        }
        binaryString += "00000000"; // Terminator

        // 2. Capacity Check
        if (binaryString.length > data.length / 4) {
            toggleLoading(action === 'share' ? shareBtn : downloadBtn, false);
            return showToast("❌ Image too small for this message!");
        }

        // 3. Embed Data (Blue Channel LSB)
        let binIdx = 0;
        for (let i = 0; i < data.length; i += 4) {
            if (binIdx < binaryString.length) {
                data[i + 2] = (data[i + 2] & ~1) | parseInt(binaryString[binIdx]);
                binIdx++;
            } else {
                break;
            }
        }

        ctx.putImageData(imgData, 0, 0);
        
        // 4. 🔥 SAVE AS .WEBKAAR (Magic Trick)
        canvas.toBlob((blob) => {
            const fileName = `secret_msg_${Date.now()}.webkaar`; 
            const file = new File([blob], fileName, { type: 'image/png' });

            if (action === 'share') {
                // Try Native Share (Mobile)
                if (navigator.share && navigator.canShare({ files: [file] })) {
                    navigator.share({
                        files: [file],
                        title: 'Secret Message',
                        text: 'Here is a secret message file. Open in WebKaar tool to decode.'
                    }).catch(console.error);
                } else {
                    showToast("⚠️ Sharing not supported, downloading instead.");
                    downloadBlob(blob, fileName);
                }
            } else {
                downloadBlob(blob, fileName);
            }
            toggleLoading(action === 'share' ? shareBtn : downloadBtn, false);
        }, 'image/png');
    }

    function downloadBlob(blob, name) {
        const link = document.createElement('a');
        link.download = name;
        link.href = URL.createObjectURL(blob);
        link.click();
        showToast("✅ File Saved! Share this file.");
    }

    function toggleLoading(btn, isLoading) {
        const loader = btn.querySelector('.loader');
        const text = btn.querySelector('.btn-text');
        if(loader && text) {
            loader.style.display = isLoading ? 'inline-block' : 'none';
            text.style.display = isLoading ? 'none' : 'inline';
            btn.disabled = isLoading;
        }
    }

    /* --- 🔥 DECRYPTION LOGIC --- */
    decryptBtn.addEventListener('click', () => {
        try {
            const msg = revealData(decPreview);
            if (msg) {
                decodedText.textContent = msg;
                resultContainer.classList.remove('hidden');
                showToast("🔓 Message Revealed!");
                resultContainer.scrollIntoView({ behavior: 'smooth' });
            } else {
                showToast("❌ No hidden message found.");
            }
        } catch (e) {
            showToast("❌ Error reading file.");
        }
    });

    function revealData(img) {
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        ctx.drawImage(img, 0, 0);
        const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        
        let extractedBits = "";
        let byteBuffer = [];
        
        for (let i = 0; i < data.length; i += 4) {
            // Read Blue Channel LSB
            extractedBits += (data[i + 2] & 1).toString();

            if (extractedBits.length === 8) {
                const byteValue = parseInt(extractedBits, 2);
                if (byteValue === 0) break; // Terminator
                byteBuffer.push(byteValue);
                extractedBits = "";
            }
        }

        if (byteBuffer.length === 0) return null;

        // Convert Bytes back to Text (UTF-8)
        try {
            const decoder = new TextDecoder();
            const decodedString = decoder.decode(new Uint8Array(byteBuffer));
            if(decodedString.length > 0) return decodedString;
        } catch(e) { return null; }
        return null;
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
    if(infoBtn) {
        infoBtn.onclick = () => modal.classList.remove('hidden');
        close.onclick = () => modal.classList.add('hidden');
    }
});

