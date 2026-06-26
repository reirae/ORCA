// Shared HTTP helper + storage key, kept out of AuthContext.jsx so React
// fast-refresh stays happy (that file must export only components).

export const STORAGE_KEY = "orca.session";

/**
 * Authenticated fetch wrapper. Attaches the stored bearer token to any /api
 * request so individual pages don't have to. Use this everywhere instead of
 * raw fetch for backend calls:
 *
 *     import { apiFetch } from "../auth/api";
 *     const res = await apiFetch("/api/users/me");
 *     const data = await res.json();
 *
 * If you move to httpOnly refresh cookies, add `credentials: "include"` to
 * the fetch options here.
 */
export async function apiFetch(url, options = {}) {
  const token = sessionStorage.getItem(STORAGE_KEY);
  const headers = { ...(options.headers || {}) };
  if (token && url.startsWith("/api")) {
    headers.Authorization = `Bearer ${token}`;
  }
  return fetch(url, { ...options, headers });
}
