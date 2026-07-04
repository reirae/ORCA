// Shared HTTP helper + storage key, kept out of AuthContext.jsx so React
// fast-refresh stays happy (that file must export only components).

export const STORAGE_KEY  = "orca.session";
export const REFRESH_KEY  = "orca.refresh";
export const CSRF_KEY = "orca.csrf";

let csrfFetchPromise = null;

function refreshHeaders(extra = {}) {
  const refreshToken = sessionStorage.getItem(REFRESH_KEY);
  return refreshToken ? { "x-refresh-token": refreshToken, ...extra } : extra;
}

// Call once on app startup to fetch and cache the CSRF token
export function fetchCsrfToken() {
  if (csrfFetchPromise) return csrfFetchPromise;

  csrfFetchPromise = fetch("/api/csrf-token", {
    credentials: "include",
    headers: refreshHeaders(),
  })
    .then(async (res) => {
      if (!res.ok) throw new Error("Failed to fetch CSRF token");
      const data = await res.json();
      if (data.csrfToken) {
        sessionStorage.setItem(CSRF_KEY, data.csrfToken);
      }
    })
    .catch(() => {
      sessionStorage.removeItem(CSRF_KEY);
    })
    .finally(() => {
      csrfFetchPromise = null;
    });

  return csrfFetchPromise;
}

let refreshPromise = null;

/**
 * Exchange the refresh token for a fresh access token, storing it. Returns the
 * new token, or null if refresh isn't possible (no refresh token, or the server
 * rejected it — i.e. the session really is dead).
 *
 * Deduped via a shared promise: during a server-side token rotation, several
 * in-flight requests can 401 at once — they all await the SAME refresh instead
 * of firing a stampede of /refresh calls. Uses a raw fetch (not apiFetch) so a
 * failing refresh can't recurse back into this handler.
 */
function refreshAccessToken() {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const refreshToken = sessionStorage.getItem(REFRESH_KEY);
    if (!refreshToken) return null;

    // /refresh is a state-changing POST — it needs a CSRF token bound to the
    // refresh-token session identifier.
    if (!sessionStorage.getItem(CSRF_KEY)) await fetchCsrfToken();
    const csrfToken = sessionStorage.getItem(CSRF_KEY);

    try {
      const res = await fetch("/api/auth/refresh", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "x-refresh-token": refreshToken,
          ...(csrfToken ? { "x-csrf-token": csrfToken } : {}),
        },
        body: JSON.stringify({ refreshToken }),
      });
      if (!res.ok) return null;
      const data = await res.json().catch(() => ({}));
      if (data.token) {
        sessionStorage.setItem(STORAGE_KEY, data.token);
        return data.token;
      }
      return null;
    } catch {
      return null;
    }
  })().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}

/**
 * Authenticated fetch wrapper.
 *
 * Attaches the stored bearer token to every /api request. Also intercepts
 * 401 responses globally: if any API call comes back with 401 it means the
 * server has rejected the session (revoked by an admin, expert approval
 * revoked, account deleted, or natural JWT expiry). In that case we clear
 * all local credentials and force a redirect to the appropriate login page
 * so the user cannot continue browsing on a dead session.
 *
 * Why here instead of in each page: every page would need to handle this
 * individually and would likely miss edge cases. A single intercept point
 * in the shared fetch wrapper guarantees consistent behaviour regardless of
 * which API call triggers the 401.
 *
 * Admin pages (/adm/*) redirect to /adm/administratorLogin.
 * All other pages redirect to /login.
 */
export async function apiFetch(url, options = {}) {
  const method = (options.method || "GET").toUpperCase();
  const mutating = ["POST", "PUT", "PATCH", "DELETE"].includes(method);

  // If mutating and storage is empty, wait for the token initialization
  if (mutating && !sessionStorage.getItem(CSRF_KEY)) {
    await fetchCsrfToken();
  }

  let token = sessionStorage.getItem(STORAGE_KEY);
  let csrfToken = sessionStorage.getItem(CSRF_KEY);
  let headers = refreshHeaders({ ...options.headers });

  if (token && url.startsWith("/api")) {
    headers.Authorization = `Bearer ${token}`;
  }
  if (mutating && csrfToken) {
    headers["x-csrf-token"] = csrfToken;
  }

  let response = await fetch(url, { ...options, headers, credentials: "include" });

  // CSRF recovery: if a mutating request is rejected for a stale CSRF token,
  // fetch a fresh one and retry ONCE before giving up. (Access-token 401s are
  // handled separately below.)
  if (response.status === 403 && mutating) {
    const errorData = await response.clone().json().catch(() => ({}));
    const errMsg = `${errorData.error || ""} ${errorData.message || ""}`.toLowerCase();
    if (errMsg.includes("csrf")) {
      
      // Force fetch a clean, synchronized token
      await fetchCsrfToken();
      csrfToken = sessionStorage.getItem(CSRF_KEY);
      
      if (csrfToken) {
        // Re-attach the new token and retry the request silently
        headers["x-csrf-token"] = csrfToken;
        response = await fetch(url, { ...options, headers, credentials: "include" });
      }
    }
  }

  // 401 recovery — the access token was rejected. Before signing the user out,
  // try to refresh it ONCE and retry the request. This handles the token-
  // rotation race: the silent refresh rotates the session's token_hash, so a
  // request that carried the just-rotated (old) token gets a 401 even though
  // the session is perfectly alive. Only a refresh that itself fails means the
  // session is genuinely dead (revoked, expired, deleted).
  if (
    response.status === 401 &&
    !options.__retried &&
    !url.includes("/api/auth/refresh") &&
    sessionStorage.getItem(REFRESH_KEY)
  ) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      return apiFetch(url, { ...options, __retried: true });
    }
  }

  // Global 401 handler — the session really is gone (refresh unavailable or
  // rejected). Sign the user out.
  if (response.status === 401) {
    // Clear every stored credential so the user is fully signed out locally.
    sessionStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(REFRESH_KEY);
    sessionStorage.removeItem(CSRF_KEY);

    // Redirect to the correct login page based on where the user is now.
    // Admin panel pages live under /adm/; everyone else uses /login.
    const isAdminPath = window.location.pathname.startsWith("/adm/");
    const loginPath = isAdminPath ? "/adm/administratorLogin" : "/login";

    // Only redirect if we aren't already on a login page (avoids redirect
    // loops if the login page itself makes an unauthenticated API call).
    const alreadyOnLogin = window.location.pathname === "/adm/administratorLogin" || window.location.pathname === "/login";

    if (!alreadyOnLogin) {
      await fetchCsrfToken(); // get a fresh token before redirecting
      window.location.replace(loginPath);
    }
  }

  return response;
}
