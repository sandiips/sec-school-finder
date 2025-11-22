'use client';

import { useRouter, usePathname } from 'next/navigation';
import { MessageCircle } from 'lucide-react';

export default function MobileHeaderFeedback() {
  const router = useRouter();
  const pathname = usePathname();
  const isOnAskSAI = pathname === '/ask-sai';

  const handleClick = () => {
    if (!isOnAskSAI) {
      router.push('/ask-sai');
    }
    // If already on Ask SAI, do nothing
  };

  return (
    <button
      onClick={handleClick}
      aria-label="Go to Ask SAI"
      className="sm:hidden flex items-center justify-center w-10 h-10 rounded-lg bg-blue-500 hover:bg-blue-600 text-white transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50 disabled:cursor-not-allowed"
      title="Ask SAI"
      disabled={isOnAskSAI}
    >
      <MessageCircle size={20} />
    </button>
  );
}
