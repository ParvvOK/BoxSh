export interface BaseMessage {
  type: string;
  roomId: string;
  userId?: string;
}

export interface JoinMessage extends BaseMessage {
  type: "join";
}

export interface LeaveMessage extends BaseMessage {
  type: "leave";
}

export interface InputMessage extends BaseMessage {
  type: "input";
  command: string;
}

export interface RunMessage extends BaseMessage {
  type: "run";
  code: string;
}

export interface OutputMessage extends BaseMessage {
  type: "output";
  content: string;
}

export interface CursorMessage extends BaseMessage {
  type: "cursor";
  position: { line: number; column: number };
}

export interface EditorMessage extends BaseMessage {
  type: "editor";
  content: string;
}

export type Message =
  | JoinMessage
  | LeaveMessage
  | InputMessage
  | RunMessage
  | OutputMessage
  | CursorMessage
  | EditorMessage;
