interface Props {
  value: string;
  onChange: (v: string) => void;
}

export function SearchBar({ value, onChange }: Props) {
  return (
    <div className="relative">
      <svg className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <circle cx="11" cy="11" r="7" /><path d="m20 20-3-3" />
      </svg>
      <input
        id="mk-search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        inputMode="search"
        autoComplete="off"
        placeholder="Search sattu, dahi, poha, protein…"
        className="input-surface w-full py-3.5 pl-11 pr-10 text-base"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-1 text-ink-muted active:scale-90"
          aria-label="Clear"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
      )}
    </div>
  );
}
