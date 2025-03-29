const WebSocket = require("ws");
const static = require("node-static");
const http = require("http");

const PORT = 3000;

// Serve static files (HTML, JS)
const fileServer = new static.Server("./public");

const server = http.createServer((req, res) => {
  req.addListener("end", () => fileServer.serve(req, res)).resume();
});

// WebSocket Server for Audio Streaming
const wss = new WebSocket.Server({ server });

wss.on("connection", (ws) => {
  console.log("Client connected to WebSocket for audio streaming");

  ws.on("message", (message) => {
    // Broadcast audio data to all connected clients (Chromecast)
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });

  ws.on("close", () => {
    console.log("Client disconnected");
  });
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
