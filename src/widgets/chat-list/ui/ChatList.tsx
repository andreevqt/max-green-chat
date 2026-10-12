import { useMemo, useState } from "react";
import {
  ArrowRight,
  CheckCheck,
  ChevronRight,
  CircleHelp,
  LogOut,
  MessageCircle,
  Plus,
  Search,
  Sparkles,
} from "lucide-react";
import { lastTimestamp } from "@/entities/chat";
import type { Chat } from "@/entities/chat";
import { initials } from "@/shared/lib/text";
import { timeLabel } from "@/shared/lib/date";
import { Logo } from "@/shared/ui";

interface ChatListProps {
  chats: Chat[];
  activeId: string | null;
  connected: boolean;
  demo: boolean;
  connection: "offline" | "connected" | "reconnecting";
  onSelectChat: (id: string | null) => void;
  onNewChat: () => void;
  onHelp: () => void;
  onConnect: () => void;
  onDisconnect: () => void;
}

export default function ChatList({
  chats,
  activeId,
  connected,
  demo,
  connection,
  onSelectChat,
  onNewChat,
  onHelp,
  onConnect,
  onDisconnect,
}: ChatListProps) {
  const [query, setQuery] = useState("");
  const filteredChats = useMemo(
    () =>
      chats
        .filter((chat) =>
          `${chat.name} ${chat.phone ?? ""}`
            .toLocaleLowerCase()
            .includes(query.toLocaleLowerCase()),
        )
        .sort((a, b) => lastTimestamp(b) - lastTimestamp(a)),
    [chats, query],
  );
  return (
    <aside className="sidebar" aria-label="Список чатов">
      <header className="sidebar-header">
        <div className="brand">
          <Logo />
          <strong>
            MAX<span className="brand-period">.</span>
          </strong>
        </div>
        <button className="icon-button" aria-label="Помощь" onClick={onHelp}>
          <CircleHelp size={21} />
        </button>
      </header>
      <div className="sidebar-title">
        <h2>
          Сообщения <span>{chats.length || ""}</span>
        </h2>
        <button
          className="new-chat-button"
          onClick={onNewChat}
          aria-label="Новый чат"
          title="Новый чат"
        >
          <Plus size={20} />
        </button>
      </div>
      <div className="search-input">
        <Search size={18} />
        <input
          aria-label="Поиск чатов"
          placeholder="Поиск"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <kbd>⌕</kbd>
      </div>
      <div className="chat-list">
        {filteredChats.map((chat) => {
          const last = chat.messages.at(-1);
          return (
            <button
              key={chat.id}
              className={`chat-item ${activeId === chat.id ? "selected" : ""}`}
              onClick={() => onSelectChat(chat.id)}
              aria-pressed={activeId === chat.id}
            >
              <div className={`avatar avatar-${chat.color}`}>
                {initials(chat.name)}
              </div>
              <div className="chat-preview">
                <div className="chat-preview-top">
                  <strong>{chat.name}</strong>
                  {last && <time>{timeLabel(last.timestamp)}</time>}
                </div>
                <div className="chat-preview-bottom">
                  <p>
                    {last?.outgoing && <CheckCheck size={14} />}
                    {last?.text || "Начните разговор"}
                  </p>
                  {chat.unread > 0 && (
                    <span
                      className="unread-badge"
                      aria-label={`${chat.unread} непрочитанных`}
                    >
                      {chat.unread}
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
        {!filteredChats.length &&
          (connected ? (
            <div className="sidebar-empty">
              <MessageCircle size={27} />
              <h3>{query ? "Ничего не найдено" : "Пока тихо"}</h3>
              <p>
                {query
                  ? "Попробуйте другое имя или номер"
                  : "Создайте первый чат и начните разговор"}
              </p>
              {!query && (
                <button onClick={onNewChat}>
                  Новый чат <ArrowRight size={14} />
                </button>
              )}
            </div>
          ) : (
            <div className="sidebar-empty disconnected-empty">
              <div className="empty-lines">
                <span />
                <span />
                <span />
              </div>
              <h3>Здесь будут ваши чаты</h3>
              <p>
                Подключите аккаунт,
                <br />
                чтобы начать общение
              </p>
            </div>
          ))}
      </div>
      <div className="sidebar-bottom">
        {demo && (
          <button className="demo-notice" onClick={onConnect}>
            <Sparkles size={17} />
            <span>
              Вы в деморежиме<small>Подключить настоящий MAX</small>
            </span>
            <ChevronRight size={16} />
          </button>
        )}
        <div className="account">
          <div
            className={`account-avatar ${connected ? "connected-avatar" : ""}`}
          >
            <Logo />
          </div>
          <div>
            <strong>
              {demo ? "Демоаккаунт" : connected ? "Ваш аккаунт" : "Ваш MAX"}
            </strong>
            <p>
              <span className={`status-dot ${connection}`} />
              {demo
                ? "Деморежим"
                : connection === "connected"
                  ? "Подключён"
                  : connection === "reconnecting"
                    ? "Восстанавливаем связь"
                    : "Не подключён"}
            </p>
          </div>
          <button
            className="icon-button"
            aria-label={connected ? "Отключить аккаунт" : "Подключить аккаунт"}
            title={connected ? "Отключить" : "Подключить"}
            onClick={() => {
              if (connected) {
                onDisconnect();
                setQuery("");
              } else onConnect();
            }}
          >
            {connected ? <LogOut size={19} /> : <ArrowRight size={19} />}
          </button>
        </div>
      </div>
    </aside>
  );
}
