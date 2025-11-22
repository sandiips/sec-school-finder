'use client';

import { MessageCircle } from 'lucide-react';

interface MobileHeaderFeedbackProps {
  onFeedbackClick: () => void;
}

export default function MobileHeaderFeedback({ onFeedbackClick }: MobileHeaderFeedbackProps) {
  return (
    <button
      onClick={onFeedbackClick}
      aria-label="Give feedback"
      className="sm:hidden flex items-center justify-center w-10 h-10 rounded-lg bg-blue-500 hover:bg-blue-600 text-white transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
      title="Feedback"
    >
      <MessageCircle size={20} />
    </button>
  );
}
