let castSession = null;
let mediaRecorder, audioStream;
let ws; // WebSocket connection

// Initialize Chromecast API
function initializeCastApi() {
    if (!chrome.cast || !chrome.cast.isAvailable) {
        setTimeout(initializeCastApi, 1000);
        return;
    }

    const sessionRequest = new chrome.cast.SessionRequest(chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID);
    const apiConfig = new chrome.cast.ApiConfig(
        sessionRequest,
        session => {
            castSession = session;
            console.log("Connected to Chromecast:", castSession);
        },
        error => console.error("Cast initialization failed:", error)
    );

    chrome.cast.initialize(apiConfig, () => {
        console.log("Chromecast API initialized");
    }, console.error);
}

// Request Chromecast Connection
function requestCastSession() {
    chrome.cast.requestSession(session => {
        castSession = session;
        console.log("Casting session started");
        castMicAudio(); // Start mic audio stream
    }, error => {
        console.error("Error starting cast session:", error);
    });
}

// Start Streaming Microphone Audio via WebSocket
async function startMicStreaming() {
    try {
        audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        ws = new WebSocket("ws://localhost:3000"); // Connect to WebSocket server

        mediaRecorder = new MediaRecorder(audioStream);
        mediaRecorder.ondataavailable = event => {
            if (event.data.size > 0) {
                ws.send(event.data);
            }
        };

        mediaRecorder.start(100); // Send mic data every 100ms
        console.log("Microphone streaming started");
    } catch (error) {
        console.error("Error accessing microphone:", error);
    }
}

// Cast Audio Stream to Chromecast
function castMicAudio() {
    if (!castSession) {
        alert("No active Chromecast session. Click 'Connect to Chromecast' first.");
        return;
    }

    const mediaInfo = new chrome.cast.media.MediaInfo("http://localhost:3000/audio-stream", "audio/wav");
    const request = new chrome.cast.media.LoadRequest(mediaInfo);

    castSession.loadMedia(request, () => {
        console.log("Microphone audio is casting...");
    }, error => {
        console.error("Error casting microphone audio:", error);
    });
}

// Start Audio Casting Process
function startAudioOnlyCasting() {
    requestCastSession(); // Connect to Chromecast
    setTimeout(() => {
        startMicStreaming(); // Start mic stream after connection
    }, 2000);
}

// Initialize Chromecast API on Page Load
window.onload = initializeCastApi;

// Attach Event Listeners
document.getElementById('connectButton').addEventListener('click', startAudioOnlyCasting);
