"use client";
import React from "react";
import Button from "@/app/utils/button";
import { ArrowLeftIcon } from "lucide-react";
import { FileStructureViewer } from "@/app/components/folder";
import { useState } from "react";
import MonacoEditorComponent from "@/app/components/codespace";
import dynamic from "next/dynamic";
const WebTerminal = dynamic(() => import("@/app/components/terminal"), {
  ssr: false,
});

const AppUI = ({
  // Props from logic
  userid,
  name,
  sessionid,
  leftPanelWidth,
  upperRightHeight,
  editorTheme,
  code,
  currentfile,
  isClient,

  // Event handlers
  handleLeftDividerMouseDown,
  handleHorizontalDividerMouseDown,
  handleback,
  handleSave,
  setEditorTheme,
  setCode,
  setcurrentfile,
}) => {
  const [FolderStructure, setFolderStructure] = useState({});
  const [Filecmd, setFilecmd] = useState("");

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
      <header className="flex items-center justify-between px-6 py-4 border-b-1 border-gray-700">
        <Button onClick={handleback}>
          <ArrowLeftIcon className="w-5 h-5" />
        </Button>
        <div className="flex gap-4 items-center">
          <div className="flex flex-col gap-1 justify-end items-start">
            <div className="font-mono text-blue-400 text-sm md:text-base">
              Name: <span className="font-bold">{name}</span>
            </div>
            <div className="font-mono text-blue-400 text-sm md:text-base">
              Session ID: <span className="font-bold">{sessionid}</span>
            </div>
          </div>
          <Button onClick={handleSave} className="text-sm bg-green-600">
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
          <FileStructureViewer
            setFilecmd={setFilecmd}
            data={FolderStructure}
            currentFile={currentfile}
            setcurrentFile={setcurrentfile}
          />

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
            <MonacoEditorComponent
              onChange={(value) => {
                setCode(value);
                setFilecmd({
                  show: false,
                  cmd: `echo "${value}" > ${currentfile}`,
                });
              }}
              editorTheme={editorTheme}
              setEditorTheme={setEditorTheme}
              language={currentfile.split(".").pop()}
              value={code}
            />

            {/* Horizontal divider */}
            <div
              className="absolute bg-gray-700 bottom-0 left-0 w-full h-1 cursor-row-resize hover:bg-blue-500 active:bg-blue-600 transition-colors"
              onMouseDown={handleHorizontalDividerMouseDown}
            />
          </div>

          {/* Lower right section*/}
          <div
            className="flex-1 relative min-h-50"
            style={{ height: `${100 - upperRightHeight}%` }}
          >
            <WebTerminal
              userid={userid}
              setCode={setCode}
              setFilecmd={setFilecmd}
              Filecmd={Filecmd}
              setFolderStructure={setFolderStructure}
              sessionid={sessionid}
              upperRightHeight={upperRightHeight}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppUI;
