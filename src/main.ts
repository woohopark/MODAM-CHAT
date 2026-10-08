import './style.css';
import './styles.css';
import { ChatStore } from './domain/chat-store';
import { ChatService } from './application/chat-service';
import { DemoChatProvider } from './providers/demo-chat-provider';
import { AgiChatProvider } from './providers/agi-chat-provider';
import { HttpConversationRepository } from './providers/http-conversation-repository';
import { ChatView } from './ui/chat-view';
import { ChatController } from './ui/chat-controller';
import { SessionController } from './ui/session-controller';

const demo = import.meta.env.VITE_CHAT_MODE === 'demo';
const service = new ChatService(
  new ChatStore(),
  demo ? new DemoChatProvider() : new AgiChatProvider(),
  demo ? undefined : new HttpConversationRepository(),
);
const view = new ChatView();
const controller = new ChatController(service, view);
const session = demo ? undefined : new SessionController(service, view);
document.body.dataset.chatMode = demo ? 'demo' : 'agi';
controller.mount();
void session?.mount();
if (import.meta.hot)
  import.meta.hot.dispose(() => {
    session?.dispose();
    controller.dispose();
  });
