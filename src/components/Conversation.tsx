import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import {
  ArrowLeft,
  Check,
  CheckCheck,
  Clock3,
  Info,
  RotateCcw,
  Send,
  Smile,
  X,
} from "lucide-react";
import type { Chat, Message } from "../types";
import { dateLabel, formatPhone, initials, timeLabel } from "../lib/chat";

function Delivery({ message }: { message: Message }) {
  if (message.status === "sending")
    return <Clock3 size={13} aria-label="Отправляется" />;
  if (message.status === "read")
    return (
      <CheckCheck size={16} className="read-check" aria-label="Прочитано" />
    );
  if (message.status === "delivered")
    return <CheckCheck size={16} aria-label="Доставлено" />;
  if (message.status === "failed")
    return (
      <span className="failed-dot" aria-label="Не отправлено">
        !
      </span>
    );
  return <Check size={16} aria-label="Принято GREEN-API" />;
}

export default function Conversation({
  chat,
  demo,
  onBack,
  onSend,
}: {
  chat: Chat;
  demo: boolean;
  onBack: () => void;
  onSend: (chatId: string, text: string, retryId?: string) => Promise<void>;
}) {
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [pending, setPending] = useState(false);
  const end = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const submitting = useRef(false);
  const draft = drafts[chat.id] ?? "";
  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [chat.id, chat.messages.length]);
  const changeDraft = (value: string) =>
    setDrafts((current) => ({ ...current, [chat.id]: value }));
  const submit = async (event?: FormEvent) => {
    event?.preventDefault();
    if (!draft.trim() || draft.length > 4000 || submitting.current) return;
    submitting.current = true;
    setPending(true);
    setSubmitError("");
    const text = draft;
    changeDraft("");
    setEmojiOpen(false);
    try {
      await onSend(chat.id, text);
    } catch {
      setSubmitError("Не удалось отправить сообщение. Попробуйте снова.");
      setDrafts((current) => ({ ...current, [chat.id]: text }));
    } finally {
      submitting.current = false;
      setPending(false);
      input.current?.focus();
    }
  };
  return (
    <section className="conversation" aria-label={`Чат: ${chat.name}`}>
      <header className="conversation-header">
        <button
          className="icon-button back-button"
          onClick={onBack}
          aria-label="К списку чатов"
        >
          <ArrowLeft size={22} />
        </button>
        <div className={`avatar avatar-${chat.color}`} aria-hidden="true">
          {initials(chat.name)}
        </div>
        <div className="contact-heading">
          <h2>{chat.name}</h2>
          <p>
            {demo
              ? "Демонстрационный контакт"
              : chat.phone
                ? formatPhone(chat.phone)
                : "MAX"}
          </p>
        </div>
        <button
          className={`icon-button ${infoOpen ? "is-active" : ""}`}
          onClick={() => setInfoOpen(!infoOpen)}
          aria-label="Информация о чате"
          aria-expanded={infoOpen}
        >
          <Info size={22} />
        </button>
      </header>
      {infoOpen && (
        <div className="contact-info">
          <span>
            Чат: {chat.id}
            {chat.phone && ` · ${formatPhone(chat.phone)}`}
          </span>
          <button
            className="icon-button"
            aria-label="Скрыть информацию"
            onClick={() => setInfoOpen(false)}
          >
            <X size={16} />
          </button>
        </div>
      )}
      <div
        className="messages"
        role="log"
        aria-label="Сообщения"
        aria-live="polite"
      >
        <div className="messages-inner">
          {!chat.messages.length && (
            <div className="empty-conversation">
              <div className="empty-conversation-icon">
                <Send size={28} />
              </div>
              <h3>
                Каждый разговор начинается
                <br />с первого сообщения
              </h3>
              <p>Напишите собеседнику. Вы уже на связи.</p>
            </div>
          )}
          {chat.messages.map((message, index) => {
            const showDate =
              index === 0 ||
              new Date(message.timestamp).toDateString() !==
                new Date(chat.messages[index - 1].timestamp).toDateString();
            return (
              <div key={message.id} className="message-group">
                {showDate && (
                  <div className="date-separator">
                    <span>{dateLabel(message.timestamp)}</span>
                  </div>
                )}
                <div
                  className={`message-row ${message.outgoing ? "outgoing" : "incoming"}`}
                >
                  <div
                    className={`message-bubble ${message.status === "failed" ? "message-failed" : ""}`}
                  >
                    <p>{message.text}</p>
                    <span className="message-meta">
                      <time
                        dateTime={new Date(message.timestamp).toISOString()}
                      >
                        {timeLabel(message.timestamp)}
                      </time>
                      {message.outgoing && <Delivery message={message} />}
                    </span>
                  </div>
                </div>
                {message.status === "failed" && (
                  <div className="message-error">
                    <span>
                      {message.error || "Сообщение не доставлено."} Перед
                      повтором проверьте доставку в MAX.
                    </span>
                    <button
                      onClick={() =>
                        void onSend(chat.id, message.text, message.id)
                      }
                    >
                      <RotateCcw size={13} /> Повторить
                    </button>
                  </div>
                )}
              </div>
            );
          })}
          <div ref={end} />
        </div>
      </div>
      <div className="composer-area">
        {emojiOpen && (
          <div className="emoji-picker" aria-label="Выберите эмодзи">
            {[
              "👋",
              "😊",
              "💜",
              "✨",
              "👍",
              "🎉",
              "❤️",
              "☕",
              "🙌",
              "🔥",
              "🤝",
              "💬",
            ].map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => {
                  changeDraft(draft + emoji);
                  setEmojiOpen(false);
                  input.current?.focus();
                }}
                aria-label={`Добавить ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
        <form className="composer" onSubmit={submit}>
          <button
            type="button"
            className={`icon-button emoji-button ${emojiOpen ? "is-active" : ""}`}
            aria-label="Добавить эмодзи"
            aria-expanded={emojiOpen}
            onClick={() => setEmojiOpen(!emojiOpen)}
          >
            <Smile size={23} />
          </button>
          <textarea
            ref={input}
            aria-label="Сообщение"
            placeholder="Напишите сообщение…"
            value={draft}
            rows={1}
            maxLength={4000}
            onChange={(e) => changeDraft(e.target.value)}
            onKeyDown={(e) => {
              if (
                e.key === "Enter" &&
                !e.shiftKey &&
                !e.nativeEvent.isComposing
              ) {
                e.preventDefault();
                void submit();
              }
            }}
          />
          <button
            className="send-button"
            aria-label="Отправить сообщение"
            type="submit"
            disabled={!draft.trim() || pending}
          >
            <Send size={21} />
          </button>
        </form>
        {submitError && (
          <p className="form-error" role="alert">
            {submitError}
          </p>
        )}
        <div className="composer-hint">
          <span>Enter — отправить · Shift + Enter — новая строка</span>
          <span>
            {draft.length > 3500
              ? `${draft.length} / 4000`
              : demo
                ? "Деморежим"
                : "Текстовые сообщения"}
          </span>
        </div>
      </div>
    </section>
  );
}
