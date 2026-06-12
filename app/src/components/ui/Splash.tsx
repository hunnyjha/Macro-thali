export function Splash() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 bg-charcoal-900">
      <div className="relative h-20 w-20 animate-pop">
        <img src="/favicon.svg" alt="Macro Katori" className="h-full w-full" />
      </div>
      <div className="text-center">
        <h1 className="font-display text-xl font-extrabold tracking-tight">Macro Katori</h1>
        <p className="text-sm text-ink-muted">Har Katori Ka Hisaab.</p>
      </div>
      <div className="mt-2 h-1 w-24 overflow-hidden rounded-full bg-white/10">
        <div className="h-full w-1/2 animate-pulse rounded-full bg-saffron" />
      </div>
    </div>
  );
}
