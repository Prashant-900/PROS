const express = require("express");
const cors = require("cors");
const http = require("http");
const bodyParser = require("body-parser");
const { initializeWebSocket } = require("./socket.js");
const {router} = require("./route.js");

const app = express();
const port = 8080;

app.use(bodyParser.json());
app.use(cors({ origin: "*" }));
app.use("/", router);

// Configuration
const config = {
  BASE_TEMPLATES_DIR: process.cwd(), // Set your default path here
};

// HTTP server setup
const server = http.createServer(app);

// Initialize WebSocket
initializeWebSocket(server, config);

// Start the server
server.listen(port, "0.0.0.0", () => {
  console.log(`🚀 Pod server running on port ${port}`);
  console.log(`📂 All file operations are confined to: ${config.BASE_TEMPLATES_DIR}`);
});