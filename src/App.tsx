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
  ShieldCheck,
  Sparkles,
  WifiOff,
} from "lucide-react";
import { useMessenger } from "./hooks/useMessenger";
import { initials, lastTimestamp, timeLabel } from "./lib/chat";
import ConnectForm from "./components/ConnectForm";
import Conversation from "./components/Conversation";
import Modal from "./components/Modal";
import NewChat from "./components/NewChat";

function Logo({ large = false }: { large?: boolean }) {
  return (
    <img
      className={`max-logo ${large ? "large" : ""}`}
      src="/favicon.svg"
      alt="MAX"
    />
  );
}

export default function App() {
  const messenger = useMessenger();
  const [query, setQuery] = useState("");
  const [newChat, setNewChat] = useState(false);
  const [help, setHelp] = useState(false);
  const [login, setLogin] = useState(false);
  const activeChat = messenger.chats.find(
    (chat) => chat.id === messenger.activeId,
  );
  const filteredChats = useMemo(
    () =>
      messenger.chats
        .filter((chat) =>
          `${chat.name} ${chat.phone ?? ""}`
            .toLocaleLowerCase()
            .includes(query.toLocaleLowerCase()),
        )
        .sort((a, b) => lastTimestamp(b) - lastTimestamp(a)),
    [messenger.chats, query],
  );
  const openNewChat = () => {
    if (messenger.connected) setNewChat(true);
    else setLogin(true);
  };
  return (
    <div className="app-page">
      <div className="top-caption">
        <span>Хорошие разговоры начинаются здесь.</span>
        <span className="caption-right">
          <span className="green-dot" /> Работает с GREEN-API
        </span>
      </div>
      <main className={`messenger ${activeChat ? "has-active-chat" : ""}`}>
        <aside className="sidebar" aria-label="Список чатов">
          <header className="sidebar-header">
            <div className="brand">
              <Logo />
              <strong>
                MAX<span className="brand-period">.</span>
              </strong>
            </div>
            <button
              className="icon-button"
              aria-label="Помощь"
              onClick={() => setHelp(true)}
            >
              <CircleHelp size={21} />
            </button>
          </header>
          <div className="sidebar-title">
            <h2>
              Сообщения <span>{messenger.chats.length || ""}</span>
            </h2>
            <button
              className="new-chat-button"
              onClick={openNewChat}
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
                  className={`chat-item ${messenger.activeId === chat.id ? "selected" : ""}`}
                  onClick={() => messenger.selectChat(chat.id)}
                  aria-pressed={messenger.activeId === chat.id}
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
              (messenger.connected ? (
                <div className="sidebar-empty">
                  <MessageCircle size={27} />
                  <h3>{query ? "Ничего не найдено" : "Пока тихо"}</h3>
                  <p>
                    {query
                      ? "Попробуйте другое имя или номер"
                      : "Создайте первый чат и начните разговор"}
                  </p>
                  {!query && (
                    <button onClick={openNewChat}>
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
            {messenger.demo && (
              <button className="demo-notice" onClick={() => setLogin(true)}>
                <Sparkles size={17} />
                <span>
                  Вы в деморежиме<small>Подключить настоящий MAX</small>
                </span>
                <ChevronRight size={16} />
              </button>
            )}
            <div className="account">
              <div
                className={`account-avatar ${messenger.connected ? "connected-avatar" : ""}`}
              >
                <Logo />
              </div>
              <div>
                <strong>
                  {messenger.demo
                    ? "Демоаккаунт"
                    : messenger.connected
                      ? "Ваш аккаунт"
                      : "Ваш MAX"}
                </strong>
                <p>
                  <span className={`status-dot ${messenger.connection}`} />
                  {messenger.demo
                    ? "Деморежим"
                    : messenger.connection === "connected"
                      ? "Подключён"
                      : messenger.connection === "reconnecting"
                        ? "Восстанавливаем связь"
                        : "Не подключён"}
                </p>
              </div>
              <button
                className="icon-button"
                aria-label={
                  messenger.connected
                    ? "Отключить аккаунт"
                    : "Подключить аккаунт"
                }
                title={messenger.connected ? "Отключить" : "Подключить"}
                onClick={() => {
                  if (messenger.connected) {
                    messenger.disconnect();
                    setQuery("");
                  } else setLogin(true);
                }}
              >
                {messenger.connected ? (
                  <LogOut size={19} />
                ) : (
                  <ArrowRight size={19} />
                )}
              </button>
            </div>
          </div>
        </aside>
        <div className="main-panel">
          {messenger.notice && (
            <div className="connection-notice" role="status">
              <WifiOff size={17} />
              <span>{messenger.notice}</span>
            </div>
          )}
          {activeChat ? (
            <Conversation
              chat={activeChat}
              demo={messenger.demo}
              onBack={() => messenger.selectChat(null)}
              onSend={messenger.sendMessage}
            />
          ) : (
            <section
              className={`welcome ${messenger.connected ? "connected-welcome" : ""}`}
            >
              <div className="welcome-decoration" aria-hidden="true">
                <div className="orbit orbit-one" />
                <div className="orbit orbit-two" />
                <span className="orbit-dot dot-one" />
                <span className="orbit-dot dot-two" />
                <Logo large />
              </div>
              {messenger.connected ? (
                <div className="ready-content">
                  <span className="eyebrow">НА СВЯЗИ</span>
                  <h1>Скажите «привет».</h1>
                  <p>
                    Выберите чат слева или начните
                    <br />
                    новый разговор по номеру телефона.
                  </p>
                  <button className="primary-button" onClick={openNewChat}>
                    <Plus size={18} /> Новый чат
                  </button>
                  <p className="privacy-note">
                    <ShieldCheck size={16} /> Личная история остаётся в этой
                    вкладке
                  </p>
                </div>
              ) : (
                <ConnectForm
                  onConnect={messenger.connect}
                  onDemo={messenger.startDemo}
                />
              )}
              <div className="welcome-bottom">
                <MessageCircle size={14} /> Просто общение. Ничего лишнего.
              </div>
            </section>
          )}
        </div>
      </main>
      <footer className="page-footer">
        <span>MAX web-клиент</span>
        <span>Текстовые сообщения. Живые разговоры.</span>
        <button onClick={() => setHelp(true)}>
          О приложении <ArrowRight size={12} />
        </button>
      </footer>
      {newChat && (
        <NewChat
          onClose={() => setNewChat(false)}
          onCreate={messenger.createChat}
          demo={messenger.demo}
        />
      )}
      {login && (
        <Modal title="Подключить MAX" onClose={() => setLogin(false)}>
          <ConnectForm
            onConnect={async (credentials) => {
              await messenger.connect(credentials);
              setLogin(false);
            }}
            onDemo={() => {
              messenger.startDemo();
              setLogin(false);
            }}
          />
        </Modal>
      )}
      {help && (
        <Modal
          title="Всё начинается с подключения"
          onClose={() => setHelp(false)}
        >
          <div className="help-content">
            <p>Веб-клиент для текстовых сообщений в MAX через GREEN-API.</p>
            <ol>
              <li>
                Создайте инстанс MAX в{" "}
                <a
                  href="https://console.green-api.com/"
                  target="_blank"
                  rel="noreferrer"
                >
                  кабинете GREEN-API
                </a>{" "}
                и авторизуйте его.
              </li>
              <li>
                Включите входящие уведомления (incomingWebhook: yes). Очистите
                Webhook URL. Для статусов доставки включите outgoingWebhook.
              </li>
              <li>
                Скопируйте idInstance и apiTokenInstance. При необходимости
                укажите API URL из кабинета.
              </li>
              <li>
                Создайте чат по номеру России или Беларуси и отправьте
                сообщение. Ответ появится автоматически.
              </li>
            </ol>
            <div className="help-security">
              <ShieldCheck size={22} />
              <p>
                Токен остаётся в памяти вкладки и отправляется только в
                GREEN-API. История хранится в sessionStorage этой вкладки. После
                обновления страницы подключитесь заново.
              </p>
            </div>
            <p className="help-footnote">
              Деморежим использует вымышленные контакты и локальные ответы.
              Приложение — независимый тестовый проект.
            </p>
          </div>
        </Modal>
      )}
    </div>
  );
}
