"use client";
import React, { useEffect, useRef } from "react";
import MonacoEditor from "@monaco-editor/react";

type Props = {
  wsRef: React.MutableRefObject<WebSocket | null>;
  roomIdRef: React.MutableRefObject<string>;
  userName: string;
  joined: boolean;
  code: string;
  onCodeChange: (value: string) => void;
};

export function EditorClient({
  wsRef,
  roomIdRef,
  userName,
  joined,
  code,
  onCodeChange,
}: Props) {
  const isSelfEdit = useRef(false);
  type CursorPosition = { lineNumber: number; column: number };
  type CursorEvent = { position: CursorPosition };
  type CodeWidget = {
    getId(): string;
    getDomNode(): HTMLElement;
    getPosition(): { position: CursorPosition; preference: number[] };
  };
  type Decoration = {
    range: {
      startLineNumber: number;
      startColumn: number;
      endLineNumber: number;
      endColumn: number;
    };
    options: { inlineClassName: string; beforeContentClassName: string };
  };
  type CodeEditor = {
    deltaDecorations(prev: string[], decorations: Decoration[]): string[];
    removeContentWidget(widget: CodeWidget): void;
    addContentWidget(widget: CodeWidget): void;
    onDidChangeCursorPosition(listener: (e: CursorEvent) => void): void;
  };

  const editorRef = useRef<CodeEditor | null>(null);
  const userIdToDecorationIdsRef = useRef<Record<string, string[]>>({});
  const userIdToWidgetRef = useRef<Record<string, CodeWidget>>({});

  const getColorForUser = (id: string) => {
    const palette = [
      "#60a5fa",
      "#34d399",
      "#fbbf24",
      "#f472b6",
      "#a78bfa",
      "#f87171",
      "#22d3ee",
    ];
    let hash = 0;
    for (let i = 0; i < id.length; i++)
      hash = (hash * 31 + id.charCodeAt(i)) | 0;
    const idx = Math.abs(hash) % palette.length;
    return palette[idx];
  };

  useEffect(() => {
    const ws = wsRef.current;
    if (!ws) return;
    type EditorMessage = { type: "editor"; roomId: string; content: string };
    type CursorMessage = {
      type: "cursor";
      roomId: string;
      userId?: string;
      position: { line: number; column: number };
    };
    type InboundMessage = EditorMessage | CursorMessage | Record<string, unknown>;

    const handler = (event: MessageEvent<string>) => {
      const msg = JSON.parse(event.data) as InboundMessage;
      if (msg.type === "editor" && msg.roomId === roomIdRef.current) {
        if (!isSelfEdit.current) {
          onCodeChange((msg as EditorMessage).content);
        }
        isSelfEdit.current = false;
      } else if (msg.type === "cursor" && msg.roomId === roomIdRef.current) {
        const { userId: user, position } = msg as CursorMessage;
        if (!editorRef.current || !user) return;
        const monacoEditor = editorRef.current;
        const range = {
          startLineNumber: position.line,
          startColumn: position.column,
          endLineNumber: position.line,
          endColumn: position.column + 1,
        };
        const color = getColorForUser(user);

        const prev = userIdToDecorationIdsRef.current[user] || [];
        const next = monacoEditor.deltaDecorations(prev, [
          {
            range,
            options: {
              inlineClassName: "remote-cursor",
              beforeContentClassName: "remote-cursor-bar",
            },
          },
        ]);
        userIdToDecorationIdsRef.current[user] = next;

        const widgetId = `remote-caret-label-${user}`;
        const dom = document.createElement("div");
        dom.className = "remote-caret-label";
        dom.textContent = String(user);
        dom.style.backgroundColor = color;
        dom.style.borderColor = color;

        const widget: CodeWidget = {
          getId() {
            return widgetId;
          },
          getDomNode() {
            return dom;
          },
          getPosition() {
            return {
              position: { lineNumber: position.line, column: position.column },
              preference: [0],
            };
          },
        };

        if (userIdToWidgetRef.current[user]) {
          monacoEditor.removeContentWidget(userIdToWidgetRef.current[user]);
        }
        monacoEditor.addContentWidget(widget);
        userIdToWidgetRef.current[user] = widget;
      }
    };
    ws.onmessage = handler;
    return () => {
      if (ws.onmessage === handler) ws.onmessage = null;
    };
  }, [wsRef, roomIdRef, onCodeChange]);

  const handleChange = (value?: string) => {
    const newValue = value || "";
    onCodeChange(newValue);
    if (!joined) return;
    if (wsRef.current) {
      isSelfEdit.current = true;
      wsRef.current.send(
        JSON.stringify({
          type: "editor",
          roomId: roomIdRef.current,
          userId: userName,
          content: newValue,
        })
      );
    }
  };

  const handleDidMount = (editor: unknown) => {
    const codeEditor = editor as CodeEditor;
    editorRef.current = codeEditor;
    codeEditor.onDidChangeCursorPosition((e: CursorEvent) => {
      if (!joined) return;
      if (wsRef.current) {
        wsRef.current.send(
          JSON.stringify({
            type: "cursor",
            roomId: roomIdRef.current,
            userId: userName,
            position: {
              line: e.position.lineNumber,
              column: e.position.column,
            },
          })
        );
      }
    });
  };

  return (
    <MonacoEditor
      height="100%"
      language="shell"
      theme="vs-dark"
      value={code}
      onChange={handleChange}
      onMount={(editor) => handleDidMount(editor)}
      options={{ fontSize: 16, minimap: { enabled: false } }}
    />
  );
}
