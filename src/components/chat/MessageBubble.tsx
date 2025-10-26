import { format } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import type { Message } from '@/hooks/useChat';
import SchoolRecommendationCard from './SchoolRecommendationCard';

interface MessageBubbleProps {
  message: Message;
  darkMode?: boolean;
}

export default function MessageBubble({ message, darkMode = false }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  if (isSystem) return null;

  return (
    <div className="w-full space-y-4">
      {/* User message - aligned right, dark bubble */}
      {isUser ? (
        <div className="flex justify-end">
          <div className={`inline-block max-w-[85%] rounded-3xl px-5 py-3 ${
            darkMode
              ? 'bg-[#2d2d2d] text-white'
              : 'bg-gray-100 text-gray-900'
          }`}>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
          </div>
        </div>
      ) : (
        /* Assistant message - full width, left aligned */
        <div className="w-full">
          <div
            className={`rounded-2xl px-1 py-2 ${
              darkMode ? 'text-white' : 'text-gray-900'
            }`}
          >
            <div className={`prose prose-sm max-w-none ${darkMode ? 'prose-invert' : ''}`}>
              <ReactMarkdown
                components={{
                  p: ({ children }) => <p className={`mb-2 last:mb-0 text-sm leading-relaxed ${darkMode ? 'text-white' : 'text-gray-900'}`}>{children}</p>,
                  ul: ({ children }) => <ul className={`list-disc pl-4 mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{children}</ul>,
                  ol: ({ children }) => <ol className={`list-decimal pl-4 mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{children}</ol>,
                  li: ({ children }) => <li className={`mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{children}</li>,
                  strong: ({ children }) => <strong className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{children}</strong>,
                  em: ({ children }) => <em className={`italic ${darkMode ? 'text-white' : 'text-gray-900'}`}>{children}</em>,
                  code: ({ children }) => (
                    <code className={`px-1 py-0.5 rounded text-sm ${
                      darkMode ? 'bg-gray-800 text-white' : 'bg-gray-200 text-gray-800'
                    }`}>
                      {children}
                    </code>
                  )
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>

            {message.isStreaming && (
              <span className="inline-block w-1 h-4 bg-current animate-pulse ml-1" />
            )}
          </div>

          {/* School Results (only for assistant messages) */}
          {message.schoolResults && message.schoolResults.length > 0 && (
            <div className="mt-4 space-y-3">
              {message.schoolResults.map((school) => (
                <SchoolRecommendationCard key={school.code} school={school} darkMode={darkMode} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
