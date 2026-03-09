document.addEventListener('DOMContentLoaded', () => {
    
    // Live Clock Elements
    const currentUnixEl = document.getElementById('current-unix');
    const copyCurrentBtn = document.getElementById('copy-current');
    
    // Converter 1: Unix to Date
    const inputTimestamp = document.getElementById('input-timestamp');
    const btnToDate = document.getElementById('btn-to-date');
    const resDateBox = document.getElementById('result-date');
    const resUtc = document.getElementById('res-utc');
    const resLocal = document.getElementById('res-local');

    // Converter 2: Date to Unix
    const inputDate = document.getElementById('input-date');
    const btnToUnix = document.getElementById('btn-to-unix');
    const resUnixBox = document.getElementById('result-unix');
    const resSeconds = document.getElementById('res-seconds');
    const resMs = document.getElementById('res-ms');

    const toast = document.getElementById('toast');

    // 1. Live Clock Logic
    function updateClock() {
        const now = Math.floor(Date.now() / 1000);
        currentUnixEl.textContent = now;
    }
    setInterval(updateClock, 1000);
    updateClock(); // Run immediately

    copyCurrentBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(currentUnixEl.textContent);
        showToast("Copied to clipboard!");
    });

    // 2. Unix -> Date Logic
    btnToDate.addEventListener('click', () => {
        let val = inputTimestamp.value.trim();
        if (!val) {
            showToast("Enter a timestamp!", true);
            return;
        }

        // Auto-detect seconds vs ms
        // If length > 11, it's likely milliseconds
        let dateObj;
        if (val.length > 11) {
            dateObj = new Date(parseInt(val)); // Milliseconds
        } else {
            dateObj = new Date(parseInt(val) * 1000); // Seconds
        }

        if (isNaN(dateObj.getTime())) {
            showToast("Invalid Timestamp", true);
            return;
        }

        resUtc.textContent = dateObj.toUTCString();
        resLocal.textContent = dateObj.toString();
        resDateBox.classList.remove('hidden');
    });

    // 3. Date -> Unix Logic
    btnToUnix.addEventListener('click', () => {
        const val = inputDate.value;
        if (!val) {
            showToast("Select a date!", true);
            return;
        }

        const dateObj = new Date(val);
        const ms = dateObj.getTime();
        const seconds = Math.floor(ms / 1000);

        resSeconds.textContent = seconds;
        resMs.textContent = ms;
        resUnixBox.classList.remove('hidden');
    });

    // 4. Global Copy Function (Accessed via onclick in HTML)
    window.copyText = function(elementId) {
        const text = document.getElementById(elementId).textContent;
        navigator.clipboard.writeText(text);
        showToast("Copied!");
    };

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