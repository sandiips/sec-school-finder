'use client';

import { useState, ReactNode } from 'react';
import Navigation from '@/components/ui/Navigation';

interface LayoutWrapperProps {
  children: ReactNode;
}

export default function LayoutWrapper({ children }: LayoutWrapperProps) {
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  // Note: We're just passing the callback to Navigation.
  // The actual feedback modal is still in FeedbackWidget, which will be
  // updated to respond to this state in a future refactor if needed.
  // For now, Navigation and FeedbackWidget manage their own state independently.

  return (
    <>
      <Navigation onMobileFeedbackClick={() => {
        // Trigger feedback modal open event
        const feedbackButton = document.querySelector('[aria-label="Give feedback"]') as HTMLButtonElement;
        if (feedbackButton) {
          feedbackButton.click();
        }
      }} />
      {children}
    </>
  );
}
