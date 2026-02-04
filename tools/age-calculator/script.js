// Elements
const dobInput = document.getElementById('dobInput');
const todayInput = document.getElementById('todayInput');
const calcBtn = document.getElementById('calcBtn');
const resetBtn = document.getElementById('resetBtn');

const inputCard = document.getElementById('input-card');
const resultCard = document.getElementById('result-card');

// Output Elements
const yearsVal = document.getElementById('yearsVal');
const monthsVal = document.getElementById('monthsVal');
const daysVal = document.getElementById('daysVal');
const nextBirthday = document.getElementById('nextBirthday');
const dayBorn = document.getElementById('dayBorn');
const totalDays = document.getElementById('totalDays');

// Modal
const infoBtn = document.getElementById('info-btn');
const infoModal = document.getElementById('info-modal');
const closeModal = document.getElementById('close-modal');

// Init: Set "Today" input to current date
const today = new Date();
todayInput.valueAsDate = today;

// Modal Logic
infoBtn.addEventListener('click', () => infoModal.classList.remove('hidden'));
closeModal.addEventListener('click', () => infoModal.classList.add('hidden'));
infoModal.addEventListener('click', (e) => { if (e.target === infoModal) infoModal.classList.add('hidden'); });

// Calculate Logic
calcBtn.addEventListener('click', () => {
    if(!dobInput.value) {
        alert("Please select your Date of Birth");
        return;
    }

    const birthDate = new Date(dobInput.value);
    const targetDate = new Date(todayInput.value);

    if(birthDate > targetDate) {
        alert("Date of Birth cannot be in the future!");
        return;
    }

    // 1. Calculate Years, Months, Days
    let years = targetDate.getFullYear() - birthDate.getFullYear();
    let months = targetDate.getMonth() - birthDate.getMonth();
    let days = targetDate.getDate() - birthDate.getDate();

    if (days < 0) {
        months--;
        // Days in previous month
        const prevMonthDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), 0);
        days += prevMonthDate.getDate();
    }

    if (months < 0) {
        years--;
        months += 12;
    }

    // 2. Extra Info
    // Day Born
    const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const bornDayName = daysOfWeek[birthDate.getDay()];

    // Total Days Lived
    const diffTime = Math.abs(targetDate - birthDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

    // Next Birthday Countdown
    const currentYear = targetDate.getFullYear();
    let nextBday = new Date(birthDate);
    nextBday.setFullYear(currentYear);

    if (nextBday < targetDate) {
        nextBday.setFullYear(currentYear + 1);
    }
    
    const diffBday = Math.ceil((nextBday - targetDate) / (1000 * 60 * 60 * 24));
    
    let bdayText = `${diffBday} Days left`;
    if(diffBday === 0) bdayText = "🎉 Happy Birthday! 🎂";
    if(diffBday === 365 || diffBday === 366) bdayText = "🎉 Happy Birthday! 🎂";

    // 3. Update UI
    yearsVal.innerText = years;
    monthsVal.innerText = months;
    daysVal.innerText = days;
    
    dayBorn.innerText = bornDayName;
    totalDays.innerText = diffDays.toLocaleString();
    nextBirthday.innerText = bdayText;

    // Switch Cards
    inputCard.classList.add('hidden');
    resultCard.classList.remove('hidden');
});

// Reset
resetBtn.addEventListener('click', () => {
    inputCard.classList.remove('hidden');
    resultCard.classList.add('hidden');
    dobInput.value = '';
});
