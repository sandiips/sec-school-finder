'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';

type Category = 'Bug' | 'Confusing' | 'Idea' | 'Other';

export default function FeedbackWidget() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [rating, setRating] = useState<number | undefined>(undefined);
  const [category, setCategory] = useState<Category>('Other');
  const [submitting, setSubmitting] = useState(false);
  const [ok, setOk] = useState<null | boolean>(null);

  // capture UA once
  const userAgent = useMemo(() => (typeof navigator !== 'undefined' ? navigator.userAgent : ''), []);
  // ESC to close
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  async function submit() {
    if (!message.trim()) return;
    setSubmitting(true);
    setOk(null);
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: pathname,
          userAgent,
          email: email || undefined,
          rating: rating ?? undefined,
          category,
          message: message.trim(),
          context: {
            viewport: { w: window.innerWidth, h: window.innerHeight },
            tz: Intl.DateTimeFormat().resolvedOptions().timeZone
          }
        })
      });
      if (!res.ok) throw new Error('Failed');
      setOk(true);
      setMessage('');
      setEmail('');
      setRating(undefined);
      setCategory('Other');
      setOpen(false);
    } catch {
      setOk(false);
    } finally {
      setSubmitting(false);
      setTimeout(() => setOk(null), 4000);
    }
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Give feedback"
        className="fixed z-[9999] bottom-4 right-4 rounded-full w-12 h-12 sm:w-auto sm:h-auto sm:px-4 sm:py-3 bg-accent-blue text-white shadow-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm sm:text-base flex items-center justify-center"
        style={{
          position: 'fixed',
          bottom: '16px',
          right: '16px',
          zIndex: 99999,
          display: 'flex',
          visibility: 'visible',
          opacity: 1
        }}
      >
        <span className="hidden sm:inline">Feedback</span>
        <span className="sm:hidden text-lg">💬</span>
      </button>

      {/* Toast */}
      {ok === true && (
        <div className="fixed bottom-20 right-4 sm:right-5 z-50 bg-green-600 text-white px-4 py-2 rounded shadow text-sm sm:text-base max-w-xs sm:max-w-none">
          Thanks! We've received your feedback.
        </div>
      )}
      {ok === false && (
        <div className="fixed bottom-20 right-4 sm:right-5 z-50 bg-red-600 text-white px-4 py-2 rounded shadow text-sm sm:text-base max-w-xs sm:max-w-none">
          Sorry—couldn't send feedback. Try again.
        </div>
      )}

      {/* Modal */}
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
        >
          {/* backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
          />
          {/* panel */}
          <div className="relative w-full sm:max-w-lg sm:rounded-2xl sm:shadow-lg sm:my-8 bg-white text-black p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">Tell us what you think</h2>
              <button
                onClick={() => setOpen(false)}
                className="rounded p-1 text-gray-500 hover:bg-gray-100"
                aria-label="Close feedback form"
              >
                ✕
              </button>
            </div>

            {/* quick rating */}
            <div className="mb-3">
              <label className="block text-sm text-gray-700 mb-1">How was your experience?</label>
              <div className="flex gap-2">
                {[1,2,3,4,5].map(n => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setRating(n)}
                    className={`h-9 w-9 rounded-full border flex items-center justify-center ${
                      rating === n ? 'bg-accent-blue text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300'
                    }`}
                    aria-pressed={rating===n}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            {/* category */}
            <div className="mb-3">
              <label className="block text-sm text-gray-700 mb-1">Category</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as Category)}
                className="w-full border border-gray-300 rounded px-3 py-2"
              >
                <option>Bug</option>
                <option>Confusing</option>
                <option>Idea</option>
                <option>Other</option>
              </select>
            </div>

            {/* message */}
            <div className="mb-3">
              <label className="block text-sm text-gray-700 mb-1">Details</label>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                rows={4}
                placeholder="What worked well? What could be better?"
                className="w-full border border-gray-300 rounded px-3 py-2"
              />
            </div>

            {/* email optional */}
            <div className="mb-4">
              <label className="block text-sm text-gray-700 mb-1">
                Email (optional, if you want a reply)
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2"
                placeholder="you@example.com"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="px-4 py-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                disabled={submitting || !message.trim()}
                onClick={submit}
                className="px-4 py-2 rounded bg-accent-blue text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {submitting ? 'Sending…' : 'Send feedback'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
