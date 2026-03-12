document.addEventListener('DOMContentLoaded', () => {

    const urlInput = document.getElementById('yt-url');
    const fetchBtn = document.getElementById('fetch-btn');
    const errorMsg = document.getElementById('error-msg');
    const resultsSection = document.getElementById('results-section');
    const thumbnailsContainer = document.getElementById('thumbnails-container');
    
    // Modal Elements
    const infoBtn = document.getElementById('info-btn');
    const closeModal = document.getElementById('close-modal');
    const infoModal = document.getElementById('info-modal');

    // YouTube URL Extractor Logic
    function extractVideoID(url) {
        // Matches standard links, youtu.be, and Shorts
        const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([^"&?\/\s]{11})/i;
        const match = url.match(regExp);
        return (match && match[1].length === 11) ? match[1] : null;
    }

    fetchBtn.addEventListener('click', () => {
        const url = urlInput.value.trim();
        const videoID = extractVideoID(url);

        if (!videoID) {
            errorMsg.classList.remove('hidden');
            resultsSection.classList.add('hidden');
            return;
        }

        // Hide error and show loader/results
        errorMsg.classList.add('hidden');
        renderThumbnails(videoID);
    });

    // Also trigger on Enter key
    urlInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') fetchBtn.click();
    });

    function renderThumbnails(id) {
        thumbnailsContainer.innerHTML = ''; // Clear previous

        // YouTube Image Resolutions Matrix
        const resolutions = [
            { id: 'maxresdefault', name: 'Max Resolution (HD/4K)', size: '1920x1080 or 1280x720', badgeClass: 'pro' },
            { id: 'sddefault', name: 'Standard Quality', size: '640x480', badgeClass: '' },
            { id: 'hqdefault', name: 'High Quality', size: '480x360', badgeClass: '' },
            { id: 'mqdefault', name: 'Medium Quality', size: '320x180', badgeClass: '' }
        ];

        resolutions.forEach((res, index) => {
            const imgUrl = `https://img.youtube.com/vi/${id}/${res.id}.jpg`;
            
            // Build the card HTML
            const card = document.createElement('div');
            card.className = 'thumb-card slide-down';
            card.style.animationDelay = `${index * 0.1}s`;

            card.innerHTML = `
                <div class="thumb-img-wrapper">
                    <span class="res-badge ${res.badgeClass}">${res.id === 'maxresdefault' ? 'BEST' : 'OK'}</span>
                    <img src="${imgUrl}" alt="${res.name}" class="thumb-img" onerror="this.src='../../images/placeholder.jpg'; this.parentElement.parentElement.style.display='none';">
                </div>
                <div class="thumb-details">
                    <div>
                        <div class="thumb-title">${res.name}</div>
                        <div class="thumb-size">${res.size}</div>
                    </div>
                    <a href="${imgUrl}" target="_blank" download="WebKaar_Thumbnail_${id}.jpg" class="download-btn ${res.id === 'maxresdefault' ? 'primary' : ''}">
                        <i class="ph-bold ph-download-simple"></i> Download Image
                    </a>
                </div>
            `;

            thumbnailsContainer.appendChild(card);
        });

        resultsSection.classList.remove('hidden');
        resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // Modal Logic
    infoBtn.addEventListener('click', () => infoModal.classList.remove('hidden'));
    closeModal.addEventListener('click', () => infoModal.classList.add('hidden'));
    infoModal.addEventListener('click', (e) => {
        if(e.target === infoModal) infoModal.classList.add('hidden');
    });

});