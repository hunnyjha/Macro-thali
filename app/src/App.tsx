import type { ReactNode } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { DataProvider } from './app/DataContext';
import { ToastProvider } from './app/ToastContext';
import { BottomNav } from './components/layout/BottomNav';
import { Onboarding } from './components/Onboarding';
import { UpgradeGate } from './components/UpgradeGate';
import { FoodLoggerScreen } from './screens/FoodLoggerScreen';
import { GoalsScreen } from './screens/GoalsScreen';
import { InsightsScreen } from './screens/InsightsScreen';
import { ComingSoon } from './screens/ComingSoon';
import { SignInScreen } from './screens/SignInScreen';
import { PaywallScreen } from './screens/PaywallScreen';
import { AccountScreen } from './screens/AccountScreen';
import { useProfileStore } from './store/useProfileStore';
import { useAuthStore } from './store/useAuthStore';
import { useIsPro } from './store/useSubscriptionStore';

export default function App() {
  const user = useAuthStore((s) => s.user);
  const onboarded = useProfileStore((s) => s.saved);
  const isPro = useIsPro();

  return (
    <DataProvider>
      <ToastProvider>
        {!user ? (
          <SignInScreen />
        ) : !onboarded ? (
          <Onboarding />
        ) : (
          <div className="mx-auto flex h-full max-w-md flex-col bg-charcoal-900">
            <main className="flex-1 overflow-y-auto">
              <Routes>
                <Route path="/" element={<FoodLoggerScreen />} />
                <Route path="/insights" element={isPro ? <InsightsScreen /> : (
                  <ProScreen title="Weekly Insights">
                    <UpgradeGate title="Insights are a Pro feature" desc="See weekly trends, streaks, weight graphs and smart tips with Macro Katori Pro." />
                  </ProScreen>
                )} />
                <Route path="/calculator" element={<GoalsScreen />} />
                <Route path="/learn" element={<ComingSoon title="Learn" note="Simple guides to calories, protein, carbs and fats." />} />
                <Route path="/account" element={<AccountScreen />} />
                <Route path="/paywall" element={<PaywallScreen />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
            <BottomNav />
          </div>
        )}
      </ToastProvider>
    </DataProvider>
  );
}

function ProScreen({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="safe-top pt-3">
      <h1 className="px-4 font-display text-xl font-extrabold">{title}</h1>
      {children}
    </div>
  );
}
