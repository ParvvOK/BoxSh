import { clients } from "./clients.js";

export const rooms = new Map<string, Set<string>>();

export function joinRoom(clientId: string, roomId: string) {
  if (!rooms.has(roomId)) rooms.set(roomId, new Set());
  rooms.get(roomId)!.add(clientId);
}

export function leaveRoom(clientId: string, roomId: string) {
  rooms.get(roomId)?.delete(clientId);
  if (rooms.get(roomId)?.size === 0) rooms.delete(roomId);
}

export function broadcastToRoom(roomId: string, message: any) {
  const clientIds = rooms.get(roomId);
  if (!clientIds) return;
  clientIds.forEach((id) => {
    const client = clients.get(id);
    if (client) client.ws.send(JSON.stringify(message));
  });
}
