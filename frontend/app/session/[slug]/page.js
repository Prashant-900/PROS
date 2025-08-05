"use client";
import React, { useState, useRef, useEffect } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import AppUI from "./ui.js";

export default function App() {
  const params = useParams();
  const searchparam = useSearchParams();
  const name = searchparam.get("name");
  const userid = searchparam.get("userid");
  const sessionid = params.slug;
  const router = useRouter();

  // State for panel sizes
  const [leftPanelWidth, setLeftPanelWidth] = useState(25);
  const [upperRightHeight, setUpperRightHeight] = useState(75);
  const [editorTheme, setEditorTheme] = useState("vs-dark");
  const [code, setCode] = useState("");
  const [currentfile, setcurrentfile] = useState("");
  const [isClient, setIsClient] = useState(false);
  const [right, setright] = useState("");
  const [priview, setpriview] = useState({success:false,data:""});
  const [port, setport] = useState(8080);

  useEffect(() => {
    async function fetchCode() {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/sessioncontrol/right`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ sessionid, userid }),
          }
        );

        const data = await response.json();
        if (!response.ok || !data.right) {
          throw new Error(
            data.message || "Unauthorized or failed to fetch rights"
          );
        }
        if(data.right==="notallowed") {
          router.back();
        }else {
          setright(data.right);
        }
      } catch (err) {
        console.error("Failed to fetch right:", err);
        alert("Access denied or session invalid. Redirecting...");
        router.back(); // Route back if rights not properly fetched
      }
    }

    fetchCode();
  }, [sessionid, userid]);

  // Refs for drag operations
  const isDraggingLeft = useRef(false);
  const isDraggingHorizontal = useRef(false);

  const handleLeftDividerMouseDown = (e) => {
    isDraggingLeft.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  const handleHorizontalDividerMouseDown = (e) => {
    isDraggingHorizontal.current = true;
    document.body.style.cursor = "row-resize";
    document.body.style.userSelect = "none";
  };

  useEffect(() => {
    setIsClient(true);

    const handleMouseMove = (e) => {
      if (isDraggingLeft.current) {
        const container = document.querySelector(".main-content");
        if (container) {
          const containerRect = container.getBoundingClientRect();
          const newWidth =
            ((e.clientX - containerRect.left) / containerRect.width) * 100;
          setLeftPanelWidth(Math.min(Math.max(15, newWidth), 40));
        }
      }

      if (isDraggingHorizontal.current) {
        const rightSection = document.querySelector(".right-section");
        if (rightSection) {
          const rightSectionRect = rightSection.getBoundingClientRect();
          const newHeight =
            ((e.clientY - rightSectionRect.top) / rightSectionRect.height) *
            100;
          setUpperRightHeight(Math.min(Math.max(30, newHeight), 85));
        }
      }
    };

    const handleMouseUp = () => {
      if (isDraggingLeft.current || isDraggingHorizontal.current) {
        isDraggingLeft.current = false;
        isDraggingHorizontal.current = false;
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      }
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  const handleback = () => {
    fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/container/delete`, {
      method: "POST",
      body: JSON.stringify({ sessionid }),
      headers: {
        "Content-Type": "application/json",
      },
    });
    router.back();
  };

  const handleSave = async () => {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/session/save`,
      {
        method: "POST",
        body: JSON.stringify({ sessionid, userid }),
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    const data = await response.json();
    if (!response.ok) {
      alert("Failed to save session");
    } else {
      alert(data.user?.message);
    }
  };

  const handleConnect = async () => {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/priview/getpriview`,
      {
        method: "POST",
        body: JSON.stringify({ sessionid, port }),
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    const data = await response.json();
    if (!response.ok) {
      alert("Failed to connect");
    } else {
      console.log(data);
      setpriview(data);
    }
  };

  return (
    <AppUI
      // Data props
      right={right}
      userid={userid}
      name={name}
      sessionid={sessionid}
      leftPanelWidth={leftPanelWidth}
      upperRightHeight={upperRightHeight}
      setUpperRightHeight={setUpperRightHeight}
      editorTheme={editorTheme}
      code={code}
      currentfile={currentfile}
      isClient={isClient}
      priview={priview}
      setport={setport}
      port={port}
      // Event handlers
      handleLeftDividerMouseDown={handleLeftDividerMouseDown}
      handleHorizontalDividerMouseDown={handleHorizontalDividerMouseDown}
      handleback={handleback}
      handleSave={handleSave}
      setEditorTheme={setEditorTheme}
      setCode={setCode}
      setcurrentfile={setcurrentfile}
      handleConnect={handleConnect}
    />
  );
}
