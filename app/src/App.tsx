import { Routes, Route } from 'react-router-dom';
import { DataProvider } from './app/DataContext';
import { BottomNav } from './components/layout/BottomNav';
import { FoodLoggerScreen } from './screens/FoodLoggerScreen';
import { GoalsScreen } from './screens/GoalsScreen';
import { ComingSoon } from './screens/ComingSoon';

export default function App() {
  return (
    <DataProvider>
      <div className="mx-auto flex h-full max-w-md flex-col bg-charcoal-900">
        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/" element={<FoodLoggerScreen />} />
            <Route path="/insights" element={<ComingSoon title="Weekly Insights" note="Your protein, calorie and oil trends will appear here." />} />
            <Route path="/calculator" element={<GoalsScreen />} />
            <Route path="/learn" element={<ComingSoon title="Learn" note="Simple guides to calories, protein, carbs and fats." />} />
            <Route path="*" element={<ComingSoon title="Not found" note="This page doesn’t exist yet." />} />
          </Routes>
        </main>
        <BottomNav />
      </div>
    </DataProvider>
  );
}
