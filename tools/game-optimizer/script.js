/**
 * =========================================================
 * ULTIMATE GAME OPTIMIZER — script.js
 * GODZILLA ENGINE v4.0
 * WebKaar | Ayush Tiwari | 2026
 * Features: 4-Step Wizard, Gaming Score, FPS Meter,
 *           DPI Calc, 6 Games, Network Optimizer,
 *           Thermal Guide, Pro Tips, Recoil Guide,
 *           Image Download, Share Card
 * =========================================================
 */

document.addEventListener('DOMContentLoaded', () => {

    // ── DOM References ──────────────────────────────────────
    const wizardContainer   = document.getElementById('wizard-container');
    const scanSection       = document.getElementById('scan-section');
    const resultWrapper     = document.getElementById('result-wrapper');
    const captureArea       = document.getElementById('capture-area');

    const deviceModelInput  = document.getElementById('device-model');
    const totalRamInput     = document.getElementById('total-ram');
    const freeStorageInput  = document.getElementById('free-storage');
    const processorInput    = document.getElementById('processor');
    const batteryLevelInput = document.getElementById('battery-level');
    const connectionInput   = document.getElementById('connection-type');
    const networkQualInput  = document.getElementById('network-quality');
    const regionInput       = document.getElementById('region');
    const gameSelect        = document.getElementById('game-select');
    const playstyleSelect   = document.getElementById('playstyle');
    const sessionInput      = document.getElementById('session-duration');
    const layoutInput       = document.getElementById('layout-pref');

    const detectScreenBtn   = document.getElementById('detect-screen-btn');
    const screenResultText  = document.getElementById('screen-result');
    const analyzeBtn        = document.getElementById('analyze-btn');
    const resetBtn          = document.getElementById('reset-btn');
    const downloadBtn       = document.getElementById('download-result-btn');
    const shareBtn          = document.getElementById('share-btn');

    const scanText          = document.getElementById('scan-text');
    const scanSubtext       = document.getElementById('scan-subtext');
    const scanProgress      = document.getElementById('scan-progress');
    const scanPercent       = document.getElementById('scan-percent');

    const resDevice         = document.getElementById('res-device');
    const resGame           = document.getElementById('res-game');
    const deviceBadge       = document.getElementById('device-badge');
    const thermalBadge      = document.getElementById('thermal-badge');
    const networkBadge      = document.getElementById('network-badge');

    const gamingScoreEl     = document.getElementById('gaming-score');
    const scoreGradeEl      = document.getElementById('score-grade');
    const scoreRingEl       = document.getElementById('score-ring-fill');
    const scoreBreakdownEl  = document.getElementById('score-breakdown');
    const fpsBarsEl         = document.getElementById('fps-bars');

    const deviceSettingsEl  = document.getElementById('device-settings');
    const inGameSettingsEl  = document.getElementById('in-game-settings');
    const networkSettingsEl = document.getElementById('network-settings');
    const thermalSettingsEl = document.getElementById('thermal-settings');
    const proTipsListEl     = document.getElementById('pro-tips-list');
    const tipsGameNameEl    = document.getElementById('tips-game-name');
    const recoilSettingsEl  = document.getElementById('recoil-settings');
    const wmWatermark       = document.getElementById('wm-watermark');

    const infoBtn           = document.getElementById('info-btn');
    const infoModal         = document.getElementById('info-modal');
    const closeModal        = document.getElementById('close-modal');
    const toast             = document.getElementById('toast');

    const stepTitleEl       = document.getElementById('step-title');
    const stepSubtitleEl    = document.getElementById('step-subtitle');

    // ── State ───────────────────────────────────────────────
    let detectedScreenWidth = 360;
    let isScreenDetected    = false;
    let currentStep         = 1;
    const TOTAL_STEPS       = 4;

    const stepTitles = [
        'Hardware Detection',
        'Device Specs',
        'Network Setup',
        'Game & Playstyle'
    ];

    const gameNames = {
        freefire:    '🔥 Free Fire (200 Sens)',
        freefiremax: '🔥 Free Fire MAX',
        bgmi:        '🎯 BGMI / PUBG Mobile',
        codm:        '💥 Call of Duty Mobile',
        valorant:    '⚡ Valorant Mobile',
        scarfall:    '🎮 Scarfall 2.0'
    };

    // ── Screen Auto-Detect ──────────────────────────────────
    detectScreenBtn.addEventListener('click', () => {
        detectScreenBtn.innerHTML = '<i class="ph-bold ph-spinner ph-spin" style="font-size:18px;"></i> Detecting...';
        detectScreenBtn.disabled = true;

        setTimeout(() => {
            detectedScreenWidth = window.screen.width || 360;
            isScreenDetected    = true;

            detectScreenBtn.style.display = 'none';
            screenResultText.classList.remove('hidden');
            screenResultText.innerHTML =
                '<i class="ph-fill ph-check-circle"></i> Display Detected: Base Width ' +
                detectedScreenWidth + 'dp' +
                '<br><span style="color:var(--text-muted);font-size:0.78rem;">Safe DPI limits unlocked.</span>';
        }, 900);
    });

    // ── Wizard Navigation ───────────────────────────────────
    window.nextStep = function (step) {
        if (!validateStep(step)) return;

        // Mark current dot as done
        const curDot = document.getElementById('dot-' + step);
        if (curDot) { curDot.classList.remove('active'); curDot.classList.add('done'); }

        // Activate line
        const line = document.getElementById('line-' + step);
        if (line) line.classList.add('active');

        // Hide current step panel
        const curPanel = document.getElementById('step-' + step);
        if (curPanel) curPanel.classList.add('hidden');

        const next = step + 1;
        currentStep = next;

        // Show next step panel
        const nextPanel = document.getElementById('step-' + next);
        if (nextPanel) nextPanel.classList.remove('hidden');

        // Activate next dot
        const nextDot = document.getElementById('dot-' + next);
        if (nextDot) nextDot.classList.add('active');

        // Update header text
        updateWizardHeader(next);
    };

    window.prevStep = function (step) {
        const curPanel = document.getElementById('step-' + step);
        if (curPanel) curPanel.classList.add('hidden');

        const curDot = document.getElementById('dot-' + step);
        if (curDot) { curDot.classList.remove('active'); curDot.classList.remove('done'); }

        const prev = step - 1;
        currentStep = prev;

        const prevPanel = document.getElementById('step-' + prev);
        if (prevPanel) prevPanel.classList.remove('hidden');

        const prevDot = document.getElementById('dot-' + prev);
        if (prevDot) { prevDot.classList.remove('done'); prevDot.classList.add('active'); }

        const line = document.getElementById('line-' + prev);
        if (line) line.classList.remove('active');

        updateWizardHeader(prev);
    };

    function updateWizardHeader(step) {
        if (stepTitleEl)    stepTitleEl.textContent    = stepTitles[step - 1] || '';
        if (stepSubtitleEl) stepSubtitleEl.textContent = 'Step ' + step + ' of ' + TOTAL_STEPS + ' — ' + getStepDesc(step);
    }

    function getStepDesc(step) {
        const desc = ['Device Info', 'Hardware Specs', 'Network Info', 'Game & Style'];
        return desc[step - 1] || '';
    }

    // ── Validation ──────────────────────────────────────────
    function validateStep(step) {
        if (step === 1) {
            if (!deviceModelInput.value.trim() || deviceModelInput.value.trim().length < 2) {
                showToast('Please enter your device model!', true);
                deviceModelInput.focus();
                return false;
            }
        }
        if (step === 2) {
            if (!totalRamInput.value || !freeStorageInput.value) {
                showToast('Please select RAM and Storage!', true);
                return false;
            }
        }
        if (step === 4) {
            // This is handled by analyzeBtn click
        }
        return true;
    }

    // ── Analyze Button ──────────────────────────────────────
    analyzeBtn.addEventListener('click', () => {
        if (!gameSelect.value || !playstyleSelect.value) {
            showToast('Please select Game and Playstyle!', true);
            return;
        }

        wizardContainer.classList.add('hidden');
        scanSection.classList.remove('hidden');
        scanSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

        runScanner();
    });

    // ── Scanner Animation ───────────────────────────────────
    function runScanner() {
        let progress = 0;
        const model  = deviceModelInput.value.toUpperCase();

        const stages = [
            { main: 'Booting Godzilla Engine v4.0...', sub: 'Loading AI optimization modules...' },
            { main: 'Reading Physical Display...', sub: isScreenDetected ? ('Base width locked: ' + detectedScreenWidth + 'dp') : 'Using default display estimate...' },
            { main: 'Calculating Safe DPI Range...', sub: 'Anti-brick protection active...' },
            { main: 'Analyzing: ' + model, sub: 'Detecting device tier & GPU profile...' },
            { main: 'Generating Sensitivity Matrix...', sub: 'Applying playstyle algorithm...' },
            { main: 'Optimizing Network Profile...', sub: 'Calculating best server & DNS...' },
            { main: 'Running Thermal Check...', sub: 'Battery & session analysis...' },
            { main: 'Compiling Pro Dashboard...', sub: 'Almost done...' }
        ];

        let stageIdx = 0;
        scanText.textContent    = stages[0].main;
        scanSubtext.textContent = stages[0].sub;

        const interval = setInterval(() => {
            progress += Math.floor(Math.random() * 4) + 2;

            if (progress >= 100) {
                progress = 100;
                scanProgress.style.width  = '100%';
                if (scanPercent) scanPercent.textContent = '100%';
                scanText.textContent    = 'Optimization Complete! ✅';
                scanSubtext.textContent = 'Building your dashboard...';
                clearInterval(interval);
                setTimeout(showResults, 700);
                return;
            }

            scanProgress.style.width = progress + '%';
            if (scanPercent) scanPercent.textContent = progress + '%';

            const newStage = Math.min(
                Math.floor((progress / 100) * stages.length),
                stages.length - 1
            );
            if (newStage !== stageIdx) {
                stageIdx = newStage;
                scanText.textContent    = stages[stageIdx].main;
                scanSubtext.textContent = stages[stageIdx].sub;
            }
        }, 110);
    }

    // ── Show Results ────────────────────────────────────────
    function showResults() {
        const deviceStr  = deviceModelInput.value.trim();
        const ram        = parseInt(totalRamInput.value) || 4;
        const storage    = freeStorageInput.value || 'ok';
        const processor  = processorInput ? processorInput.value : 'unknown';
        const battery    = batteryLevelInput ? batteryLevelInput.value : 'full';
        const connection = connectionInput ? connectionInput.value : 'wifi';
        const netQual    = networkQualInput ? networkQualInput.value : 'good';
        const region     = regionInput ? regionInput.value : 'india';
        const game       = gameSelect.value;
        const style      = playstyleSelect.value;
        const session    = sessionInput ? sessionInput.value : 'medium';
        const layout     = layoutInput ? layoutInput.value : '3finger';

        // Device Tier
        const lower      = deviceStr.toLowerCase();
        let deviceTier   = 'standard';
        let badgeText    = '📱 Standard Device';
        let badgeClass   = '';

        if (lower.match(/(rog|poco f|black shark|iqoo|redmagic|legion|nubia|gt neo|gt 6|x100|k70 pro|k60 pro)/)) {
            deviceTier = 'gaming';
            badgeText  = '🔥 Gaming Beast';
            badgeClass = 'gaming';
        } else if (lower.match(/(samsung s2[0-9]|samsung s[0-9] ultra|iphone 1[2-9]|pixel [6-9]|oneplus 1[0-9]|pro max|ultra)/) || ram >= 12) {
            deviceTier = 'flagship';
            badgeText  = '⚡ Flagship';
            badgeClass = 'flagship';
        } else if (ram >= 8) {
            deviceTier = 'highend';
            badgeText  = '💪 High-End';
            badgeClass = 'flagship';
        }

        // Fill header
        resDevice.textContent = deviceStr;
        resGame.textContent   = gameNames[game] || game;
        deviceBadge.textContent  = badgeText;
        deviceBadge.className    = 'badge-tag ' + badgeClass;

        // Thermal Badge
        const thermalRisk = getThermalRisk(ram, battery, session, deviceTier);
        thermalBadge.textContent = thermalRisk.label;
        thermalBadge.className   = 'badge-tag ' + thermalRisk.cls;

        // Network Badge
        const netLabel = getNetworkLabel(connection, netQual);
        networkBadge.textContent = netLabel.label;
        networkBadge.className   = 'badge-tag ' + netLabel.cls;

        // Gaming Score
        const score = calcGamingScore(ram, storage, processor, deviceTier);
        renderGamingScore(score, ram, storage, processor);

        // FPS Meter
        renderFpsBars(ram, deviceTier, processor, game);

        // All Setting Cards
        const cfg = buildConfig(deviceTier, ram, storage, processor, game, style, layout, detectedScreenWidth);
        renderSettingList(deviceSettingsEl,  cfg.device);
        renderSettingList(inGameSettingsEl,  cfg.inGame);

        // Network
        renderSettingList(networkSettingsEl, buildNetworkConfig(connection, netQual, region, game));

        // Thermal
        renderSettingList(thermalSettingsEl, buildThermalConfig(ram, battery, session, deviceTier));

        // Pro Tips
        tipsGameNameEl.textContent = gameNames[game] || game;
        renderProTips(proTipsListEl, game, style, deviceTier);

        // Recoil
        renderSettingList(recoilSettingsEl, buildRecoilConfig(game, style, ram));

        // Show
        scanSection.classList.add('hidden');
        resultWrapper.classList.remove('hidden');
        resultWrapper.scrollIntoView({ behavior: 'smooth', block: 'start' });

        // Animate bars after render
        setTimeout(animateBars, 150);
    }

    // ── Gaming Score Calculation ─────────────────────────────
    function calcGamingScore(ram, storage, processor, tier) {
        let score = 0;

        // RAM (40 pts)
        const ramScore = ram >= 16 ? 40 : ram >= 12 ? 37 : ram >= 8 ? 33 :
                         ram >= 6  ? 27 : ram >= 4  ? 20 : ram >= 3 ? 13 : 8;
        score += ramScore;

        // Storage (20 pts)
        const storScore = storage === 'good' ? 20 : storage === 'ok' ? 15 :
                          storage === 'low'  ? 8  : 3;
        score += storScore;

        // Processor (25 pts)
        const cpuScore = processor === 'apple'      ? 25 :
                         processor === 'snapdragon' ? 22 :
                         processor === 'mediatek'   ? 18 :
                         processor === 'exynos'     ? 16 :
                         processor === 'kirin'      ? 14 : 12;
        score += cpuScore;

        // Tier bonus (15 pts)
        const tierScore = tier === 'gaming' ? 15 : tier === 'flagship' ? 13 :
                          tier === 'highend' ? 10 : 6;
        score += tierScore;

        return Math.min(score, 100);
    }

    function renderGamingScore(score, ram, storage, processor) {
        gamingScoreEl.textContent = score;

        // Grade
        const grade = score >= 90 ? 'S' : score >= 75 ? 'A' :
                      score >= 55 ? 'B' : score >= 35 ? 'C' : 'D';
        scoreGradeEl.textContent = grade;

        const gradeColors = { S: '#10b981', A: '#3b82f6', B: '#f59e0b', C: '#f97316', D: '#ef4444' };
        scoreGradeEl.style.color  = gradeColors[grade] || '#10b981';
        scoreRingEl.style.stroke  = gradeColors[grade] || '#10b981';

        // SVG ring — circumference = 2 * PI * 50 ≈ 314
        const circumference = 314;
        const offset = circumference - (score / 100) * circumference;
        scoreRingEl.style.strokeDashoffset = offset;

        // Breakdown bars
        const ramPct  = Math.round((ram >= 16 ? 100 : ram >= 12 ? 92 : ram >= 8 ? 82 : ram >= 6 ? 67 : ram >= 4 ? 50 : 30));
        const storPct = storage === 'good' ? 100 : storage === 'ok' ? 75 : storage === 'low' ? 40 : 15;
        const cpuPct  = processor === 'apple' ? 100 : processor === 'snapdragon' ? 88 :
                        processor === 'mediatek' ? 72 : processor === 'exynos' ? 64 :
                        processor === 'kirin' ? 56 : 48;

        scoreBreakdownEl.innerHTML = [
            { label: 'RAM',       pct: ramPct  },
            { label: 'Storage',   pct: storPct },
            { label: 'Processor', pct: cpuPct  },
            { label: 'Overall',   pct: score   }
        ].map(b => `
            <div class="score-bar-item">
                <div class="score-bar-label">
                    <span>${b.label}</span><span>${b.pct}%</span>
                </div>
                <div class="score-bar-track">
                    <div class="score-bar-fill" style="width:0%" data-target="${b.pct}%"></div>
                </div>
            </div>
        `).join('');
    }

    // ── FPS Bars ────────────────────────────────────────────
    function renderFpsBars(ram, tier, processor, game) {
        const maxFps = ram >= 12 || tier === 'gaming' ? 120 :
                       ram >= 8  || tier === 'flagship' ? 90 :
                       ram >= 6  ? 60 : ram >= 4 ? 60 : 30;

        const fpsLevels = [
            { label: '30 FPS',  cap: 30,  color: 'green'  },
            { label: '60 FPS',  cap: 60,  color: 'blue'   },
            { label: '90 FPS',  cap: 90,  color: 'yellow' },
            { label: '120 FPS', cap: 120, color: 'red'    }
        ];

        fpsBarsEl.innerHTML = fpsLevels.map(f => {
            const achievable = maxFps >= f.cap;
            const pct        = achievable ? 100 : Math.round((maxFps / f.cap) * 100);
            const colorClass = achievable ? f.color : 'red';
            const label      = achievable ? '✅ Capable' : '❌ Not Capable';
            return `
                <div class="fps-item">
                    <span class="fps-label">${f.label}</span>
                    <div class="fps-track">
                        <div class="fps-fill ${colorClass}" data-target="${pct}%" style="width:0%"></div>
                    </div>
                    <span class="fps-value">${label}</span>
                </div>
            `;
        }).join('');
    }

    // ── Animate All Bars ────────────────────────────────────
    function animateBars() {
        document.querySelectorAll('[data-target]').forEach(el => {
            const target = el.getAttribute('data-target');
            requestAnimationFrame(() => { el.style.width = target; });
        });
    }

    // ── Main Config Builder ─────────────────────────────────
    function buildConfig(tier, ram, storage, processor, game, style, layout, baseWidth) {
        const cfg      = { device: [], inGame: [] };
        const isRusher = style === 'rusher';
        const isSniper = style === 'sniper';

        // ── DEVICE / DPI SETTINGS ──
        let dpiRange = '';
        if (ram <= 3) {
            dpiRange = baseWidth + ' (Default — DO NOT CHANGE)';
            cfg.device.push({ label: 'Safe Custom DPI',    value: dpiRange,              type: 'danger'    });
            cfg.device.push({ label: 'Window Animations',  value: 'OFF (0x)',            type: 'highlight' });
            cfg.device.push({ label: 'Background Limit',   value: 'Max 1 Process',       type: 'danger'    });
            cfg.device.push({ label: 'Game Mode',          value: 'Enable if Available', type: ''          });
        } else if (ram <= 6) {
            const boost  = tier === 'gaming' ? 120 : 70;
            dpiRange     = (baseWidth + 20) + ' – ' + (baseWidth + boost) + ' (Safe Range)';
            cfg.device.push({ label: 'Safe Custom DPI',    value: dpiRange,              type: 'highlight' });
            cfg.device.push({ label: 'Window Animations',  value: '0.5x Scale',          type: ''          });
            cfg.device.push({ label: 'Force 4x MSAA',      value: ram === 6 ? 'ON' : 'OFF', type: ''       });
            cfg.device.push({ label: 'Background Limit',   value: 'Max 2 Processes',     type: ''          });
        } else {
            const extreme = Math.min((tier === 'gaming' || tier === 'flagship') ? baseWidth + 220 : baseWidth + 150, 620);
            dpiRange      = (baseWidth + 80) + ' – ' + extreme + ' (eSports Level)';
            cfg.device.push({ label: 'Safe Custom DPI',    value: dpiRange,              type: 'highlight' });
            cfg.device.push({ label: 'Hardware Overlays',  value: 'Disable (Force GPU)', type: 'highlight' });
            cfg.device.push({ label: 'Window Animations',  value: '0.5x or OFF',         type: ''          });
            cfg.device.push({ label: 'Game Booster',       value: 'Enable Pro Mode',     type: 'highlight' });
        }

        // Processor specific
        if (processor === 'snapdragon') {
            cfg.device.push({ label: 'Adreno GPU Governor', value: 'Performance Mode', type: 'blue' });
        } else if (processor === 'mediatek') {
            cfg.device.push({ label: 'MT GPU Tuner',        value: 'Game Mode ON',     type: 'blue' });
        } else if (processor === 'apple') {
            cfg.device.push({ label: 'ProMotion (120Hz)',   value: 'Enable Always On', type: 'blue' });
        }

        // Layout tip
        const layoutTips = {
            '2finger': '2-Finger: Use larger fire buttons.',
            '3finger': '3-Finger: Balance speed & accuracy.',
            '4finger': '4-Finger Claw: Enable Peek & Fire.',
            '6finger': '6-Finger: Turn on all corner slots.'
        };
        cfg.device.push({ label: 'Layout Tip', value: layoutTips[layout] || '3-Finger recommended.', type: '' });

        // ── IN-GAME SENSITIVITY ──
        if (game === 'freefire' || game === 'freefiremax') {
            const graphicsVal = ram <= 3 ? 'Smooth + High FPS' : ram >= 8 ? 'Max / Ultra + High FPS' : 'Standard + High FPS';
            const generalSens = isRusher ? (ram <= 4 ? '190 – 200' : '175 – 190') : isSniper ? (ram <= 4 ? '160 – 175' : '150 – 165') : '170 – 185';
            const redDotSens  = isRusher ? '170 – 185' : isSniper ? '140 – 155' : '155 – 170';
            const scopeSens   = isRusher ? '155 – 170' : isSniper ? '120 – 140' : '140 – 155';
            const fireSize    = isRusher ? '42% – 48%' : isSniper ? '50% – 56%' : '46% – 52%';
            cfg.inGame.push({ label: 'Graphics',           value: graphicsVal,  type: ram <= 3 ? 'danger' : 'highlight' });
            cfg.inGame.push({ label: 'General Sens (200)', value: generalSens,  type: 'highlight' });
            cfg.inGame.push({ label: 'Red Dot Sens',       value: redDotSens,   type: '' });
            cfg.inGame.push({ label: '2x Scope Sens',      value: scopeSens,    type: '' });
            cfg.inGame.push({ label: 'Fire Button Size',   value: fireSize,     type: 'highlight' });
            cfg.inGame.push({ label: 'Auto Headshot Sens', value: isRusher ? '185 – 195' : '170 – 182', type: 'blue' });
        }
        else if (game === 'bgmi') {
            const fpsMode  = ram >= 8 && tier !== 'standard' ? '90 / 120 FPS' : ram <= 4 ? '60 FPS Extreme' : '90 FPS';
            const camSens  = isRusher ? '130% – 150%' : isSniper ? '100% – 115%' : '115% – 130%';
            const adsSens  = isRusher ? '125% – 145%' : isSniper ? '95% – 110%'  : '110% – 125%';
            const gyro     = isRusher ? 'Always ON (350–400%)' : isSniper ? 'Scope ON (200–250%)' : 'Scope ON (280–320%)';
            const peek     = isRusher ? '180% – 200%' : '155% – 175%';
            cfg.inGame.push({ label: 'Graphics + FPS',     value: 'Smooth + ' + fpsMode, type: 'highlight' });
            cfg.inGame.push({ label: 'Camera (No Scope)',  value: camSens,               type: '' });
            cfg.inGame.push({ label: 'ADS (No Scope)',     value: adsSens,               type: 'highlight' });
            cfg.inGame.push({ label: 'Gyroscope',          value: gyro,                  type: '' });
            cfg.inGame.push({ label: 'Peek & Fire',        value: peek,                  type: 'blue' });
            cfg.inGame.push({ label: '3x Scope',           value: isRusher ? '85%' : '70%', type: '' });
        }
        else if (game === 'codm') {
            const graphics = ram <= 4 ? 'Low + Max FPS' : ram >= 8 ? 'High + Max FPS' : 'Medium + High FPS';
            const std      = isRusher ? '95 – 110' : isSniper ? '70 – 82' : '82 – 95';
            const snp      = isRusher ? '68 – 78'  : isSniper ? '45 – 55' : '55 – 65';
            const ads      = isRusher ? '88 – 98'  : isSniper ? '62 – 72' : '74 – 85';
            cfg.inGame.push({ label: 'Graphics / FPS',   value: graphics,          type: 'highlight' });
            cfg.inGame.push({ label: 'Standard Sens',    value: std,               type: '' });
            cfg.inGame.push({ label: 'ADS Sens',         value: ads,               type: 'highlight' });
            cfg.inGame.push({ label: 'Sniper Sens',      value: snp,               type: '' });
            cfg.inGame.push({ label: 'Shooting Mode',    value: isRusher ? 'Simple Mode' : 'Advanced', type: 'blue' });
            cfg.inGame.push({ label: 'Graphic Quality',  value: ram >= 8 ? 'Very High' : 'Medium', type: '' });
        }
        else if (game === 'valorant') {
            const graphics = ram <= 4 ? 'Low + Balanced' : ram >= 8 ? 'High + Performance' : 'Medium + Performance';
            const aimSens  = isRusher ? '0.38 – 0.48' : isSniper ? '0.28 – 0.36' : '0.32 – 0.42';
            const adsSens  = isRusher ? '0.85 – 0.95' : isSniper ? '0.70 – 0.80' : '0.78 – 0.88';
            cfg.inGame.push({ label: 'Graphics Mode',    value: graphics,          type: 'highlight' });
            cfg.inGame.push({ label: 'Aim Sensitivity',  value: aimSens,           type: 'highlight' });
            cfg.inGame.push({ label: 'ADS Sensitivity',  value: adsSens,           type: '' });
            cfg.inGame.push({ label: 'Crosshair',        value: isRusher ? 'Dynamic (Small)' : 'Static (Dot)', type: 'blue' });
            cfg.inGame.push({ label: 'Agent Type',       value: isRusher ? 'Duelist' : isSniper ? 'Sentinel' : 'Initiator', type: '' });
        }
        else if (game === 'scarfall') {
            const graphics = ram <= 4 ? 'Medium' : 'Ultra High';
            const lookSens = isRusher ? '88% – 95%' : isSniper ? '68% – 78%' : '78% – 88%';
            const aimSens  = isRusher ? '80% – 88%' : isSniper ? '60% – 70%' : '70% – 80%';
            cfg.inGame.push({ label: 'Graphics',          value: graphics,  type: '' });
            cfg.inGame.push({ label: 'Look Sensitivity',  value: lookSens,  type: 'highlight' });
            cfg.inGame.push({ label: 'Aim Sensitivity',   value: aimSens,   type: '' });
            cfg.inGame.push({ label: 'Fire Mode',         value: isRusher ? 'Auto' : 'Tap', type: 'blue' });
        }

        return cfg;
    }

    // ── Network Config ──────────────────────────────────────
    function buildNetworkConfig(connection, quality, region, game) {
        const cfg = [];

        const pingMap = {
            india: { server: 'Mumbai / Chennai', dns: '8.8.8.8 + 8.8.4.4', ping: '18–45ms' },
            sg:    { server: 'Singapore',        dns: '1.1.1.1 + 1.0.0.1', ping: '30–70ms' },
            me:    { server: 'Dubai / Bahrain',  dns: '8.8.8.8 + 1.1.1.1', ping: '40–90ms' },
            us:    { server: 'US East / West',   dns: '1.1.1.1 + 8.8.4.4', ping: '80–140ms' },
            eu:    { server: 'Frankfurt / London', dns: '1.1.1.1 + 1.0.0.1', ping: '60–110ms' },
            br:    { server: 'São Paulo',        dns: '8.8.8.8 + 8.8.4.4', ping: '50–100ms' }
        };
        const info = pingMap[region] || pingMap['india'];

        cfg.push({ label: 'Best Game Server', value: info.server,     type: 'highlight' });
        cfg.push({ label: 'Recommended DNS',  value: info.dns,        type: 'blue'      });
        cfg.push({ label: 'Expected Ping',    value: info.ping,       type: quality === 'poor' ? 'danger' : 'highlight' });
        cfg.push({ label: 'Connection',       value: connection.toUpperCase(), type: connection === '5g' ? 'highlight' : '' });

        if (connection === 'wifi') {
            cfg.push({ label: 'WiFi Band',     value: '5GHz preferred over 2.4GHz', type: 'blue' });
        } else if (connection === '4g' || connection === '5g') {
            cfg.push({ label: 'Data Tip',      value: 'Disable VoLTE during gaming', type: 'warning' });
        } else {
            cfg.push({ label: 'Warning',       value: 'Slow connection — expect lag',  type: 'danger' });
        }

        if (quality === 'poor' || quality === 'average') {
            cfg.push({ label: 'Lag Fix',       value: 'Use GFX Tool + lower graphics', type: 'danger' });
        } else {
            cfg.push({ label: 'Status',        value: 'Network is stable ✅',          type: 'highlight' });
        }

        return cfg;
    }

    // ── Thermal Config ──────────────────────────────────────
    function getThermalRisk(ram, battery, session, tier) {
        const isLong = session === 'long';
        const isLow  = battery === 'low';
        if (isLong && isLow)  return { label: '🌡️ Thermal: High Risk',  cls: 'thermal-warn' };
        if (isLong || isLow)  return { label: '🌡️ Thermal: Medium Risk', cls: 'thermal-warn' };
        return                       { label: '🌡️ Thermal: Safe',        cls: 'thermal-safe' };
    }

    function buildThermalConfig(ram, battery, session, tier) {
        const cfg  = [];
        const long = session === 'long';
        const low  = battery === 'low';

        cfg.push({ label: 'Session Type',     value: session === 'short' ? 'Short (<1hr)' : session === 'medium' ? 'Medium (1–3hr)' : 'Long (3hr+)', type: long ? 'warning' : '' });
        cfg.push({ label: 'Battery Status',   value: battery === 'full' ? 'Full (80–100%) ✅' : battery === 'mid' ? 'Medium (40–79%)' : 'Low (<40%) ⚠️', type: low ? 'danger' : '' });

        if (low) {
            cfg.push({ label: 'Charging Tip', value: 'Charge to 60%+ before gaming', type: 'danger' });
        }
        if (long) {
            cfg.push({ label: 'Cool-down',    value: 'Take 10min break every hour',   type: 'warning' });
            cfg.push({ label: 'Back Cover',   value: 'Remove case to reduce heat',    type: 'warning' });
        }

        if (tier === 'gaming') {
            cfg.push({ label: 'Fan / Cooler', value: 'Enable Performance Fan Mode',   type: 'highlight' });
        } else {
            cfg.push({ label: 'Brightness',   value: 'Set to 40–60% while gaming',    type: '' });
        }

        cfg.push({ label: 'Battery Saver',    value: 'Keep OFF during gaming',         type: 'blue' });
        cfg.push({ label: 'Auto Brightness',  value: 'Disable — manual 50%',           type: '' });

        return cfg;
    }

    // ── Pro Tips ────────────────────────────────────────────
    function renderProTips(el, game, style, tier) {
        const tips = getProTips(game, style, tier);
        el.innerHTML = tips.map(t => '<li>' + t + '</li>').join('');
    }

    function getProTips(game, style, tier) {
        const isRusher  = style === 'rusher';
        const isSniper  = style === 'sniper';
        const isGaming  = tier === 'gaming' || tier === 'flagship';

        const commonTips = [
            'Clear RAM before every match — close all background apps.',
            'Enable Do Not Disturb mode to avoid notification interruptions.',
            'Keep screen brightness at 50% to reduce heat and save battery.',
            isGaming ? 'Enable Performance / Fnatic Mode in device settings.' : 'Disable unnecessary features like Bluetooth when gaming.'
        ];

        const gameTips = {
            freefire: [
                isRusher ? 'Use M1887 + MP40 combo for rushing — high DPS at close range.' : 'Use AWM + M14 for long-range — always pre-aim before scoping.',
                'Place fire button slightly above the joystick for faster reaction.',
                'Use Gyroscope with Red Dot — enable "Scope On" mode only.',
                isRusher ? 'Sprint + crouch while shooting to reduce recoil on movement.' : 'Always check the mini-map for zone & enemy positions.',
                'Headshot sensitivity 185–195 works best for auto weapons.'
            ],
            freefiremax: [
                'Enable MAX graphics only if RAM is 6GB+.',
                isRusher ? 'Use Hayato + Kelly combo for rushing.' : 'Use Alok + D-Bee for repositioning.',
                'MAX mode has better hit registration — use higher sensitivity.',
                'Disable ultra HD textures on low-end devices to avoid frame drops.'
            ],
            bgmi: [
                isRusher ? 'Use UMP45 + M416 for aggressive rushing — low recoil combo.' : 'Use M24 + DP-28 for sniping — always use a bipod.',
                'Gyroscope full ON at 300–350% reduces recoil dramatically.',
                'Peak + fire around corners — never expose more than your head.',
                isRusher ? 'Use 2x + 3x scope only — avoid 6x while rushing.' : 'Use 4x or 6x scope — always tap-fire for long range.',
                'Set graphics to Smooth + 90FPS for best performance.'
            ],
            codm: [
                isRusher ? 'Use Fennec + Man-O-War for aggressive close combat.' : 'Use DL Q33 + Kilo Bolt for sniper play.',
                'ADS sensitivity slightly higher than hipfire for smoother shots.',
                isRusher ? 'Use S36 operator skill for area denial when rushing.' : 'Trophy System + Operator Skill Gravity Spikes for camping.',
                'Enable Simple Mode for faster one-tap shooting.',
                'Ranked mode: always use Smoke + Frag grenade combo.'
            ],
            valorant: [
                isRusher ? 'Pick Jett or Raze — use dash/jump for movement advantage.' : 'Pick Sage or Chamber — hold angles with Sheriff/Op.',
                'Crosshair placement: always aim at head height while moving.',
                'Buy Vandal for long range, Phantom for close-mid range fights.',
                isRusher ? 'Entry frag: use flash + dash combo on every site push.' : 'Hold common spots with Op — reposition after every kill.',
                'Eco rounds: Go Ghost pistol — never waste credits.'
            ],
            scarfall: [
                isRusher ? 'Use SMG class weapons — high fire rate for close combat.' : 'Use Sniper class — always use elevated positions.',
                'Enable Auto-fire for faster reaction time.',
                'Loot quickly in hot zones — first 2 minutes are critical.',
                'Use grenades to flush enemies from cover before rushing.'
            ]
        };

        const selected = gameTips[game] || [];
        return [...commonTips.slice(0, 2), ...selected.slice(0, 4)];
    }

    // ── Recoil Guide ────────────────────────────────────────
    function buildRecoilConfig(game, style, ram) {
        const cfg      = [];
        const isRusher = style === 'rusher';

        const recoilData = {
            freefire:    [
                { label: 'MP40 Recoil',   value: isRusher ? 'Pull Down Slightly' : 'Tap Fire at Range',  type: '' },
                { label: 'M1887 Recoil',  value: 'No Recoil — Aim & Fire',                              type: 'highlight' },
                { label: 'AK Recoil',     value: 'Pull Down + Left',                                    type: 'warning' },
                { label: 'SCAR Recoil',   value: 'Minimal — Best Auto Weapon',                          type: 'highlight' }
            ],
            freefiremax: [
                { label: 'MP40 Recoil',   value: 'Pull Down Slightly',                                  type: '' },
                { label: 'XM8 Recoil',    value: 'Minimal — Beginner Friendly',                        type: 'highlight' },
                { label: 'Groza Recoil',  value: 'High — Pull Down Hard',                              type: 'danger' }
            ],
            bgmi: [
                { label: 'M416 Recoil',   value: 'Pull Down — Very Stable',                            type: 'highlight' },
                { label: 'AKM Recoil',    value: 'Pull Down + Right (Compensator)',                    type: 'warning' },
                { label: 'DP-28 Recoil',  value: 'Minimal — Best for Beginners',                      type: 'highlight' },
                { label: 'GROZA Recoil',  value: 'High — Use Thumb Rest Grip',                        type: 'danger' }
            ],
            codm: [
                { label: 'M4 Recoil',     value: 'Slight Down — Very Consistent',                     type: 'highlight' },
                { label: 'AK117 Recoil',  value: 'Down + Left — Use Stock',                           type: 'warning' },
                { label: 'Fennec Recoil', value: 'Almost Zero — Best SMG',                            type: 'highlight' },
                { label: 'DL Q33 Recoil', value: 'Hard — Hold Breath Before Shot',                   type: 'danger' }
            ],
            valorant: [
                { label: 'Vandal Recoil', value: 'Hard Pull Down — Burst at Range',                   type: 'warning' },
                { label: 'Phantom Recoil',value: 'Softer — Good for Spraying',                        type: 'highlight' },
                { label: 'Spectre Recoil',value: 'Minimal — Eco Round King',                          type: 'highlight' },
                { label: 'Operator',      value: 'No Spray — Tap Only',                               type: '' }
            ],
            scarfall: [
                { label: 'SMG Recoil',    value: 'Low — Spray Freely',                               type: 'highlight' },
                { label: 'AR Recoil',     value: 'Medium — Pull Down',                               type: '' },
                { label: 'Sniper',        value: 'Single Shot — Pre-aim',                            type: 'blue' }
            ]
        };

        return recoilData[game] || [{ label: 'Tip', value: 'Burst fire reduces recoil on all weapons.', type: '' }];
    }

    // ── Render Setting List ─────────────────────────────────
    function renderSettingList(container, arr) {
        if (!container || !arr) return;
        container.innerHTML = arr.map(item => `
            <div class="setting-item">
                <span class="setting-label">${item.label}</span>
                <span class="setting-value ${item.type || ''}">${item.value}</span>
            </div>
        `).join('');
    }

    // ── Get Network Label ───────────────────────────────────
    function getNetworkLabel(connection, quality) {
        if (quality === 'poor' || quality === 'average') {
            return { label: '📡 Network: Weak',  cls: 'network-poor' };
        }
        if (connection === '5g') {
            return { label: '📡 Network: 5G ⚡', cls: 'network-good' };
        }
        return { label: '📡 Network: Good', cls: 'network-good' };
    }

    // ── Image Download ──────────────────────────────────────
    downloadBtn.addEventListener('click', () => {
        const orig = downloadBtn.innerHTML;
        downloadBtn.innerHTML  = '<i class="ph-bold ph-spinner ph-spin"></i> Generating...';
        downloadBtn.disabled   = true;

        wmWatermark.classList.remove('hidden');

        const isDark  = document.body.classList.contains('dark-mode');
        const bgColor = isDark ? '#0f172a' : '#ffffff';

        html2canvas(captureArea, {
            scale: 2,
            backgroundColor: bgColor,
            useCORS: true,
            logging: false
        }).then(canvas => {
            wmWatermark.classList.add('hidden');

            const link      = document.createElement('a');
            const safeName  = (deviceModelInput.value || 'Device').replace(/\s+/g, '_');
            link.download   = 'WebKaar_GameOptimizer_' + safeName + '.png';
            link.href       = canvas.toDataURL('image/png');
            link.click();

            downloadBtn.innerHTML         = '<i class="ph-bold ph-check"></i> Saved!';
            downloadBtn.style.background  = '#10b981';

            setTimeout(() => {
                downloadBtn.innerHTML        = orig;
                downloadBtn.style.background = '';
                downloadBtn.disabled         = false;
            }, 3000);

            showToast('Image saved successfully!');
        }).catch(err => {
            console.error('Screenshot error:', err);
            wmWatermark.classList.add('hidden');
            downloadBtn.innerHTML = orig;
            downloadBtn.disabled  = false;
            showToast('Could not generate image. Try a screenshot!', true);
        });
    });

    // ── Share Card ──────────────────────────────────────────
    shareBtn.addEventListener('click', () => {
        if (navigator.share) {
            navigator.share({
                title: 'My Gaming Settings — WebKaar',
                text:  'Check out my optimized gaming settings for ' + (gameSelect.value ? gameNames[gameSelect.value] : 'mobile gaming') + '! Generated by WebKaar Tools.',
                url:   'https://webkaar.pages.dev/tools/game-optimizer/'
            }).catch(() => {});
        } else {
            // Fallback — copy link
            navigator.clipboard.writeText('https://webkaar.pages.dev/tools/game-optimizer/')
                .then(() => showToast('Link copied! Share it anywhere.'))
                .catch(()  => showToast('webkaar.pages.dev/tools/game-optimizer/'));
        }
    });

    // ── Reset ───────────────────────────────────────────────
    resetBtn.addEventListener('click', () => {
        // Reset all step dots & lines
        for (let i = 1; i <= TOTAL_STEPS; i++) {
            const dot  = document.getElementById('dot-' + i);
            const line = document.getElementById('line-' + i);
            if (dot) { dot.classList.remove('active', 'done'); }
            if (line) line.classList.remove('active');
        }
        document.getElementById('dot-1').classList.add('active');

        // Hide all step panels except step-1
        for (let i = 2; i <= TOTAL_STEPS; i++) {
            const panel = document.getElementById('step-' + i);
            if (panel) panel.classList.add('hidden');
        }
        document.getElementById('step-1').classList.remove('hidden');

        currentStep = 1;
        updateWizardHeader(1);

        // Reset inputs
        deviceModelInput.value = '';
        if (totalRamInput)     totalRamInput.selectedIndex     = 0;
        if (freeStorageInput)  freeStorageInput.selectedIndex  = 0;
        if (processorInput)    processorInput.selectedIndex    = 0;
        if (batteryLevelInput) batteryLevelInput.selectedIndex = 0;
        if (connectionInput)   connectionInput.selectedIndex   = 0;
        if (networkQualInput)  networkQualInput.selectedIndex  = 0;
        if (regionInput)       regionInput.selectedIndex       = 0;
        gameSelect.selectedIndex    = 0;
        playstyleSelect.selectedIndex = 0;
        if (sessionInput)      sessionInput.selectedIndex      = 0;
        if (layoutInput)       layoutInput.selectedIndex       = 0;

        // Reset screen detect
        isScreenDetected          = false;
        detectedScreenWidth       = 360;
        detectScreenBtn.style.display = 'flex';
        detectScreenBtn.disabled  = false;
        detectScreenBtn.innerHTML = '<i class="ph-bold ph-corners-out" style="font-size:20px;"></i> Auto-Detect My Display';
        screenResultText.classList.add('hidden');

        // Reset scan bar
        scanProgress.style.width = '0%';
        if (scanPercent) scanPercent.textContent = '0%';

        resultWrapper.classList.add('hidden');
        wizardContainer.classList.remove('hidden');
        wizardContainer.classList.add('slide-down');

        window.scrollTo({ top: 0, behavior: 'smooth' });
        showToast('Reset complete!');
    });

    // ── Info Modal ──────────────────────────────────────────
    if (infoBtn)    infoBtn.addEventListener('click',    () => infoModal.classList.remove('hidden'));
    if (closeModal) closeModal.addEventListener('click', () => infoModal.classList.add('hidden'));
    if (infoModal)  infoModal.addEventListener('click',  (e) => { if (e.target === infoModal) infoModal.classList.add('hidden'); });

    // ── Toast ────────────────────────────────────────────────
    function showToast(msg, isError) {
        if (!toast) return;
        toast.textContent            = msg;
        toast.style.backgroundColor  = isError ? '#ef4444' : '#10b981';
        toast.classList.remove('hidden');
        toast.classList.add('visible');
        setTimeout(() => {
            toast.classList.remove('visible');
            toast.classList.add('hidden');
        }, 3200);
    }

}); // end DOMContentLoaded