import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';

interface Toast {
  id: number;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

interface ToastCtx {
  showToast: (message: string, opts?: { actionLabel?: string; onAction?: () => void; duration?: number }) => void;
}

const Ctx = createContext<ToastCtx | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<Toast | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast: ToastCtx['showToast'] = useCallback((message, opts) => {
    if (timer.current) clearTimeout(timer.current);
    const id = Date.now();
    setToast({ id, message, actionLabel: opts?.actionLabel, onAction: opts?.onAction });
    timer.current = setTimeout(() => setToast(null), opts?.duration ?? 4000);
  }, []);

  return (
    <Ctx.Provider value={{ showToast }}>
      {children}
      {toast && (
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex justify-center px-4 pb-20 safe-bottom">
          <div className="pointer-events-auto flex w-full max-w-sm animate-pop items-center gap-3 rounded-xl2 border border-white/10 bg-charcoal-600 px-4 py-3 shadow-sheet">
            <span className="flex-1 text-sm text-ink">{toast.message}</span>
            {toast.actionLabel && (
              <button
                onClick={() => { toast.onAction?.(); setToast(null); }}
                className="shrink-0 text-sm font-bold text-saffron active:scale-95"
              >
                {toast.actionLabel}
              </button>
            )}
          </div>
        </div>
      )}
    </Ctx.Provider>
  );
}

export function useToast(): ToastCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error('useToast must be used within ToastProvider');
  return c;
}
