interface TypingIndicatorProps {
  darkMode?: boolean;
}

export default function TypingIndicator({ darkMode = false }: TypingIndicatorProps) {
  return (
    <div className="flex items-center gap-2 px-4 py-3">
      <div className="flex gap-1">
        <span
          className={`w-2 h-2 rounded-full animate-bounce ${
            darkMode ? 'bg-gray-500' : 'bg-gray-400'
          }`}
          style={{ animationDelay: '-0.32s' }}
        />
        <span
          className={`w-2 h-2 rounded-full animate-bounce ${
            darkMode ? 'bg-gray-500' : 'bg-gray-400'
          }`}
          style={{ animationDelay: '-0.16s' }}
        />
        <span
          className={`w-2 h-2 rounded-full animate-bounce ${
            darkMode ? 'bg-gray-500' : 'bg-gray-400'
          }`}
        />
      </div>
      <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
        SAI is thinking...
      </span>
    </div>
  );
}
