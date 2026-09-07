import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import ChatbotWidget from './ChatbotWidget';

export default function Layout() {
  const { profile, resetAll } = useApp();
  const navigate = useNavigate();

  const handleReset = () => {
    resetAll();
    navigate('/');
  };

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
          <button className="btn-ghost" onClick={handleReset}>
            Start over
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
