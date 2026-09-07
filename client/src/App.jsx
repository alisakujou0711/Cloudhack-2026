import { Navigate, Route, Routes } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ChatUIProvider } from './context/ChatUIContext';
import SignInPage from './pages/SignInPage';
import SignUpPage from './pages/SignUpPage';
import OnboardingPage from './pages/OnboardingPage';
import ApplicationOptimizationPage from './pages/ApplicationOptimizationPage';
import HistoryPage from './pages/HistoryPage';
import InterviewsPage from './pages/InterviewsPage';
import InspirationsPage from './pages/InspirationsPage';
import AccountSettingsPage from './pages/AccountSettingsPage';
import Layout from './components/Layout';

// Where someone who has not passed both gates belongs, or null once both are passed. Stated once
// here so the root redirect and the /app guard cannot drift apart.
function gateRedirect(isAuthenticated, profile) {
  if (!isAuthenticated) return '/signin';
  if (!profile) return '/onboarding';
  return null;
}

function LoadingScreen() {
  return (
    <div className="page-center">
      <p className="subtitle">Loading...</p>
    </div>
  );
}

function AppRoutes() {
  const { status, isAuthenticated, signOut } = useAuth();
  const { profile, loadStatus, reloadState } = useApp();

  // Nothing may be decided while /auth/me is still in flight — rendering the sign-in screen
  // here would flash it at someone who is already signed in.
  if (status === 'resolving') {
    return <LoadingScreen />;
  }

  // Nor while the state document is still arriving: the profile gate would read a profile that
  // has not loaded yet and send a returning student back through onboarding.
  if (isAuthenticated && loadStatus !== 'ready') {
    if (loadStatus !== 'error') return <LoadingScreen />;
    return (
      <div className="page-center">
        <div className="card onboarding-card">
          <h2>Couldn&apos;t load your work</h2>
          <p className="subtitle">
            Your saved work lives on the server, so the app needs it before it can open. Check that
            the server is running and try again.
          </p>
          <button className="btn-primary" onClick={reloadState}>
            Try again
          </button>
          <button className="link-btn" onClick={signOut}>
            Sign out
          </button>
        </div>
      </div>
    );
  }

  // The two gates, in order: a session, then a profile. `/` is nothing but this three-way
  // redirect; every other route re-checks the gates it depends on.
  const blockedAt = gateRedirect(isAuthenticated, profile);

  return (
    <Routes>
      <Route path="/" element={<Navigate to={blockedAt || '/app/optimize'} replace />} />
      <Route path="/signin" element={isAuthenticated ? <Navigate to="/" replace /> : <SignInPage />} />
      <Route path="/signup" element={isAuthenticated ? <Navigate to="/" replace /> : <SignUpPage />} />
      {/* The one route a profile sends you away from rather than towards. */}
      <Route
        path="/onboarding"
        element={
          !isAuthenticated ? <Navigate to="/signin" replace /> : profile ? <Navigate to="/app/optimize" replace /> : <OnboardingPage />
        }
      />
      <Route path="/app" element={blockedAt ? <Navigate to={blockedAt} replace /> : <Layout />}>
        <Route index element={<Navigate to="optimize" replace />} />
        <Route path="optimize" element={<ApplicationOptimizationPage />} />
        <Route path="history" element={<HistoryPage />} />
        <Route path="interviews" element={<InterviewsPage />} />
        <Route path="inspirations" element={<InspirationsPage />} />
        {/* Reached from the avatar menu only — deliberately not a fifth tab. */}
        <Route path="settings" element={<AccountSettingsPage />} />
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
    <AuthProvider>
      <AppProvider>
        <ChatUIProvider>
          <AppRoutes />
        </ChatUIProvider>
      </AppProvider>
    </AuthProvider>
  );
}
