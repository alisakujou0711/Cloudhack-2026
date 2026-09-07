const { getSessionUser } = require('../services/auth');

const SESSION_COOKIE = 'pp_session';

function setSessionCookie(res, session) {
  res.cookie(SESSION_COOKIE, session.token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: session.maxAgeMs,
  });
}

function clearSessionCookie(res) {
  res.clearCookie(SESSION_COOKIE, { httpOnly: true, sameSite: 'lax', path: '/' });
}

// Guards the authenticated routes: resolves the session cookie to a user or answers 401.
function requireAuth(req, res, next) {
  const token = req.cookies ? req.cookies[SESSION_COOKIE] : undefined;
  const user = getSessionUser(token);
  if (!user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  req.user = user;
  req.sessionToken = token;
  next();
}

module.exports = { setSessionCookie, clearSessionCookie, requireAuth };
