'use client';

import { useChat } from '@/hooks/useChat';
import ChatMessages from './ChatMessages';
import ChatInput from './ChatInput';

interface ChatContainerProps {
  darkMode?: boolean;
}

export default function ChatContainer({ darkMode = false }: ChatContainerProps) {
  const { messages, isLoading, sendMessage, clearConversation } = useChat();

  return (
    <div className="flex flex-col h-full">
      {/* Messages Area - Scrollable */}
      <div className="flex-1 min-h-0">
        <ChatMessages messages={messages} isLoading={isLoading} darkMode={darkMode} />
      </div>

      {/* Input Area - Fixed at bottom, centered */}
      <div className="flex-shrink-0 w-full">
        <ChatInput onSend={sendMessage} disabled={isLoading} darkMode={darkMode} />
      </div>
    </div>
  );
}
