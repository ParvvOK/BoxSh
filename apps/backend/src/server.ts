import { rooms } from "./rooms.js";
function broadcastUserList(roomId: string) {
  const clientIds = rooms.get(roomId);
  if (!clientIds) return;
  const users = Array.from(clientIds as Set<string>)
    .map((id: string) => clients.get(id)?.userId)
    .filter(Boolean);
  broadcastToRoom(roomId, {
    type: "userList",
    roomId,
    users,
  });
}
import { WebSocketServer, WebSocket } from "ws";
import { clients } from "./clients.js";
import type { Client } from "./clients.js";
import { joinRoom, leaveRoom, broadcastToRoom } from "./rooms.js";
import { runCommand } from "./shell.js";
import type { Message } from "./messages.js";
import { v4 as uuidv4 } from "uuid";
import { runCode } from "./runner.js";

export function startServer() {
  const wss = new WebSocketServer({ port: 8080 });

  wss.on("connection", (ws: WebSocket) => {
    const clientId = uuidv4();
    const client: Client = { ws, userId: clientId, roomId: undefined };
    clients.set(clientId, client);

    console.log(`Client connected: ${clientId}`);

    ws.on("message", async (raw: any) => {
      try {
        const msg: Message = JSON.parse(raw.toString());

        switch (msg.type) {
          case "join":
            client.roomId = msg.roomId;
            client.userId = msg.userId || "Anonymous";
            joinRoom(clientId, msg.roomId);
            broadcastUserList(msg.roomId);
            broadcastToRoom(msg.roomId, {
              type: "output",
              content: `${msg.userId} joined`,
            });
            break;

          case "leave":
            leaveRoom(clientId, msg.roomId);
            broadcastUserList(msg.roomId);
            broadcastToRoom(msg.roomId, {
              type: "output",
              content: `${msg.userId} left`,
            });
            client.roomId = undefined;
            break;

          case "input":
            const output: string = await runCommand(msg.command);
            broadcastToRoom(msg.roomId, { type: "output", content: output });
            break;

          case "cursor":
            broadcastToRoom(msg.roomId, msg);
            break;

          case "editor":
            broadcastToRoom(msg.roomId, msg);
            break;

          case "run":
            try {
              const output = await runCode(msg.code);
              if (client.roomId) {
                broadcastToRoom(client.roomId, {
                  type: "output",
                  content: output,
                });
              } else {
                client.ws.send(
                  JSON.stringify({
                    type: "output",
                    content: output,
                  })
                );
              }
            } catch (err) {
              const errorMsg = {
                type: "output",
                content: `❌ Error: ${(err as Error).message}`,
              };
              if (client.roomId) {
                broadcastToRoom(client.roomId, errorMsg);
              } else {
                client.ws.send(JSON.stringify(errorMsg));
              }
            }
            console.log("Received message:", msg);

            break;

          default:
            console.warn("Unknown message type:", msg);
        }
      } catch (err: unknown) {
        console.error("Error handling message:", err);
      }
    });

    ws.on("close", () => {
      if (client.roomId) leaveRoom(clientId, client.roomId);
      clients.delete(clientId);
      console.log(`Client disconnected: ${clientId}`);
    });
  });

  console.log("WebSocket server running on ws://localhost:8080");
}
