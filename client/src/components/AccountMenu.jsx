import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { initialsFrom, toneFrom } from '../utils/avatar';

export default function AccountMenu() {
  const { profile } = useApp();
  const { account, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const buttonRef = useRef(null);

  // Bound only while the menu is open — an outside click and Escape are the two ways out, so it
  // can never trap someone behind it.
  useEffect(() => {
    if (!open) return undefined;

    const onPointerDown = (event) => {
      if (!containerRef.current?.contains(event.target)) setOpen(false);
    };
    const onKeyDown = (event) => {
      if (event.key !== 'Escape') return;
      setOpen(false);
      // Escape came from the keyboard, so put focus back where it started.
      buttonRef.current?.focus();
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const name = profile?.name || '';

  return (
    <div className="account-menu" ref={containerRef}>
      <button
        ref={buttonRef}
        type="button"
        className={`avatar avatar-tone-${toneFrom(name)}`}
        onClick={() => setOpen((wasOpen) => !wasOpen)}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={name ? `Account menu for ${name}` : 'Account menu'}
      >
        {initialsFrom(name)}
      </button>
      {open && (
        <div className="account-menu-panel">
          <div className="account-menu-identity">
            <span className="account-menu-name">{name}</span>
            <span className="account-menu-email">{account?.email}</span>
          </div>
          <Link to="/app/settings" className="account-menu-item" onClick={() => setOpen(false)}>
            Account settings
          </Link>
          <button type="button" className="account-menu-item" onClick={signOut}>
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
