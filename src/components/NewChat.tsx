import { useState } from "react";
import type { FormEvent } from "react";
import { ArrowRight, LoaderCircle, Phone } from "lucide-react";
import { errorMessage } from "../lib/api";
import Modal from "./Modal";

export default function NewChat({
  onClose,
  onCreate,
  demo,
}: {
  onClose: () => void;
  onCreate: (phone: string, name: string) => Promise<void>;
  demo: boolean;
}) {
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      await onCreate(phone, name);
      onClose();
    } catch (error) {
      setError(errorMessage(error));
      setBusy(false);
    }
  };
  return (
    <Modal title="Новый разговор" onClose={onClose}>
      <p className="modal-description">
        Начните с номера телефона. Остальное — просто сообщение.
      </p>
      <form onSubmit={submit} className="new-chat-form">
        <label htmlFor="phone">Номер телефона</label>
        <div className="phone-input">
          <Phone size={18} />
          <input
            id="phone"
            type="tel"
            placeholder="+7 999 123-45-67"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            autoFocus
            disabled={busy}
          />
        </div>
        <p className="field-hint">
          Номер России или Беларуси в международном формате
        </p>
        <label htmlFor="contact-name">
          Имя <span>необязательно</span>
        </label>
        <input
          id="contact-name"
          placeholder="Как зовут собеседника?"
          maxLength={80}
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={busy}
        />
        {error && (
          <p role="alert" className="form-error">
            {error}
          </p>
        )}
        {demo && (
          <p className="field-hint demo-hint">
            Деморежим: сообщения остаются внутри приложения.
          </p>
        )}
        <button className="primary-button" type="submit" disabled={busy}>
          {busy ? (
            <>
              <LoaderCircle size={18} className="spin" /> Проверяем номер…
            </>
          ) : (
            <>
              Начать разговор <ArrowRight size={18} />
            </>
          )}
        </button>
      </form>
    </Modal>
  );
}
