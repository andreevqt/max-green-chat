import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Info, Send, X } from "lucide-react";
import { MessageBubble } from "@/entities/chat";
import type { Chat } from "@/entities/chat";
import { MessageComposer, RetryMessageButton } from "@/features/send-message";
import { dateLabel } from "@/shared/lib/date";
import { formatPhone } from "@/shared/lib/phone";
import { initials } from "@/shared/lib/text";

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
  const [infoOpen, setInfoOpen] = useState(false);
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [chat.id, chat.messages.length]);
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
                <MessageBubble
                  message={message}
                  retryAction={
                    <RetryMessageButton
                      onRetry={() =>
                        void onSend(chat.id, message.text, message.id)
                      }
                    />
                  }
                />
              </div>
            );
          })}
          <div ref={end} />
        </div>
      </div>
      <MessageComposer chatId={chat.id} demo={demo} onSend={onSend} />
    </section>
  );
}
