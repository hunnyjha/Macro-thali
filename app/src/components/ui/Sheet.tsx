import { type ReactNode, useEffect } from 'react';

interface Props {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
}

// Bottom sheet with backdrop. Used for the portion/oil food editor.
export function Sheet({ open, onClose, children, title }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 animate-fade-in bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative max-h-[88vh] animate-sheet-up overflow-y-auto rounded-t-3xl border-t border-white/10 bg-charcoal-800 shadow-sheet safe-bottom">
        <div className="sticky top-0 z-10 flex items-center justify-center bg-charcoal-800 pt-3 pb-1">
          <div className="h-1.5 w-10 rounded-full bg-white/20" />
        </div>
        {title && <h2 className="px-5 pb-2 text-center font-display text-lg font-bold">{title}</h2>}
        <div className="px-5 pb-6">{children}</div>
      </div>
    </div>
  );
}
