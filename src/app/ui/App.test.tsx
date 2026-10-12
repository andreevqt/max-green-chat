import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import App from "./App";

describe("Пользовательские сценарии", () => {
  it("демо отправляет локальное сообщение и создаёт чат по номеру", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    render(<App />);
    await user.click(screen.getByRole("button", { name: /Посмотреть демо/ }));
    expect(screen.getByRole("heading", { name: "Александра" })).toBeVisible();
    await user.type(
      screen.getByRole("textbox", { name: "Сообщение" }),
      "Проверка демо{Enter}",
    );
    expect(
      await within(screen.getByRole("log")).findByText("Проверка демо"),
    ).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Новый чат" }));
    await user.type(
      screen.getByLabelText("Номер телефона"),
      "+7 999 222-33-44",
    );
    await user.type(screen.getByLabelText(/Имя/), "Анна");
    await user.click(screen.getByRole("button", { name: /Начать разговор/ }));
    expect(await screen.findByRole("heading", { name: "Анна" })).toBeVisible();
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it("подключается, получает и подтверждает сообщение, отправляет через API", async () => {
    const user = userEvent.setup();
    let received = false;
    const calls: string[] = [];
    const fetchMock = vi.fn(async (url: string, options: RequestInit) => {
      calls.push(url);
      if (url.includes("getStateInstance"))
        return new Response('{"stateInstance":"authorized"}');
      if (url.includes("getSettings"))
        return new Response('{"incomingWebhook":"yes","webhookUrl":""}');
      if (url.includes("receiveNotification")) {
        if (!received) {
          received = true;
          return new Response(
            JSON.stringify({
              receiptId: 17,
              body: {
                typeWebhook: "incomingMessageReceived",
                idMessage: "in-1",
                timestamp: Math.floor(Date.now() / 1000),
                senderData: { chatId: "10001", senderName: "Реальный контакт" },
                messageData: {
                  typeMessage: "textMessage",
                  textMessageData: { textMessage: "Ответ из MAX" },
                },
              },
            }),
          );
        }
        // A pending poll respects cleanup and does not flood this test.
        return new Promise<Response>((_, reject) =>
          options.signal?.addEventListener(
            "abort",
            () => reject(new DOMException("Aborted", "AbortError")),
            { once: true },
          ),
        );
      }
      if (url.includes("deleteNotification"))
        return new Response('{"result":true}');
      if (url.includes("sendMessage"))
        return new Response('{"idMessage":"out-1"}');
      throw new Error("Unexpected API method");
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<App />);
    await user.type(screen.getByLabelText(/ID инстанса/), "3100123456");
    await user.type(screen.getByLabelText(/API-токен/), "this-is-a-test-token");
    await user.click(screen.getByRole("button", { name: "Подключиться" }));
    await user.click(
      await screen.findByRole("button", { name: /Реальный контакт/ }),
    );
    expect(
      within(screen.getByRole("log")).getByText("Ответ из MAX"),
    ).toBeVisible();
    await waitFor(() =>
      expect(
        calls.some((url) =>
          url.includes("deleteNotification/this-is-a-test-token/17"),
        ),
      ).toBe(true),
    );
    expect(JSON.stringify(sessionStorage)).not.toContain(
      "this-is-a-test-token",
    );
    await user.type(
      screen.getByRole("textbox", { name: "Сообщение" }),
      "Привет из браузера{Enter}",
    );
    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("/sendMessage/"),
        expect.objectContaining({
          body: JSON.stringify({
            chatId: "10001",
            message: "Привет из браузера",
          }),
        }),
      ),
    );
    expect(await screen.findByLabelText("Принято GREEN-API")).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Отключить аккаунт" }));
    expect(screen.getByRole("button", { name: "Подключиться" })).toBeVisible();
  });
  it("показывает ошибку авторизации без запуска очереди", async () => {
    const user = userEvent.setup();
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response('{"stateInstance":"notAuthorized"}'));
    vi.stubGlobal("fetch", fetchMock);
    render(<App />);
    await user.type(screen.getByLabelText(/ID инстанса/), "3100123456");
    await user.type(screen.getByLabelText(/API-токен/), "this-is-a-test-token");
    await user.click(screen.getByRole("button", { name: "Подключиться" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Инстанс не авторизован",
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
