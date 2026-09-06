import { useEffect, useRef } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import ChatbotWidget from './ChatbotWidget';

// Persistence used to be invisible. Now that a save is a request that can be in flight or fail,
// the header says so. Pending and saving read the same to the student — the work is on its way.
const SAVE_LABELS = {
  pending: 'Saving...',
  saving: 'Saving...',
  saved: 'Saved',
  error: 'Not saved',
};

function SaveStatus() {
  const { saveStatus } = useApp();
  const label = SAVE_LABELS[saveStatus];
  if (!label) return null;
  return <span className={saveStatus === 'error' ? 'save-status is-error' : 'save-status'}>{label}</span>;
}

export default function Layout() {
  const { profile } = useApp();
  const { signOut } = useAuth();
  const { pathname } = useLocation();
  const mainRef = useRef(null);

  // The window no longer scrolls — .app-main does — so a tab change has to be told to go back to
  // the top. Without this you arrive at a new tab already halfway down it.
  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0 });
  }, [pathname]);

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand">PortfolioPath</div>
        <nav className="tabs">
          <NavLink to="/app/optimize" className={({ isActive }) => (isActive ? 'tab active' : 'tab')}>
            Application Optimization
          </NavLink>
          <NavLink to="/app/history" className={({ isActive }) => (isActive ? 'tab active' : 'tab')}>
            History
          </NavLink>
          <NavLink to="/app/interviews" className={({ isActive }) => (isActive ? 'tab active' : 'tab')}>
            Interviews
          </NavLink>
          <NavLink to="/app/inspirations" className={({ isActive }) => (isActive ? 'tab active' : 'tab')}>
            Inspirations
          </NavLink>
        </nav>
        <div className="header-right">
          <SaveStatus />
          <span className="user-chip">{profile.name}</span>
          <button className="btn-ghost" onClick={signOut}>
            Sign out
          </button>
        </div>
      </header>
      <main className="app-main" ref={mainRef}>
        <div className="app-main-inner">
          <Outlet />
        </div>
      </main>
      <ChatbotWidget />
    </div>
  );
}
