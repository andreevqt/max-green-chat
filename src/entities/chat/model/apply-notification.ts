import type { NotificationBody } from "@/shared/api";
import { formatPhone } from "@/shared/lib/phone";
import { colorFor } from "../lib/chat";
import type { Chat, MessageStatus } from "./types";

const statuses: Record<string, MessageStatus> = {
  sent: "sent",
  delivered: "delivered",
  read: "read",
  failed: "failed",
};
const order: Record<MessageStatus, number> = {
  sending: 0,
  sent: 1,
  delivered: 2,
  read: 3,
  failed: 4,
};

export function applyNotification(
  chats: Chat[],
  body: NotificationBody,
  activeId: string | null,
): Chat[] {
  if (body.typeWebhook === "outgoingMessageStatus") {
    const status = statuses[body.status ?? ""];
    if (!status || !body.idMessage) return chats;
    return chats.map((chat) => ({
      ...chat,
      messages: chat.messages.map((message) =>
        message.id === body.idMessage &&
        message.outgoing &&
        order[status] >= order[message.status ?? "sent"]
          ? { ...message, status }
          : message,
      ),
    }));
  }
  const incoming = body.typeWebhook === "incomingMessageReceived";
  const outgoing =
    body.typeWebhook === "outgoingMessageReceived" ||
    body.typeWebhook === "outgoingAPIMessageReceived";
  if (!incoming && !outgoing) return chats;
  const data = body.messageData;
  const text =
    data?.typeMessage === "textMessage"
      ? data.textMessageData?.textMessage
      : ["extendedTextMessage", "quotedMessage"].includes(
            data?.typeMessage ?? "",
          )
        ? data?.extendedTextMessageData?.text
        : undefined;
  const sender = body.senderData;
  const id = sender?.chatId ?? sender?.sender;
  if (!id || !body.idMessage || typeof text !== "string") return chats;
  const existing = chats.find((chat) => chat.id === id);
  if (existing?.messages.some((message) => message.id === body.idMessage))
    return chats;
  const chat: Chat = existing ?? {
    id,
    name:
      sender?.senderContactName ||
      sender?.chatName ||
      sender?.senderName ||
      (sender?.senderPhoneNumber
        ? formatPhone(String(sender.senderPhoneNumber))
        : `Контакт ${id}`),
    phone: sender?.senderPhoneNumber
      ? String(sender.senderPhoneNumber)
      : undefined,
    color: colorFor(id),
    unread: 0,
    messages: [],
  };
  const updated = {
    ...chat,
    unread: chat.unread + (incoming && activeId !== id ? 1 : 0),
    messages: [
      ...chat.messages,
      {
        id: body.idMessage,
        text,
        timestamp: (body.timestamp ?? Math.floor(Date.now() / 1000)) * 1000,
        outgoing,
        ...(outgoing ? { status: "sent" as const } : {}),
      },
    ].sort((a, b) => a.timestamp - b.timestamp),
  };
  return existing
    ? chats.map((item) => (item.id === id ? updated : item))
    : [...chats, updated];
}
