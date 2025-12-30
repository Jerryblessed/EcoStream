/**
 * EcoStream AI - Main Frontend Logic
 * Integrated with Google OAuth, Google Maps, Web Speech API, and ElevenLabs
 */

let userToken = null;
let map;
let currentMarker = null;

// --- 1. IDENTITY LOGIC ---
// We attach this to 'window' so the Google GSI library can find it
window.handleCredentialResponse = (response) => {
    userToken = response.credential;
    document.getElementById("login-container").classList.add("hidden");
    document.getElementById("main-app").classList.remove("hidden");
    initMap();
};

// --- 2. MAP LOGIC ---
async function initMap() {
    try {
        const { Map } = await google.maps.importLibrary("maps");
        map = new Map(document.getElementById("map"), {
            center: { lat: 6.5244, lng: 3.3792 }, // Lagos
            zoom: 12,
            mapId: "4504f8b373f3ca48", // Professional Vector Map ID
            disableDefaultUI: true,
            zoomControl: true
        });
    } catch (error) {
        console.error("Map initialization failed:", error);
    }
}

// --- 3. VOICE RECOGNITION LOGIC ---
function toggleMic() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
        alert("Sir, your browser does not support voice features. Please use Google Chrome.");
        return;
    }

    const recognition = new SpeechRecognition();
    const btn = document.getElementById("micBtn");
    const status = document.getElementById("status");

    recognition.lang = 'en-US';
    recognition.interimResults = false;

    recognition.onstart = () => {
        btn.classList.add("listening");
        status.innerText = "Listening to your request...";
    };

    recognition.onresult = async (event) => {
        const query = event.results[0][0].transcript;
        status.innerText = `Searching for: "${query}"`;
        await callBackend(query);
    };

    recognition.onerror = (event) => {
        btn.classList.remove("listening");
        status.innerText = "Speech recognition error. Please try again.";
        console.error("Speech Error:", event.error);
    };

    recognition.onend = () => {
        btn.classList.remove("listening");
    };

    recognition.start();
}

// --- 4. BACKEND COMMUNICATION ---
async function callBackend(query) {
    const status = document.getElementById("status");
    const welcome = document.getElementById("welcome");
    const carbonContainer = document.getElementById("carbon-container");
    const carbonVal = document.getElementById("carbon-val");

    try {
        const response = await fetch('/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: query, credential: userToken })
        });

        if (!response.ok) throw new Error("Server communication failed");

        const data = await response.json();

        // UI Updates
        welcome.innerText = `Success, ${data.user_name}!`;
        status.innerText = data.answer;

        // Carbon Transparency Badge
        if (data.carbon_saved !== undefined) {
            carbonVal.innerText = data.carbon_saved;
            carbonContainer.classList.remove("hidden");
        }

        // Play ElevenLabs Audio (Rachel's Voice)
        if (data.audio) {
            const audio = new Audio(`data:audio/mp3;base64,${data.audio}`);
            audio.play().catch(e => console.warn("Audio playback blocked by browser:", e));
        }

        // Drop Map Marker
        if (data.location) {
            updateMarker(data.location, data.market_name);
        }

    } catch (err) {
        console.error("Backend Error:", err);
        status.innerText = "Sir, I encountered an error connecting to the AI brain.";
    }
}

// --- 5. MAP MARKER LOGIC ---
async function updateMarker(pos, title) {
    const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");

    // Clear old marker if it exists
    if (currentMarker) currentMarker.setMap(null);

    currentMarker = new AdvancedMarkerElement({
        map: map,
        position: pos,
        title: title,
    });

    // Smoothly pan to the new market location
    map.panTo(pos);
    map.setZoom(15);
}

// Global Exports for button clicks
window.toggleMic = toggleMic;