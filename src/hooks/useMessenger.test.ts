import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { GreenApi } from "../lib/api";
import type { Notification } from "../types";
import { useMessenger } from "./useMessenger";

const credentials = {
  idInstance: "3100123456",
  apiTokenInstance: "test-token-not-real",
  apiUrl: "",
};

function mockConnection() {
  vi.spyOn(GreenApi.prototype, "getState").mockResolvedValue({
    stateInstance: "authorized",
  });
  vi.spyOn(GreenApi.prototype, "getSettings").mockResolvedValue({
    incomingWebhook: "yes",
    webhookUrl: "",
  });
  vi.spyOn(GreenApi.prototype, "checkAccount").mockResolvedValue({
    exist: true,
    chatId: "10001",
  });
  vi.spyOn(GreenApi.prototype, "receive").mockImplementation(
    (signal) =>
      new Promise((_, reject) =>
        signal.addEventListener(
          "abort",
          () => reject(new DOMException("Aborted", "AbortError")),
          { once: true },
        ),
      ),
  );
  return renderHook(() => useMessenger());
}

describe("Надёжность обмена сообщениями", () => {
  it("сохраняет ранний статус прочтения, пришедший до ответа SendMessage", async () => {
    const hook = mockConnection();
    let deliver!: (notification: Notification) => void;
    vi.spyOn(GreenApi.prototype, "receive").mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          deliver = resolve;
        }),
    );
    const acknowledge = vi
      .spyOn(GreenApi.prototype, "acknowledge")
      .mockResolvedValue({ result: true });
    let sent!: (response: { idMessage: string }) => void;
    vi.spyOn(GreenApi.prototype, "send").mockImplementation(
      () =>
        new Promise((resolve) => {
          sent = resolve;
        }),
    );
    await act(async () => {
      await hook.result.current.connect(credentials);
    });
    await act(async () => {
      await hook.result.current.createChat("+7 999 123-45-67", "Анна");
    });
    let sending!: Promise<void>;
    act(() => {
      sending = hook.result.current.sendMessage("10001", "Привет");
    });
    await act(async () => {
      deliver({
        receiptId: 8,
        body: {
          typeWebhook: "outgoingMessageStatus",
          idMessage: "out-42",
          status: "read",
          chatId: "10001",
        },
      });
    });
    await waitFor(() => expect(acknowledge).toHaveBeenCalled());
    await act(async () => {
      sent({ idMessage: "out-42" });
      await sending;
    });
    expect(hook.result.current.chats[0].messages).toHaveLength(1);
    expect(hook.result.current.chats[0].messages[0]).toMatchObject({
      id: "out-42",
      status: "read",
    });
  });

  it("повторяет неуспешную отправку без второй копии сообщения", async () => {
    const hook = mockConnection();
    const send = vi
      .spyOn(GreenApi.prototype, "send")
      .mockRejectedValueOnce(new Error("Сервис недоступен"))
      .mockResolvedValueOnce({ idMessage: "out-retry" });
    await act(async () => {
      await hook.result.current.connect(credentials);
    });
    await act(async () => {
      await hook.result.current.createChat("+7 999 123-45-67", "Анна");
    });
    await act(async () => {
      await hook.result.current.sendMessage("10001", "Привет");
    });
    const failed = hook.result.current.chats[0].messages[0];
    expect(failed).toMatchObject({
      status: "failed",
      error: "Сервис недоступен",
    });
    await act(async () => {
      await hook.result.current.sendMessage("10001", failed.text, failed.id);
    });
    expect(send).toHaveBeenCalledTimes(2);
    expect(hook.result.current.chats[0].messages).toHaveLength(1);
    expect(hook.result.current.chats[0].messages[0]).toMatchObject({
      id: "out-retry",
      status: "sent",
    });
  });

  it("не подтверждает входящее сообщение, если его не удалось сохранить", async () => {
    const hook = mockConnection();
    let deliver!: (notification: Notification) => void;
    vi.spyOn(GreenApi.prototype, "receive").mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          deliver = resolve;
        }),
    );
    const acknowledge = vi
      .spyOn(GreenApi.prototype, "acknowledge")
      .mockResolvedValue({ result: true });
    await act(async () => {
      await hook.result.current.connect(credentials);
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("Storage full", "QuotaExceededError");
    });
    await act(async () => {
      deliver({
        receiptId: 9,
        body: {
          typeWebhook: "incomingMessageReceived",
          idMessage: "in-9",
          senderData: { chatId: "10001" },
          messageData: {
            typeMessage: "textMessage",
            textMessageData: { textMessage: "Не потеряй меня" },
          },
        },
      });
    });
    await waitFor(() =>
      expect(hook.result.current.connection).toBe("reconnecting"),
    );
    expect(acknowledge).not.toHaveBeenCalled();
    expect(hook.result.current.chats).toHaveLength(0);
  });
});
