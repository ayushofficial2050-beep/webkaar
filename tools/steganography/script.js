document.addEventListener('DOMContentLoaded', () => {

    /* --- DOM ELEMENTS --- */
    const tabs = document.querySelectorAll('.tab-btn');
    const panels = document.querySelectorAll('.panel');
    const canvas = document.getElementById('processor-canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const toast = document.getElementById('toast');

    // Encode Elements
    const encDrop = document.getElementById('encode-dropzone');
    const encFile = document.getElementById('encode-file');
    const encWorkspace = document.getElementById('encode-workspace');
    const encPreview = document.getElementById('encode-preview');
    const encMeta = document.getElementById('encode-meta');
    const secretInput = document.getElementById('secret-message');
    const charCounter = document.getElementById('char-counter');
    const shareBtn = document.getElementById('share-btn');
    const downloadBtn = document.getElementById('download-btn');
    const clearBtnEncode = document.getElementById('clear-btn');

    // Decode Elements
    const decDrop = document.getElementById('decode-dropzone');
    const decFile = document.getElementById('decode-file');
    const decWorkspace = document.getElementById('decode-workspace');
    const decPreview = document.getElementById('decode-preview');
    const decryptBtn = document.getElementById('decrypt-btn');
    const resultContainer = document.getElementById('result-container');
    const decodedText = document.getElementById('decoded-text');
    const copyBtn = document.getElementById('copy-btn');
    const clearBtnDecode = document.getElementById('clear-btn-decode');

    // WebKaar Secret Signature (To prevent garbage decoding)
    const SIGNATURE = "WBK|"; 

    /* --- TABS NAVIGATION --- */
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

    /* --- TEXT LIMITER --- */
    secretInput.addEventListener('input', () => {
        let len = secretInput.value.length;
        if (len > 1000) {
            secretInput.value = secretInput.value.slice(0, 1000);
            len = 1000;
            showToast("⚠️ Max 1000 characters allowed!", true);
        }
        charCounter.textContent = len;
        charCounter.style.color = len === 1000 ? '#ef4444' : 'var(--text-muted)';
    });

    /* --- DRAG & DROP LOGIC --- */
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

    encDrop.addEventListener('click', () => encFile.click());
    decDrop.addEventListener('click', () => decFile.click());

    encFile.addEventListener('change', e => handleFile(e.target.files[0], 'encode'));
    decFile.addEventListener('change', e => handleFile(e.target.files[0], 'decode'));

    /* --- FILE HANDLER --- */
    function handleFile(file, mode) {
        if (!file || !file.type.startsWith('image/')) {
            return showToast("⚠️ Please upload a valid image file", true);
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
            imgObj.onerror = () => showToast("❌ Invalid image format", true);
            imgObj.src = event.target.result;
        };
        reader.readAsDataURL(file);
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

    /* --- ENCODE & STEGANOGRAPHY LOGIC --- */
    shareBtn.addEventListener('click', () => processImage('share'));
    downloadBtn.addEventListener('click', () => processImage('download'));

    function processImage(action) {
        const text = secretInput.value.trim();
        if (!text) return showToast("⚠️ Type a secret message first!", true);
        
        // Append WebKaar signature to secure against random noise
        const secureText = SIGNATURE + text;
        const encoder = new TextEncoder();
        const bytes = encoder.encode(secureText);
        
        if (bytes.length > 5000) return showToast("⚠️ Message too long!", true);
        
        toggleLoading(action === 'share' ? shareBtn : downloadBtn, true);

        // Defer heavy canvas ops so loader can show
        setTimeout(() => {
            try {
                hideData(encPreview, secureText, action);
            } catch (error) {
                console.error(error);
                showToast("❌ Error hiding data. Try a different image.", true);
                toggleLoading(action === 'share' ? shareBtn : downloadBtn, false);
            }
        }, 100);
    }

    function hideData(img, text, action) {
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        
        // Prevent transparency corruption by applying solid white background
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);

        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;

        const encoder = new TextEncoder();
        const uint8Array = encoder.encode(text);
        
        let binaryString = "";
        for (let byte of uint8Array) {
            binaryString += byte.toString(2).padStart(8, '0');
        }
        binaryString += "00000000"; // Terminator byte

        if (binaryString.length > data.length / 4) {
            toggleLoading(action === 'share' ? shareBtn : downloadBtn, false);
            return showToast("❌ Image too small for this message!", true);
        }

        // LSB replacement on the Blue channel
        let binIdx = 0;
        for (let i = 0; i < data.length && binIdx < binaryString.length; i += 4) {
            data[i + 2] = (data[i + 2] & ~1) | parseInt(binaryString[binIdx]);
            binIdx++;
        }

        ctx.putImageData(imgData, 0, 0);
        
        canvas.toBlob(blob => {
            // Fake WhatsApp-style filename so nobody gets suspicious
            const fileName = `IMG-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-WA${Math.floor(Math.random() * 1000).toString().padStart(4, '0')}.png`;
            const file = new File([blob], fileName, { type: 'image/png' });

            if (action === 'share') {
                if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                    navigator.share({
                        files: [file],
                        title: 'Share Image',
                    }).catch(err => {
                        console.log('Share canceled or failed');
                        // Fallback
                        downloadBlob(blob, fileName);
                    });
                } else {
                    showToast("⚠️ Direct share not supported. Downloading instead.");
                    downloadBlob(blob, fileName);
                }
            } else {
                downloadBlob(blob, fileName);
            }

            toggleLoading(action === 'share' ? shareBtn : downloadBtn, false);
        }, 'image/png', 1.0);
    }

    function downloadBlob(blob, name) {
        const link = document.createElement('a');
        link.download = name;
        link.href = URL.createObjectURL(blob);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
        showToast("✅ Image Saved! Send as Document on WhatsApp.");
    }

    /* --- DECRYPT & REVEAL LOGIC --- */
    decryptBtn.addEventListener('click', () => {
        toggleLoading(decryptBtn, true);
        
        setTimeout(() => {
            try {
                const msg = revealData(decPreview);
                if (msg) {
                    decodedText.textContent = msg;
                    resultContainer.classList.remove('hidden');
                    showToast("🔓 Message Revealed!");
                    resultContainer.scrollIntoView({ behavior: 'smooth' });
                } else {
                    showToast("❌ No secret message found in this image.", true);
                }
            } catch (e) {
                console.error(e);
                showToast("❌ Error reading image. It might be compressed.", true);
            } finally {
                toggleLoading(decryptBtn, false);
            }
        }, 100);
    });

    function revealData(img) {
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        
        const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        
        let extractedBits = "";
        let byteBuffer = [];
        
        for (let i = 0; i < data.length; i += 4) {
            extractedBits += (data[i + 2] & 1).toString();

            if (extractedBits.length === 8) {
                const byteValue = parseInt(extractedBits, 2);
                if (byteValue === 0) break; 
                byteBuffer.push(byteValue);
                extractedBits = "";
            }
        }

        if (byteBuffer.length === 0) return null;

        try {
            const decoder = new TextDecoder();
            const decodedString = decoder.decode(new Uint8Array(byteBuffer));
            
            // Verify WebKaar Signature
            if (decodedString.startsWith(SIGNATURE)) {
                return decodedString.substring(SIGNATURE.length);
            } else {
                return null;
            }
        } catch (e) {
            return null;
        }
    }

    /* --- UTILS, TOASTS & MODALS --- */
    function toggleLoading(btn, isLoading) {
        const loader = btn.querySelector('.loader');
        const text = btn.querySelector('.btn-text');
        if (loader && text) {
            if (isLoading) {
                loader.classList.remove('hidden');
                text.classList.add('hidden');
            } else {
                loader.classList.add('hidden');
                text.classList.remove('hidden');
            }
            btn.disabled = isLoading;
        }
    }

    copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(decodedText.textContent).then(() => {
            showToast("Message Copied! 📋");
        }).catch(() => {
            showToast("❌ Copy failed.", true);
        });
    });

    function showToast(msg, isError = false) {
        toast.textContent = msg;
        toast.style.backgroundColor = isError ? '#ef4444' : 'var(--accent-green)';
        toast.classList.remove('hidden');
        toast.classList.add('visible');
        setTimeout(() => {
            toast.classList.remove('visible');
            toast.classList.add('hidden');
        }, 3000);
    }

    if (clearBtnEncode) clearBtnEncode.addEventListener('click', resetWorkspaces);
    if (clearBtnDecode) clearBtnDecode.addEventListener('click', resetWorkspaces);

    // Modal Interaction Logic
    const infoBtn = document.getElementById('info-btn');
    const modal = document.getElementById('info-modal');
    const closeModal = document.getElementById('close-modal');

    if (infoBtn && modal && closeModal) {
        infoBtn.addEventListener('click', () => modal.classList.remove('hidden'));
        closeModal.addEventListener('click', () => modal.classList.add('hidden'));
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.classList.add('hidden');
        });
    }

});
