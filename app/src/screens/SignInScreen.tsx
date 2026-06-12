import { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';

export function SignInScreen() {
  const signIn = useAuthStore((s) => s.signIn);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  const submit = () => {
    if (!name.trim()) return;
    signIn(name, email);
  };

  return (
    <div className="mx-auto flex h-full max-w-md flex-col items-center justify-center gap-6 bg-charcoal-900 px-8 safe-top safe-bottom">
      <img src="/favicon.svg" alt="" className="h-20 w-20 animate-pop" />
      <div className="text-center">
        <h1 className="font-display text-2xl font-extrabold">Welcome to Macro Katori</h1>
        <p className="mt-1 text-sm text-ink-muted">Track Food the Indian Way. Let’s set up your profile.</p>
      </div>

      <div className="w-full space-y-3">
        <div>
          <label className="mb-1 block text-xs text-ink-faint">Your name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            placeholder="e.g. Aarav"
            className="w-full rounded-xl2 border border-white/10 bg-charcoal-700 px-4 py-3 text-base text-ink placeholder:text-ink-faint focus:border-saffron/60 focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-ink-faint">Email <span className="text-ink-faint">(optional)</span></label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            inputMode="email"
            placeholder="you@email.com"
            className="w-full rounded-xl2 border border-white/10 bg-charcoal-700 px-4 py-3 text-base text-ink placeholder:text-ink-faint focus:border-saffron/60 focus:outline-none"
          />
        </div>
      </div>

      <button className="btn-primary w-full" onClick={submit} disabled={!name.trim()}>
        Continue
      </button>
      <p className="text-center text-[11px] text-ink-faint">
        Your data stays on this device. Cross-device sync is coming soon.
      </p>
    </div>
  );
}
