document.addEventListener('DOMContentLoaded', () => {

    const typingText = document.querySelector(".typing-text");
    const inpField = document.querySelector(".input-field");
    const tryAgainBtn = document.querySelector("#try-again-btn");
    const timeTag = document.querySelector("#time-tag");
    const mistakeTag = document.querySelector("#mistake-tag");
    const wpmTag = document.querySelector("#wpm-tag");
    const accuracyTag = document.querySelector("#accuracy-tag");

    let timer;
    let maxTime = 60;
    let timeLeft = maxTime;
    let charIndex = 0;
    let mistakes = 0;
    let isTyping = false;

    // Interesting Paragraphs for Typing
    const paragraphs = [
        "Technology is best when it brings people together. It allows us to connect with friends and family across the globe in seconds.",
        "Success is not final, failure is not fatal: It is the courage to continue that counts. Keep pushing forward no matter what.",
        "The only way to do great work is to love what you do. If you haven't found it yet, keep looking. Don't settle.",
        "Artificial intelligence is transforming the world. From self-driving cars to smart assistants, machines are learning faster than ever.",
        "Coding is the language of the future. It empowers creators to build software that solves real-world problems efficiently.",
        "Design is not just what it looks like and feels like. Design is how it works. Good design makes a product useful and understandable.",
        "Consistency is the key to mastering any skill. Practice a little bit every day, and you will see massive improvement over time."
    ];

    function loadParagraph() {
        const ranIndex = Math.floor(Math.random() * paragraphs.length);
        typingText.innerHTML = "";
        
        // Split text into characters
        paragraphs[ranIndex].split("").forEach(char => {
            let span = `<span>${char}</span>`;
            typingText.innerHTML += span;
        });

        // Set first char active
        const spans = typingText.querySelectorAll("span");
        if(spans.length > 0) spans[0].classList.add("active");
        
        // Focus input
        document.addEventListener("keydown", () => inpField.focus());
        typingText.addEventListener("click", () => inpField.focus());
    }

    // NEW LOGIC: Loop based comparison (Much smoother)
    function initTyping() {
        const characters = typingText.querySelectorAll("span");
        let typedChar = inpField.value.split("")[charIndex];
        
        // Check if user finished text or time ran out
        if (charIndex < characters.length && timeLeft > 0) {
            
            if (!isTyping) {
                timer = setInterval(initTimer, 1000);
                isTyping = true;
            }

            // Handle Backspace vs Typing
            if (typedChar == null) { 
                // Backspace detected
                if (charIndex > 0) {
                    charIndex--;
                    if (characters[charIndex].classList.contains("incorrect")) {
                        // Optional: decrease mistakes if correcting? 
                        // Usually typing tests keep mistake count up.
                    }
                    characters[charIndex].classList.remove("correct", "incorrect");
                }
            } else {
                // Typing detected
                if (characters[charIndex].innerText === typedChar) {
                    characters[charIndex].classList.add("correct");
                } else {
                    mistakes++;
                    characters[charIndex].classList.add("incorrect");
                }
                charIndex++;
            }

            // --- CURSOR LOGIC FIX ---
            characters.forEach(span => span.classList.remove("active"));
            
            if (charIndex < characters.length) {
                characters[charIndex].classList.add("active");
            }

            // Stats Update
            // WPM: (Total characters typed / 5) / Time elapsed in minutes
            let wpm = Math.round(((charIndex - mistakes) / 5) / ((maxTime - timeLeft) / 60));
            // Prevent infinity or NaN at start
            wpm = wpm < 0 || !wpm || wpm === Infinity ? 0 : wpm;
            
            wpmTag.innerText = wpm;
            mistakeTag.innerText = mistakes;
            
            let accuracy = Math.round(((charIndex - mistakes) / charIndex) * 100);
            accuracy = accuracy < 0 || !accuracy || accuracy === Infinity ? 100 : accuracy;
            accuracyTag.innerText = `${accuracy}%`;

        } else {
            clearInterval(timer);
            inpField.value = "";
        }
    }

    // Alternate Robust Input Handler for Mobile
    // This replaces the char-by-char logic with full string comparison if needed
    // But for now, let's fix the cursor jumping by sticking to input event properly.
    
    inpField.addEventListener("input", (e) => {
        const characters = typingText.querySelectorAll("span");
        
        // Get current value length
        const valLength = inpField.value.length;
        
        // Reset everything if user clears input completely (safety)
        if(valLength === 0 && charIndex > 0) {
            characters.forEach(span => span.classList.remove("correct", "incorrect", "active"));
            charIndex = 0;
            characters[0].classList.add("active");
            return;
        }
        
        // If the length matches (typing forward)
        if (valLength > charIndex) {
            // User typed something
            let typedChar = inpField.value[charIndex]; // Get the char at current index
            
            if(!isTyping) {
                timer = setInterval(initTimer, 1000);
                isTyping = true;
            }

            if (characters[charIndex].innerText === typedChar) {
                characters[charIndex].classList.add("correct");
            } else {
                mistakes++;
                characters[charIndex].classList.add("incorrect");
            }
            charIndex++;
        } 
        // If length is less (Backspace)
        else if (valLength < charIndex) {
            charIndex--;
            characters[charIndex].classList.remove("correct", "incorrect");
        }

        // Move Cursor
        characters.forEach(span => span.classList.remove("active"));
        if(charIndex < characters.length) {
            characters[charIndex].classList.add("active");
        } else {
            // End of text
            clearInterval(timer);
        }
        
        // Stats
        let timeElapsed = maxTime - timeLeft;
        if(timeElapsed === 0) timeElapsed = 1; // avoid divide by zero
        
        let wpm = Math.round(((charIndex - mistakes) / 5) / (timeElapsed / 60));
        wpm = wpm < 0 || !wpm || wpm === Infinity ? 0 : wpm;
        
        wpmTag.innerText = wpm;
        mistakeTag.innerText = mistakes;
        
        let accuracy = Math.round(((charIndex - mistakes) / charIndex) * 100);
        accuracyTag.innerText = `${isNaN(accuracy) ? 100 : accuracy}%`;
    });

    function initTimer() {
        if (timeLeft > 0) {
            timeLeft--;
            timeTag.innerText = `${timeLeft}s`;
        } else {
            clearInterval(timer);
        }
    }

    function resetGame() {
        loadParagraph();
        clearInterval(timer);
        timeLeft = maxTime;
        charIndex = mistakes = 0;
        isTyping = false;
        inpField.value = "";
        timeTag.innerText = `${timeLeft}s`;
        wpmTag.innerText = 0;
        mistakeTag.innerText = 0;
        accuracyTag.innerText = "100%";
    }

    loadParagraph();
    tryAgainBtn.addEventListener("click", resetGame);

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

