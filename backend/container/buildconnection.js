import { URL } from "url";

export function handleUpgrade(req, socket, head, wss) {
  try {
    if (!req || !req.url) {
      console.error("Invalid request object");
      socket.destroy();
      return;
    }
    const pathname = new URL(req.url, `http://${req.headers.host}`).pathname;

    if (!pathname) {
      console.error("Invalid URL: no pathname");
      socket.destroy();
      return;
    }

    const pathParts = pathname.split("/");
    const [, route, sessionId, userId, right] = pathParts;
    if (route !== "ws" || !sessionId || !userId || !right) {
      console.error("Invalid WebSocket path format:", pathname);
      socket.destroy();
      return;
    }

    if (!["read", "write"].includes(right)) {
      console.log(`Rejected connection with invalid right: ${right}`);
      socket.destroy();
      return;
    }

    // Validate sessionId and userId format
    if (
      !/^[a-zA-Z0-9_-]+$/.test(sessionId) ||
      !/^[a-zA-Z0-9_-]+$/.test(userId)
    ) {
      console.error("Invalid sessionId or userId format");
      socket.destroy();
      return;
    }

    wss.handleUpgrade(req, socket, head, (ws) => {
      try {
        ws.sessionId = sessionId;
        ws.userId = userId;
        ws.right = right;
        wss.emit("connection", ws, req);
      } catch (error) {
        console.error("Error in handleUpgrade callback:", error);
        ws.terminate();
      }
    });
  } catch (error) {
    console.error("Upgrade failed:", error.message || error);
    try {
      socket.destroy();
    } catch (destroyError) {
      console.error("Error destroying socket:", destroyError);
    }
  }
}

export function broadcastToSession(
  sessionId,
  message,
  { activeSessions, sessionOutputs, sessionCommandInfo }
) {
  try {
    if (!sessionId || !message) {
      console.error("broadcastToSession: Invalid parameters");
      return;
    }

    const sessionUsers = activeSessions.get(sessionId);
    if (!sessionUsers || !Array.isArray(sessionUsers)) {
      console.warn(`No active users found for session: ${sessionId}`);
      return;
    }

    const messageString = JSON.stringify(message);

    sessionUsers.forEach(({ userId, ws }) => {
      try {
        if (ws && ws.readyState === ws.OPEN) {
          ws.send(messageString);
        }
      } catch (e) {
        console.error(`Error broadcasting to user ${userId}:`, e);
        // Remove dead connection
        try {
          const updatedUsers = sessionUsers.filter((u) => u.userId !== userId);
          if (updatedUsers.length === 0) {
            activeSessions.delete(sessionId);
            sessionOutputs.delete(sessionId);
            sessionCommandInfo.delete(sessionId);
          } else {
            activeSessions.set(sessionId, updatedUsers);
          }
        } catch (cleanupError) {
          console.error("Error cleaning up dead connection:", cleanupError);
        }
      }
    });
  } catch (error) {
    console.error("Error in broadcastToSession:", error);
  }
}
