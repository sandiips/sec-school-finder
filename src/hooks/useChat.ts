import { useState, useEffect, useCallback } from 'react';
import { nanoid } from 'nanoid';

export interface SchoolResult {
  code: string;
  name: string;
  address: string;
  distance_km: number;
  cop_max_score: number;
  is_affiliated: boolean;
  sports_matches: string[];
  ccas_matches: string[];
  culture_matches: string[];
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  schoolResults?: SchoolResult[];
  isStreaming?: boolean;
}

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load conversation from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('sai-conversation');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Convert timestamp strings back to Date objects
        const messagesWithDates = parsed.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
        setMessages(messagesWithDates);
      } catch (e) {
        console.error('Failed to load conversation from localStorage:', e);
      }
    } else {
      // Add initial greeting message
      const greeting: Message = {
        id: nanoid(),
        role: 'assistant',
        content: "Hi! I'm SAI, your School Advisor for Singapore. I can help you find the perfect secondary school based on your PSLE AL score, location, and interests. What would you like to know?",
        timestamp: new Date()
      };
      setMessages([greeting]);
    }
  }, []);

  // Save conversation to localStorage whenever messages change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('sai-conversation', JSON.stringify(messages));
    }
  }, [messages]);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;

    setError(null);
    setIsLoading(true);

    // Add user message
    const userMessage: Message = {
      id: nanoid(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);

    // Create placeholder for assistant message
    const assistantMessageId = nanoid();
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true
    };

    setMessages(prev => [...prev, assistantMessage]);

    try {
      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(msg => ({
            role: msg.role,
            content: msg.content
          }))
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      let accumulatedContent = '';
      let schoolResults: SchoolResult[] | undefined;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.type === 'content') {
                accumulatedContent += data.content;

                // Update message with streamed content
                setMessages(prev => prev.map(msg =>
                  msg.id === assistantMessageId
                    ? { ...msg, content: accumulatedContent, isStreaming: true }
                    : msg
                ));
              } else if (data.type === 'tool_call' && data.result?.schools) {
                schoolResults = data.result.schools;
              } else if (data.type === 'done') {
                // Finalize message
                setMessages(prev => prev.map(msg =>
                  msg.id === assistantMessageId
                    ? {
                        ...msg,
                        content: accumulatedContent,
                        schoolResults,
                        isStreaming: false
                      }
                    : msg
                ));
              }
            } catch (parseError) {
              console.error('Error parsing SSE data:', parseError);
            }
          }
        }
      }

      // Ensure message is marked as complete
      setMessages(prev => prev.map(msg =>
        msg.id === assistantMessageId && msg.isStreaming
          ? { ...msg, schoolResults, isStreaming: false }
          : msg
      ));

    } catch (err) {
      console.error('Chat error:', err);
      setError(err instanceof Error ? err.message : 'Failed to send message');

      // Remove the failed assistant message
      setMessages(prev => prev.filter(msg => msg.id !== assistantMessageId));

      // Add error message
      const errorMessage: Message = {
        id: nanoid(),
        role: 'assistant',
        content: "I'm sorry, I encountered an error. Please try again.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [messages]);

  const clearConversation = useCallback(() => {
    localStorage.removeItem('sai-conversation');

    // Reset to greeting message
    const greeting: Message = {
      id: nanoid(),
      role: 'assistant',
      content: "Hi! I'm SAI, your School Advisor for Singapore. I can help you find the perfect secondary school based on your PSLE AL score, location, and interests. What would you like to know?",
      timestamp: new Date()
    };

    setMessages([greeting]);
    setError(null);
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearConversation
  };
}
