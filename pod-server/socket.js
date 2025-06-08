const WebSocket = require("ws");
const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");
const chokidar = require("chokidar");
const Minio = require("minio");

const minioClient = new Minio.Client({
  endPoint: "minio-service",
  port: 9000,
  useSSL: false,
  accessKey: "minioadmin",
  secretKey: "minioadmin",
});

/**
 * Gets a tree-like structure of files and directories.
 * @param {string} dirPath - The directory to create the tree for.
 * @returns {object} A hierarchical object representing the file tree.
 */
function getFileTree(dirPath) {
  const stats = fs.statSync(dirPath);

  if (stats.isFile()) {
    return {
      type: "file",
      name: path.basename(dirPath),
      path: dirPath, // Add full path for reference
    };
  }

  const children = fs
    .readdirSync(dirPath)
    .filter((f) => f !== "node_modules" && f !== ".git")
    .map((file) => {
      const childPath = path.join(dirPath, file);
      return getFileTree(childPath);
    });

  return {
    type: "directory",
    name: path.basename(dirPath),
    path: dirPath, // Add full path for reference
    children,
  };
}

/**
 * Initializes WebSocket server with structured message handling
 * @param {http.Server} server - HTTP server instance
 * @param {object} config - Configuration object
 * @param {string} config.BASE_TEMPLATES_DIR - Base directory for file operations
 */
function initializeWebSocket(server, config) {
  const wss = new WebSocket.Server({ server, path: "/ws" });
  let killTimeout = null;

  // Timer management functions
  const startKillTimer = () => {
    clearKillTimer();
    killTimeout = setTimeout(() => {
      console.log("⏳ No connection for 30s, shutting down pod");
      process.exit(1);
    }, 30000);
  };

  const clearKillTimer = () => {
    if (killTimeout) {
      clearTimeout(killTimeout);
      killTimeout = null;
    }
  };

  startKillTimer();

  wss.on("connection", (ws) => {
    clearKillTimer();
    console.log("🔌 WebSocket connected");

    // Client state initialization
    ws.allowedRootDir = config.BASE_TEMPLATES_DIR;
    ws.currentCwd = config.BASE_TEMPLATES_DIR;

    const getDisplayedPath = (fullPath) => {
      return path.relative(ws.allowedRootDir, fullPath) || "./";
    };

    // Send initial state to client
    const sendInitialState = () => {
      ws.send(
        JSON.stringify({
          type: "filetree",
          data: getFileTree(ws.allowedRootDir),
        })
      );
      ws.send(
        JSON.stringify({
          type: "stdout",
          data: `Current directory: ${getDisplayedPath(ws.currentCwd)}\n`,
        })
      );
    };

    sendInitialState();

    // Handle incoming messages
    ws.on("message", async (message) => {
      try {
        const { type, data, show } = parseMessage(message);

        if (type === "error") {
          sendError(ws, data);
          return;
        }

        switch (type) {
          case "cmd":
            await handleCommand(ws, data);
            break;
          case "filecmd":
            await handleFileCommand(ws, data, show);
            break;
          case "join":
            await syncFolderFromBucket("my-bucket",data, ws.currentCwd); // ← was BASE_TEMPLATES_DIR, fixed to ws.currentCwd
            ws.send(
              JSON.stringify({
                type: "stdout",
                data: `📥 Synced files from bucket "${data}" to ${getDisplayedPath(
                  ws.currentCwd
                )}\n`,
              })
            );
            break;

          default:
            sendError(ws, `Unknown message type: ${type}`);
        }
      } catch (error) {
        sendError(ws, "Internal server error");
      }
    });

    ws.on("close", () => {
      console.log("🔌 WebSocket disconnected");
      startKillTimer();
    });
  });

  // Set up file system watcher
  const watcher = chokidar.watch(config.BASE_TEMPLATES_DIR, {
    ignored: /(^|[\/\\])\..|node_modules/,
    persistent: true,
    ignoreInitial: true,
  });

  watcher.on("all", (event, filePath) => {
    console.log(`File system event: ${event} on ${filePath}`);
    broadcastFileTree(wss);
  });

  return wss;
}

// Helper functions

/**
 * Parses an incoming WebSocket message. Expects JSON with 'type' and 'data' fields.
 * If parsing fails or the expected structure is not found, it returns an 'error' type.
 * @param {string|Buffer} message - The raw message received from the WebSocket.
 * @returns {object} An object containing { type, data } or { type: "error", data: "message" }.
 */
function parseMessage(message) {
  try {
    const messageString =
      typeof message === "string" ? message : message.toString();
    const parsed = JSON.parse(messageString);
    // Handle both old and new formats
    if (parsed.data.cmd !== undefined || parsed.data.show !== undefined) {
      return {
        type: "filecmd",
        data: parsed.data.cmd,
        show: parsed.data.show || false,
      };
    }

    if (
      typeof parsed === "object" &&
      parsed !== null &&
      typeof parsed.type === "string" &&
      parsed.data !== undefined
    ) {
      return parsed;
    }

    return { type: "error", data: "Malformed message" };
  } catch (error) {
    return { type: "error", data: `Failed to parse message: ${error.message}` };
  }
}

