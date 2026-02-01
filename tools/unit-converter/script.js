// Data Configuration
const UNITS = {
    length: {
        base: 'm',
        rates: {
            m: 1,
            km: 0.001,
            cm: 100,
            mm: 1000,
            mi: 0.000621371,
            yd: 1.09361,
            ft: 3.28084,
            in: 39.3701
        },
        labels: { m:'Meters', km:'Kilometers', cm:'Centimeters', mm:'Millimeters', mi:'Miles', yd:'Yards', ft:'Feet', in:'Inches' }
    },
    weight: {
        base: 'kg',
        rates: {
            kg: 1,
            g: 1000,
            mg: 1000000,
            lb: 2.20462,
            oz: 35.274
        },
        labels: { kg:'Kilograms', g:'Grams', mg:'Milligrams', lb:'Pounds', oz:'Ounces' }
    },
    time: {
        base: 's',
        rates: {
            s: 1,
            min: 1/60,
            h: 1/3600,
            d: 1/86400,
            wk: 1/604800
        },
        labels: { s:'Seconds', min:'Minutes', h:'Hours', d:'Days', wk:'Weeks' }
    },
    data: {
        base: 'MB',
        rates: {
            B: 1048576,
            KB: 1024,
            MB: 1,
            GB: 1/1024,
            TB: 1/1048576
        },
        labels: { B:'Bytes', KB:'Kilobytes', MB:'Megabytes', GB:'Gigabytes', TB:'Terabytes' }
    },
    // Temperature handles differently (Logic in function)
    temperature: {
        units: ['C', 'F', 'K'],
        labels: { C:'Celsius', F:'Fahrenheit', K:'Kelvin' }
    }
};

// DOM Elements
const inputVal = document.getElementById('input-val');
const outputVal = document.getElementById('output-val');
const selectFrom = document.getElementById('select-from');
const selectTo = document.getElementById('select-to');
const swapBtn = document.getElementById('swap-btn');
const tabs = document.querySelectorAll('.tab-btn');
const formulaText = document.getElementById('formula-text');

// Modal Elements
const infoBtn = document.getElementById('info-btn');
const infoModal = document.getElementById('info-modal');
const closeModal = document.getElementById('close-modal');

let currentCat = 'length';

// --- INITIALIZATION ---

function init() {
    populateSelects(currentCat);
    calculate();
}

// Populate Dropdowns
function populateSelects(category) {
    selectFrom.innerHTML = '';
    selectTo.innerHTML = '';

    const unitKeys = category === 'temperature' 
        ? UNITS[category].units 
        : Object.keys(UNITS[category].rates);

    unitKeys.forEach(unit => {
        const name = UNITS[category].labels[unit];
        
        const option1 = new Option(name, unit);
        const option2 = new Option(name, unit);
        
        selectFrom.add(option1);
        selectTo.add(option2);
    });

    // Default Selection (Second item for 'To')
    if (unitKeys.length > 1) {
        selectTo.selectedIndex = 1;
    }
}

// --- CALCULATION LOGIC ---

function calculate() {
    const val = parseFloat(inputVal.value);
    if (isNaN(val)) {
        outputVal.value = '';
        return;
    }

    const from = selectFrom.value;
    const to = selectTo.value;
    let result = 0;

    if (currentCat === 'temperature') {
        result = convertTemp(val, from, to);
    } else {
        const rates = UNITS[currentCat].rates;
        // Convert 'From' to Base, then Base to 'To'
        // Formula: (Value / Rate_From) * Rate_To
        const baseVal = val / rates[from]; 
        result = baseVal * rates[to];
    }

    // Formatting (Avoid long decimals)
    outputVal.value = parseFloat(result.toPrecision(6));
    
    // Update Formula Text (Simple representation)
    formulaText.innerText = `1 ${from} = ${(1/UNITS[currentCat].rates[from] * UNITS[currentCat].rates[to]).toPrecision(4)} ${to}`;
}

function convertTemp(val, from, to) {
    if (from === to) return val;
    
    let celsius;
    // 1. Convert to Celsius
    if (from === 'C') celsius = val;
    else if (from === 'F') celsius = (val - 32) * (5/9);
    else if (from === 'K') celsius = val - 273.15;

    // 2. Convert Celsius to Target
    if (to === 'C') return celsius;
    if (to === 'F') return (celsius * 9/5) + 32;
    if (to === 'K') return celsius + 273.15;
}

// --- EVENT LISTENERS ---

// 1. Tabs Switching
tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        currentCat = tab.dataset.cat;
        populateSelects(currentCat);
        calculate();
    });
});

// 2. Input & Select Changes
inputVal.addEventListener('input', calculate);
selectFrom.addEventListener('change', calculate);
selectTo.addEventListener('change', calculate);

// 3. Swap Values
swapBtn.addEventListener('click', () => {
    // Swap Dropdowns
    const tempUnit = selectFrom.value;
    selectFrom.value = selectTo.value;
    selectTo.value = tempUnit;
    
    calculate();
});

// 4. Modal
infoBtn.addEventListener('click', () => infoModal.classList.remove('hidden'));
closeModal.addEventListener('click', () => infoModal.classList.add('hidden'));
infoModal.addEventListener('click', (e) => {
    if (e.target === infoModal) infoModal.classList.add('hidden');
});

// Start
init();