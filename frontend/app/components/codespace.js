// components/MonacoEditorComponent.jsx
"use client";
import React, { useEffect, useState } from "react";
import { Editor } from "@monaco-editor/react";

export default function MonacoEditorComponent({
  onChange,
  editorTheme,
  setEditorTheme,
  language,
  value = "",
  right,
}) {
  // Check if in read-only mode
  const isReadOnly = right === "read";

  const editorOptions = {
    automaticLayout: true,
    fontSize: 14,
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    renderWhitespace: "selection",
    wordWrap: "on",
    theme: editorTheme,
    // Additional syntax highlighting options
    bracketPairColorization: { enabled: true },
    colorDecorators: true,
    // Read-only mode settings
    readOnly: isReadOnly,
    domReadOnly: isReadOnly,
    // Disable editing features in read-only mode
    contextmenu: !isReadOnly,
    quickSuggestions: !isReadOnly,
    suggestOnTriggerCharacters: !isReadOnly,
    acceptSuggestionOnEnter: isReadOnly ? "off" : "on",
    tabCompletion: isReadOnly ? "off" : "on",
    wordBasedSuggestions: isReadOnly ? "off" : "currentDocument",
    // Visual indicators for read-only mode
    selectionHighlight: !isReadOnly,
    cursorBlinking: isReadOnly ? "solid" : "blink",
    cursorStyle: isReadOnly ? "line-thin" : "line",
    // Disable drag and drop in read-only mode
    dragAndDrop: !isReadOnly,
  };

  const languageMap = {
    js: "javascript",
    ts: "typescript",
    py: "python",
    c: "c",
    cpp: "cpp",
    java: "java",
    html: "html",
    css: "css",
    json: "json",
    md: "markdown",
    sh: "shell",
    rs: "rust",
    go: "go",
    php: "php",
    xml: "xml",
    yaml: "yaml",
    yml: "yaml",
    txt: "plaintext",
    txt2: "text", // optional fallback
    // Add more as needed
  };

  const normalizedLanguage = languageMap[language] || language;

  useEffect(() => {
    setEditorTheme("custom-dark");
  }, [setEditorTheme]);

  // Handle onChange - don't call onChange in read-only mode
  const handleChange = (value) => {
    if (!isReadOnly && onChange) {
      onChange(value);
    }
  };

  return (
    <div className="relative h-full">
      {/* Read-only mode indicator */}
      {isReadOnly && (
        <div className="absolute top-2 right-2 z-10 bg-blue-900 text-blue-200 px-2 py-1 rounded text-xs border border-blue-700">
          📖 Read Only
        </div>
      )}
      
      <Editor
        height="100%"
        language={normalizedLanguage}
        value={value}
        onChange={handleChange}
        options={editorOptions}
        theme={editorTheme}
        beforeMount={(monaco) => {
          monaco.editor.defineTheme("custom-dark", {
            base: "vs-dark",
            inherit: true,
            rules: [
              // Syntax token colors
              { token: "comment", foreground: "7f848e", fontStyle: "italic" }, // gray comments
              { token: "keyword", foreground: "c678dd" }, // purple keywords
              { token: "number", foreground: "d19a66" }, // orange numbers
              { token: "string", foreground: "98c379" }, // green strings
              { token: "type", foreground: "e5c07b" }, // yellow types/classes
              { token: "function", foreground: "61afef" }, // blue functions
              { token: "variable", foreground: "e06c75" }, // red variables
              { token: "operator", foreground: "56b6c2" }, // teal operators
              { token: "delimiter", foreground: "abb2bf" }, // white delimiters
              { token: "tag", foreground: "e06c75" }, // red HTML tags
              { token: "attribute.name", foreground: "d19a66" }, // orange HTML attributes
              { token: "attribute.value", foreground: "98c379" }, // green HTML attribute values

              // JSX/TSX specific
              { token: "jsx.tag", foreground: "e06c75" },
              { token: "jsx.attribute", foreground: "d19a66" },
              { token: "jsx.text", foreground: "abb2bf" },
              { token: "jsx.bracket", foreground: "abb2bf" },

              // CSS specific
              { token: "css.property", foreground: "61afef" },
              { token: "css.value", foreground: "d19a66" },
              { token: "css.tag", foreground: "e06c75" },
              { token: "css.identifier", foreground: "e5c07b" },
            ],
            colors: {
              "editor.background": isReadOnly ? "#1a1f2e" : "#1a202c", // Slightly different bg for read-only
              "editor.foreground": "#abb2bf", // Default text color
              "editor.lineHighlightBackground": "#2d374850",
              "editorLineNumber.foreground": "#718096",
              "editorLineNumber.activeForeground": "#abb2bf",
              "editor.selectionBackground": "#3e445166",
              "editor.inactiveSelectionBackground": "#3e445133",
              "editorCursor.foreground": isReadOnly ? "#718096" : "#528bff", // Dimmed cursor in read-only
              "editorWhitespace.foreground": "#4b5363",
              "editorIndentGuide.background": "#2c313a",
              "editorIndentGuide.activeBackground": "#495162",
              "editorBracketHighlight.foreground1": "#abb2bf",
              "editorBracketHighlight.foreground2": "#56b6c2",
              "editorBracketHighlight.foreground3": "#d19a66",
              "editorBracketHighlight.unexpectedBracket.foreground": "#e06c75",
              // Read-only specific colors
              "editor.selectionHighlightBackground": isReadOnly ? "transparent" : "#3e445166",
              "editor.wordHighlightBackground": isReadOnly ? "transparent" : "#3e445166",
              "editor.wordHighlightStrongBackground": isReadOnly ? "transparent" : "#3e445166",
            },
          });

          // Define a read-only theme variant
          monaco.editor.defineTheme("custom-dark-readonly", {
            base: "vs-dark",
            inherit: true,
            rules: [
              // Same syntax highlighting rules
              { token: "comment", foreground: "7f848e", fontStyle: "italic" },
              { token: "keyword", foreground: "c678dd" },
              { token: "number", foreground: "d19a66" },
              { token: "string", foreground: "98c379" },
              { token: "type", foreground: "e5c07b" },
              { token: "function", foreground: "61afef" },
              { token: "variable", foreground: "e06c75" },
              { token: "operator", foreground: "56b6c2" },
              { token: "delimiter", foreground: "abb2bf" },
              { token: "tag", foreground: "e06c75" },
              { token: "attribute.name", foreground: "d19a66" },
              { token: "attribute.value", foreground: "98c379" },
              { token: "jsx.tag", foreground: "e06c75" },
              { token: "jsx.attribute", foreground: "d19a66" },
              { token: "jsx.text", foreground: "abb2bf" },
              { token: "jsx.bracket", foreground: "abb2bf" },
              { token: "css.property", foreground: "61afef" },
              { token: "css.value", foreground: "d19a66" },
              { token: "css.tag", foreground: "e06c75" },
              { token: "css.identifier", foreground: "e5c07b" },
            ],
            colors: {
              "editor.background": "#1a1f2e", // Slightly different background
              "editor.foreground": "#9ca3af", // Slightly dimmed text
              "editor.lineHighlightBackground": "transparent", // No line highlighting
              "editorLineNumber.foreground": "#6b7280",
              "editorLineNumber.activeForeground": "#9ca3af",
              "editor.selectionBackground": "#374151",
              "editor.inactiveSelectionBackground": "#374151",
              "editorCursor.foreground": "#6b7280", // Dimmed cursor
              "editorWhitespace.foreground": "#4b5563",
              "editorIndentGuide.background": "#2c313a",
              "editorIndentGuide.activeBackground": "#495162",
              "editorBracketHighlight.foreground1": "#9ca3af",
              "editorBracketHighlight.foreground2": "#56b6c2",
              "editorBracketHighlight.foreground3": "#d19a66",
              "editorBracketHighlight.unexpectedBracket.foreground": "#e06c75",
            },
          });
        }}
        onMount={(editor) => {
          // Focus the editor on mount only if not read-only
          if (!isReadOnly) {
            editor.focus();
          }
          
          // Add read-only styling if needed
          if (isReadOnly) {
            editor.updateOptions({
              theme: "custom-dark-readonly"
            });
          }
        }}
      />
    </div>
  );
}