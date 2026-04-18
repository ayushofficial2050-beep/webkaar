/* ==========================================================================
   AGE & DEATH CALCULATOR - CORE ENGINE (v4.0)
   Author: Ayush Tiwari (Panthera Store)
   Features: M3 UI Integration, Precise Lifespan Logic, Zero Lag
   ========================================================================== */

// --- 1. DOM ELEMENTS ---
const dobInput = document.getElementById('dobInput');
const todayInput = document.getElementById('todayInput');
const genderInput = document.getElementById('genderInput');
const lifestyleInput = document.getElementById('lifestyleInput');
const stressInput = document.getElementById('stressInput');
const calcBtn = document.getElementById('calcBtn');
const resetBtn = document.getElementById('resetBtn');

const inputCard = document.getElementById('input-card');
const resultCard = document.getElementById('result-card');

// --- 2. OUTPUT DISPLAYS ---
const yearsVal = document.getElementById('yearsVal');
const monthsVal = document.getElementById('monthsVal');
const daysVal = document.getElementById('daysVal');
const nextBirthday = document.getElementById('nextBirthday');
const dayBorn = document.getElementById('dayBorn');
const totalDays = document.getElementById('totalDays');

const lifespanVal = document.getElementById('lifespanVal');
const passingYear = document.getElementById('passingYear');
const remainingTime = document.getElementById('remainingTime');

// --- 3. MODAL LOGIC ---
const infoBtn = document.getElementById('info-btn');
const infoModal = document.getElementById('info-modal');
const closeModal = document.getElementById('close-modal');

// Init: Set default "Today" date
const now = new Date();
todayInput.valueAsDate = now;

infoBtn.onclick = () => infoModal.classList.remove('hidden');
closeModal.onclick = () => infoModal.classList.add('hidden');
window.onclick = (e) => { if (e.target === infoModal) infoModal.classList.add('hidden'); };

// --- 4. CALCULATION LOGIC ---
calcBtn.addEventListener('click', () => {
    // Validation
    if (!dobInput.value) {
        alert("Please select your Date of Birth 🎂");
        return;
    }

    const birthDate = new Date(dobInput.value);
    const targetDate = new Date(todayInput.value);

    if (birthDate > targetDate) {
        alert("Date of Birth cannot be in the future! 🚀");
        return;
    }

    // A. PRECISE AGE CALCULATION
    let y = targetDate.getFullYear() - birthDate.getFullYear();
    let m = targetDate.getMonth() - birthDate.getMonth();
    let d = targetDate.getDate() - birthDate.getDate();

    if (d < 0) {
        m--;
        const lastMonth = new Date(targetDate.getFullYear(), targetDate.getMonth(), 0);
        d += lastMonth.getDate();
    }
    if (m < 0) {
        y--;
        m += 12;
    }

    // B. STATS & FUN DATA
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const bornOn = dayNames[birthDate.getDay()];

    const totalMs = Math.abs(targetDate - birthDate);
    const totalDaysLived = Math.floor(totalMs / (1000 * 60 * 60 * 24));

    // C. NEXT BIRTHDAY COUNTDOWN
    let nextBday = new Date(birthDate);
    nextBday.setFullYear(targetDate.getFullYear());
    if (nextBday < targetDate) {
        nextBday.setFullYear(targetDate.getFullYear() + 1);
    }
    const daysToBday = Math.ceil((nextBday - targetDate) / (1000 * 60 * 60 * 24));
    let bdayText = daysToBday === 0 || daysToBday === 365 ? "🎉 Happy Birthday! 🎂" : `${daysToBday} Days to go`;

    // D. DEATH CALCULATOR ENGINE (Statistical Logic)
    let baseLifespan = 74; // Global Average

    // Gender Factor
    if (genderInput.value === 'female') baseLifespan += 4;
    
    // Lifestyle Factor
    const habits = lifestyleInput.value;
    if (habits === 'healthy') baseLifespan += 9;
    else if (habits === 'unhealthy') baseLifespan -= 7;

    // Stress Factor
    const stress = stressInput.value;
    if (stress === 'low') baseLifespan += 3;
    else if (stress === 'high') baseLifespan -= 6;

    // Ensure they don't "die" before today
    if (baseLifespan < y + 1) baseLifespan = y + Math.floor(Math.random() * 5) + 2;

    const estimatedPassingYear = birthDate.getFullYear() + Math.floor(baseLifespan);
    const yearsLeft = Math.max(0, Math.floor(baseLifespan - y));

    // --- 5. UI UPDATE (M3 ANIMATION) ---
    yearsVal.innerText = y;
    monthsVal.innerText = m;
    daysVal.innerText = d;
    dayBorn.innerText = bornOn;
    totalDays.innerText = totalDaysLived.toLocaleString();
    nextBirthday.innerText = bdayText;

    lifespanVal.innerText = Math.floor(baseLifespan);
    passingYear.innerText = estimatedPassingYear;
    remainingTime.innerText = `${yearsLeft} Years approx.`;

    // Switch Cards with Smooth Scroll
    inputCard.classList.add('hidden');
    resultCard.classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

// --- 6. RESET LOGIC ---
resetBtn.addEventListener('click', () => {
    inputCard.classList.remove('hidden');
    resultCard.classList.add('hidden');
    dobInput.value = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
});
