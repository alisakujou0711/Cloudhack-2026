import { Navigate, Route, Routes } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { ChatUIProvider } from './context/ChatUIContext';
import OnboardingPage from './pages/OnboardingPage';
import ApplicationOptimizationPage from './pages/ApplicationOptimizationPage';
import HistoryPage from './pages/HistoryPage';
import InterviewsPage from './pages/InterviewsPage';
import InspirationsPage from './pages/InspirationsPage';
import Layout from './components/Layout';

function AppRoutes() {
  const { profile } = useApp();

  return (
    <Routes>
      <Route path="/" element={profile ? <Navigate to="/app/optimize" replace /> : <OnboardingPage />} />
      <Route path="/app" element={profile ? <Layout /> : <Navigate to="/" replace />}>
        <Route index element={<Navigate to="optimize" replace />} />
        <Route path="optimize" element={<ApplicationOptimizationPage />} />
        <Route path="history" element={<HistoryPage />} />
        <Route path="interviews" element={<InterviewsPage />} />
        <Route path="inspirations" element={<InspirationsPage />} />
        {/* Legacy routes from the old two-tab layout */}
        <Route path="university" element={<Navigate to="/app/optimize" replace />} />
        <Route path="internship" element={<Navigate to="/app/optimize" replace />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AppProvider>
      <ChatUIProvider>
        <AppRoutes />
      </ChatUIProvider>
    </AppProvider>
  );
}
