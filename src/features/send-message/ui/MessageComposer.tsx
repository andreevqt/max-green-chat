import { useRef, useState } from "react";
import type { FormEvent } from "react";
import { Send, Smile } from "lucide-react";

export default function MessageComposer({
  chatId,
  demo,
  onSend,
}: {
  chatId: string;
  demo: boolean;
  onSend: (chatId: string, text: string, retryId?: string) => Promise<void>;
}) {
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [pending, setPending] = useState(false);
  const input = useRef<HTMLTextAreaElement>(null);
  const submitting = useRef(false);
  const draft = drafts[chatId] ?? "";
  const changeDraft = (value: string) =>
    setDrafts((current) => ({ ...current, [chatId]: value }));
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
      await onSend(chatId, text);
    } catch {
      setSubmitError("Не удалось отправить сообщение. Попробуйте снова.");
      setDrafts((current) => ({ ...current, [chatId]: text }));
    } finally {
      submitting.current = false;
      setPending(false);
      input.current?.focus();
    }
  };
  return (
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
  );
}
