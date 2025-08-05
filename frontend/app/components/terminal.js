"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import { Terminal } from "xterm";
import "xterm/css/xterm.css";
import { ArrowUpCircleIcon,ArrowDownCircleIcon } from "lucide-react";

const WebTerminal = ({
  right,
  sessionid,
  setFolderStructure,
  Filecmd,
  setCode,
  setFilecmd,
  userid,
  isCollapsed,
  toggleCollapse,
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
  const wsUrl = `ws://localhost:${port}/ws/${sessionid}/${userid}/${right}`;

  const writePrompt = () => {
    if (right !== "read") {
      term.current?.write("\r\n$ ");
    }
  };

  const connectWebSocket = useCallback(() => {
    if (ws.current?.readyState === WebSocket.OPEN) return;

    ws.current = new WebSocket(wsUrl);
    setConnected(false);

    ws.current.onopen = () => {
      setConnected(true);
      term.current?.write(`\rConnected to ${wsUrl}\r`);
      writePrompt();
    };

    ws.current.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        console.log("Received WebSocket message:", data);
        if (data.type === "tree") {
          setFolderStructure(data.data);
        } else if (data.type === "filecontent") {
          setCode(data.data);
        } else if (data.type === "stdout") {
          const output = data.data.replace(/\n/g, "\r");
          term.current?.write(`\r${output}\r`);
          writePrompt(); // ⬅️ Add this here
          currLine.current = "";
        } else if (data.type === "retry") {
          if (
            ws.current?.readyState === WebSocket.OPEN ||
            ws.current?.readyState === WebSocket.CONNECTING
          ) {
            ws.current.close(); // This will also trigger cleanup in `onclose`
            setConnected(false);
          }
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };

    ws.current.onclose = () => setConnected(false);
    ws.current.onerror = () => term.current?.write("\rConnection error\r\n");
  }, [wsUrl, setFolderStructure, setCode]);

  const handleResize = useCallback(() => {
    if (!term.current || !containerRef.current) return;

    try {
      const { clientWidth: width, clientHeight: height } = containerRef.current;
      const cols = Math.max(40, Math.floor(width / 8.5) - 2);
      const rows = Math.max(10, Math.floor(height / 17) - 2);
      term.current.resize(cols, rows);
    } catch (error) {
      console.error("Resize error:", error);
    }
  }, []);

  useEffect(() => {
    if (Filecmd && ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(Filecmd));
      setFilecmd(""); // reset after sending
    }
  }, [Filecmd, setFilecmd]);

  useEffect(() => {
    term.current = new Terminal({
      cursorBlink: right !== "read", // Disable cursor blinking in read mode
      fontSize: 14,
      fontFamily: "monospace",
      theme: { background: "#1a1a1a", foreground: "#ffffff" },
      scrollback: 1000,
      allowProposedApi: true,
    });

    term.current.open(terminalRef.current);

    term.current.onKey(({ key, domEvent: ev }) => {
      if (right === "read") return;

      // Handle Ctrl+C
      if (ev.ctrlKey && ev.key === "c") {
        term.current.write("^C\r\n");
        currLine.current = "";
        writePrompt(); // ⬅️ Add here too

        // Optional: Send interrupt to backend
        if (ws.current?.readyState === WebSocket.OPEN) {
          ws.current.send(
            JSON.stringify({
              type: "stdout",
              cmd: "\x03", // Or a custom identifier you handle on server
            })
          );
        }
        return;
      }

      if (ev.key === "Enter") {
        const cmd = currLine.current.trim();
        term.current.write("\r\n");
        if (ws.current?.readyState === WebSocket.OPEN) {
          ws.current.send(
            JSON.stringify({
              type: "stdout",
              cmd: cmd + "\n" || "\n",
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
  }, [connectWebSocket, handleResize, right]); // Added 'right' to dependencies

  return (
    <div
      ref={containerRef}
      className="flex flex-col h-full bg-gray-900 overflow-hidden"
    >
      <div className="shrink-0 h-8 px-4 py-2 bg-gray-800 border-b border-gray-700 flex items-center justify-between">
        <span className="text-gray-300 flex items-center gap-2 text-sm font-semibold">
          <span onClick={() => toggleCollapse()}>{isCollapsed ? <ArrowDownCircleIcon className="w-5 h-5 hover:w-6 hover:h-6" /> : <ArrowUpCircleIcon className="w-5 h-5 hover:w-6 hover:h-6" />}</span>
          Web Terminal{" "}
          {right === "read" && (
            <span className="text-yellow-400 text-xs ml-2">(Read Only)</span>
          )}
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
