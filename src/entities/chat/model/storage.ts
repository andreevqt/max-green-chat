import type { Chat, Message } from "./types";
import { colorFor } from "../lib/chat";

export function restoreChatHistory(key: string): Chat[] {
  try {
    const data: unknown = JSON.parse(sessionStorage.getItem(key) ?? "[]");
    if (!Array.isArray(data)) return [];
    return data
      .filter(
        (chat): chat is Chat =>
          typeof chat?.id === "string" &&
          typeof chat?.name === "string" &&
          Array.isArray(chat?.messages) &&
          chat.messages.every(
            (m: Message) =>
              typeof m.id === "string" &&
              typeof m.text === "string" &&
              typeof m.timestamp === "number" &&
              typeof m.outgoing === "boolean",
          ),
      )
      .map((chat) => ({
        ...chat,
        color: colorFor(chat.id),
        unread: 0,
        messages: chat.messages.map((m) =>
          m.status === "sending"
            ? {
                ...m,
                status: "failed",
                error:
                  "Отправка прервалась. Проверьте доставку перед повтором.",
              }
            : m,
        ),
      }));
  } catch {
    return [];
  }
}
