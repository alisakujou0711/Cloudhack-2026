import { useEffect, useRef } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import AccountMenu from './AccountMenu';
import ChatbotWidget from './ChatbotWidget';

export default function Layout() {
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
        <AccountMenu />
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
