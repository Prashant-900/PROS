"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import { Terminal } from "xterm";
import "xterm/css/xterm.css";

const WebTerminal = ({
  sessionid,
  prompt = "$ ",
  setFolderStructure,
  Filecmd,
  setCode,
  setFilecmd,
  userid
}) => {
  const terminalRef = useRef(null);
  const containerRef = useRef(null);
  const term = useRef(null);
  const ws = useRef(null);
  const currLine = useRef("");
  const [connected, setConnected] = useState(false);
  const port = process.env.NEXT_PUBLIC_BACKEND_URL
    ? new URL(process.env.NEXT_PUBLIC_BACKEND_URL).port
    : "8000";
  const wsUrl = `ws://localhost:${port}/ws/${sessionid}/${userid}`;
  console.log("WebSocket URL:", wsUrl);
  

  const connectWebSocket = useCallback(() => {
    if (ws.current?.readyState === WebSocket.OPEN) return;

    ws.current = new WebSocket(wsUrl);
    setConnected(false);

    ws.current.onopen = () => {
      setConnected(true);
      term.current?.write(`\r\nConnected to ${wsUrl}\r\n${prompt}`);
    };

ws.current.onmessage = (e) => {
  try {
    const data = JSON.parse(e.data);

    if (data.type === "filetree") {
      setFolderStructure(data.data);
    } else if (data.type === "filecontent") {
      // Handle file content specifically
      setCode(data.data);
    } else if (data.type === "stdout") {
      // Normal terminal output
      const output = data.data.replace(/\n/g, "\r\n");
      term.current?.write(`\r\n${output}\r\n${prompt}`);
      currLine.current = "";
    }
  } catch (error) {
    console.error("Error parsing WebSocket message:", error);
  }
};

    ws.current.onclose = () => setConnected(false);
    ws.current.onerror = () => term.current?.write("\r\nConnection error\r\n");
  }, [wsUrl, setFolderStructure, prompt, setCode]);

  const handleResize = useCallback(() => {
    if (!term.current || !containerRef.current) return;

    try {
      const { clientWidth: width, clientHeight: height } =
        containerRef.current;
      const cols = Math.max(40, Math.floor(width / 8.5) - 2);
      const rows = Math.max(10, Math.floor(height / 17) - 2);
      term.current.resize(cols, rows);
    } catch (error) {
      console.error("Resize error:", error);
    }
  }, []);

  useEffect(() => {
    if (Filecmd && ws.current?.readyState === WebSocket.OPEN) {
      
      ws.current.send(
        JSON.stringify({
          type: "filecmd",
          data: Filecmd,
        })
      );
      setFilecmd(""); // reset after sending
    }
  }, [Filecmd, setFilecmd]);

  useEffect(() => {
    term.current = new Terminal({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: "monospace",
      theme: { background: "#1a1a1a", foreground: "#ffffff" },
      scrollback: 1000,
      allowProposedApi: true,
    });

    term.current.open(terminalRef.current);
    term.current.write(prompt);

    term.current.onKey(({ key, domEvent: ev }) => {
      if (ev.key === "Enter") {
        const cmd = currLine.current.trim();
        term.current.write("\r\n");
        if (cmd && ws.current?.readyState === WebSocket.OPEN) {
          ws.current.send(
            JSON.stringify({
              type: "cmd",
              data: cmd,
            })
          );
        }
        currLine.current = "";
      } else if (ev.key === "Backspace") {
        if (currLine.current.length > 0) {
          currLine.current = currLine.current.slice(0, -1);
          term.current.write("\b \b");
        }
      } else if (key.length === 1) {
        currLine.current += key;
        term.current.write(key);
      }
    });

    connectWebSocket();
    setTimeout(() => {
      handleResize();
    }, 10);

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(containerRef.current);

    return () => {
      ws.current?.close();
      term.current?.dispose();
      resizeObserver.disconnect();
    };
  }, [connectWebSocket, handleResize, prompt]);

  return (
    <div
      ref={containerRef}
      className="flex flex-col h-full bg-gray-900 overflow-hidden"
    >
      <div className="shrink-0 px-4 py-2 bg-gray-800 border-b border-gray-700 flex items-center justify-between">
        <span className="text-gray-300 text-sm font-semibold">
          Web Terminal
        </span>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div
              className={`w-2.5 h-2.5 rounded-full ${
                connected ? "bg-green-500" : "bg-red-500"
              }`}
            />
            <span className="text-gray-400 text-xs">
              {connected ? "Connected" : "Disconnected"}
            </span>
          </div>
          {!connected && (
            <button
              onClick={connectWebSocket}
              className="hover:text-blue-400 text-xs font-medium text-white transition-colors duration-200"
            >
              Reconnect
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 min-h-0 relative">
        <div
          ref={terminalRef}
          className="absolute inset-0"
          style={{ backgroundColor: "#1a1a1a" }}
        />
      </div>
    </div>
  );
};

export default WebTerminal;