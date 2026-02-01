document.addEventListener('DOMContentLoaded', () => {
    
    // Toggle Elements
    const metricBtn = document.querySelector('[data-unit="metric"]');
    const imperialBtn = document.querySelector('[data-unit="imperial"]');
    const metricInputs = document.getElementById('metric-inputs');
    const imperialInputs = document.getElementById('imperial-inputs');
    
    // Input Elements
    const heightCm = document.getElementById('height-cm');
    const weightKg = document.getElementById('weight-kg');
    const heightFt = document.getElementById('height-ft');
    const heightIn = document.getElementById('height-in');
    const weightLbs = document.getElementById('weight-lbs');
    
    // Result Elements
    const calculateBtn = document.getElementById('calculate-btn');
    const resultCard = document.getElementById('result-card');
    const bmiValueEl = document.getElementById('bmi-value');
    const bmiStatusEl = document.getElementById('bmi-status');
    const bmiDescEl = document.getElementById('bmi-desc');
    const meterFill = document.getElementById('meter-fill');

    let currentUnit = 'metric';

    // 1. Unit Switcher Logic
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
        resultCard.classList.add('hidden'); // Hide result on switch
    }

    metricBtn.addEventListener('click', () => switchUnit('metric'));
    imperialBtn.addEventListener('click', () => switchUnit('imperial'));

    // 2. Calculation Logic
    calculateBtn.addEventListener('click', () => {
        let bmi = 0;

        if (currentUnit === 'metric') {
            const h = parseFloat(heightCm.value);
            const w = parseFloat(weightKg.value);
            
            if (!h || !w) return alert("Please enter both height and weight");
            
            // BMI = kg / m^2
            bmi = w / ((h / 100) * (h / 100));

        } else {
            const ft = parseFloat(heightFt.value) || 0;
            const inc = parseFloat(heightIn.value) || 0;
            const lbs = parseFloat(weightLbs.value);

            if ((!ft && !inc) || !lbs) return alert("Please enter height and weight");

            // Convert to metric internally
            const totalInches = (ft * 12) + inc;
            // BMI = 703 * (lbs / inches^2)
            bmi = 703 * (lbs / (totalInches * totalInches));
        }

        bmi = parseFloat(bmi.toFixed(1));
        showResult(bmi);
    });

    // 3. Display Result Logic
    function showResult(bmi) {
        bmiValueEl.textContent = bmi;
        
        let status = '';
        let color = '';
        let desc = '';
        let percent = 0; // For meter bar position

        if (bmi < 18.5) {
            status = 'Underweight';
            color = '#3b82f6'; // Blue
            desc = "You are in the underweight range. It's important to eat nutritious food.";
            percent = 10; // Left side
        } else if (bmi >= 18.5 && bmi < 25) {
            status = 'Normal Weight';
            color = '#10b981'; // Green
            desc = "Great job! You are in the healthy weight range.";
            percent = 35; // Middle Left
        } else if (bmi >= 25 && bmi < 30) {
            status = 'Overweight';
            color = '#f59e0b'; // Orange
            desc = "You are in the overweight range. Consider a balanced diet.";
            percent = 65; // Middle Right
        } else {
            status = 'Obese';
            color = '#ef4444'; // Red
            desc = "You are in the obese range. Consult a healthcare provider for advice.";
            percent = 90; // Right side
        }

        bmiStatusEl.textContent = status;
        bmiStatusEl.style.color = color;
        bmiDescEl.textContent = desc;
        
        // Meter Animation
        resultCard.classList.remove('hidden');
        
        // Small delay for animation
        setTimeout(() => {
            meterFill.style.left = percent + '%';
            meterFill.style.backgroundColor = color;
        }, 100);

        // Scroll to result
        resultCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
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