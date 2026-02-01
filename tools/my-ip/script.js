const ipDisplay = document.getElementById('ip-display');
const ispDisplay = document.getElementById('isp-display');
const detailsBox = document.getElementById('details-box');
const refreshBtn = document.getElementById('refresh-btn');

// Detail Fields
const locationVal = document.getElementById('location-val');
const countryVal = document.getElementById('country-val');
const flagIcon = document.getElementById('flag-icon');
const timezoneVal = document.getElementById('timezone-val');
const connectionVal = document.getElementById('connection-val');

// Load Data on Start
document.addEventListener('DOMContentLoaded', fetchIPData);

refreshBtn.addEventListener('click', () => {
    ipDisplay.innerText = "Loading...";
    detailsBox.classList.add('hidden');
    fetchIPData();
});

async function fetchIPData() {
    // Check if API module exists
    if (!window.WebKaarAPI) {
        ipDisplay.innerText = "Error";
        ispDisplay.innerText = "API Module Missing";
        return;
    }

    try {
        // Calling the function from api.js
        const data = await window.WebKaarAPI.getNetworkInfo();

        if (data.success) {
            updateUI(data);
        } else {
            throw new Error(data.error);
        }
    } catch (error) {
        console.error(error);
        ipDisplay.innerText = "Offline";
        ispDisplay.innerText = "Check Connection";
    }
}

function updateUI(data) {
    // Update Main Card
    ipDisplay.innerText = data.ip;
    ispDisplay.innerText = data.isp || "Unknown ISP";

    // Update Details
    locationVal.innerText = `${data.city}, ${data.country}`;
    countryVal.innerText = data.country;
    
    // Set Flag (Emoji logic or image)
    // ipwho.is returns a flag image URL, but we can assume emoji for now or use the image
    if(data.flag) {
        // If api.js returns flag image url
        flagIcon.innerHTML = `<img src="${data.flag}" width="20" style="vertical-align: middle;">`;
    }

    timezoneVal.innerText = data.timezone;
    connectionVal.innerText = "Secure (HTTPS)"; // Static for now

    // Show Grid with Animation
    detailsBox.classList.remove('hidden');
}