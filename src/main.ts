import './style.css';
import { ChatStore } from './domain/chat-store';
import { ChatService } from './application/chat-service';
import { DemoChatProvider } from './providers/demo-chat-provider';
import { ChatController } from './ui/chat-controller';
import { ChatView } from './ui/chat-view';

// Composition root: replace the provider here when an AGI API is available.
const service = new ChatService(new ChatStore(), new DemoChatProvider());
const controller = new ChatController(service, new ChatView());
controller.mount();
if (import.meta.hot) import.meta.hot.dispose(() => controller.dispose());
