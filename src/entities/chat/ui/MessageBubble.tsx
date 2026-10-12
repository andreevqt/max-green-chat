import type { ReactNode } from "react";
import { Check, CheckCheck, Clock3 } from "lucide-react";
import { timeLabel } from "@/shared/lib/date";
import type { Message } from "../model/types";

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

export default function MessageBubble({
  message,
  retryAction,
}: {
  message: Message;
  retryAction?: ReactNode;
}) {
  return (
    <>
      <div
        className={`message-row ${message.outgoing ? "outgoing" : "incoming"}`}
      >
        <div
          className={`message-bubble ${message.status === "failed" ? "message-failed" : ""}`}
        >
          <p>{message.text}</p>
          <span className="message-meta">
            <time dateTime={new Date(message.timestamp).toISOString()}>
              {timeLabel(message.timestamp)}
            </time>
            {message.outgoing && <Delivery message={message} />}
          </span>
        </div>
      </div>
      {message.status === "failed" && (
        <div className="message-error">
          <span>
            {message.error || "Сообщение не доставлено."} Перед повтором
            проверьте доставку в MAX.
          </span>
          {retryAction}
        </div>
      )}
    </>
  );
}
