import { NavLink } from 'react-router-dom';

const tabs = [
  { to: '/', label: 'Log', icon: 'M4 6h16M4 12h10M4 18h7' },
  { to: '/insights', label: 'Insights', icon: 'M4 19V5m5 14V9m5 10V4m5 15v-7' },
  { to: '/calculator', label: 'Goals', icon: 'M9 7h6M9 11h6M9 15h4M7 3h10a1 1 0 011 1v16a1 1 0 01-1 1H7a1 1 0 01-1-1V4a1 1 0 011-1z' },
  { to: '/learn', label: 'Learn', icon: 'M12 6.5C10 5 6.5 5 5 5v12c1.5 0 5 0 7 1.5C14 17 17.5 17 19 17V5c-1.5 0-5 0-7 1.5z' },
];

export function BottomNav() {
  return (
    <nav className="sticky bottom-0 z-30 border-t border-white/[0.06] bg-charcoal-950/80 backdrop-blur-xl safe-bottom">
      <div className="mx-auto flex max-w-md items-stretch justify-around px-2 pt-1.5">
        {tabs.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            end={t.to === '/'}
            className={({ isActive }) =>
              `group flex flex-1 flex-col items-center gap-1 py-1.5 text-[11px] font-medium transition-colors ${
                isActive ? 'text-saffron' : 'text-ink-faint'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={`flex h-8 w-12 items-center justify-center rounded-full transition-all duration-200 ${
                    isActive ? 'bg-saffron/12' : 'bg-transparent'
                  }`}
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d={t.icon} />
                  </svg>
                </span>
                {t.label}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
