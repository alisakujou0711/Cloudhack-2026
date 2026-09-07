import { createContext, useContext, useEffect, useState } from 'react';
import { api, setUnauthorizedHandler } from '../api/client';

const AuthContext = createContext(null);

// What the sign-in screen says to somebody who has just deleted their account. Without it they
// land on a form with no explanation and no way to tell whether it worked.
const ACCOUNT_DELETED_NOTICE = 'Your account and everything on it have been deleted.';

// Authentication is deliberately its own context, separate from AppContext: it resolves first
// and gates whether the app is reachable at all, and merging the two would make that order
// ambiguous.
export function AuthProvider({ children }) {
  // "Account", not "user" — see CONTEXT.md. The wire shape stays `{user}` because that is what
  // `/auth/me` documents (docs/api.md).
  const [account, setAccount] = useState(null);
  // 'resolving' until /auth/me answers. The router must not choose a destination before then,
  // or an already signed-in person sees the sign-in screen flash on every load.
  const [status, setStatus] = useState('resolving');
  // A one-off sentence for the auth screens, set when the app sends somebody there rather than
  // when they navigate there themselves. Deliberately React state and nothing else: a reload is a
  // fresh visit to sign-in, and an explanation of something that happened before it would be
  // stale rather than helpful.
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let cancelled = false;
    api
      .me()
      .then(({ user }) => {
        if (!cancelled) {
          setAccount(user);
          setStatus('authenticated');
        }
      })
      .catch(() => {
        if (!cancelled) {
          setAccount(null);
          setStatus('anonymous');
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    // A 401 from any other endpoint means the session is gone, not that this one call failed.
    // Dropping the user here lets the routing gate return the person to sign-in instead of the
    // API client rendering "Unauthorized" inside whichever panel happened to make the request.
    setUnauthorizedHandler(() => {
      setAccount(null);
      setStatus('anonymous');
    });
    return () => setUnauthorizedHandler(null);
  }, []);

  const signUp = async (email, password) => {
    const { user } = await api.signUp({ email, password });
    setNotice('');
    setAccount(user);
    setStatus('authenticated');
  };

  const signIn = async (email, password) => {
    const { user } = await api.signIn({ email, password });
    setNotice('');
    setAccount(user);
    setStatus('authenticated');
  };

  // The session keys on the account rather than on the address, so it survives the change and the
  // person stays where they were. The account object held here does not: without replacing it
  // from the response, the avatar menu keeps offering an address that no longer signs in.
  const changeEmail = async (email, currentPassword) => {
    const { user } = await api.changeEmail({ email, currentPassword });
    setAccount(user);
  };

  // Irreversible, and guarded by the password rather than by anything typed here — see
  // docs/adr/0004-account-deletion-is-immediate.md. There is no sign-out to follow it: the session
  // row went with the account it referenced. Dropping the account here is what hands the person to
  // the routing gate, which carries them to sign-in on its own; the notice is what they read when
  // they get there. A refusal throws, and nothing about the session has changed.
  const deleteAccount = async (currentPassword) => {
    await api.deleteAccount({ currentPassword });
    setNotice(ACCOUNT_DELETED_NOTICE);
    setAccount(null);
    setStatus('anonymous');
  };

  const signOut = async () => {
    // A failed revoke must not strand someone inside the app — the local session is dropped
    // either way, and the server token expires on its own.
    try {
      await api.signOut();
    } catch (err) {
      console.warn('Sign-out request failed', err);
    }
    setNotice('');
    setAccount(null);
    setStatus('anonymous');
  };

  const value = {
    account,
    status,
    notice,
    isAuthenticated: status === 'authenticated',
    signUp,
    signIn,
    signOut,
    changeEmail,
    deleteAccount,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
