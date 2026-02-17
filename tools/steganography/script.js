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
    const clearBtnEncode = document.getElementById('clear-btn'); // Added for clear button

    // Decode
    const decDrop = document.getElementById('decode-dropzone');
    const decFile = document.getElementById('decode-file');
    const decWorkspace = document.getElementById('decode-workspace');
    const decPreview = document.getElementById('decode-preview');
    const decryptBtn = document.getElementById('decrypt-btn');
    const resultContainer = document.getElementById('result-container');
    const decodedText = document.getElementById('decoded-text');
    const copyBtn = document.getElementById('copy-btn');
    const clearBtnDecode = document.getElementById('clear-btn-decode'); // Added for decode clear

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

    /* --- INPUT COUNT & STRICT LIMIT --- */
    secretInput.addEventListener('input', () => {
        let len = secretInput.value.length;
        charCounter.textContent = len;
        
        if (len > 1000) {
            charCounter.style.color = '#ef4444';
            secretInput.value = secretInput.value.slice(0, 1000); // strict cut
            showToast("⚠️ Max 1000 characters allowed!");
        } else {
            charCounter.style.color = 'var(--text-muted)';
        }
    });

    /* --- DRAG & DROP SUPPORT (Improved UX) --- */
    function addDragEvents(dropZone, mode) {
        ['dragover', 'dragenter'].forEach(event => {
            dropZone.addEventListener(event, e => {
                e.preventDefault();
                dropZone.classList.add('drag-over');
            });
        });

        ['dragleave', 'dragend'].forEach(event => {
            dropZone.addEventListener(event, () => dropZone.classList.remove('drag-over'));
        });

        dropZone.addEventListener('drop', e => {
            e.preventDefault();
            dropZone.classList.remove('drag-over');
            handleFile(e.dataTransfer.files[0], mode);
        });
    }

    addDragEvents(encDrop, 'encode');
    addDragEvents(decDrop, 'decode');

    /* --- FILE HANDLING --- */
    encDrop.addEventListener('click', () => encFile.click());
    decDrop.addEventListener('click', () => decFile.click());

    encFile.addEventListener('change', e => handleFile(e.target.files[0], 'encode'));
    decFile.addEventListener('change', e => handleFile(e.target.files[0], 'decode'));

    function handleFile(file, mode) {
        if (!file) return;
        
        let blob = file;
        
        // Force .webkaar / .enc as PNG for decoding
        if (mode === 'decode') {
            blob = new Blob([file], { type: 'image/png' });
        } else if (!file.type.startsWith('image/')) {
            showToast("⚠️ Please upload a valid image (JPG/PNG)");
            return;
        }

        const reader = new FileReader();
        reader.onload = event => {
            const imgObj = new Image();
            imgObj.onload = () => {
                if (mode === 'encode') {
                    encPreview.src = imgObj.src;
                    encWorkspace.classList.remove('hidden');
                    encDrop.classList.add('hidden');
                    encMeta.textContent = `${imgObj.width} x ${imgObj.height} px • ${(file.size / 1024 / 1024).toFixed(2)} MB`;
                } else {
                    decPreview.src = imgObj.src;
                    decWorkspace.classList.remove('hidden');
                    decDrop.classList.add('hidden');
                    resultContainer.classList.add('hidden');
                }
            };
            imgObj.onerror = () => showToast("❌ Invalid image file");
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
        charCounter.style.color = 'var(--text-muted)';
        
        decWorkspace.classList.add('hidden');
        decDrop.classList.remove('hidden');
        decFile.value = '';
        resultContainer.classList.add('hidden');
        decodedText.textContent = '';
    }

    /* --- SHARE & DOWNLOAD --- */
    shareBtn.addEventListener('click', () => processImage('share'));
    downloadBtn.addEventListener('click', () => processImage('download'));

    function processImage(action) {
        const text = secretInput.value.trim();
        if (!text) return showToast("⚠️ Type a secret message first!");
        
        const encoder = new TextEncoder();
        const bytes = encoder.encode(text);
        if (bytes.length > 5000) return showToast("⚠️ Message too long! (Max ~5000 bytes)");
        
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

        // UTF-8 to binary
        const encoder = new TextEncoder();
        const uint8Array = encoder.encode(text);
        
        let binaryString = "";
        for (let byte of uint8Array) {
            binaryString += byte.toString(2).padStart(8, '0');
        }
        binaryString += "00000000"; // Terminator

        // Capacity check
        if (binaryString.length > data.length / 4) {
            toggleLoading(action === 'share' ? shareBtn : downloadBtn, false);
            return showToast("❌ Image too small! Use a larger image or shorter message.");
        }

        // Embed in Blue channel LSB
        let binIdx = 0;
        for (let i = 0; i < data.length && binIdx < binaryString.length; i += 4) {
            data[i + 2] = (data[i + 2] & ~1) | parseInt(binaryString[binIdx]);
            binIdx++;
        }

        ctx.putImageData(imgData, 0, 0);
        
        // Create blob with generic binary type (anti-compression fix)
        canvas.toBlob(blob => {
            const octetBlob = new Blob([blob], { type: 'application/octet-stream' });
            const fileName = `secret_msg_${Date.now()}.webkaar`;
            const file = new File([octetBlob], fileName, { type: 'application/octet-stream' });

            if (action === 'share') {
                if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                    navigator.share({
                        files: [file],
                        title: 'Secret Message File',
                        text: 'Open this .webkaar file in WebKaar to reveal the hidden message.'
                    }).catch(err => {
                        console.log('Share failed:', err);
                        downloadBlob(octetBlob, fileName);
                    });
                } else {
                    showToast("⚠️ Sharing not supported on this device, downloading instead.");
                    downloadBlob(octetBlob, fileName);
                }
            } else {
                downloadBlob(octetBlob, fileName);
            }

            toggleLoading(action === 'share' ? shareBtn : downloadBtn, false);
        }, 'image/png', 0.92); // Slightly better quality
    }

    function downloadBlob(blob, name) {
        const link = document.createElement('a');
        link.download = name;
        link.href = URL.createObjectURL(blob);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href); // Clean up memory
        showToast("✅ File Saved! Share this .webkaar file.");
    }

    function toggleLoading(btn, isLoading) {
        const loader = btn.querySelector('.loader');
        const text = btn.querySelector('.btn-text');
        if (loader && text) {
            loader.style.display = isLoading ? 'inline-block' : 'none';
            text.style.display = isLoading ? 'none' : 'inline';
            btn.disabled = isLoading;
        }
    }

    /* --- DECRYPTION --- */
    decryptBtn.addEventListener('click', () => {
        try {
            const msg = revealData(decPreview);
            if (msg) {
                decodedText.textContent = msg;
                resultContainer.classList.remove('hidden');
                showToast("🔓 Message Revealed!");
                resultContainer.scrollIntoView({ behavior: 'smooth' });
            } else {
                showToast("❌ No hidden message found in this file.");
            }
        } catch (e) {
            console.error(e);
            showToast("❌ Error reading file. Try another.");
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
            extractedBits += (data[i + 2] & 1).toString();

            if (extractedBits.length === 8) {
                const byteValue = parseInt(extractedBits, 2);
                if (byteValue === 0) break; // Terminator
                byteBuffer.push(byteValue);
                extractedBits = "";
            }
        }

        if (byteBuffer.length === 0) return null;

        try {
            const decoder = new TextDecoder();
            return decoder.decode(new Uint8Array(byteBuffer));
        } catch (e) {
            return null;
        }
    }

    /* --- UTILS --- */
    copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(decodedText.textContent).then(() => {
            showToast("Message Copied! 📋");
        }).catch(() => {
            showToast("❌ Copy failed. Select and copy manually.");
        });
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

    // Clear buttons (for both panels)
    if (clearBtnEncode) clearBtnEncode.addEventListener('click', resetWorkspaces);
    if (clearBtnDecode) clearBtnDecode.addEventListener('click', resetWorkspaces);

});
