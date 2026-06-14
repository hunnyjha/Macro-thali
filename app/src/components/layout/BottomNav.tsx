import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useUiStore } from '../../store/useUiStore';

// Premium 5-slot nav with a raised, gold center Scan — the app's primary action.
// Coach opens the assistant sheet from anywhere; Scan jumps home and opens the
// camera. Goals & settings live inside Profile.
const ICONS = {
  home: 'M3 11.5 12 4l9 7.5M5 10v9a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-9',
  insights: 'M4 19V5m5 14V9m5 10V4m5 15v-7',
  coach: 'M21 11.5a8.5 8.5 0 0 1-12.9 7.3L3 20l1.2-4.1A8.5 8.5 0 1 1 21 11.5z',
  profile: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM5 20a7 7 0 0 1 14 0',
};

function Icon({ d }: { d: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

export function BottomNav() {
  const nav = useNavigate();
  const location = useLocation();
  const openScan = useUiStore((s) => s.openScan);
  const openCoach = useUiStore((s) => s.openCoach);
  const coachOpen = useUiStore((s) => s.coachOpen);

  const tabClass = (active: boolean) =>
    `group flex flex-1 flex-col items-center gap-1 py-1.5 text-[11px] font-medium transition-colors ${active ? 'text-saffron' : 'text-ink-faint'}`;
  const pill = (active: boolean) =>
    `flex h-8 w-12 items-center justify-center rounded-full transition-all duration-200 ${active ? 'bg-saffron/12' : ''}`;

  const onScan = () => { if (location.pathname !== '/') nav('/'); openScan(); };

  return (
    <nav className="sticky bottom-0 z-30 border-t border-white/[0.06] bg-charcoal-950/85 backdrop-blur-xl safe-bottom">
      <div className="mx-auto flex max-w-md items-end justify-around px-2 pt-1.5">
        <NavLink to="/" end className={({ isActive }) => tabClass(isActive)}>
          {({ isActive }) => (<><span className={pill(isActive)}><Icon d={ICONS.home} /></span>Home</>)}
        </NavLink>

        <NavLink to="/insights" className={({ isActive }) => tabClass(isActive)}>
          {({ isActive }) => (<><span className={pill(isActive)}><Icon d={ICONS.insights} /></span>Insights</>)}
        </NavLink>

        {/* center Scan — raised, gold, the primary action */}
        <button onClick={onScan} className="flex flex-1 flex-col items-center text-[11px] font-medium text-saffron" aria-label="Scan food">
          <span className="-mt-6 mb-0.5 flex h-[58px] w-[58px] items-center justify-center rounded-full bg-gradient-to-b from-saffron-light to-saffron text-charcoal-900 shadow-glow-saffron ring-4 ring-charcoal-950 active:scale-95 transition-transform">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 8a2 2 0 0 1 2-2h2l1-2h8l1 2h2a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <circle cx="12" cy="13" r="3.4" />
            </svg>
          </span>
          Scan
        </button>

        <button onClick={openCoach} className={tabClass(coachOpen)}>
          <span className={pill(coachOpen)}><Icon d={ICONS.coach} /></span>Coach
        </button>

        <NavLink to="/account" className={({ isActive }) => tabClass(isActive)}>
          {({ isActive }) => (<><span className={pill(isActive)}><Icon d={ICONS.profile} /></span>Profile</>)}
        </NavLink>
      </div>
    </nav>
  );
}
