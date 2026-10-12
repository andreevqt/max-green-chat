export type MessageStatus =
  "sending" | "sent" | "delivered" | "read" | "failed";
export interface Message {
  id: string;
  text: string;
  timestamp: number;
  outgoing: boolean;
  status?: MessageStatus;
  error?: string;
}
export interface Chat {
  id: string;
  name: string;
  phone?: string;
  color: number;
  unread: number;
  messages: Message[];
}
