import { describe, expect, it } from "vitest";
import { applyNotification, normalizePhone } from "./chat";
import type { Chat, NotificationBody } from "../types";

const incoming: NotificationBody = {
  typeWebhook: "incomingMessageReceived",
  idMessage: "message-1",
  timestamp: 1700000000,
  senderData: { chatId: "12345", senderName: "Анна" },
  messageData: {
    typeMessage: "textMessage",
    textMessageData: { textMessage: "Привет!" },
  },
};

describe("Номера MAX", () => {
  it.each([
    ["+7 (999) 123-45-67", "79991234567"],
    ["8 999 123 45 67", "79991234567"],
    ["+375 29 123-45-67", "375291234567"],
  ])("нормализует %s", (input, expected) =>
    expect(normalizePhone(input)).toBe(expected),
  );
  it.each(["123", "+1 555 1234567", "79991234567abc", "37529123456"])(
    "отклоняет %s",
    (input) => expect(() => normalizePhone(input)).toThrow(),
  );
});

describe("Входящая очередь", () => {
  it("создаёт чат для неизвестного отправителя и учитывает непрочитанное", () => {
    const result = applyNotification([], incoming, null);
    expect(result[0]).toMatchObject({ id: "12345", name: "Анна", unread: 1 });
    expect(result[0].messages[0]).toMatchObject({
      text: "Привет!",
      outgoing: false,
      timestamp: 1700000000000,
    });
  });
  it("не дублирует сообщение при повторе уведомления после ошибки подтверждения", () => {
    const chats = applyNotification([], incoming, "12345");
    expect(applyNotification(chats, incoming, null)).toBe(chats);
    expect(chats[0].unread).toBe(0);
  });
  it("обрабатывает текст с URL и игнорирует медиа", () => {
    expect(
      applyNotification(
        [],
        {
          ...incoming,
          messageData: {
            typeMessage: "extendedTextMessage",
            extendedTextMessageData: { text: "https://example.com" },
          },
        },
        null,
      )[0].messages[0].text,
    ).toBe("https://example.com");
    expect(
      applyNotification(
        [],
        { ...incoming, messageData: { typeMessage: "imageMessage" } },
        null,
      ),
    ).toEqual([]);
  });
  it("не понижает статус прочитанного сообщения при запоздалом событии", () => {
    const chats: Chat[] = [
      {
        id: "12345",
        name: "Анна",
        color: 0,
        unread: 0,
        messages: [
          {
            id: "out-1",
            text: "Привет",
            outgoing: true,
            timestamp: 1,
            status: "read",
          },
        ],
      },
    ];
    expect(
      applyNotification(
        chats,
        {
          typeWebhook: "outgoingMessageStatus",
          idMessage: "out-1",
          status: "delivered",
        },
        null,
      )[0].messages[0].status,
    ).toBe("read");
  });
});
