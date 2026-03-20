// ============================================
//   BMI CALCULATOR - SCRIPT
//   WebKaar Tools | script.js
// ============================================

document.addEventListener('DOMContentLoaded', () => {

    // ── ELEMENTS ──────────────────────────────
    const metricBtn      = document.querySelector('[data-unit="metric"]');
    const imperialBtn    = document.querySelector('[data-unit="imperial"]');
    const metricInputs   = document.getElementById('metric-inputs');
    const imperialInputs = document.getElementById('imperial-inputs');

    const heightCm       = document.getElementById('height-cm');
    const weightKg       = document.getElementById('weight-kg');
    const heightFt       = document.getElementById('height-ft');
    const heightIn       = document.getElementById('height-in');
    const weightLbs      = document.getElementById('weight-lbs');
    const ageInput       = document.getElementById('age-input');
    const genderInput    = document.getElementById('gender-input');

    const calculateBtn   = document.getElementById('calculate-btn');
    const resetBtn       = document.getElementById('reset-btn');
    const shareBtn       = document.getElementById('share-btn');

    const resultCard     = document.getElementById('result-card');
    const bmiValueEl     = document.getElementById('bmi-value');
    const bmiStatusEl    = document.getElementById('bmi-status');
    const bmiDescEl      = document.getElementById('bmi-desc');
    const meterFill      = document.getElementById('meter-fill');

    const idealWeightVal = document.getElementById('ideal-weight-value');
    const bmrRow         = document.getElementById('bmr-row');
    const bmrVal         = document.getElementById('bmr-value');
    const healthTip      = document.getElementById('health-tip');

    const infoBtn        = document.getElementById('info-btn');
    const modal          = document.getElementById('info-modal');
    const closeModal     = document.getElementById('close-modal');
    const toastEl        = document.getElementById('toast');

    let currentUnit = 'metric';
    let lastBmi     = 0;
    let lastStatus  = '';
    let lastIdeal   = '';
    let lastBmr     = '';
    let toastTimer  = null;

    // ── TOAST ────────────────────────────────
    function showToast(msg) {
        if (toastTimer) clearTimeout(toastTimer);
        toastEl.textContent = msg;
        toastEl.classList.remove('hidden');
        void toastEl.offsetWidth;
        toastEl.classList.add('show');
        toastTimer = setTimeout(() => {
            toastEl.classList.remove('show');
            setTimeout(() => toastEl.classList.add('hidden'), 300);
        }, 2500);
    }

    // ── UNIT SWITCHER ────────────────────────
    function switchUnit(unit) {
        currentUnit = unit;
        if (unit === 'metric') {
            metricBtn.classList.add('active');
            imperialBtn.classList.remove('active');
            metricInputs.classList.remove('hidden');
            imperialInputs.classList.add('hidden');
        } else {
            imperialBtn.classList.add('active');
            metricBtn.classList.remove('active');
            imperialInputs.classList.remove('hidden');
            metricInputs.classList.add('hidden');
        }
        resultCard.classList.add('hidden');
        resetBtn.classList.add('hidden');
        clearErrors();
    }

    metricBtn.addEventListener('click', () => switchUnit('metric'));
    imperialBtn.addEventListener('click', () => switchUnit('imperial'));

    // ── INPUT VALIDATION ─────────────────────
    function clearErrors() {
        document.querySelectorAll('input').forEach(i => i.classList.remove('input-error'));
    }

    function setError(el) {
        el.classList.add('input-error');
        el.addEventListener('input', () => el.classList.remove('input-error'), { once: true });
    }

    // ── CALCULATE ────────────────────────────
    calculateBtn.addEventListener('click', () => {
        clearErrors();
        let bmi        = 0;
        let heightM    = 0;
        let weightKgVal = 0;

        if (currentUnit === 'metric') {
            const h = parseFloat(heightCm.value);
            const w = parseFloat(weightKg.value);
            let valid = true;
            if (!h || h <= 0) { setError(heightCm); valid = false; }
            if (!w || w <= 0) { setError(weightKg); valid = false; }
            if (!valid) { showToast('Please enter valid height and weight'); return; }
            heightM     = h / 100;
            weightKgVal = w;
            bmi         = w / (heightM * heightM);

        } else {
            const ft  = parseFloat(heightFt.value) || 0;
            const inc = parseFloat(heightIn.value) || 0;
            const lbs = parseFloat(weightLbs.value);
            let valid = true;
            if (ft <= 0 && inc <= 0) { setError(heightFt); setError(heightIn); valid = false; }
            if (!lbs || lbs <= 0)    { setError(weightLbs); valid = false; }
            if (!valid) { showToast('Please enter valid height and weight'); return; }
            const totalInches = (ft * 12) + inc;
            heightM           = totalInches * 0.0254;
            weightKgVal       = lbs * 0.453592;
            bmi               = 703 * (lbs / (totalInches * totalInches));
        }

        bmi     = parseFloat(bmi.toFixed(1));
        lastBmi = bmi;
        showResult(bmi, heightM, weightKgVal);
    });

    // ── SHOW RESULT ──────────────────────────
    function showResult(bmi, heightM, weightKgVal) {
        bmiValueEl.textContent = bmi;

        let status, color, desc, percent, tip;

        // Accurate meter: BMI 10–40 mapped to 0–100%
        const clampedBmi = Math.min(Math.max(bmi, 10), 40);
        percent = ((clampedBmi - 10) / 30) * 100;

        if (bmi < 18.5) {
            status = 'Underweight';
            color  = '#3b82f6';
            desc   = 'You are below the healthy weight range. Focus on nutritious, balanced meals.';
            tip    = 'Eat more protein-rich foods like eggs, lentils, and nuts. Consult a doctor if needed.';
        } else if (bmi < 25) {
            status = 'Normal Weight';
            color  = '#10b981';
            desc   = 'You are in the healthy weight range. Keep it up!';
            tip    = 'Maintain your weight with regular exercise and a balanced diet.';
        } else if (bmi < 30) {
            status = 'Overweight';
            color  = '#f59e0b';
            desc   = 'You are slightly above the healthy weight range. Small lifestyle changes can help.';
            tip    = 'Try 30 minutes of walking daily and reduce sugary drinks and junk food.';
        } else {
            status = 'Obese';
            color  = '#ef4444';
            desc   = 'You are in the obese range. It is recommended to consult a healthcare provider.';
            tip    = 'Consult a doctor or nutritionist for a safe weight loss plan tailored to you.';
        }

        lastStatus = status;

        bmiValueEl.style.color  = color;
        bmiStatusEl.textContent = status;
        bmiStatusEl.style.color = color;
        bmiDescEl.textContent   = desc;
        healthTip.textContent   = tip;

        // ── Ideal Weight Range ──
        const minIdeal = (18.5 * heightM * heightM).toFixed(1);
        const maxIdeal = (24.9 * heightM * heightM).toFixed(1);

        if (currentUnit === 'metric') {
            lastIdeal = `${minIdeal} kg – ${maxIdeal} kg`;
        } else {
            const minLbs = (minIdeal * 2.20462).toFixed(1);
            const maxLbs = (maxIdeal * 2.20462).toFixed(1);
            lastIdeal = `${minLbs} lbs – ${maxLbs} lbs`;
        }
        idealWeightVal.textContent = lastIdeal;

        // ── BMR (Mifflin-St Jeor) ──
        const age    = parseFloat(ageInput.value);
        const gender = genderInput.value;

        if (age > 0 && gender) {
            let bmr;
            if (gender === 'male') {
                bmr = (10 * weightKgVal) + (6.25 * heightM * 100) - (5 * age) + 5;
            } else {
                bmr = (10 * weightKgVal) + (6.25 * heightM * 100) - (5 * age) - 161;
            }
            lastBmr                = `~${Math.round(bmr)} kcal/day`;
            bmrVal.textContent     = lastBmr;
            bmrRow.style.display   = 'flex';
        } else {
            lastBmr              = '';
            bmrRow.style.display = 'none';
        }

        // ── Show card & reset button ──
        resultCard.classList.remove('hidden');
        resetBtn.classList.remove('hidden');

        // ── Animate meter marker ──
        setTimeout(() => {
            meterFill.style.left            = percent + '%';
            meterFill.style.backgroundColor = color;
        }, 100);

        resultCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    // ── SHARE BUTTON ─────────────────────────
    shareBtn.addEventListener('click', () => {
        const bmrLine = lastBmr ? `\nDaily Calorie Need: ${lastBmr}` : '';
        const shareText =
`My BMI Result — WebKaar Tools
──────────────────────
BMI Score    : ${lastBmi}
Category     : ${lastStatus}
Ideal Weight : ${lastIdeal}${bmrLine}
──────────────────────
Check yours free: https://webkaar.pages.dev/tools/bmi-calculator/`;

        // Use Web Share API if available (Android/iOS native share sheet)
        if (navigator.share) {
            navigator.share({
                title: 'My BMI Result — WebKaar Tools',
                text: shareText,
                url: 'https://webkaar.pages.dev/tools/bmi-calculator/'
            }).catch(() => {
                // User cancelled share — do nothing
            });
        } else {
            // Fallback: copy to clipboard
            navigator.clipboard.writeText(shareText)
                .then(() => showToast('Result copied — share it anywhere!'))
                .catch(() => showToast('Could not share. Please try manually.'));
        }
    });

    // ── RESET ────────────────────────────────
    resetBtn.addEventListener('click', () => {
        [heightCm, weightKg, heightFt, heightIn, weightLbs, ageInput].forEach(el => {
            if (el) el.value = '';
        });
        if (genderInput) genderInput.value = '';
        resultCard.classList.add('hidden');
        resetBtn.classList.add('hidden');
        clearErrors();
        showToast('Reset done');
    });

    // ── INFO MODAL ───────────────────────────
    if (infoBtn && modal && closeModal) {
        infoBtn.addEventListener('click', () => modal.classList.remove('hidden'));
        closeModal.addEventListener('click', () => modal.classList.add('hidden'));
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.classList.add('hidden');
        });
    }

});
