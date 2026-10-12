import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError, errorMessage, GreenApi } from "../lib/api";
import {
  applyNotification,
  colorFor,
  demoChats,
  formatPhone,
  normalizePhone,
} from "../lib/chat";
import type { Chat, Credentials, Message, NotificationBody } from "../types";

function restore(key: string): Chat[] {
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

function pause(ms: number, signal: AbortSignal) {
  return new Promise<void>((resolve) => {
    if (signal.aborted) return resolve();
    const finish = () => {
      clearTimeout(timer);
      signal.removeEventListener("abort", finish);
      resolve();
    };
    const timer = setTimeout(finish, ms);
    signal.addEventListener("abort", finish, { once: true });
  });
}

export function useMessenger() {
  const [client, setClient] = useState<GreenApi | null>(null);
  const [demo, setDemo] = useState(false);
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [connection, setConnection] = useState<
    "offline" | "connected" | "reconnecting"
  >("offline");
  const [notice, setNotice] = useState("");
  const chatsRef = useRef<Chat[]>([]);
  const activeRef = useRef<string | null>(null);
  const clientRef = useRef<GreenApi | null>(null);
  const storageKey = useRef("");
  const session = useRef(0);
  const demoTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const earlyStatuses = useRef(new Map<string, NotificationBody>());

  const updateChats = useCallback((update: (current: Chat[]) => Chat[]) => {
    const next = update(chatsRef.current);
    if (next === chatsRef.current) return;
    // Persist processed messages before acknowledging the API queue.
    if (storageKey.current)
      sessionStorage.setItem(storageKey.current, JSON.stringify(next));
    chatsRef.current = next;
    setChats(next);
  }, []);

  const selectChat = useCallback(
    (id: string | null) => {
      activeRef.current = id;
      setActiveId(id);
      try {
        updateChats((current) =>
          current.map((chat) =>
            chat.id === id ? { ...chat, unread: 0 } : chat,
          ),
        );
      } catch {
        setNotice(
          "Не удалось сохранить историю: освободите место в хранилище браузера.",
        );
      }
    },
    [updateChats],
  );

  const disconnect = useCallback(() => {
    session.current++;
    clientRef.current = null;
    storageKey.current = "";
    earlyStatuses.current.clear();
    setClient(null);
    setDemo(false);
    setConnection("offline");
    setNotice("");
    chatsRef.current = [];
    setChats([]);
    activeRef.current = null;
    setActiveId(null);
    demoTimers.current.forEach(clearTimeout);
    demoTimers.current = [];
  }, []);

  const connect = async (credentials: Credentials) => {
    const generation = ++session.current;
    const api = new GreenApi(credentials);
    const state = await api.getState();
    if (generation !== session.current) return;
    if (state?.stateInstance !== "authorized")
      throw new ApiError(
        "Инстанс не авторизован. Подключите аккаунт MAX в личном кабинете GREEN-API.",
      );
    const settings = await api.getSettings();
    if (generation !== session.current) return;
    if (!settings || settings.webhookUrl || settings.incomingWebhook !== "yes")
      throw new ApiError(
        "В настройках инстанса включите входящие уведомления и очистите Webhook URL. Затем повторите подключение.",
      );
    demoTimers.current.forEach(clearTimeout);
    demoTimers.current = [];
    earlyStatuses.current.clear();
    storageKey.current = `max-chat:${api.credentials.apiUrl}:${api.credentials.idInstance}`;
    const restored = restore(storageKey.current);
    chatsRef.current = restored;
    setChats(restored);
    activeRef.current = null;
    setActiveId(null);
    clientRef.current = api;
    setClient(api);
    setDemo(false);
    setConnection("connected");
    setNotice("");
  };

  const startDemo = () => {
    disconnect();
    const initial = demoChats();
    chatsRef.current = initial;
    setChats(initial);
    setDemo(true);
    setConnection("connected");
    selectChat("demo-1");
  };

  useEffect(() => {
    if (!client) return;
    const controller = new AbortController();
    const { signal } = controller;
    const poll = async () => {
      let failures = 0;
      while (!signal.aborted) {
        try {
          const notification = await client.receive(signal);
          if (signal.aborted) break;
          if (notification) {
            if (
              !Number.isSafeInteger(notification.receiptId) ||
              !notification.body
            )
              throw new ApiError("Некорректный формат уведомления GREEN-API.");
            updateChats((current) =>
              applyNotification(current, notification.body, activeRef.current),
            );
            const body = notification.body;
            if (
              body.typeWebhook === "outgoingMessageStatus" &&
              body.idMessage &&
              !chatsRef.current.some((chat) =>
                chat.messages.some((message) => message.id === body.idMessage),
              )
            ) {
              earlyStatuses.current.set(body.idMessage, body);
              if (earlyStatuses.current.size > 256)
                earlyStatuses.current.delete(
                  earlyStatuses.current.keys().next().value!,
                );
            }
            const ack = await client.acknowledge(
              notification.receiptId,
              signal,
            );
            if (!ack?.result)
              throw new ApiError(
                "Не удалось подтвердить получение сообщения. Повторяем попытку.",
              );
          }
          if (signal.aborted) break;
          failures = 0;
          setConnection("connected");
          setNotice("");
          await pause(notification ? 150 : 500, signal);
        } catch (error) {
          if (signal.aborted) break;
          setConnection("reconnecting");
          setNotice(errorMessage(error));
          failures++;
          await pause(
            Math.min(1000 * 2 ** Math.min(failures, 5), 30000),
            signal,
          );
        }
      }
    };
    void poll();
    return () => controller.abort();
  }, [client, updateChats]);

  useEffect(
    () => () => {
      demoTimers.current.forEach(clearTimeout);
    },
    [],
  );

  const createChat = async (rawPhone: string, rawName: string) => {
    const phone = normalizePhone(rawPhone);
    const api = clientRef.current;
    const generation = session.current;
    let id = `demo-${phone}`;
    const known = chatsRef.current.find((chat) => chat.phone === phone);
    if (known) {
      selectChat(known.id);
      return;
    }
    if (!demo) {
      if (!api) throw new ApiError("Сначала подключите GREEN-API.");
      const account = await api.checkAccount(phone);
      if (generation !== session.current) return;
      if (account.status === false)
        throw new ApiError(
          "Проверка номера недоступна. Проверьте авторизацию и лимиты инстанса.",
        );
      if (!account.exist || !account.chatId)
        throw new ApiError(
          "Аккаунт MAX не найден. Проверьте номер и доступность поиска по телефону.",
        );
      id = String(account.chatId);
    }
    updateChats((current) =>
      current.some((chat) => chat.id === id)
        ? current
        : [
            ...current,
            {
              id,
              phone,
              name: rawName.trim() || formatPhone(phone),
              color: colorFor(id),
              unread: 0,
              messages: [],
            },
          ],
    );
    selectChat(id);
  };

  const sendMessage = async (
    chatId: string,
    text: string,
    retryId?: string,
  ) => {
    if (!text.trim() || text.length > 4000) return;
    const api = clientRef.current;
    if (!demo && !api) return;
    const generation = session.current;
    const id = retryId ?? crypto.randomUUID();
    const message: Message = {
      id,
      text: text.trim(),
      timestamp: Date.now(),
      outgoing: true,
      status: "sending",
    };
    const replace = (patch: Partial<Message>) =>
      updateChats((current) =>
        current.map((chat) =>
          chat.id === chatId
            ? {
                ...chat,
                messages: chat.messages.map((item) =>
                  item.id === id ? { ...item, ...patch } : item,
                ),
              }
            : chat,
        ),
      );
    try {
      updateChats((current) =>
        current.map((chat) =>
          chat.id === chatId
            ? {
                ...chat,
                messages: retryId
                  ? chat.messages.map((item) =>
                      item.id === id
                        ? { ...item, status: "sending", error: undefined }
                        : item,
                    )
                  : [...chat.messages, message],
              }
            : chat,
        ),
      );
      if (demo) {
        replace({ status: "read" });
        const timer = setTimeout(() => {
          if (generation !== session.current) return;
          updateChats((current) =>
            applyNotification(
              current,
              {
                typeWebhook: "incomingMessageReceived",
                idMessage: crypto.randomUUID(),
                timestamp: Math.floor(Date.now() / 1000),
                senderData: { chatId },
                messageData: {
                  typeMessage: "textMessage",
                  textMessageData: {
                    textMessage:
                      "Сообщение получено! Это демонстрационный ответ — в реальном режиме здесь появится ответ из MAX 💜",
                  },
                },
              },
              activeRef.current,
            ),
          );
        }, 1100);
        demoTimers.current.push(timer);
      } else {
        const result = await api!.send(chatId, message.text);
        if (generation !== session.current) return;
        if (!result?.idMessage)
          throw new ApiError(
            "Сервис не подтвердил отправку. Проверьте доставку перед повтором.",
          );
        // An outgoing webhook can arrive before the send request resolves.
        updateChats((current) => {
          const merged: Chat[] = current.map((chat) =>
            chat.id === chatId
              ? {
                  ...chat,
                  messages: chat.messages
                    .filter(
                      (item) =>
                        item.id !== String(result.idMessage) || item.id === id,
                    )
                    .map((item) =>
                      item.id === id
                        ? {
                            ...item,
                            id: String(result.idMessage),
                            status:
                              chat.messages.find(
                                (m) => m.id === String(result.idMessage),
                              )?.status ?? "sent",
                          }
                        : item,
                    ),
                }
              : chat,
          );
          const earlyStatus = earlyStatuses.current.get(
            String(result.idMessage),
          );
          return earlyStatus
            ? applyNotification(merged, earlyStatus, activeRef.current)
            : merged;
        });
        earlyStatuses.current.delete(String(result.idMessage));
      }
    } catch (error) {
      if (generation !== session.current) return;
      try {
        replace({ status: "failed", error: errorMessage(error) });
      } catch {
        setNotice(
          "Не удалось сохранить сообщение: проверьте хранилище браузера.",
        );
      }
    }
  };

  return {
    chats,
    activeId,
    selectChat,
    connect,
    disconnect,
    startDemo,
    createChat,
    sendMessage,
    demo,
    connection,
    notice,
    connected: !!client || demo,
    instanceId: client?.credentials.idInstance,
  };
}
