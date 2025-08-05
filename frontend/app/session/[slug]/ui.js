"use client";
import React from "react";
import Button from "@/app/utils/button";
import { ArrowLeftIcon, Plus, X } from "lucide-react";
import { FileStructureContainer } from "@/app/components/folder";
import { useState } from "react";
import MonacoEditorComponent from "@/app/components/codespace";
import dynamic from "next/dynamic";
import Preview from "@/app/components/preview";
const WebTerminal = dynamic(() => import("@/app/components/terminal"), {
  ssr: false,
});

const AppUI = ({
  // Props from logic
  right,
  userid,
  name,
  sessionid,
  leftPanelWidth,
  upperRightHeight,
  setUpperRightHeight,
  priview,
  editorTheme,
  code,
  currentfile,
  isClient,
  setport,
  port,

  // Event handlers
  handleLeftDividerMouseDown,
  handleHorizontalDividerMouseDown,
  handleback,
  handleConnect,
  handleSave,
  setEditorTheme,
  setCode,
  setcurrentfile,
}) => {
  const [FolderStructure, setFolderStructure] = useState({});
  const [Filecmd, setFilecmd] = useState("");
  const [screen, setscreen] = useState("code");
  const [isCollapsed, setisCollapsed] = useState(false);
  const [lastExpandedHeight, setLastExpandedHeight] = useState(70);
  const [newterminal, setnewterminal] = useState(false);
  const [hasSecondTerminal, setHasSecondTerminal] = useState(false);
  

  const COLLAPSED_TERMINAL_HEIGHT = 5;

  const toggleCollapse = () => {
    if (isCollapsed) {
      // Restore to previous height
      setUpperRightHeight(lastExpandedHeight);
      setisCollapsed(false);
    } else {
      // Save current height and collapse
      setLastExpandedHeight(upperRightHeight);
      setUpperRightHeight(100 - COLLAPSED_TERMINAL_HEIGHT); // Upper section takes remaining space
      setisCollapsed(true);
    }
  };

  const toggleSecondTerminal = () => {
    setHasSecondTerminal(!hasSecondTerminal);
  };

  if (!isClient) {
    return (
      <div className="h-screen w-full bg-gray-900 text-white flex flex-col font-sans">
        <header className="flex items-center justify-between px-6 py-4 border-b-1 border-gray-700">
          <Button onClick={() => router.back()}>
            <ArrowLeftIcon className="w-5 h-5" />
          </Button>
          <div className="font-mono text-blue-400 text-sm md:text-base">
            Loading...
          </div>
        </header>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-gray-900 text-white flex flex-col font-sans">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-1 border-b-1 border-gray-700">
        <Button onClick={handleback}>
          <ArrowLeftIcon className="w-5 h-5" />
        </Button>
        <div className="flex gap-4 items-center">
          <div className="flex flex-col justify-end items-start">
            <div className="font-mono text-blue-400 text-sm md:text-base">
              Name: <span className="font-bold">{name}</span>
            </div>
            <div className="font-mono text-blue-400 text-sm md:text-base">
              Session ID: <span className="font-bold">{sessionid}</span>
            </div>
          </div>
          <Button
            disabled={right === "read"}
            onClick={handleSave}
            className="text-sm bg-green-600"
          >
            Save
          </Button>
        </div>
      </header>

      {/* Main content */}
      <div className="main-content h-full w-full flex">
        {/* Left sidebar */}
        <div
          className="h-full p-1 relative min-w-42"
          style={{ width: `${leftPanelWidth}%` }}
        >
          <div className="h-full w-full flex flex-col">
            <div
              onClick={() => setFilecmd({ cmd: "", type: "tree" })}
              className="font-smono text-center cursor-pointer hover:text-blue-500 active:text-blue-600 text-blue-400 border-b border-gray-700"
            >
              refresh
            </div>

            <div className="flex-1 overflow-auto">
              <FileStructureContainer
                right={right}
                setFilecmd={setFilecmd}
                data={FolderStructure}
                currentFile={currentfile}
                setcurrentFile={setcurrentfile}
              />
            </div>
          </div>

          {/* Left divider */}
          <div
            className="absolute right-0 top-0 h-full w-1 cursor-col-resize bg-gray-700 hover:bg-blue-500 active:bg-blue-600 transition-colors"
            onMouseDown={handleLeftDividerMouseDown}
          />
        </div>

        {/* Right content */}
        <div
          className="right-section h-full flex flex-col"
          style={{ width: `${100 - leftPanelWidth}%` }}
        >
          {/* Upper right section*/}
          <div className="relative" style={{ height: `${upperRightHeight}%` }}>
            <div className="flex flex-col h-full w-full">
              <div className="w-full h-9 flex justify-between px-2 py-1">
                <div className="flex gap-2">
                  <Button
                    className="py-0.5 px-0.5 relative flex items-center gap-1"
                    onClick={() => setscreen("code")}
                  >
                    <span className="whitespace-nowrap">Code</span>
                  </Button>
                  <Button
                    className="py-0.5 px-0.5 relative flex items-center gap-2"
                    onClick={() => setscreen("preview")}
                  >
                    <span className="whitespace-nowrap">Preview</span>
                    <input
                      type="number"
                      placeholder="Port"
                      defaultValue={port}
                      className="w-14 text-xs px-1 py-0.5 text-black border border-gray-300 rounded bg-gray-500 text-center focus:outline-none"
                      onClick={(e) => e.stopPropagation()} // Prevent button click
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault(); // prevent form submit if inside form
                          setport(e.target.value); // ✅ Save port
                          e.target.blur(); // Optional: remove focus
                        }
                      }}
                    />
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={toggleSecondTerminal}
                    className={`py-0.5 px-0.5 relative flex items-center gap-1 hover:bg-orange-700 active:bg-orange-800 ${
                      hasSecondTerminal ? 'bg-orange-600' : 'bg-gray-600'
                    }`}
                    title={hasSecondTerminal ? "Remove second terminal" : "Add second terminal"}
                  >
                    {hasSecondTerminal ? (
                      <>
                        <X className="w-4 h-4" />
                        <span className="whitespace-nowrap text-xs">Term 2</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        <span className="whitespace-nowrap text-xs">Term</span>
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={handleConnect}
                    className={`py-0.5 px-0.5 relative flex items-center hover:bg-cyan-700 active:bg-cyan-800 ${
                      priview.success && `!border-cyan-500`
                    }`}
                    style={{ color: "white" }}
                  >
                    Connect
                  </Button>
                </div>
              </div>
              {screen === "preview" ? (
                <div className="flex-1 overflow-hidden">
                  <Preview priview={priview} />
                </div>
              ) : (
                <MonacoEditorComponent
                  right={right}
                  onChange={(value) => {
                    setCode(value);
                    if (currentfile !== "") {
                      setFilecmd({
                        type: "code",
                        cmd: `cat > /mnt/data/${currentfile} << EOF\n${value}\nEOF\n`,
                      });
                    }
                  }}
                  editorTheme={editorTheme}
                  setEditorTheme={setEditorTheme}
                  language={currentfile.split(".").pop()}
                  value={code}
                />
              )}
            </div>
            {/* Horizontal divider - only show when not collapsed */}
            {!isCollapsed && (
              <div
                className="absolute bg-gray-700 bottom-0 left-0 w-full h-1 cursor-row-resize hover:bg-blue-500 active:bg-blue-600 transition-colors"
                onMouseDown={handleHorizontalDividerMouseDown}
              />
            )}
          </div>
          
          {/* Lower right section (Terminal) */}
          <div
            className="relative overflow-hidden"
            style={{
              height: isCollapsed ? `${COLLAPSED_TERMINAL_HEIGHT}%` : `${100 - upperRightHeight}%`,
              minHeight: isCollapsed ? `${COLLAPSED_TERMINAL_HEIGHT}%` : "200px"
            }}
          >
            {hasSecondTerminal ? (
              // Two terminals side by side
              <div className="flex h-full">
                <div className="flex-1 border-r border-gray-700">
                  <div style={{ height: '100%' }}>
                    <WebTerminal
                      toggleCollapse={toggleCollapse}
                      isCollapsed={isCollapsed}
                      right={right}
                      userid={userid}
                      setCode={setCode}
                      setFilecmd={setFilecmd}
                      Filecmd={Filecmd}
                      setFolderStructure={setFolderStructure}
                      sessionid={`${sessionid}-term1`}
                      upperRightHeight={upperRightHeight}
                      setnewterminal={setnewterminal}
                      newterminal={newterminal}
                    />
                  </div>
                </div>
                <div className="flex-1">
                  <div style={{ height: '100%' }}>
                    <WebTerminal
                      toggleCollapse={toggleCollapse}
                      isCollapsed={isCollapsed}
                      right={right}
                      userid={userid}
                      setCode={setCode}
                      setFilecmd={setFilecmd}
                      Filecmd={Filecmd}
                      setFolderStructure={setFolderStructure}
                      sessionid={`${sessionid}-term2`}
                      upperRightHeight={upperRightHeight}
                      setnewterminal={setnewterminal}
                      newterminal={newterminal}
                    />
                  </div>
                </div>
              </div>
            ) : (
              // Single terminal
              <WebTerminal
                toggleCollapse={toggleCollapse}
                isCollapsed={isCollapsed}
                right={right}
                userid={userid}
                setCode={setCode}
                setFilecmd={setFilecmd}
                Filecmd={Filecmd}
                setFolderStructure={setFolderStructure}
                sessionid={`${sessionid}-term1`}
                upperRightHeight={upperRightHeight}
                setnewterminal={setnewterminal}
                newterminal={newterminal}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppUI;