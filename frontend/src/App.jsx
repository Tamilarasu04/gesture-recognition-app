import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import AnalyticsPage from './pages/AnalyticsPage';
import AuthPage from './pages/AuthPage';

export default function App() {
  return (
    <div className="min-h-screen bg-surface-900">
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/auth" element={<AuthPage />} />
        </Routes>
      </main>
      <footer className="border-t border-white/10 py-6 text-center text-sm text-gray-500">
        GestureAI — IEEE-ready multilingual gesture recognition system
      </footer>
    </div>
  );
}
