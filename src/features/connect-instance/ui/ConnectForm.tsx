import { useState } from "react";
import type { FormEvent } from "react";
import {
  ArrowRight,
  Check,
  ChevronDown,
  ExternalLink,
  Eye,
  EyeOff,
  LoaderCircle,
  ShieldCheck,
} from "lucide-react";
import type { Credentials } from "@/shared/api";
import { errorMessage } from "@/shared/api";

export default function ConnectForm({
  onConnect,
  onDemo,
}: {
  onConnect: (credentials: Credentials) => Promise<void>;
  onDemo: () => void;
}) {
  const [id, setId] = useState("");
  const [token, setToken] = useState("");
  const [url, setUrl] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      await onConnect({ idInstance: id, apiTokenInstance: token, apiUrl: url });
    } catch (error) {
      setError(errorMessage(error));
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="connect-content">
      <div className="eyebrow">
        <span className="green-dot" /> GREEN-API × MAX
      </div>
      <h1>Ближе, чем кажется.</h1>
      <p className="connect-description">
        Подключите аккаунт MAX и оставайтесь
        <br className="desktop-break" /> на связи прямо из браузера.
      </p>
      <form onSubmit={submit} className="connect-form">
        <label htmlFor="instance">
          ID инстанса <span>idInstance</span>
        </label>
        <input
          id="instance"
          inputMode="numeric"
          placeholder="Например, 3100123456"
          value={id}
          onChange={(e) => setId(e.target.value)}
          required
          autoComplete="off"
          disabled={busy}
        />
        <label htmlFor="token">
          API-токен <span>apiTokenInstance</span>
        </label>
        <div className="password-input">
          <input
            id="token"
            type={showToken ? "text" : "password"}
            placeholder="Введите ваш API-токен"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            required
            autoComplete="off"
            disabled={busy}
            spellCheck={false}
          />
          <button
            type="button"
            className="icon-button"
            onClick={() => setShowToken(!showToken)}
            aria-label={showToken ? "Скрыть токен" : "Показать токен"}
          >
            {showToken ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        <details className="api-details">
          <summary>
            Другой адрес API <ChevronDown size={15} />
          </summary>
          <label htmlFor="api-url" className="sr-only">
            API URL
          </label>
          <input
            id="api-url"
            type="url"
            placeholder="https://3100.api.green-api.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={busy}
          />
          <p>
            Если API URL в кабинете отличается от адреса, определённого по ID.
          </p>
        </details>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <button className="primary-button" disabled={busy} type="submit">
          {busy ? (
            <>
              <LoaderCircle className="spin" size={19} /> Подключаемся…
            </>
          ) : (
            <>
              Подключиться <ArrowRight size={19} />
            </>
          )}
        </button>
      </form>
      <p className="privacy-note">
        <ShieldCheck size={15} /> Токен хранится только в памяти этой вкладки
      </p>
      <div className="connect-divider">
        <span />
        или
        <span />
      </div>
      <button className="demo-button" onClick={onDemo} disabled={busy}>
        Посмотреть демо <ArrowRight size={17} />
      </button>
      <p className="credentials-help">
        Где взять данные?{" "}
        <a
          href="https://console.green-api.com/"
          target="_blank"
          rel="noreferrer"
        >
          Личный кабинет GREEN-API <ExternalLink size={12} />
        </a>
      </p>
      <div className="setup-hint">
        <Check size={14} />
        <p>
          В инстансе должны быть включены входящие уведомления, а поле Webhook
          URL — пустым.
        </p>
      </div>
    </div>
  );
}
