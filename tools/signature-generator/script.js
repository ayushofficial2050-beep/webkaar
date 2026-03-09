document.addEventListener('DOMContentLoaded', () => {

    const canvas = document.getElementById('sig-canvas');
    const ctx = canvas.getContext('2d');
    const placeholder = document.getElementById('placeholder');
    
    // Buttons & Inputs
    const colorBtns = document.querySelectorAll('.color-btn');
    const penSizeInput = document.getElementById('pen-size');
    const clearBtn = document.getElementById('clear-btn');
    const downloadBtn = document.getElementById('download-btn');
    const toast = document.getElementById('toast');

    // State
    let isDrawing = false;
    let lastX = 0;
    let lastY = 0;
    let penColor = '#000000';
    let penWidth = 2;

    // 1. Setup Canvas Size
    function resizeCanvas() {
        const rect = canvas.parentElement.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.lineWidth = penWidth;
        ctx.strokeStyle = penColor;
    }
    
    // Initial Resize
    resizeCanvas();
    // Resize on window change
    window.addEventListener('resize', resizeCanvas);

    // 2. Drawing Functions
    function startDrawing(e) {
        isDrawing = true;
        placeholder.style.display = 'none'; // Hide placeholder
        
        const { x, y } = getPos(e);
        lastX = x;
        lastY = y;
    }

    function draw(e) {
        if (!isDrawing) return;
        e.preventDefault(); // Stop scrolling on touch

        const { x, y } = getPos(e);
        
        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(x, y);
        ctx.stroke();
        
        lastX = x;
        lastY = y;
    }

    function stopDrawing() {
        isDrawing = false;
    }

    // Helper: Get X/Y coordinates for Mouse or Touch
    function getPos(e) {
        const rect = canvas.getBoundingClientRect();
        let clientX, clientY;

        if (e.touches && e.touches.length > 0) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }

        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    }

    // 3. Event Listeners (Mouse + Touch)
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);

    canvas.addEventListener('touchstart', startDrawing, { passive: false });
    canvas.addEventListener('touchmove', draw, { passive: false });
    canvas.addEventListener('touchend', stopDrawing);

    // 4. Controls Logic
    
    // Change Color
    colorBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all
            colorBtns.forEach(b => b.classList.remove('active'));
            // Add to clicked
            btn.classList.add('active');
            
            penColor = btn.dataset.color;
            ctx.strokeStyle = penColor;
        });
    });

    // Change Size
    penSizeInput.addEventListener('input', (e) => {
        penWidth = e.target.value;
        ctx.lineWidth = penWidth;
    });

    // Clear Canvas
    clearBtn.addEventListener('click', () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        placeholder.style.display = 'block';
    });

    // Download Signature
    downloadBtn.addEventListener('click', () => {
        // Check if canvas is empty (basic check)
        if (placeholder.style.display !== 'none') {
            alert("Please sign first!");
            return;
        }

        const link = document.createElement('a');
        link.download = 'my-signature.png';
        link.href = canvas.toDataURL();
        link.click();
        
        showToast();
    });

    // Toast Logic
    function showToast() {
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
