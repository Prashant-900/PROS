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
}) {
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

  return (
    <Editor
      height="100%"
      language={normalizedLanguage}
      value={value}
      onChange={onChange}
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
            "editor.background": "#1a202c", // Match your bg-gray-900
            "editor.foreground": "#abb2bf", // Default text color
            "editor.lineHighlightBackground": "#2d374850",
            "editorLineNumber.foreground": "#718096",
            "editorLineNumber.activeForeground": "#abb2bf",
            "editor.selectionBackground": "#3e445166",
            "editor.inactiveSelectionBackground": "#3e445133",
            "editorCursor.foreground": "#528bff",
            "editorWhitespace.foreground": "#4b5363",
            "editorIndentGuide.background": "#2c313a",
            "editorIndentGuide.activeBackground": "#495162",
            "editorBracketHighlight.foreground1": "#abb2bf",
            "editorBracketHighlight.foreground2": "#56b6c2",
            "editorBracketHighlight.foreground3": "#d19a66",
            "editorBracketHighlight.unexpectedBracket.foreground": "#e06c75",
          },
        });
      }}
      onMount={(editor) => {
        // Focus the editor on mount
        editor.focus();
      }}
    />
  );
}
