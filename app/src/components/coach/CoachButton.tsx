import { useState } from 'react';
import { CoachSheet } from './CoachSheet';

// App-wide floating Macro Coach button (bottom-left, clear of the + FAB).
export function CoachButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-20 left-4 z-40 flex h-12 w-12 items-center justify-center rounded-full border border-emerald/30 bg-charcoal-700/90 text-emerald-light shadow-glow-emerald backdrop-blur active:scale-90 transition-transform"
        aria-label="Macro Coach"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 11.5a8.5 8.5 0 01-12.9 7.3L3 20l1.2-4.1A8.5 8.5 0 1121 11.5z" />
          <path d="M9 11h.01M12 11h.01M15 11h.01" />
        </svg>
      </button>
      <CoachSheet open={open} onClose={() => setOpen(false)} />
    </>
  );
}
