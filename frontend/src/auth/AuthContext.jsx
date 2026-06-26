import { useMemo, useState, useCallback } from "react";
import { AuthContext } from "./context";
import { apiFetch, STORAGE_KEY } from "./api";

/**
 * AuthContext — the single source of truth for "who is logged in".
 *
 * This is the only file to change to replace the temporary fake-login with
 * real authentication. Everything else (route guards, navbar, pages) talks to
 * auth through `useAuth()`, so swapping the two functions below is a drop-in
 * change, not a rewrite.
 *
 *    login(email, password)  ->  replace the fake-login call with
 *                                POST /api/auth/login
 *    logout()                ->  add POST /api/auth/logout to revoke the
 *                                session/refresh token server-side
 *
 * The shape of `user` ({ id, name, role }) is what the rest of the app
 * expects. Keep that shape and the guards keep working. Add fields freely —
 * they're additive.
 *
 * HTTP: uses the browser's built-in `fetch`. Use the exported `apiFetch()`
 * helper for any authenticated /api call — it attaches the bearer token
 * automatically:
 *
 *      import { apiFetch } from "../auth/api";
 *      const res = await apiFetch("/api/users/me");
 *      const data = await res.json();
 *
 * Token storage: keeps the JWT in sessionStorage. If you move to refresh-token
 * rotation with httpOnly cookies, switch apiFetch to `credentials: "include"`
 * and stop reading the token from storage.
 */

// Decode a JWT payload without verifying it (display only — the server is the
// authority on every request; this is purely so the navbar can show a
// name/role before the first API round-trip).
function decodeJwt(token) {
  try {
    const payload = token.split(".")[1];
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => sessionStorage.getItem(STORAGE_KEY) || null);
  const [user, setUser] = useState(() => {
    const t = sessionStorage.getItem(STORAGE_KEY);
    return t ? decodeJwt(t) : null;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const persist = useCallback((newToken) => {
    if (newToken) {
      sessionStorage.setItem(STORAGE_KEY, newToken);
      setToken(newToken);
      setUser(decodeJwt(newToken));
    } else {
      sessionStorage.removeItem(STORAGE_KEY);
      setToken(null);
      setUser(null);
    }
  }, []);

  /**
   * TEMPORARY login — wired to the skeleton's GET /api/auth/fake-login so the
   * UI works end-to-end today. The form passes an email; we map the two seeded
   * demo accounts to the fake user ids the backend understands.
   *
   * To wire real auth, replace the body with:
   *   const res = await apiFetch("/api/auth/login", {
   *     method: "POST",
   *     headers: { "Content-Type": "application/json" },
   *     body: JSON.stringify({ email, password }),
   *   });
   *   if (!res.ok) throw new Error("Email or password is incorrect.");
   *   const data = await res.json();
   *   persist(data.token);
   *   return data;
   * ...and delete the demo-account mapping below.
   */
  const login = useCallback(
    async (email, password) => {
      setLoading(true);
      setError(null);
      try {
        // --- TEMPORARY: map seeded emails to fake-login ids -------------------
        const FAKE_MAP = {
          "john@orca.com": "user-1", // worker
          "bob@orca.com": "user-2", // expert
        };
        // `password` is accepted but ignored by fake-login; the real endpoint
        // will send it to POST /api/auth/login. Referenced so the signature is real.
        void password;
        const fakeId = FAKE_MAP[email?.toLowerCase().trim()];
        if (!fakeId) {
          // Never reveal which field was wrong.
          throw new Error("Email or password is incorrect.");
        }
        const res = await apiFetch(`/api/auth/fake-login?userId=${fakeId}`);
        if (!res.ok) {
          throw new Error("Login failed. Is the backend running?");
        }
        const data = await res.json();
        persist(data.token);
        return data;
        // --- END TEMPORARY ---------------------------------------------------
      } catch (err) {
        const msg = err?.message || "Login failed.";
        setError(msg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [persist]
  );

  const logout = useCallback(async () => {
    // todo: call POST /api/auth/logout here to revoke the session before
    // clearing local state.
    persist(null);
  }, [persist]);

  const value = useMemo(
    () => ({
      user, // { id, name, role } or null
      token,
      isAuthenticated: !!user,
      loading,
      error,
      login,
      logout,
    }),
    [user, token, loading, error, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
