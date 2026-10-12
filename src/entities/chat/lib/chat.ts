import type { Chat } from "../model/types";

export function colorFor(id: string) {
  return [...id].reduce((sum, char) => sum + char.charCodeAt(0), 0) % 6;
}
export function lastTimestamp(chat: Chat) {
  return chat.messages.at(-1)?.timestamp ?? 0;
}
