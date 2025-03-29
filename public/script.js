let castSession = null;
let mediaElement, mediaStreamSource, mediaRecorder;
let audioChunks = [];

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

// Request a Chromecast session
function requestCastSession() {
    chrome.cast.requestSession(session => {
        castSession = session;
        console.log("Casting session started");
    }, error => {
        console.error("Error starting cast session:", error);
    });
}

// Load YouTube Karaoke Video on Chromecast
function castYouTube(videoId) {
    if (!castSession) {
        alert("No active Chromecast session. Click 'Connect to Chromecast' first.");
        return;
    }

    const mediaInfo = new chrome.cast.media.MediaInfo(`https://www.youtube.com/watch?v=${videoId}`, 'video/mp4');
    const request = new chrome.cast.media.LoadRequest(mediaInfo);

    castSession.loadMedia(request, () => {
        console.log("Video is casting...");
    }, error => {
        console.error("Error casting video:", error);
    });
}

// Capture Microphone Audio and Stream it to Chromecast
async function startMicStreaming() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

        // Create a media element to hold the stream
        mediaElement = new Audio();
        mediaElement.srcObject = stream;
        mediaElement.muted = true; // Mute local playback

        // Create a MediaRecorder to capture audio data
        mediaRecorder = new MediaRecorder(stream);
        mediaRecorder.ondataavailable = event => {
            if (event.data.size > 0) {
                audioChunks.push(event.data);
            }
        };

        mediaRecorder.onstop = async () => {
            // Convert audio to Blob and send to Chromecast
            const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
            const audioUrl = URL.createObjectURL(audioBlob);

            castMicAudio(audioUrl);
        };

        mediaRecorder.start();
        console.log("Microphone streaming started");
    } catch (error) {
        console.error("Error accessing microphone:", error);
    }
}

// Send Microphone Audio to Chromecast
function castMicAudio(audioUrl) {
    if (!castSession) {
        alert("No active Chromecast session. Click 'Connect to Chromecast' first.");
        return;
    }

    const mediaInfo = new chrome.cast.media.MediaInfo(audioUrl, "audio/webm");
    const request = new chrome.cast.media.LoadRequest(mediaInfo);

    castSession.loadMedia(request, () => {
        console.log("Microphone audio is casting...");
    }, error => {
        console.error("Error casting microphone audio:", error);
    });
}

// Start Karaoke: Connect, Load Video, and Sync Audio
function startKaraoke() {
    const videoId = document.getElementById("videoId").value;
    if (!videoId) {
        alert("Please enter a YouTube video ID");
        return;
    }

    requestCastSession(); // Connect to Chromecast
    setTimeout(() => {
        castYouTube(videoId);
        startMicStreaming();
    }, 2000); // Delay to allow Chromecast to load video
}

// Initialize Chromecast API on Page Load
window.onload = initializeCastApi;

// Attach Event Listeners
document.getElementById('startButton').addEventListener('click', startKaraoke);
document.getElementById('connectButton').addEventListener('click', requestCastSession);
