import { WebSocket } from "ws";

export interface Client {
  ws: WebSocket;
  userId: string;
  roomId?: string | undefined;
}

export const clients = new Map<string, Client>();
