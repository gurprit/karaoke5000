let localStream;
let peerConnection;
let ws;

const config = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };

// Connect to WebSocket for WebRTC signaling
function connectWebSocket() {
    ws = new WebSocket("ws://localhost:3000");

    ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        if (message.offer) {
            handleOffer(message.offer);
        } else if (message.answer) {
            peerConnection.setRemoteDescription(new RTCSessionDescription(message.answer));
        } else if (message.candidate) {
            peerConnection.addIceCandidate(new RTCIceCandidate(message.candidate));
        }
    };

    ws.onopen = () => console.log("WebSocket connected.");
}

// Start microphone and WebRTC connection
async function startMicAndStream() {
    try {
        localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        peerConnection = new RTCPeerConnection(config);

        localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

        peerConnection.onicecandidate = event => {
            if (event.candidate) {
                ws.send(JSON.stringify({ candidate: event.candidate }));
            }
        };

        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);

        ws.send(JSON.stringify({ offer }));
        console.log("Microphone streaming started.");
    } catch (error) {
        console.error("Error accessing microphone:", error);
    }
}

// Chromecast Setup
function initializeCastApi() {
    if (!chrome.cast || !chrome.cast.isAvailable) {
        setTimeout(initializeCastApi, 1000);
        return;
    }

    const sessionRequest = new chrome.cast.SessionRequest(chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID);
    const apiConfig = new chrome.cast.ApiConfig(sessionRequest, session => {
        console.log("Connected to Chromecast:", session);
        castSession = session;
        startCasting();
    }, error => console.error("Cast initialization failed:", error));

    chrome.cast.initialize(apiConfig, () => console.log("Chromecast API initialized"), console.error);
}

// Load Audio Stream on Chromecast
function startCasting() {
    if (!castSession) {
        alert("No active Chromecast session. Click 'Connect to Chromecast' first.");
        return;
    }

    const mediaInfo = new chrome.cast.media.MediaInfo("http://localhost:3000/audio-stream", "audio/wav");
    const request = new chrome.cast.media.LoadRequest(mediaInfo);

    castSession.loadMedia(request, () => console.log("Microphone audio is casting..."), error => console.error("Error casting microphone audio:", error));
}

// Initialize Chromecast API on Page Load
window.onload = () => {
    initializeCastApi();
    connectWebSocket();
};

// Attach Event Listeners
document.getElementById("connectButton").addEventListener("click", () => {
    chrome.cast.requestSession(session => {
        castSession = session;
        startMicAndStream();
    }, error => console.error("Error starting cast session:", error));
});
