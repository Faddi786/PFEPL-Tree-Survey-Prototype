const AUTH_KEY = "doslr_auth_session";

/**
 * Rapid-testing flag: auto-create a demo session so `/` opens the main
 * workbench without the Initialize Platform / login screens.
 * Login pages stay at `/login` and `/login-classic` — set to `false` to restore auth.
 */
export const SKIP_PLATFORM_LOGIN = false;

export function loginSession(userId: string) {
  sessionStorage.setItem(
    AUTH_KEY,
    JSON.stringify({
      userId,
      loggedInAt: new Date().toISOString(),
    }),
  );
}

export function logoutSession() {
  sessionStorage.removeItem(AUTH_KEY);
}

export function isAuthenticated() {
  return Boolean(sessionStorage.getItem(AUTH_KEY));
}

/** Seed demo auth when skip flag is on (idempotent). */
export function ensureDemoSession() {
  if (SKIP_PLATFORM_LOGIN && !isAuthenticated()) {
    loginSession("demo.user");
  }
}

export function getAuthUser() {
  const raw = sessionStorage.getItem(AUTH_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as { userId: string; loggedInAt: string };
  } catch {
    return null;
  }
}
