import { useState } from "react";
import {
  ArrowRight,
  MessageCircle,
  Plus,
  ShieldCheck,
  WifiOff,
} from "lucide-react";
import { ConnectForm } from "@/features/connect-instance";
import { NewChatDialog } from "@/features/create-chat";
import { ChatList } from "@/widgets/chat-list";
import { Conversation } from "@/widgets/conversation";
import { Logo, Modal } from "@/shared/ui";
import { useMessenger } from "../model/use-messenger";
import HelpDialog from "./HelpDialog";

export default function MessengerPage() {
  const messenger = useMessenger();
  const [newChat, setNewChat] = useState(false);
  const [help, setHelp] = useState(false);
  const [login, setLogin] = useState(false);
  const activeChat = messenger.chats.find(
    (chat) => chat.id === messenger.activeId,
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
        <ChatList
          chats={messenger.chats}
          activeId={messenger.activeId}
          connected={messenger.connected}
          demo={messenger.demo}
          connection={messenger.connection}
          onSelectChat={messenger.selectChat}
          onNewChat={openNewChat}
          onHelp={() => setHelp(true)}
          onConnect={() => setLogin(true)}
          onDisconnect={messenger.disconnect}
        />
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
        <NewChatDialog
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
      {help && <HelpDialog onClose={() => setHelp(false)} />}
    </div>
  );
}
