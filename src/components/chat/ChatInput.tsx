import { useState, FormEvent, KeyboardEvent } from 'react';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  darkMode?: boolean;
}

export default function ChatInput({ onSend, disabled = false, darkMode = false }: ChatInputProps) {
  const [input, setInput] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (input.trim() && !disabled) {
      onSend(input);
      setInput('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Enter (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  return (
    <div className={`w-full ${darkMode ? 'bg-[#1a1a1a]' : 'bg-white'}`}>
      <div className="max-w-3xl mx-auto px-4 py-4">
        <form onSubmit={handleSubmit} className="relative">
          {/* Google-style input container */}
          <div className={`flex items-end gap-3 rounded-full border shadow-lg px-5 py-3 transition-all ${
            darkMode
              ? 'bg-[#2d2d2d] border-gray-700 hover:bg-[#333333] hover:border-gray-600'
              : 'bg-white border-gray-300 hover:border-gray-400'
          }`}>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={disabled}
              placeholder="Ask anything"
              className={`flex-1 resize-none bg-transparent focus:outline-none min-h-[24px] max-h-[120px] ${
                darkMode
                  ? 'text-white placeholder-gray-500 disabled:text-gray-600'
                  : 'text-gray-900 placeholder-gray-400 disabled:text-gray-500'
              }`}
              rows={1}
              style={{
                lineHeight: '24px',
                scrollbarWidth: 'thin'
              }}
            />

            {/* Icon buttons - Google style */}
            <div className="flex items-center gap-1 flex-shrink-0">
              {/* Send button */}
              <button
                type="submit"
                disabled={disabled || !input.trim()}
                className={`p-2 rounded-full transition-all ${
                  !disabled && input.trim()
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : darkMode
                    ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                {disabled ? (
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
