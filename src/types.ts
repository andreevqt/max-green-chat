export interface Credentials {
  idInstance: string;
  apiTokenInstance: string;
  apiUrl: string;
}
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
export interface NotificationBody {
  typeWebhook: string;
  timestamp?: number;
  idMessage?: string;
  chatId?: string;
  status?: string;
  senderData?: {
    chatId?: string;
    sender?: string;
    senderName?: string;
    senderContactName?: string;
    chatName?: string;
    senderPhoneNumber?: number;
  };
  messageData?: {
    typeMessage?: string;
    textMessageData?: { textMessage?: string };
    extendedTextMessageData?: { text?: string };
  };
}
export interface Notification {
  receiptId: number;
  body: NotificationBody;
}
