import { Writable } from "stream";
import * as k8s from "@kubernetes/client-node";

let globalExec = null;

export function initKubernetesClient() {
  try {
    const kc = new k8s.KubeConfig();
    kc.loadFromDefault();
    const exec = new k8s.Exec(kc);
    globalExec = exec;
    console.log("✅ Kubernetes client initialized successfully");
    return { kc, exec };
  } catch (error) {
    console.error("❌ Failed to initialize Kubernetes client:", error);
    setTimeout(() => {
      console.log("🔄 Retrying Kubernetes client initialization...");
      initKubernetesClient();
    }, 5000);
  }
}

export async function getTree(sessionId, ws) {
  if (!sessionId || !ws) {
    console.error("getTree: Invalid parameters");
    return;
  }

  if (!globalExec) {
    console.error("getTree: Kubernetes client not initialized");
    ws.readyState === ws.OPEN &&
      ws.send(
        JSON.stringify({
          type: "stdout",
          data: "Error: Kubernetes client not available",
        })
      );
    return;
  }

  let output = "";
  let streamClosed = false;

  const treeStream = new Writable({
    write(chunk, _, cb) {
      if (chunk && !streamClosed) output += chunk.toString();
      cb();
    },
    final(cb) {
      streamClosed = true;
      try {
        const treeData = JSON.parse(output);
        const dir = treeData.find((item) => item?.type === "directory");
        ws.readyState === ws.OPEN &&
          ws.send(
            JSON.stringify({
              type: "tree",
              data: dir?.contents || [],
            })
          );
        cb();
      } catch (err) {
        console.error("Failed to parse tree JSON:", err);
        ws.readyState === ws.OPEN &&
          ws.send(
            JSON.stringify({
              type: "stdout",
              data:
                "Failed to parse tree output: " +
                (err.message || "Unknown error"),
            })
          );
        cb();
      }
    },
  });

  const stderrStream = new Writable({
    write(chunk, _, cb) {
      const text = chunk.toString();
      console.error("Tree STDERR:", text);
      ws.readyState === ws.OPEN &&
        ws.send(
          JSON.stringify({
            type: "stdout",
            data: text,
          })
        );
      cb();
    },
  });

  try {
    await globalExec.exec(
      "default",
      `pod-${sessionId.split("-")[0]}`,
      "user-container",
      ["/bin/sh", "-c", "tree -J /mnt/data"],
      treeStream,
      stderrStream,
      null,
      true
    );
  } catch (err) {
    console.error("Tree command execution failed:", err);
    ws.readyState === ws.OPEN &&
      ws.send(
        JSON.stringify({
          type: "stdout",
          data:
            "Failed to execute tree command: " +
            (err.message || "Unknown error"),
        })
      );
  }
}


export async function getPriview(sessionid, port) {
  return new Promise(async (resolve) => {
    if (!sessionid || !port) {
      return resolve({ success: false, data: "Invalid parameters" });
    }

    if (!globalExec) {
      return resolve({
        success: false,
        data: "Kubernetes client not initialized",
      });
    }

    let output = "";
    let publicUrl = null;

    const stdoutStream = new Writable({
      write(chunk, _, cb) {
        const text = chunk.toString();
        output += text;

        const match = text.match(/url=(https:\/\/[^\s]+)/);
        if (match && !publicUrl) {
          publicUrl = match[1];
        }
        cb();
      },
    });

    const stderrStream = new Writable({
      write(chunk, _, cb) {
        console.error("ngrok STDERR:", chunk.toString());
        cb();
      },
    });

    try {
      // 1. Try to get existing tunnel
      const getTunnelCmd = `curl -s http://127.0.0.1:4040/api/tunnels`;
      let tunnelCheckOutput = "";

      const tunnelOutputStream = new Writable({
        write(chunk, _, cb) {
          tunnelCheckOutput += chunk.toString();
          cb();
        },
      });

      await new Promise((res) => {
        globalExec.exec(
          "default",
          `pod-${sessionid}`,
          "user-container",
          ["/bin/sh", "-c", getTunnelCmd],
          tunnelOutputStream,
          new Writable({ write(c, _, cb) { cb(); } }),
          null,
          true
        );
        setTimeout(res, 1000);
      });

      try {
        const tunnels = JSON.parse(tunnelCheckOutput).tunnels || [];
        const existingTunnel = tunnels.find(t =>
          t.config.addr.endsWith(`:${port}`)
        );
        if (existingTunnel) {
          return resolve({ success: true, data: existingTunnel.public_url });
        }
      } catch (e) {
        console.warn("Could not parse ngrok tunnel list");
      }

      // 2. Start ngrok if no tunnel found
      globalExec.exec(
        "default",
        `pod-${sessionid}`,
        "user-container",
        [
          "/bin/sh",
          "-c",
          `ngrok config add-authtoken 2qk1xlWHMQ7babC5fS16aMPSW7e_7cuaPU19vziheaUNp4Fpo && ngrok http 0.0.0.0:${port} --log=stdout`,
        ],
        stdoutStream,
        stderrStream,
        null,
        false
      );

      // Wait 3 seconds to see if URL appears
      setTimeout(() => {
        if (publicUrl) {
          resolve({ success: true, data: publicUrl });
        } else {
          resolve({ success: false, data: "ngrok URL not found in output" });
        }
      }, 3000);
    } catch (err) {
      console.error("Exec failed:", err);
      resolve({
        success: false,
        data: "Failed to start ngrok: " + (err.message || "Unknown error"),
      });
    }
  });
}
