document.addEventListener('DOMContentLoaded', () => {
    
    // Elements
    const color1Input = document.getElementById('color1');
    const hex1Input = document.getElementById('hex1');
    const color2Input = document.getElementById('color2');
    const hex2Input = document.getElementById('hex2');
    const swapBtn = document.getElementById('swap-colors');
    
    const angleSlider = document.getElementById('angle-slider');
    const angleVal = document.getElementById('angle-val');
    const presets = document.querySelectorAll('.chip');
    
    const randomBtn = document.getElementById('random-btn');
    const previewBox = document.getElementById('gradient-preview');
    const cssOutput = document.getElementById('css-output');
    const copyBtn = document.getElementById('copy-btn');
    const toast = document.getElementById('toast');

    // 1. Update Gradient Logic
    function updateGradient() {
        const c1 = color1Input.value;
        const c2 = color2Input.value;
        const deg = angleSlider.value;

        // Sync Hex Inputs
        hex1Input.value = c1;
        hex2Input.value = c2;
        angleVal.textContent = `${deg}°`;

        // Generate CSS
        const css = `background: linear-gradient(${deg}deg, ${c1}, ${c2});`;
        
        // Apply to Preview
        previewBox.style.background = `linear-gradient(${deg}deg, ${c1}, ${c2})`;
        
        // Update Code Box
        cssOutput.textContent = css;
    }

    // 2. Input Listeners
    color1Input.addEventListener('input', updateGradient);
    color2Input.addEventListener('input', updateGradient);
    
    // Hex Text Input Listeners
    hex1Input.addEventListener('input', (e) => {
        if(isValidHex(e.target.value)) {
            color1Input.value = formatHex(e.target.value);
            updateGradient();
        }
    });
    hex2Input.addEventListener('input', (e) => {
        if(isValidHex(e.target.value)) {
            color2Input.value = formatHex(e.target.value);
            updateGradient();
        }
    });

    angleSlider.addEventListener('input', updateGradient);

    // 3. Swap Colors
    swapBtn.addEventListener('click', () => {
        const temp = color1Input.value;
        color1Input.value = color2Input.value;
        color2Input.value = temp;
        updateGradient();
    });

    // 4. Presets (Angle)
    presets.forEach(btn => {
        btn.addEventListener('click', () => {
            angleSlider.value = btn.dataset.deg;
            updateGradient();
        });
    });

    // 5. Random Colors
    randomBtn.addEventListener('click', () => {
        const c1 = getRandomColor();
        const c2 = getRandomColor();
        color1Input.value = c1;
        color2Input.value = c2;
        updateGradient();
    });

    // 6. Copy Code
    copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(cssOutput.textContent);
        showToast("CSS Copied!");
    });

    // Helpers
    function isValidHex(hex) {
        return /^#([0-9A-F]{3}){1,2}$/i.test(hex);
    }

    function formatHex(hex) {
        // Ensure # prefix
        return hex.startsWith('#') ? hex : '#' + hex;
    }

    function getRandomColor() {
        const letters = '0123456789ABCDEF';
        let color = '#';
        for (let i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    }

    function showToast(msg) {
        toast.textContent = msg;
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

    // Initialize
    updateGradient();
});