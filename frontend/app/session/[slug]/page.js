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
            ((e.clientY - rightSectionRect.top) / rightSectionRect.height) * 100;
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
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/session/save`, {
      method: "POST",
      body: JSON.stringify({ sessionid, userid }),
      headers: {
        "Content-Type": "application/json",
      },
    });
    const data = await response.json();
    if (!response.ok) {
      alert("Failed to save session");
    } else {
      alert(data.user?.message);
    }
  };

  return (
    <AppUI
      // Data props
      userid={userid}
      name={name}
      sessionid={sessionid}
      leftPanelWidth={leftPanelWidth}
      upperRightHeight={upperRightHeight}
      editorTheme={editorTheme}
      code={code}
      currentfile={currentfile}
      isClient={isClient}
      
      // Event handlers
      handleLeftDividerMouseDown={handleLeftDividerMouseDown}
      handleHorizontalDividerMouseDown={handleHorizontalDividerMouseDown}
      handleback={handleback}
      handleSave={handleSave}
      setEditorTheme={setEditorTheme}
      setCode={setCode}
      setcurrentfile={setcurrentfile}
    />
  );
}