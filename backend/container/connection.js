import { WebSocketServer, WebSocket } from "ws";
import url from "url";

export function setupWebSocket(server) {
  const wss = new WebSocketServer({ noServer: true });

  const sessionMap = new Map();

  // Handle upgrade request to get the dynamic sessionId from URL
  server.on("upgrade", (req, socket, head) => {
    const parsedUrl = url.parse(req.url);
    const pathname = parsedUrl.pathname || "";

    // Expecting URL like /ws/SESSIONID/USERID
    const pathParts = pathname.split("/");

    if (pathParts.length !== 4 || pathParts[1] !== "ws") {
      console.log("Invalid path for websocket:", pathname);
      socket.destroy();
      return;
    }

    const sessionId = pathParts[2];
    const userId = pathParts[3];
    if (!sessionId) {
      console.log("No sessionId found in URL:", pathname);
      socket.destroy();
      return;
    }

    // Upgrade and emit connection event, pass sessionId
    wss.handleUpgrade(req, socket, head, (ws) => {
      // Attach sessionId to ws instance for later use
      ws.sessionId = sessionId;
      ws.userId = userId;
      wss.emit("connection", ws, req);
    });
  });

  // Now handle connection with sessionId attached
  wss.on("connection", (frontendSocket, req) => {
    const sessionId = frontendSocket.sessionId;
    const userId = frontendSocket.userId;
    console.log(`🔌 Frontend connected for session: ${sessionId}`);

    // Connect to backend pod WebSocket dynamically using sessionId
    const backendSocket = new WebSocket(`ws://service-${sessionId}:8080/ws`);

    sessionMap.set(sessionId, { frontendSocket, backendSocket });

    backendSocket.on("open", () => {
      console.log(`✅ Connected to backend pod for session ${sessionId}`);
      backendSocket.send(JSON.stringify({ type: "join", data: userId+"/"+sessionId+"/" }));
    });

    backendSocket.on("message", (backendMsg) => {
      if (frontendSocket.readyState === WebSocket.OPEN) {
        frontendSocket.send(backendMsg.toString());
      }
    });

    frontendSocket.on("message", (frontendMsg) => {
      if (backendSocket.readyState === WebSocket.OPEN) {
        backendSocket.send(frontendMsg.toString());
      }
    });

    const cleanup = () => {
      console.log(`❌ Closing session: ${sessionId}`);
      sessionMap.delete(sessionId);
      if (backendSocket.readyState === WebSocket.OPEN) backendSocket.close();
      if (frontendSocket.readyState === WebSocket.OPEN) frontendSocket.close();
    };

    frontendSocket.on("close", cleanup);
    backendSocket.on("close", cleanup);
    backendSocket.on("error", (err) =>
      console.error(`❌ Backend WS error [${sessionId}]:`, err)
    );
  });

  console.log(
    "🌐 WebSocket server setup complete (dynamic path /ws/:sessionId)"
  );
}
