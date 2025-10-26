'use client';

import { useState, useEffect } from 'react';
import Navigation from '@/components/ui/Navigation';
import ChatContainer from '@/components/chat/ChatContainer';
import { useChat } from '@/hooks/useChat';

export default function AskSAIPage() {
  const [showChat, setShowChat] = useState(false);
  const [initialPrompt, setInitialPrompt] = useState<string>('');
  const [landingInput, setLandingInput] = useState('');
  const { clearConversation } = useChat();


  const handleLandingInputFocus = () => {
    // When user clicks input on landing page, transition to chat mode
    if (landingInput.trim()) {
      setInitialPrompt(landingInput);
    }
    setShowChat(true);
  };

  const handleBackToStart = () => {
    setShowChat(false);
    setInitialPrompt('');
    setLandingInput('');
    // Clear chat history when exiting
    clearConversation();
  };

  // Clear conversation when component unmounts (user navigates away)
  useEffect(() => {
    return () => {
      // Cleanup: clear conversation when leaving the page
      clearConversation();
    };
  }, [clearConversation]);

  // Populate chat input field with landing page text when transitioning
  useEffect(() => {
    if (showChat && initialPrompt) {
      setTimeout(() => {
        const input = document.querySelector('textarea') as HTMLTextAreaElement;
        if (input) {
          // Set value and trigger React's onChange
          const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
            window.HTMLTextAreaElement.prototype,
            'value'
          )?.set;
          if (nativeInputValueSetter) {
            nativeInputValueSetter.call(input, initialPrompt);
            const event = new Event('input', { bubbles: true });
            input.dispatchEvent(event);
          }
          input.focus();
        }
      }, 150);
    }
  }, [showChat, initialPrompt]);

  return (
    <main className="min-h-screen bg-[#1a1a1a]">
      <Navigation />

      {!showChat ? (
        /* Initial Landing View - Google AI Mode Style */
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] px-4">
          <div className="w-full max-w-3xl mx-auto text-center space-y-8">
            {/* Hero Section */}
            <div className="space-y-4">
              <h1 className="text-5xl md:text-6xl font-semibold text-white tracking-tight">
                Meet SAI
              </h1>
              <p className="text-xl text-white-400">
                Ask anything on SG secondary schooling to School Advisor AI (SAI) </p>
                <p className="text-l text-gray-500">
          Disclaimer: The answers provided by Ask SAI are AI-generated and may not always be accurate or complete. 
          Please validate the responses independently, as AI is still prone to errors.

              </p>
            </div>

            {/* Input Area - Google AI Mode Style - Functional */}
            <div className="mt-12">
              <div className="w-full bg-[#2d2d2d] border border-gray-700 rounded-full px-6 py-4 hover:bg-[#333333] hover:border-gray-600 transition-all shadow-lg">
                <div className="flex items-center gap-4">
                  <textarea
                    value={landingInput}
                    onChange={(e) => setLandingInput(e.target.value)}
                    onFocus={handleLandingInputFocus}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleLandingInputFocus();
                      }
                    }}
                    placeholder="Ask anything about Singapore secondary schools"
                    className="flex-1 bg-transparent text-gray-300 placeholder-gray-400 text-base focus:outline-none resize-none"
                    rows={1}
                    style={{ lineHeight: '24px' }}
                  />
                </div>
              </div>
            </div>

            {/* Info Section */}
            <div className="mt-16 text-sm text-gray-500 max-w-2xl mx-auto">
              <p>
                SAI knows about PSLE AL scores, cut-off points, school affiliations, sports programs, CCAs, and school culture.
                Get personalized recommendations based on your preferences.
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* Chat Interface - Full screen Google style */
        <div className="fixed inset-0 top-16 bg-[#1a1a1a] flex flex-col">
          {/* Back button - fixed at top */}
          <div className="flex-shrink-0 px-4 py-3 border-b border-gray-800">
            <button
              onClick={handleBackToStart}
              className="flex items-center gap-2 text-gray-400 hover:text-gray-200 transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              <span>Back to start</span>
            </button>
          </div>

          {/* Chat container - fills remaining space */}
          <div className="flex-1 min-h-0 flex flex-col">
            <div className="flex-1 min-h-0">
              <ChatContainer darkMode />
            </div>

            {/* Footer - Dark theme */}
            <footer className="flex-shrink-0 bg-[#1a1a1a] border-t border-gray-800 py-4">
              <div className="max-w-7xl mx-auto px-4">
                <div className="text-center">
                  <p className="text-sm text-gray-500">
                    © 2025 SchoolAdvisor SG. All rights reserved.
                  </p>
                </div>
              </div>
            </footer>
          </div>
        </div>
      )}
    </main>
  );
}
