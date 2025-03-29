let castSession = null;
let audioContext, source, destination;

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

// Request to Start Casting to Chromecast
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

// Capture and Send Microphone Audio
async function startMicStreaming() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioContext = new AudioContext();
        source = audioContext.createMediaStreamSource(stream);
        destination = audioContext.createMediaStreamDestination();

        // Delay to Sync with Chromecast Video
        const delayNode = audioContext.createDelay();
        delayNode.delayTime.value = 1.0; // Adjust as needed
        source.connect(delayNode);
        delayNode.connect(destination);

        // Create an Audio Element to Play on the TV
        const audioElement = new Audio();
        audioElement.srcObject = destination.stream;
        audioElement.play();

        console.log("Microphone streaming started");
    } catch (error) {
        console.error("Error accessing microphone:", error);
    }
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
