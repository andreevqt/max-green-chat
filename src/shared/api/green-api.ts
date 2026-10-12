import type { Credentials, Notification } from "./types";

export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function defaultApiUrl(idInstance: string) {
  return `https://${idInstance.slice(0, 4)}.api.green-api.com`;
}

export function validateCredentials(credentials: Credentials): Credentials {
  const idInstance = credentials.idInstance.trim();
  const apiTokenInstance = credentials.apiTokenInstance.trim();
  if (!/^\d{6,20}$/.test(idInstance))
    throw new ApiError("ID инстанса должен содержать от 6 до 20 цифр.");
  if (!/^[a-zA-Z0-9_-]{10,256}$/.test(apiTokenInstance))
    throw new ApiError("Проверьте API-токен в личном кабинете GREEN-API.");
  let url: URL;
  try {
    url = new URL(credentials.apiUrl.trim() || defaultApiUrl(idInstance));
  } catch {
    throw new ApiError("Введите корректный API URL из личного кабинета.");
  }
  if (
    url.protocol !== "https:" ||
    !/^(?:[a-z0-9-]+\.)*green-api\.com$/.test(url.hostname) ||
    url.username ||
    url.password ||
    url.port ||
    (url.pathname !== "/" && url.pathname !== "") ||
    url.search ||
    url.hash
  ) {
    throw new ApiError(
      "API URL должен быть HTTPS-адресом GREEN-API без пути, например https://3100.api.green-api.com.",
    );
  }
  return { idInstance, apiTokenInstance, apiUrl: url.origin };
}

function friendlyError(status: number, body: string): string {
  if (status === 401 || status === 403)
    return "Доступ отклонён. Проверьте ID инстанса и API-токен.";
  if (status === 429 || status === 469)
    return "Достигнут лимит GREEN-API. Подождите и попробуйте снова.";
  if (/webhook url/i.test(body))
    return "Очистите Webhook URL в настройках GREEN-API и подождите около минуты.";
  if (status >= 500)
    return "GREEN-API временно недоступен. Соединение восстановится автоматически.";
  return `GREEN-API вернул ошибку ${status}. Проверьте настройки инстанса и повторите попытку.`;
}

export class GreenApi {
  readonly credentials: Credentials;
  constructor(credentials: Credentials) {
    this.credentials = validateCredentials(credentials);
  }
  async request<T>(
    method: string,
    httpMethod = "GET",
    body?: object,
    signal?: AbortSignal,
    suffix = "",
  ): Promise<T> {
    const { apiUrl, idInstance, apiTokenInstance } = this.credentials;
    // Tokens are never persisted or included in application error messages.
    const url = `${apiUrl}/v3/waInstance${idInstance}/${method}/${apiTokenInstance}${suffix}`;
    let response: Response;
    try {
      response = await fetch(url, {
        method: httpMethod,
        ...(body
          ? {
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(body),
            }
          : {}),
        signal: signal
          ? AbortSignal.any([signal, AbortSignal.timeout(20_000)])
          : AbortSignal.timeout(20_000),
        cache: "no-store",
        referrerPolicy: "no-referrer",
      });
    } catch (error) {
      if (signal?.aborted) throw error;
      throw new ApiError(
        "Не удалось связаться с GREEN-API. Проверьте интернет и API URL.",
      );
    }
    const text = await response.text();
    if (!response.ok)
      throw new ApiError(friendlyError(response.status, text), response.status);
    try {
      return (text ? JSON.parse(text) : null) as T;
    } catch {
      throw new ApiError(
        "GREEN-API вернул некорректный ответ. Попробуйте снова.",
      );
    }
  }
  getState() {
    return this.request<{ stateInstance: string }>("getStateInstance");
  }
  getSettings() {
    return this.request<{
      incomingWebhook?: string;
      outgoingWebhook?: string;
      webhookUrl?: string;
    }>("getSettings");
  }
  checkAccount(phone: string) {
    return this.request<{
      exist?: boolean;
      chatId?: string;
      status?: boolean;
      reason?: string;
    }>("checkAccount", "POST", { phoneNumber: Number(phone) });
  }
  send(chatId: string, message: string) {
    return this.request<{ idMessage: string }>("sendMessage", "POST", {
      chatId,
      message,
    });
  }
  receive(signal: AbortSignal) {
    return this.request<Notification | null>(
      "receiveNotification",
      "GET",
      undefined,
      signal,
      "?receiveTimeout=5",
    );
  }
  acknowledge(receiptId: number, signal: AbortSignal) {
    return this.request<{ result: boolean }>(
      "deleteNotification",
      "DELETE",
      undefined,
      signal,
      `/${receiptId}`,
    );
  }
}

export function errorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Что-то пошло не так. Попробуйте снова.";
}
