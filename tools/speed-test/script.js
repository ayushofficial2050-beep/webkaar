document.addEventListener('DOMContentLoaded', () => {
    
    // Elements
    const startBtn = document.getElementById('start-btn');
    const statusText = document.getElementById('status-text');
    const speedValue = document.getElementById('speed-value');
    const gaugeFill = document.getElementById('gauge-progress');
    
    const pingVal = document.getElementById('ping-val');
    const jitterVal = document.getElementById('jitter-val');
    const dlVal = document.getElementById('dl-val');

    // Test Config (Using a fast public CDN file)
    // Wikipedia image is good because it has CORS enabled and fast servers.
    const TEST_FILE_URL = 'https://upload.wikimedia.org/wikipedia/commons/2/2d/Snake_River_%285mb%29.jpg';
    const TEST_FILE_SIZE = 5242880; // 5 MB in bytes (approx)

    let isTesting = false;

    startBtn.addEventListener('click', runSpeedTest);

    async function runSpeedTest() {
        if (isTesting) return;
        isTesting = true;
        
        // Reset UI
        startBtn.disabled = true;
        updateGauge(0);
        pingVal.textContent = '-- ms';
        jitterVal.textContent = '-- ms';
        dlVal.textContent = '-- Mbps';
        
        try {
            // 1. PING TEST
            statusText.textContent = 'Testing Ping...';
            const pingResults = await measurePing();
            pingVal.textContent = `${pingResults.ping} ms`;
            jitterVal.textContent = `${pingResults.jitter} ms`;

            // 2. DOWNLOAD TEST
            statusText.textContent = 'Testing Download Speed...';
            const speedMbps = await measureDownload();
            
            // 3. FINISH
            dlVal.textContent = `${speedMbps} Mbps`;
            statusText.textContent = 'Test Completed';
            
            // Visual success effect
            gaugeFill.style.stroke = '#10b981'; // Green

        } catch (error) {
            console.error(error);
            statusText.textContent = 'Test Failed. Check Connection.';
            statusText.style.color = '#ef4444';
        } finally {
            isTesting = false;
            startBtn.disabled = false;
            startBtn.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                Test Again
            `;
        }
    }

    // --- LOGIC: Measure Ping ---
    async function measurePing() {
        const pings = [];
        // Ping Google 5 times to check stability
        for (let i = 0; i < 5; i++) {
            const start = performance.now();
            try {
                // Fetching HEAD of current page (Cloudflare Server Latency)
                await fetch(window.location.href, { method: 'HEAD', cache: 'no-store' });
                const end = performance.now();
                pings.push(end - start);
            } catch (e) {
                pings.push(100); // Fallback
            }
        }

        // Calculate Avg Ping
        const sum = pings.reduce((a, b) => a + b, 0);
        const avg = Math.round(sum / pings.length);

        // Calculate Jitter (Variation)
        // Avg difference between consecutive pings
        let jitterSum = 0;
        for (let i = 0; i < pings.length - 1; i++) {
            jitterSum += Math.abs(pings[i] - pings[i+1]);
        }
        const jitter = Math.round(jitterSum / (pings.length - 1)) || 1;

        return { ping: avg, jitter: jitter };
    }

    // --- LOGIC: Measure Download ---
    async function measureDownload() {
        const startTime = performance.now();
        
        // Add random query to prevent caching
        const cacheBuster = `?t=${new Date().getTime()}`;
        
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('GET', TEST_FILE_URL + cacheBuster, true);
            xhr.responseType = 'blob';

            // Progress event for live gauge update
            xhr.onprogress = (event) => {
                if (event.lengthComputable) {
                    const durationSeconds = (performance.now() - startTime) / 1000;
                    const loadedBytes = event.loaded;
                    const speedBps = (loadedBytes * 8) / durationSeconds; // Bits per second
                    const speedMbps = (speedBps / 1024 / 1024).toFixed(1); // Mbps
                    
                    updateGauge(speedMbps);
                }
            };

            xhr.onload = () => {
                const durationSeconds = (performance.now() - startTime) / 1000;
                const totalBytes = xhr.response.size; // Accurate size
                const speedBps = (totalBytes * 8) / durationSeconds;
                const finalMbps = (speedBps / 1024 / 1024).toFixed(2);
                
                updateGauge(finalMbps);
                resolve(finalMbps);
            };

            xhr.onerror = () => reject('Network Error');
            xhr.send();
        });
    }

    // --- UI: Gauge Animation ---
    function updateGauge(speed) {
        speedValue.textContent = speed;

        // Max speed for gauge visual = 100 Mbps (just for scale)
        const maxSpeed = 100; 
        const minSpeed = 0;
        
        // Clamp value
        let normalized = Math.min(Math.max(speed, minSpeed), maxSpeed);
        
        // Gauge Arc Math
        // Full arc is 251.2px
        // 0 speed = 251.2 offset (empty)
        // 100 speed = 0 offset (full)
        
        const maxOffset = 251.2;
        const offset = maxOffset - ((normalized / maxSpeed) * maxOffset);
        
        gaugeFill.style.strokeDashoffset = offset;
        
        // Color Change based on speed
        if (speed < 10) gaugeFill.style.stroke = '#ef4444'; // Slow (Red)
        else if (speed < 50) gaugeFill.style.stroke = '#f59e0b'; // Avg (Orange)
        else gaugeFill.style.stroke = '#3b82f6'; // Fast (Blue)
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
