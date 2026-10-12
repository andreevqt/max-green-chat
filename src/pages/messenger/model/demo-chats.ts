import type { Chat } from "@/entities/chat";

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
