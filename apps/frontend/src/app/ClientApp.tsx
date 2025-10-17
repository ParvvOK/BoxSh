"use client";
import React, { useEffect, useRef, useState } from "react";
import { AppHeader, Participants } from "@boxsh/ui";
import { EditorClient } from "./EditorClient";

const getWsUrl = () => {
  if (typeof process !== "undefined" && process.env.NEXT_PUBLIC_WS_URL) {
    return process.env.NEXT_PUBLIC_WS_URL as string;
  }
  if (typeof window !== "undefined") {
    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    return `${protocol}://${window.location.hostname}:8080`;
  }
  return "ws://localhost:8080";
};

export default function ClientApp() {
  const [outputList, setOutputList] = useState<string[]>([]);
  const [code, setCode] = useState<string>("");
  const wsRef = useRef<WebSocket | null>(null);
  const [showRoomDialog, setShowRoomDialog] = useState(false);
  const [userName, setUserName] = useState("");
  const [roomId, setRoomId] = useState("");
  const [joined, setJoined] = useState(false);
  const [participants, setParticipants] = useState<string[]>([]);
  const roomIdRef = useRef<string>("");

  useEffect(() => {
    wsRef.current = new WebSocket(getWsUrl());
    wsRef.current.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.type === "output") {
        setOutputList((prev) => [msg.content, ...prev]);
      } else if (msg.type === "userList") {
        if (msg.roomId === roomIdRef.current) {
          setParticipants(Array.isArray(msg.users) ? msg.users : []);
        }
      } else if (msg.type === "editor" && msg.roomId === roomIdRef.current) {
        setCode(typeof msg.content === "string" ? msg.content : "");
      }
    };
    return () => {
      wsRef.current?.close();
    };
  }, []);

  useEffect(() => {
    roomIdRef.current = roomId;
  }, [roomId]);

  const handleRun = () => {
    if (wsRef.current) {
      wsRef.current.send(
        JSON.stringify({
          type: "run",
          code,
        })
      );
    }
  };

  const handleRoomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (wsRef.current && userName && roomId) {
      wsRef.current.send(
        JSON.stringify({
          type: "join",
          roomId,
          userId: userName,
        })
      );
      setJoined(true);
      setShowRoomDialog(false);
      setParticipants([]);
      if (code) {
        wsRef.current.send(
          JSON.stringify({
            type: "editor",
            roomId,
            userId: userName,
            content: code,
          })
        );
      }
    }
  };

  const handleLeaveRoom = () => {
    if (wsRef.current && joined && roomId) {
      wsRef.current.send(
        JSON.stringify({
          type: "leave",
          roomId,
          userId: userName,
        })
      );
    }
    setJoined(false);
    setParticipants([]);
  };

  return (
    <div className="flex h-screen font-sans">
      <div className="w-1/5 bg-[#222] text-white p-4 border-r-2 border-[#222] flex flex-col items-start gap-8 relative">
        <AppHeader
          onRun={handleRun}
          titleClassName="text-4xl font-extrabold tracking-tight"
        />

        <div className="w-full">
          {!joined ? (
            <button
              onClick={() => setShowRoomDialog(true)}
              className="w-full px-4 py-2 font-bold bg-gray-700 hover:bg-gray-600 rounded-md transition"
            >
              Room
            </button>
          ) : (
            <div className="w-full">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold truncate" title={roomId}>
                  {roomId}
                </h3>
                <button
                  onClick={handleLeaveRoom}
                  className="px-3 py-1 text-sm font-bold bg-red-600 hover:bg-red-500 rounded-md transition"
                >
                  Leave
                </button>
              </div>
              <Participants users={participants} />
            </div>
          )}

          {showRoomDialog && !joined && (
            <div className="absolute top-20 left-0 right-0 mx-auto max-w-[calc(100%_-_4px)] bg-[#1E1E1E] text-white p-6 rounded-lg shadow-lg z-10">
              <div className="flex justify-center mb-4 gap-4">
                <button className="px-4 py-2 rounded-md font-bold bg-gray-700">
                  Join Room
                </button>
              </div>

              <form onSubmit={handleRoomSubmit} className="flex flex-col gap-4">
                <label className="flex flex-col text-sm">
                  Name:
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    required
                    className="mt-1 px-2 py-1 bg-gray-800 text-white rounded border border-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-600"
                  />
                </label>
                <label className="flex flex-col text-sm">
                  Room ID:
                  <input
                    type="text"
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value)}
                    required
                    className="mt-1 px-2 py-1 bg-gray-800 text-white rounded border border-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-600"
                  />
                </label>

                <div className="flex gap-4 justify-end mt-4">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 font-bold rounded-md transition"
                  >
                    Join
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowRoomDialog(false)}
                    className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-md transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

      <main className="w-4/5 flex flex-col h-screen">
        <div className="flex flex-col h-[70%]">
          <div className="flex-1">
            <EditorClient
              wsRef={wsRef}
              roomIdRef={roomIdRef}
              userName={userName}
              joined={joined}
              code={code}
              onCodeChange={setCode}
            />
          </div>
        </div>

        <div className="h-[30%] bg-[#111] text-green-500 font-mono overflow-y-auto whitespace-pre-wrap border-t border-gray-800 p-4">
          {outputList.map((out, idx) => (
            <React.Fragment key={idx}>
              <div>{out}</div>
              {idx !== outputList.length - 1 && (
                <div className="border-b border-dotted border-gray-700 my-2" />
              )}
            </React.Fragment>
          ))}
        </div>
      </main>
    </div>
  );
}
