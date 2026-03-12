/**
 * =========================================================
 * GODZILLA ENGINE - PRO GAME OPTIMIZER (v3.1)
 * Features: Screen Auto-Detect, 200 Sens Logic, Image Download
 * =========================================================
 */

document.addEventListener('DOMContentLoaded', () => {

    // --- DOM ELEMENTS ---
    const wizardContainer = document.getElementById('wizard-container');
    const scanSection = document.getElementById('scan-section');
    const resultWrapper = document.getElementById('result-wrapper');
    const captureArea = document.getElementById('capture-area');
    
    // Inputs & Buttons
    const deviceModelInput = document.getElementById('device-model');
    const totalRamInput = document.getElementById('total-ram');
    const freeStorageInput = document.getElementById('free-storage');
    const gameSelect = document.getElementById('game-select');
    const playstyleSelect = document.getElementById('playstyle');
    
    const detectScreenBtn = document.getElementById('detect-screen-btn');
    const screenResultText = document.getElementById('screen-result');
    const analyzeBtn = document.getElementById('analyze-btn');
    const resetBtn = document.getElementById('reset-btn');
    const downloadBtn = document.getElementById('download-result-btn');
    
    // Scan Elements
    const scanText = document.getElementById('scan-text');
    const scanSubtext = document.getElementById('scan-subtext');
    const scanProgress = document.getElementById('scan-progress');
    
    // Result Elements
    const resDevice = document.getElementById('res-device');
    const resGame = document.getElementById('res-game');
    const deviceBadge = document.getElementById('device-badge');
    const inGameSettings = document.getElementById('in-game-settings');
    const deviceSettings = document.getElementById('device-settings');
    const wmWatermark = document.getElementById('wm-watermark');

    // Modals
    const infoBtn = document.getElementById('info-btn');
    const closeModal = document.getElementById('close-modal');
    const infoModal = document.getElementById('info-modal');

    // Internal Variables
    let detectedScreenWidth = 360; // Default Android Smallest Width
    let isScreenDetected = false;

    const gameNames = {
        'freefire': 'Free Fire (200 Sens)',
        'bgmi': 'BGMI / PUBG Mobile',
        'scarfall': 'Scarfall 2.0',
        'codm': 'Call of Duty Mobile'
    };

    // --- 1. AUTO-DETECT SCREEN LOGIC ---
    detectScreenBtn.addEventListener('click', () => {
        detectScreenBtn.innerHTML = '<i class="ph-bold ph-spinner ph-spin" style="font-size: 20px;"></i> Detecting...';
        
        setTimeout(() => {
            // Get physical device logical width (usually 360px, 393px, 412px etc on phones)
            detectedScreenWidth = window.screen.width;
            isScreenDetected = true;
            
            detectScreenBtn.style.display = 'none';
            screenResultText.classList.remove('hidden');
            screenResultText.innerHTML = `<i class="ph-fill ph-check-circle"></i> Display Detected: Base Width ${detectedScreenWidth}dp<br><span style="color:var(--text-muted); font-size:0.8rem;">Safe DPI limits unlocked.</span>`;
        }, 800);
    });

    // --- 2. WIZARD NAVIGATION & VALIDATION ---
    window.nextStep = function(step) {
        if (!validateStep(step)) return; 
        
        document.getElementById(`step-${step}`).classList.add('hidden');
        document.getElementById(`dot-${step}`).classList.remove('active');
        document.getElementById(`dot-${step}`).style.background = '#10b981'; 
        
        const next = step + 1;
        document.getElementById(`step-${next}`).classList.remove('hidden');
        document.getElementById(`dot-${next}`).classList.add('active');
        
        const lines = document.querySelectorAll('.step-line');
        if(lines[step - 1]) lines[step - 1].classList.add('active');
    };

    window.prevStep = function(step) {
        document.getElementById(`step-${step}`).classList.add('hidden');
        document.getElementById(`dot-${step}`).classList.remove('active');
        
        const prev = step - 1;
        document.getElementById(`step-${prev}`).classList.remove('hidden');
        document.getElementById(`dot-${prev}`).classList.add('active');
        
        const lines = document.querySelectorAll('.step-line');
        if(lines[prev - 1]) lines[prev - 1].classList.remove('active');
    };

    function validateStep(step) {
        if (step === 1) {
            if(deviceModelInput.value.trim().length < 2) {
                alert("Brother, please enter your Device Name (e.g., POCO, Samsung).");
                deviceModelInput.focus();
                return false;
            }
        }
        else if (step === 2) {
            if(!totalRamInput.value || !freeStorageInput.value) {
                alert("Please select your RAM and Storage status to continue.");
                return false;
            }
        }
        return true;
    }

    // --- 3. START DEEP SCAN ANIMATION ---
    analyzeBtn.addEventListener('click', () => {
        if(!gameSelect.value || !playstyleSelect.value) {
            alert("Please select Game and Playstyle.");
            return;
        }

        wizardContainer.classList.add('hidden');
        scanSection.classList.remove('hidden');
        
        runGodzillaScanner();
    });

    function runGodzillaScanner() {
        let progress = 0;
        const modelName = deviceModelInput.value.toUpperCase();
        
        const scanStages = [
            { main: "Booting AI Godzilla Engine...", sub: `Targeting GPU for: ${modelName}` },
            { main: "Reading Physical Screen...", sub: isScreenDetected ? `Base width locked at ${detectedScreenWidth}dp` : "Estimating Default DPI..." },
            { main: "Calibrating Safe DPI...", sub: "Bypassing thermal throttling limits..." },
            { main: "Injecting 2026 Playstyle Alg...", sub: "Adjusting Crosshair Recoil Matrix..." },
            { main: "Generating HD Dashboard...", sub: "Applying pro eSports settings..." }
        ];

        let stageIndex = 0;
        scanText.innerText = scanStages[0].main;
        scanSubtext.innerText = scanStages[0].sub;

        const scanInterval = setInterval(() => {
            progress += Math.floor(Math.random() * 5) + 3; 
            
            if(progress >= 100) {
                progress = 100;
                scanProgress.style.width = '100%';
                scanText.innerText = "Optimization 100% Complete!";
                scanSubtext.innerText = "Results ready for download.";
                clearInterval(scanInterval);
                
                setTimeout(() => showResults(), 800);
            } else {
                scanProgress.style.width = progress + '%';
                let newStage = Math.floor((progress / 100) * scanStages.length);
                if(newStage !== stageIndex && newStage < scanStages.length) {
                    stageIndex = newStage;
                    scanText.innerText = scanStages[stageIndex].main;
                    scanSubtext.innerText = scanStages[stageIndex].sub;
                }
            }
        }, 120);
    }

    // --- 4. THE GODZILLA CALCULATION ENGINE ---
    function showResults() {
        const deviceStr = deviceModelInput.value.trim();
        const ram = parseInt(totalRamInput.value);
        const storage = freeStorageInput.value;
        const game = gameSelect.value;
        const style = playstyleSelect.value;

        // Smart Device Detection
        const lowerDevice = deviceStr.toLowerCase();
        let deviceTier = 'standard';
        let badgeText = 'Standard Device';
        let badgeClass = '';

        if(lowerDevice.match(/(rog|poco|black shark|iqoo|redmagic|legion|nubia|gt neo|x100)/)) {
            deviceTier = 'gaming';
            badgeText = '🔥 Gaming Beast Detected';
            badgeClass = 'gaming';
        } else if (lowerDevice.match(/(samsung s|iphone|pixel|oneplus|pro max|ultra)/) || ram >= 8) {
            deviceTier = 'flagship';
            badgeText = '⚡ High-End / Flagship';
            badgeClass = 'flagship';
        }

        resDevice.innerText = deviceStr;
        resGame.innerText = gameNames[game];
        deviceBadge.innerText = badgeText;
        deviceBadge.className = `badge-tag ${badgeClass}`;

        const config = calculateOptimization(deviceTier, ram, storage, game, style, detectedScreenWidth);

        renderSettingsList(deviceSettings, config.device);
        renderSettingsList(inGameSettings, config.inGame);

        scanSection.classList.add('hidden');
        resultWrapper.classList.remove('hidden');
    }

    function calculateOptimization(tier, ram, storage, game, style, baseWidth) {
        let config = { inGame: [], device: [] };
        const isRusher = (style === 'rusher');

        // --- DEVICE & DPI LOGIC (Tied to Physical Screen) ---
        let finalDpi = '';
        if (ram <= 3) {
            finalDpi = `${baseWidth} (Default - DO NOT CHANGE)`;
            config.device.push({ label: 'Safe Custom DPI', value: finalDpi, type: 'danger' });
            config.device.push({ label: 'Window Animation', value: 'Turn OFF (0x)', type: 'highlight' });
            config.device.push({ label: 'Background Limit', value: 'Max 1 Process', type: 'danger' });
        } else if (ram === 4 || ram === 6) {
            let maxBoost = (tier === 'gaming') ? 120 : 70;
            finalDpi = `${baseWidth + 20} to ${baseWidth + maxBoost} (Safe Range)`;
            config.device.push({ label: 'Safe Custom DPI', value: finalDpi, type: 'highlight' });
            config.device.push({ label: 'Window Animation', value: '0.5x', type: '' });
            config.device.push({ label: 'Force 4x MSAA', value: (ram === 6 && storage !== 'critical') ? 'ON' : 'OFF', type: '' });
        } else {
            // 8GB+ RAM
            let extremeDpi = (tier === 'gaming' || tier === 'flagship') ? baseWidth + 220 : baseWidth + 150;
            if(extremeDpi > 650) extremeDpi = 620; // Hard cap to prevent UI bricking
            finalDpi = `${baseWidth + 80} to ${extremeDpi} (eSports Level)`;
            config.device.push({ label: 'Safe Custom DPI', value: finalDpi, type: 'highlight' });
            config.device.push({ label: 'Hardware Overlays', value: 'Disable (Force GPU)', type: 'highlight' });
            config.device.push({ label: 'Game Booster', value: 'Enable Pro/Fnatic Mode', type: '' });
        }

        // --- IN-GAME SENSITIVITY (THE 200 SENS UPDATE) ---
        if (game === 'freefire') {
            config.inGame.push({ label: 'Graphics / FPS', value: ram <= 3 ? 'Smooth + High FPS' : (ram >= 8 ? 'Max/Ultra + High FPS' : 'Standard + High FPS'), type: (ram <= 3) ? 'danger' : 'highlight' });
            // New 200 Sens Logic
            let generalSens = isRusher ? (ram <= 4 ? '190 - 200' : '175 - 190') : (ram <= 4 ? '180 - 195' : '160 - 180');
            let redDotSens = isRusher ? '170 - 185' : '150 - 170';
            config.inGame.push({ label: 'General (New Update)', value: generalSens, type: 'highlight' });
            config.inGame.push({ label: 'Red Dot', value: redDotSens, type: '' });
            config.inGame.push({ label: 'Fire Button Size', value: isRusher ? '42% - 48%' : '50% - 55%', type: 'highlight' });
        } 
        else if (game === 'bgmi') {
            let fpsSetting = (ram >= 8 && tier !== 'standard') ? '90 FPS / 120 FPS' : (ram <= 4 ? 'Extreme (60 FPS)' : 'Extreme / 90 FPS');
            config.inGame.push({ label: 'Graphics / Frame Rate', value: `Smooth + ${fpsSetting}`, type: 'highlight' });
            config.inGame.push({ label: 'Camera (No Scope)', value: isRusher ? '130% - 150%' : '110% - 120%', type: '' });
            config.inGame.push({ label: 'ADS (No Scope)', value: isRusher ? '125% - 145%' : '105% - 115%', type: 'highlight' });
            config.inGame.push({ label: 'Gyroscope', value: isRusher ? 'Always ON (350-400%)' : 'Scope ON (250-300%)', type: '' });
        }
        else if (game === 'scarfall') {
            config.inGame.push({ label: 'Graphics', value: ram <= 4 ? 'Medium' : 'Ultra High', type: '' });
            config.inGame.push({ label: 'Look Sensitivity', value: isRusher ? '88% - 95%' : '75% - 85%', type: 'highlight' });
            config.inGame.push({ label: 'Aim Sens', value: isRusher ? '80%' : '65%', type: '' });
        }
        else if (game === 'codm') {
            config.inGame.push({ label: 'Graphic / FPS', value: ram <= 4 ? 'Low + Max FPS' : 'Medium + Ultra FPS', type: 'highlight' });
            config.inGame.push({ label: 'Standard Sens', value: isRusher ? '95 - 110' : '80 - 90', type: '' });
            config.inGame.push({ label: 'Sniper Sens', value: isRusher ? '65 - 75' : '45 - 55', type: 'highlight' });
        }

        return config;
    }

    // --- DOM INJECTION HELPERS ---
    function renderSettingsList(container, settingsArray) {
        container.innerHTML = '';
        settingsArray.forEach(item => {
            const div = document.createElement('div');
            div.className = 'setting-item';
            div.innerHTML = `<span class="setting-label">${item.label}</span><span class="setting-value ${item.type}">${item.value}</span>`;
            container.appendChild(div);
        });
    }

    // --- 5. IMAGE DOWNLOAD FEATURE (html2canvas) ---
    downloadBtn.addEventListener('click', () => {
        // Change button state
        const originalText = downloadBtn.innerHTML;
        downloadBtn.innerHTML = '<i class="ph-bold ph-spinner ph-spin"></i> Generating HD Image...';
        downloadBtn.style.opacity = '0.8';
        downloadBtn.disabled = true;

        // Show Watermark for the screenshot
        wmWatermark.classList.remove('hidden');

        // Check if dark mode is active to give the correct background color
        const isDark = document.body.classList.contains('dark-mode');
        const bgColor = isDark ? '#0f172a' : '#ffffff';

        // Capture Area
        html2canvas(captureArea, {
            scale: 2, // High-Resolution
            backgroundColor: bgColor,
            useCORS: true,
            logging: false,
            borderRadius: 24
        }).then(canvas => {
            // Hide watermark again
            wmWatermark.classList.add('hidden');
            
            // Create Download Link
            const link = document.createElement('a');
            link.download = `WebKaar_Optimizer_${deviceModelInput.value.replace(/\s+/g, '_')}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();

            // Restore Button
            downloadBtn.innerHTML = '<i class="ph-bold ph-check"></i> Image Saved!';
            downloadBtn.style.background = '#10b981'; // Turn green
            
            setTimeout(() => {
                downloadBtn.innerHTML = originalText;
                downloadBtn.style.background = '';
                downloadBtn.style.opacity = '1';
                downloadBtn.disabled = false;
            }, 3000);
        }).catch(err => {
            console.error("Screenshot error:", err);
            alert("Oops! Could not save image. Try taking a normal screenshot.");
            wmWatermark.classList.add('hidden');
            downloadBtn.innerHTML = originalText;
            downloadBtn.disabled = false;
        });
    });

    // --- RESET WIZARD ---
    resetBtn.addEventListener('click', () => {
        resultWrapper.classList.add('hidden');
        
        document.getElementById('step-3').classList.add('hidden');
        document.getElementById('dot-3').classList.remove('active');
        document.getElementById('dot-3').style.background = 'var(--border-color)';
        
        document.getElementById('step-1').classList.remove('hidden');
        document.getElementById('dot-1').classList.add('active');
        document.getElementById('dot-1').style.background = 'var(--border-color)';
        document.getElementById('dot-2').style.background = 'var(--border-color)';
        
        document.querySelectorAll('.step-line').forEach(l => l.classList.remove('active'));

        // Reset inputs
        deviceModelInput.value = '';
        totalRamInput.selectedIndex = 0;
        freeStorageInput.selectedIndex = 0;
        gameSelect.selectedIndex = 0;
        playstyleSelect.selectedIndex = 0;

        // Reset Auto-detect UI
        detectScreenBtn.style.display = 'flex';
        detectScreenBtn.innerHTML = '<i class="ph-bold ph-corners-out" style="font-size: 20px;"></i> Auto-Detect My Display';
        screenResultText.classList.add('hidden');
        isScreenDetected = false;

        wizardContainer.classList.remove('hidden');
        wizardContainer.classList.add('slide-down');
    });

    // --- INFO MODAL ---
    infoBtn.addEventListener('click', () => infoModal.classList.remove('hidden'));
    closeModal.addEventListener('click', () => infoModal.classList.add('hidden'));
    infoModal.addEventListener('click', (e) => {
        if(e.target === infoModal) infoModal.classList.add('hidden');
    });

});