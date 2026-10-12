import { describe, expect, it, vi } from "vitest";
import { GreenApi, validateCredentials } from "./green-api";

const credentials = {
  idInstance: "3100123456",
  apiTokenInstance: "test-token-that-is-not-real",
  apiUrl: "",
};
describe("GREEN-API клиент", () => {
  it("определяет кластер по ID инстанса", () =>
    expect(validateCredentials(credentials).apiUrl).toBe(
      "https://3100.api.green-api.com",
    ));
  it.each([
    "https://green-api.com.evil.com",
    "http://3100.api.green-api.com",
    "https://example.com",
    "https://api.green-api.com/path",
    "https://user:password@api.green-api.com",
    "https://api.green-api.com?token=x",
  ])("не отправляет токен в %s", (apiUrl) =>
    expect(() => validateCredentials({ ...credentials, apiUrl })).toThrow(),
  );
  it("посылает текст методом SendMessage с MAX chatId", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify({ idMessage: "42" })));
    vi.stubGlobal("fetch", fetchMock);
    expect(await new GreenApi(credentials).send("10000000", "Привет")).toEqual({
      idMessage: "42",
    });
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/v3/waInstance3100123456/sendMessage/"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ chatId: "10000000", message: "Привет" }),
      }),
    );
  });
  it("получает уведомление и подтверждает его DELETE", async () => {
    const fetchMock = vi
      .fn()
      .mockImplementation(async () => new Response("null"));
    vi.stubGlobal("fetch", fetchMock);
    const api = new GreenApi(credentials),
      signal = new AbortController().signal;
    await api.receive(signal);
    await api.acknowledge(123, signal);
    expect(fetchMock.mock.calls[0][0]).toContain(
      "/receiveNotification/test-token-that-is-not-real?receiveTimeout=5",
    );
    expect(fetchMock.mock.calls[1]).toEqual([
      expect.stringContaining(
        "/deleteNotification/test-token-that-is-not-real/123",
      ),
      expect.objectContaining({ method: "DELETE" }),
    ]);
  });
  it("скрывает детали ответа сервера и токен из пользовательской ошибки", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          new Response(credentials.apiTokenInstance, { status: 401 }),
        ),
    );
    await expect(new GreenApi(credentials).getState()).rejects.toThrow(
      "Доступ отклонён",
    );
  });
});
