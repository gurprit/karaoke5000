let castSession = null;
let audioContext, source, destination;

// Initialize Chromecast API
function initializeCastApi() {
    const sessionRequest = new chrome.cast.SessionRequest(chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID);
    const apiConfig = new chrome.cast.ApiConfig(sessionRequest, session => {
        castSession = session;
    });
    chrome.cast.initialize(apiConfig, () => console.log("Cast initialized"), console.error);
}

// Load YouTube Video on Chromecast
function castYouTube(videoId) {
    if (!castSession) {
        console.error("No active cast session");
        return;
    }
    const mediaInfo = new chrome.cast.media.MediaInfo(`https://www.youtube.com/watch?v=${videoId}`, 'video/mp4');
    const request = new chrome.cast.media.LoadRequest(mediaInfo);
    castSession.loadMedia(request);
}

// Capture Microphone Audio and Stream
async function startMicStreaming() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioContext = new AudioContext();
        source = audioContext.createMediaStreamSource(stream);
        destination = audioContext.createMediaStreamDestination();

        // Add a delay to sync with Chromecast video
        const delayNode = audioContext.createDelay();
        delayNode.delayTime.value = 1.0; // Adjust as needed
        source.connect(delayNode);
        delayNode.connect(destination);

        // Play audio to test streaming
        const audioElement = new Audio();
        audioElement.srcObject = destination.stream;
        audioElement.play();

        console.log("Microphone streaming started");
    } catch (error) {
        console.error("Error accessing microphone:", error);
    }
}

// Start Casting and Streaming
function startKaraoke() {
    const videoId = document.getElementById("videoId").value;
    if (videoId) {
        castYouTube(videoId);
        startMicStreaming();
    } else {
        alert("Please enter a YouTube video ID");
    }
}

// Initialize Chromecast API on page load
window.onload = initializeCastApi;

// Attach event listener to start button
document.getElementById('startButton').addEventListener('click', startKaraoke);