async function syncFolderFromBucket(bucketName, folderPath, destDir) {
  const stream = minioClient.listObjectsV2(bucketName, folderPath, true);

  const objects = [];
  for await (const obj of stream) {
    objects.push(obj);
  }

  if (objects.length === 0) {
    console.log(`📂 Folder "${folderPath}" not found in bucket "${bucketName}"`);
    return;
  }

  console.log(`📥 Downloading ${objects.length} file(s) from "${folderPath}"`);

  for (const obj of objects) {
    const objectKey = obj.name;
    const relativePath = objectKey.slice(folderPath.length); // remove folder prefix
    const filePath = path.join(destDir, relativePath);

    // Ensure subdirectories exist
    fs.mkdirSync(path.dirname(filePath), { recursive: true });

    const fileStream = fs.createWriteStream(filePath);
    await minioClient.getObject(bucketName, objectKey).then(dataStream => {
      dataStream.pipe(fileStream);
    });

    console.log(`✅ Saved ${objectKey} → ${filePath}`);
  }
}


async function handleCommand(ws, command) {
  const [cmd, ...args] = command.trim().split(/\s+/);

  if (cmd === "cd") {
    await handleChangeDirectory(ws, args[0] || "./");
  } else {
    executeCommand(ws, command, "stdout");
  }
}

async function handleFileCommand(ws, command, show = false) {
  const [cmd, ...args] = command.trim().split(/\s+/);

  if (show) {
    // Handle file content display
    const filePath = path.resolve(ws.currentCwd, command);

    // Security check
    if (!filePath.startsWith(ws.allowedRootDir)) {
      return sendMessage(
        ws,
        "filecontent",
        "Error: Cannot access files outside allowed directory"
      );
    }

    try {
      const content = await fs.promises.readFile(filePath, "utf8");
      sendMessage(ws, "filecontent", content);
    } catch (error) {
      sendMessage(ws, "filecontent", `Error reading file: ${error.message}`);
    }
  } else {
    // Normal file commands
    if (cmd === "cd") {
      await handleChangeDirectory(ws, args[0] || "./", "filecmd_response");
    } else {
      executeCommand(ws, command, "filecmd_response");
    }
  }
}

async function handleChangeDirectory(ws, targetPath, responseType = "stdout") {
  const newPath = path.resolve(ws.currentCwd, targetPath);

  // Security check - prevent directory traversal
  if (!newPath.startsWith(ws.allowedRootDir)) {
    return sendMessage(
      ws,
      responseType,
      `Cannot go outside the allowed directory (${path.basename(
        ws.allowedRootDir
      )}/).`
    );
  }

  try {
    const stats = await fs.promises.stat(newPath);
    if (stats.isDirectory()) {
      ws.currentCwd = newPath;
      sendMessage(
        ws,
        responseType,
        `Changed directory to: ${
          path.relative(ws.allowedRootDir, newPath) || "./"
        }`
      );
    } else {
      sendMessage(
        ws,
        responseType,
        `${path.relative(ws.allowedRootDir, newPath)}: Not a directory`
      );
    }
  } catch (error) {
    sendMessage(
      ws,
      responseType,
      `${path.relative(ws.allowedRootDir, newPath)}: No such file or directory`
    );
  }
}

function executeCommand(ws, command, responseType, cwd = ws.currentCwd) {
  exec(command, { cwd }, (error, stdout, stderr) => {
    if (error) {
      sendMessage(ws, responseType, `❌ ${error.message}`);
    } else if (stderr) {
      sendMessage(ws, responseType, `⚠️ ${stderr}`);
    } else {
      sendMessage(ws, responseType, stdout.toString());
    }
  });
}

/**
 * Broadcasts the current file tree to all connected WebSocket clients.
 * @param {WebSocket.Server} wss - The WebSocket server instance.
 * @param {string} [rootPath] - Optional root path to generate the file tree from. Defaults to client's allowedRootDir.
 */
function broadcastFileTree(wss, rootPath) {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      sendMessage(
        client,
        "filetree",
        getFileTree(rootPath || client.allowedRootDir)
      );
    }
  });
}

/**
 * Sends a structured message to a specific WebSocket client.
 * @param {WebSocket} ws - The WebSocket client to send the message to.
 * @param {string} type - The type of message (e.g., "stdout", "filetree", "error").
 * @param {*} data - The data payload of the message.
 */
function sendMessage(ws, type, data) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type, data }));
  }
}

/**
 * Sends an error message to a specific WebSocket client using the "stdout" type.
 * @param {WebSocket} ws - The WebSocket client to send the error to.
 * @param {string} message - The error message string.
 */
function sendError(ws, message) {
  sendMessage(ws, "stdout", `❌ ${message}\n`);
}

module.exports = { initializeWebSocket };
