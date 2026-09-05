import { NavLink, Outlet } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import ChatbotWidget from './ChatbotWidget';

export default function Layout() {
  const { profile } = useApp();
  const { signOut } = useAuth();

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
          <span className="user-chip">{profile.name}</span>
          <button className="btn-ghost" onClick={signOut}>
            Sign out
          </button>
        </div>
      </header>
      <main className="app-main">
        <Outlet />
      </main>
      <ChatbotWidget />
    </div>
  );
}
