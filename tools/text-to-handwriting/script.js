document.addEventListener('DOMContentLoaded', () => {

    const canvas = document.getElementById('page-canvas');
    const ctx = canvas.getContext('2d');
    
    // UI Elements
    const textInput = document.getElementById('text-input');
    const fontSelect = document.getElementById('font-select');
    const customFontUpload = document.getElementById('custom-font-upload');
    const sizeSlider = document.getElementById('size-slider');
    const sizeVal = document.getElementById('size-val');
    const messSlider = document.getElementById('mess-slider');
    const messVal = document.getElementById('mess-val');
    const inkColors = document.querySelectorAll('input[name="ink-color"]');
    const downloadBtn = document.getElementById('download-btn');
    
    // Modal
    const infoBtn = document.getElementById('info-btn');
    const closeModal = document.getElementById('close-modal');
    const infoModal = document.getElementById('info-modal');

    let currentCustomFont = '';

    // A4 Paper Constants (HD Resolution)
    const CANVAS_WIDTH = 1240;
    const CANVAS_HEIGHT = 1754;
    const MARGIN_LEFT = 160; // Space for red line margin
    const MARGIN_RIGHT = 60;
    const MARGIN_TOP = 190; // Start of first blue line
    const LINE_HEIGHT = 45; // Gap between blue lines

    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;

    // Default Demo Text
    textInput.value = "Hey there,\n\nNotice how the text now touches the blue lines perfectly?\n\nIf you increase the 'Human Realism' slider, words will randomly shift up and down slightly, making it look 100% human and less like a robot.\n\nYou can even select 'Upload Custom Font' to use your own handwriting!\n\nCreated by Ayush Tiwari.\n\nBest of luck with your assignments!";

    // --- EVENT LISTENERS ---
    textInput.addEventListener('input', drawPage);
    inkColors.forEach(radio => radio.addEventListener('change', drawPage));

    sizeSlider.addEventListener('input', (e) => {
        sizeVal.innerText = e.target.value + 'px';
        drawPage();
    });

    messSlider.addEventListener('input', (e) => {
        let val = parseInt(e.target.value);
        if(val === 0) messVal.innerText = "Robot (Perfect)";
        else if(val <= 3) messVal.innerText = "Normal";
        else if(val <= 6) messVal.innerText = "Messy Human";
        else if(val <= 9) messVal.innerText = "In a Hurry!";
        else messVal.innerText = "Doctor Level!";
        drawPage();
    });

    // Font Selection & Custom Upload Logic
    fontSelect.addEventListener('change', (e) => {
        if(e.target.value === 'custom') {
            customFontUpload.style.display = 'block';
        } else {
            customFontUpload.style.display = 'none';
            drawPage();
        }
    });

    customFontUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if(!file) return;
        
        const url = URL.createObjectURL(file);
        const fontName = 'UserCustomFont_' + Date.now();
        
        const customFont = new FontFace(fontName, `url(${url})`);
        customFont.load().then((loadedFont) => {
            document.fonts.add(loadedFont);
            currentCustomFont = `'${fontName}', sans-serif`;
            drawPage();
        }).catch(err => alert('Error loading font file. Please use a valid .ttf or .otf file.'));
    });

    // Make sure fonts are loaded before drawing the first time
    document.fonts.ready.then(() => drawPage());

    // --- RENDER ENGINE ---
    function drawPage() {
        // 1. Draw Paper Background
        ctx.fillStyle = '#fdfdfc'; // Off-white cream paper color
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // 2. Draw Blue Ruled Lines
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = '#9caadd'; 
        for (let y = MARGIN_TOP; y < CANVAS_HEIGHT; y += LINE_HEIGHT) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(CANVAS_WIDTH, y);
            ctx.stroke();
        }

        // 3. Draw Red Margin
        ctx.strokeStyle = '#f28b82'; 
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(MARGIN_LEFT, 0); ctx.lineTo(MARGIN_LEFT, CANVAS_HEIGHT);
        ctx.moveTo(MARGIN_LEFT + 6, 0); ctx.lineTo(MARGIN_LEFT + 6, CANVAS_HEIGHT);
        ctx.stroke();

        // 4. Setup Text Options
        const text = textInput.value;
        const fontSize = parseInt(sizeSlider.value) * 1.5; // Scale font for HD canvas
        const inkColor = document.querySelector('input[name="ink-color"]:checked').value;
        
        let fontStyle = fontSelect.value;
        if (fontStyle === 'custom') {
            fontStyle = currentCustomFont || 'sans-serif'; // Fallback
        }

        ctx.font = `${fontSize}px ${fontStyle}`;
        ctx.fillStyle = inkColor;
        
        // 🔥 CRITICAL: 'alphabetic' makes text sit EXACTLY on the drawn y-coordinate line
        ctx.textBaseline = 'alphabetic'; 

        const messiness = parseInt(messSlider.value);

        // 5. Draw the text with Smart Word Wrap
        // Start X is after the red margin. Start Y is exactly on the first blue line.
        writeHumanText(ctx, text, MARGIN_LEFT + 25, MARGIN_TOP, CANVAS_WIDTH - MARGIN_LEFT - MARGIN_RIGHT, LINE_HEIGHT, messiness);
    }

    function writeHumanText(context, text, startX, startY, maxWidth, lineHeight, messiness) {
        const paragraphs = text.split('\n');
        let currentY = startY; 

        for (let i = 0; i < paragraphs.length; i++) {
            let words = paragraphs[i].split(' ');
            let lineX = startX;

            for (let n = 0; n < words.length; n++) {
                let word = words[n];
                // Measure word with trailing space
                let wordWidth = context.measureText(word + ' ').width;

                // Word Wrap: If word exceeds margin, move to next line
                if (lineX + wordWidth > startX + maxWidth && lineX > startX) {
                    lineX = startX;
                    currentY += lineHeight; 
                }

                // 🔥 ANTI-ROBOT ALGORITHM (Jitter)
                let randomYOffset = 0;
                if (messiness > 0) {
                    // Random shift up or down. Max shift depends on messiness slider (0 to 10)
                    // If messiness is 10, shift can be roughly +/- 12px
                    randomYOffset = (Math.random() - 0.5) * messiness * 2.5; 
                }

                // Draw word and move X cursor forward
                context.fillText(word + ' ', lineX, currentY + randomYOffset);
                lineX += wordWidth;
            }
            // Move down for the next paragraph
            currentY += lineHeight; 
        }
    }

    // Modal Logic
    infoBtn.addEventListener('click', () => infoModal.classList.remove('hidden'));
    closeModal.addEventListener('click', () => infoModal.classList.add('hidden'));
    infoModal.addEventListener('click', (e) => {
        if(e.target === infoModal) infoModal.classList.add('hidden');
    });

    // Download Logic
    downloadBtn.addEventListener('click', () => {
        const link = document.createElement('a');
        link.download = `WebKaar_Assignment_${Date.now()}.jpg`;
        link.href = canvas.toDataURL('image/jpeg', 0.95); // High quality export
        link.click();
    });
});
