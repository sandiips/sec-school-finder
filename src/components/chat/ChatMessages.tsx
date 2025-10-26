import { useEffect, useRef } from 'react';
import type { Message } from '@/hooks/useChat';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';

interface ChatMessagesProps {
  messages: Message[];
  isLoading: boolean;
  darkMode?: boolean;
}

export default function ChatMessages({ messages, isLoading, darkMode = false }: ChatMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} darkMode={darkMode} />
        ))}

        {isLoading && <TypingIndicator darkMode={darkMode} />}

        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
