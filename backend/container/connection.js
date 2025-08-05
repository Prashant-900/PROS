import { WebSocketServer } from "ws";
import { PassThrough } from "stream";
import { getTree, initKubernetesClient } from "./function.js";
import { broadcastToSession, handleUpgrade } from "./buildconnection.js";

function setupWebSocket(server) {
  const wss = new WebSocketServer({ noServer: true });
  const activeSessions = new Map(); // Map<sessionId, {userId: string, right: string, ws: WebSocket}[]>
  const sessionOutputs = new Map(); // Map<sessionId, {stdout: string[], stderr: string[]}>
  const sessionCommandInfo = new Map(); // Map<sessionId, { userId: string, type: string, data: string }>

  let { kc, exec } = initKubernetesClient();

  async function handleConnection(ws) {
    try {
      if (!ws || !ws.sessionId || !ws.userId || !ws.right) {
        console.error("Invalid WebSocket connection parameters");
        if (ws) ws.terminate();
        return;
      }

      const { sessionId, userId, right } = ws;
      console.log(
        `✅ New connection: (session: ${sessionId}, user: ${userId}, right: ${right})`
      );

      // Initialize session data if not exists
      if (!activeSessions.has(sessionId)) {
        activeSessions.set(sessionId, []);
        sessionOutputs.set(sessionId, { stdout: [], stderr: [] });
      }

      const sessionUsers = activeSessions.get(sessionId);
      if (!Array.isArray(sessionUsers)) {
        console.error("Session users is not an array");
        ws.terminate();
        return;
      }

      sessionUsers.push({ userId, right, ws });
      activeSessions.set(sessionId, sessionUsers);

      // Send existing outputs to read users
      if (right === "read") {
        try {
          const outputs = sessionOutputs.get(sessionId);
          if (outputs && Array.isArray(outputs.stdout)) {
            outputs.stdout.forEach((data) => {
              if (ws.readyState === ws.OPEN) {
                ws.send(JSON.stringify({ type: "stdout", data }));
              }
            });
          }
          if (outputs && Array.isArray(outputs.stderr)) {
            outputs.stderr.forEach((data) => {
              if (ws.readyState === ws.OPEN) {
                ws.send(JSON.stringify({ type: "stdout", data }));
              }
            });
          }
        } catch (error) {
          console.error("Error sending existing outputs:", error);
        }
      }

      // Setup write user streams
      if (
        right === "write" &&
        !sessionUsers.some((u) => u.right === "write" && u.userId !== userId)
      ) {
        if (!exec) {
          console.error("Kubernetes client not available for write user");
          if (ws.readyState === ws.OPEN) {
            ws.send(
              JSON.stringify({
                type: "error",
                data: "Kubernetes client not available",
              })
            );
          }
          return;
        }

        const stdin = new PassThrough();
        const stdout = new PassThrough();
        const stderr = new PassThrough();

        ws.stdin = stdin;

        // Add error handlers for streams
        stdin.on("error", (error) => {
          console.error("Stdin stream error:", error);
        });

        stdout.on("error", (error) => {
          console.error("Stdout stream error:", error);
        });

        stderr.on("error", (error) => {
          console.error("Stderr stream error:", error);
        });

        stdout.on("data", (chunk) => {
          try {
            if (!chunk) return;

            const data = chunk.toString();
            console.log("Received stdout:", data);

            const outputs = sessionOutputs.get(sessionId);
            if (outputs && Array.isArray(outputs.stdout)) {
              if (!outputs.stdout.includes(data)) {
                outputs.stdout.push(data);
                sessionOutputs.set(sessionId, outputs);
              }
            }

            const commandInfo = sessionCommandInfo.get(sessionId);
            console.log(commandInfo)
            if(commandInfo && commandInfo.type !== "code") {     
              if (commandInfo && commandInfo.type === "filecontent") {
                const targetUser = activeSessions
                  .get(sessionId)
                  ?.find((u) => u.userId === commandInfo.userId);
                if (
                  targetUser?.ws &&
                  targetUser.ws.readyState === targetUser.ws.OPEN
                ) {
                  const trimeddata = data.trim();
                  if (trimeddata !== "#" && trimeddata !== commandInfo.cmd.trim()) {
                    targetUser.ws.send(
                      JSON.stringify({ type: "filecontent", data:trimeddata })
                    );
                  }
                }
              } else if (commandInfo && commandInfo.type === "stdout") {
                broadcastToSession(
                  sessionId,
                  { type: "stdout", data },
                  {
                    activeSessions,
                    sessionOutputs,
                    sessionCommandInfo,
                  }
                );
              }
            }
          } catch (error) {
            console.error("Error handling stdout data:", error);
          }
        });

        stderr.on("data", (chunk) => {
          try {
            if (!chunk) return;

            const data = chunk.toString();
            console.log("Received stderr:", data);

            const outputs = sessionOutputs.get(sessionId);
            if (outputs && Array.isArray(outputs.stderr)) {
              outputs.stderr.push(data);
              sessionOutputs.set(sessionId, outputs);
            }

            broadcastToSession(
              sessionId,
              { type: "stdout", data },
              {
                activeSessions,
                sessionOutputs,
                sessionCommandInfo,
              }
            );
          } catch (error) {
            console.error("Error handling stderr data:", error);
          }
        });

        try {
          await exec.exec(
            "default",
            `pod-${sessionId.split("-")[0]}`,
            "user-container",
            ["/bin/sh"],
            stdout,
            stderr,
            stdin,
            true,
            (status) => {
              try {
                console.log("🚀 Pod exited with status", status);
                broadcastToSession(
                  sessionId,
                  {
                    type: "retry",
                    data: "Session terminated",
                  },
                  {
                    activeSessions,
                    sessionOutputs,
                    sessionCommandInfo,
                  }
                );

                activeSessions.delete(sessionId);
                sessionOutputs.delete(sessionId);
                sessionCommandInfo.delete(sessionId);
              } catch (error) {
                console.error("Error in pod exit handler:", error);
              }
            }
          );
        } catch (err) {
          console.error("Exec error:", err);
          broadcastToSession(
            sessionId,
            {
              type: "stdout",
              data: `Exec failed: ${err.message || "Unknown error"}`,
            },
            {
              activeSessions,
              sessionOutputs,
              sessionCommandInfo,
            }
          );
        }
      }

      // Message handler
      ws.on("message", async (message) => {
        try {
          if (!message) return;

          const msg = JSON.parse(message.toString());
          if (!msg || typeof msg !== "object") {
            console.error("Invalid message format");
            return;
          }

          const isWriter = ws.right === "write";

          if (isWriter || msg.type === "filecontent") {
            sessionCommandInfo.set(sessionId, {
              userId,
              type: msg.type,
              cmd: msg.cmd,
            });

            // All commands go through the write user's stdin
            const writeUser = activeSessions
              .get(sessionId)
              ?.find((u) => u.right === "write");

            if (writeUser?.ws?.stdin) {
              try {
                writeUser.ws.stdin.write(msg.cmd);
              } catch (writeError) {
                console.error("Error writing to stdin:", writeError);
              }
            } else {
              console.warn("No write user or stdin available");
            }

            // If command can change file structure, refresh the tree
            if (msg.type === "tree") {
              setTimeout(() => {
                try {
                  const sessionUsers = activeSessions.get(sessionId);
                  if (sessionUsers && Array.isArray(sessionUsers)) {
                    sessionUsers.forEach(({ ws: userWs }) => {
                      if (userWs && userWs.readyState === userWs.OPEN) {
                        getTree(sessionId, userWs).catch((e) =>
                          console.error("Error refreshing tree:", e)
                        );
                      }
                    });
                  }
                } catch (error) {
                  console.error("Error in tree refresh timeout:", error);
                }
              }, 500);
            }
          }
        } catch (err) {
          console.error("Error handling message:", err);
        }
      });

      // Initial tree load
      setTimeout(() => {
        if (ws.readyState === ws.OPEN) {
          getTree(sessionId, ws).catch((e) =>
            console.error("Error sending initial tree:", e)
          );
        }
      }, 1000);

      // Close handler
      ws.on("close", () => {
        try {
          console.log(
            `🔌 WebSocket closed for session ${sessionId}, user ${userId}`
          );

          const sessionUsers = activeSessions.get(sessionId);
          if (sessionUsers && Array.isArray(sessionUsers)) {
            const updatedUsers = sessionUsers.filter(
              (u) => u.userId !== userId
            );
            if (updatedUsers.length === 0) {
              activeSessions.delete(sessionId);
              sessionOutputs.delete(sessionId);
              sessionCommandInfo.delete(sessionId);
            } else {
              activeSessions.set(sessionId, updatedUsers);
            }
          }
        } catch (error) {
          console.error("Error in close handler:", error);
        }
      });

      // Error handler
      ws.on("error", (err) => {
        try {
          console.error(
            `⚠️ WebSocket error for session ${sessionId}, user ${userId}:`,
            err
          );

          const sessionUsers = activeSessions.get(sessionId);
          if (sessionUsers && Array.isArray(sessionUsers)) {
            const updatedUsers = sessionUsers.filter(
              (u) => u.userId !== userId
            );
            if (updatedUsers.length === 0) {
              activeSessions.delete(sessionId);
              sessionOutputs.delete(sessionId);
              sessionCommandInfo.delete(sessionId);
            } else {
              activeSessions.set(sessionId, updatedUsers);
            }
          }
        } catch (error) {
          console.error("Error in error handler:", error);
        }
      });
    } catch (error) {
      console.error("Error in handleConnection:", error);
      if (ws) {
        try {
          ws.terminate();
        } catch (terminateError) {
          console.error("Error terminating WebSocket:", terminateError);
        }
      }
    }
  }

  // Add error handlers for the server and WebSocket server
  server.on("error", (error) => {
    console.error("Server error:", error);
  });

  wss.on("error", (error) => {
    console.error("WebSocket server error:", error);
  });

  server.on("upgrade", (req, socket, head) => {
    handleUpgrade(req, socket, head, wss);
  });

  wss.on("connection", handleConnection);

  console.log("🌐 WebSocket server running at /ws/:sessionId/:userId/:right");

  return {
    close: () => {
      try {
        activeSessions.forEach((users) => {
          if (Array.isArray(users)) {
            users.forEach(({ ws }) => {
              try {
                if (ws && ws.readyState === ws.OPEN) {
                  ws.close();
                }
              } catch (error) {
                console.error("Error closing WebSocket:", error);
              }
            });
          }
        });

        activeSessions.clear();
        sessionOutputs.clear();
        sessionCommandInfo.clear();

        wss.close((error) => {
          if (error) {
            console.error("Error closing WebSocket server:", error);
          }
        });
      } catch (error) {
        console.error("Error in close function:", error);
      }
    },
  };
}

export { setupWebSocket };
