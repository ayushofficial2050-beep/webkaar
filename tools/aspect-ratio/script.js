document.addEventListener('DOMContentLoaded', () => {
    
    // Inputs
    const w1 = document.getElementById('w1');
    const h1 = document.getElementById('h1');
    const w2 = document.getElementById('w2');
    const h2 = document.getElementById('h2');
    const ratioResult = document.getElementById('ratio-result');
    const presets = document.querySelectorAll('.chip');
    
    // Preview Elements
    const aspectBox = document.getElementById('aspect-box');
    const boxLabel = document.getElementById('box-label');

    // Modal Elements
    const infoBtn = document.getElementById('info-btn');
    const modal = document.getElementById('info-modal');
    const closeModal = document.getElementById('close-modal');

    // 1. Calculate Ratio (GCD Algorithm)
    function calculateRatio(w, h) {
        if (!w || !h) return "0:0";
        const gcdVal = gcd(w, h);
        return `${w / gcdVal}:${h / gcdVal}`;
    }

    function gcd(a, b) {
        return b === 0 ? a : gcd(b, a % b);
    }

    // 2. Update Logic
    function update(source) {
        const width1 = parseFloat(w1.value);
        const height1 = parseFloat(h1.value);
        
        if (!width1 || !height1) return;

        // Update Ratio Text
        const ratio = calculateRatio(width1, height1);
        ratioResult.textContent = ratio;
        boxLabel.textContent = ratio;

        // Update New Dimensions
        if (source === 'w2') {
            const width2 = parseFloat(w2.value);
            if (width2) {
                h2.value = Math.round((height1 / width1) * width2);
            }
        } else if (source === 'h2') {
            const height2 = parseFloat(h2.value);
            if (height2) {
                w2.value = Math.round((width1 / height1) * height2);
            }
        } else {
            // If source is w1 or h1, just re-calc w2 if it exists
            const width2 = parseFloat(w2.value);
            if (width2) {
                h2.value = Math.round((height1 / width1) * width2);
            }
        }

        // Update Visual Box
        updateVisual(width1, height1);
    }

    function updateVisual(w, h) {
        // Base size for the box inside 300px container
        const maxSize = 250;
        let newW, newH;

        if (w > h) {
            newW = maxSize;
            newH = (h / w) * maxSize;
        } else {
            newH = maxSize;
            newW = (w / h) * maxSize;
        }

        aspectBox.style.width = `${newW}px`;
        aspectBox.style.height = `${newH}px`;
    }

    // 3. Event Listeners
    w1.addEventListener('input', () => update('w1'));
    h1.addEventListener('input', () => update('h1'));
    w2.addEventListener('input', () => update('w2'));
    h2.addEventListener('input', () => update('h2'));

    // 4. Presets Logic
    presets.forEach(btn => {
        btn.addEventListener('click', () => {
            w1.value = btn.dataset.w;
            h1.value = btn.dataset.h;
            update('w1');
        });
    });

    // Initial Run
    update('w1');

    // 5. Modal Logic
    if(infoBtn && modal && closeModal) {
        infoBtn.addEventListener('click', () => modal.classList.remove('hidden'));
        closeModal.addEventListener('click', () => modal.classList.add('hidden'));
        modal.addEventListener('click', (e) => {
            if(e.target === modal) modal.classList.add('hidden');
        });
    }

});