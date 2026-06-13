import { useState } from 'react';
import { Sheet } from '../ui/Sheet';
import { useToast } from '../../app/ToastContext';

interface Props {
  onSearch: () => void;
  onQuickAdd: () => void;
  onVoice: () => void;
  onScan: () => void;
}

// Floating "+ Add Food" button + action sheet. Search/Quick Add are live;
// Voice / Barcode / Meal Photo are entry points reserved for upcoming phases
// and degrade gracefully with a friendly note.
export function AddFab({ onSearch, onQuickAdd, onVoice, onScan }: Props) {
  const [open, setOpen] = useState(false);
  const { showToast } = useToast();

  const soon = (label: string) => {
    setOpen(false);
    showToast(`${label} is coming soon`);
  };

  const actions = [
    { key: 'search', label: 'Search Food', desc: 'Find any of 340+ foods', icon: 'M11 4a7 7 0 105 12l4 4', live: true, run: () => { setOpen(false); onSearch(); } },
    { key: 'quick', label: 'Quick Add', desc: 'Eggs, roti, rice & more', icon: 'M12 5v14M5 12h14', live: true, run: () => { setOpen(false); onQuickAdd(); } },
    { key: 'voice', label: 'Type / Speak a Meal', desc: 'e.g. "2 roti aur dahi"', icon: 'M12 3v10m0 0a3 3 0 003-3V6a3 3 0 00-6 0v4a3 3 0 003 3zm-7 0a7 7 0 0014 0', live: true, run: () => { setOpen(false); onVoice(); } },
    { key: 'barcode', label: 'Barcode Scan', desc: 'Scan packaged foods', icon: 'M4 7V5h2M4 17v2h2M20 7V5h-2M20 17v2h-2M7 8v8M10 8v8M13 8v8M16 8v8', live: false, run: () => soon('Barcode scan') },
    { key: 'photo', label: 'Scan Food (AI)', desc: 'Snap a meal photo', icon: 'M3 8a2 2 0 012-2h2l1-2h8l1 2h2a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2zM12 11a3 3 0 100 6 3 3 0 000-6z', live: true, run: () => { setOpen(false); onScan(); } },
  ];

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-20 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-saffron text-charcoal-900 shadow-lg shadow-black/40 active:scale-90 transition-transform"
        aria-label="Add food"
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
      </button>

      <Sheet open={open} onClose={() => setOpen(false)} title="Add Food">
        <div className="space-y-2">
          {actions.map((a) => (
            <button key={a.key} onClick={a.run}
              className="flex w-full items-center gap-3 rounded-xl2 border border-white/8 bg-charcoal-700 p-3 text-left active:scale-[0.99] transition-transform">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl2 bg-saffron/15 text-saffron">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={a.icon} /></svg>
              </span>
              <div className="flex-1">
                <p className="font-medium text-ink">{a.label}</p>
                <p className="text-xs text-ink-faint">{a.desc}</p>
              </div>
              {!a.live && <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-ink-muted">Soon</span>}
            </button>
          ))}
        </div>
      </Sheet>
    </>
  );
}
