import { ShieldCheck } from "lucide-react";
import { Modal } from "@/shared/ui";

export default function HelpDialog({ onClose }: { onClose: () => void }) {
  return (
    <Modal title="Всё начинается с подключения" onClose={onClose}>
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
            Скопируйте idInstance и apiTokenInstance. При необходимости укажите
            API URL из кабинета.
          </li>
          <li>
            Создайте чат по номеру России или Беларуси и отправьте сообщение.
            Ответ появится автоматически.
          </li>
        </ol>
        <div className="help-security">
          <ShieldCheck size={22} />
          <p>
            Токен остаётся в памяти вкладки и отправляется только в GREEN-API.
            История хранится в sessionStorage этой вкладки. После обновления
            страницы подключитесь заново.
          </p>
        </div>
        <p className="help-footnote">
          Деморежим использует вымышленные контакты и локальные ответы.
          Приложение — независимый тестовый проект.
        </p>
      </div>
    </Modal>
  );
}
