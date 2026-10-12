import type { Chat, MessageStatus, NotificationBody } from "../types";

export function normalizePhone(value: string): string {
  if (/[^\d+\s()-]/.test(value))
    throw new Error("Введите номер телефона, например +7 999 123-45-67.");
  let phone = value.replace(/\D/g, "");
  if (phone.length === 11 && phone.startsWith("8"))
    phone = `7${phone.slice(1)}`;
  if (!/^(7\d{10}|375\d{9})$/.test(phone))
    throw new Error(
      "Укажите номер России (+7) или Беларуси (+375) в международном формате.",
    );
  return phone;
}

export function formatPhone(phone: string) {
  if (/^7\d{10}$/.test(phone))
    return `+7 ${phone.slice(1, 4)} ${phone.slice(4, 7)}-${phone.slice(7, 9)}-${phone.slice(9)}`;
  return phone ? `+${phone}` : "";
}
export function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}
export function colorFor(id: string) {
  return [...id].reduce((sum, char) => sum + char.charCodeAt(0), 0) % 6;
}
export function lastTimestamp(chat: Chat) {
  return chat.messages.at(-1)?.timestamp ?? 0;
}
export function timeLabel(timestamp: number) {
  return new Date(timestamp).toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });
}
export function dateLabel(timestamp: number) {
  const date = new Date(timestamp);
  if (date.toDateString() === new Date().toDateString()) return "Сегодня";
  return date.toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
}

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

export function demoChats(): Chat[] {
  const now = Date.now();
  return [
    {
      id: "demo-1",
      name: "Александра",
      phone: "79991234567",
      color: 0,
      unread: 0,
      messages: [
        {
          id: "d1",
          text: "Привет! Как продвигается наше тестовое?",
          timestamp: now - 540000,
          outgoing: false,
        },
        {
          id: "d2",
          text: "Привет! Уже можно отправлять сообщения и получать ответы. Всё в одном окне ✨",
          timestamp: now - 480000,
          outgoing: true,
          status: "read",
        },
        {
          id: "d3",
          text: "Здорово! Люблю, когда всё просто и понятно.",
          timestamp: now - 420000,
          outgoing: false,
        },
        {
          id: "d4",
          text: "И я. Добавил только самое нужное — ничего лишнего.",
          timestamp: now - 360000,
          outgoing: true,
          status: "read",
        },
        {
          id: "d5",
          text: "Давай проверим? Напиши мне что-нибудь 👋",
          timestamp: now - 120000,
          outgoing: false,
        },
      ],
    },
    {
      id: "demo-2",
      name: "Михаил",
      phone: "79997654321",
      color: 1,
      unread: 1,
      messages: [
        {
          id: "d6",
          text: "Буду на связи после обеда",
          timestamp: now - 3600000,
          outgoing: false,
        },
      ],
    },
    {
      id: "demo-3",
      name: "Екатерина",
      phone: "79995551212",
      color: 2,
      unread: 0,
      messages: [
        {
          id: "d7",
          text: "Спасибо, всё получилось 💜",
          timestamp: now - 7200000,
          outgoing: false,
        },
      ],
    },
  ];
}
