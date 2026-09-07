import { useEffect, useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';

// How many `--avatar-tone-*` tokens index.css defines. The colour is picked from the name rather
// than stored, so it survives a reload without anything being persisted for it.
const TONE_COUNT = 8;

// First letters of the first two words — "Mei Ling Tan" is ML, "Ravi" is R. A profile with no
// name cannot reach the header (the routing gate stops it), but an avatar with nothing in it
// would read as broken, so it falls back rather than rendering empty.
function initialsFrom(name) {
  const letters = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join('');
  return letters || '?';
}

// djb2 over the whole name, so two accounts differing only in their surname still land on
// different tones. Deterministic by construction: same name in, same tone out, every load.
function toneFrom(name) {
  let hash = 5381;
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash * 33) ^ name.charCodeAt(i);
  }
  return Math.abs(hash) % TONE_COUNT;
}

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
          <button type="button" className="account-menu-item" onClick={signOut}>
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
