export function ComingSoon({ title, note }: { title: string; note: string }) {
  return (
    <div className="safe-top flex h-full flex-col items-center justify-center gap-3 px-8 text-center">
      <div className="rounded-2xl bg-white/5 p-4">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#f5a623" strokeWidth="2" strokeLinecap="round">
          <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" />
        </svg>
      </div>
      <h1 className="font-display text-xl font-bold">{title}</h1>
      <p className="max-w-xs text-sm text-ink-muted">{note}</p>
      <span className="chip mt-1">Coming after Food Logger</span>
    </div>
  );
}
