import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { OrcaWordmark } from "../components/Brand";

/**
 * Login page (FR-01).
 *
 * The form is intentionally thin — all auth logic lives in AuthContext so
 * Member 1's real /api/auth/login swap doesn't touch this file. Notes:
 *  - FR-01: on failure we show a single generic message and never reveal
 *    whether the email or the password was wrong. Keep it that way.
 *  - After a successful login we return the user to wherever a guard
 *    bounced them from (location.state.from), or /dashboard by default.
 *
 * DEMO: until real auth lands, sign in with one of the seeded accounts:
 *    john@orca.com  (worker)   ·   bob@orca.com  (expert)
 *    password field is ignored for now — any value works.
 */
export default function Login() {
  const { login, loading, error } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [localError, setLocalError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setLocalError(null);
    if (!email || !password) {
      setLocalError("Enter your email and password.");
      return;
    }
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch {
      // Error message is surfaced via context `error`; nothing else to do.
    }
  }

  const shownError = localError || error;

  return (
    <div className="orca-login-split">
      {/* Left: brand panel (hidden on small screens) */}
      <aside className="orca-login-brand">
        <OrcaWordmark size={32} />
        <div style={{ marginTop: "auto" }}>
          <p className="orca-code" style={{ color: "var(--orca-hi)", marginBottom: 14 }}>
            Secure consultation platform
          </p>
          <p style={s.brandLine}>
            Every session is access-controlled, encrypted in transit, and recorded for audit.
          </p>
        </div>
      </aside>

      {/* Right: form */}
      <main style={s.formPane}>
        <div style={s.formCard}>
          <h1 style={s.h1}>Sign in</h1>
          <p style={s.sub}>Welcome back. Pick up where your team left off.</p>

          {shownError && (
            <div className="orca-alert" role="alert">
              {shownError}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="orca-field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                autoComplete="username"
                placeholder="you@orca.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="orca-field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div style={s.row}>
              {/* MEMBER 1: wire to the forgot-password flow (FR-01 reset link) */}
              <Link to="/forgot-password" style={s.minor}>
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              className="orca-btn orca-btn--primary orca-btn--block"
              disabled={loading}
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <p style={s.footNote}>
            New here? <Link to="/register">Create an account</Link>
          </p>

          {/* Remove this hint block once real auth is live. */}
          <div style={s.demoHint}>
            <span className="orca-code" style={{ color: "var(--orca-hi)" }}>
              Demo
            </span>
            <span>
              {" "}
              Sign in as <code style={s.kbd}>john@orca.com</code> (worker) or{" "}
              <code style={s.kbd}>bob@orca.com</code> (expert). Any password.
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}

const s = {
  brandLine: {
    fontSize: 22,
    lineHeight: 1.4,
    color: "var(--orca-ink)",
    maxWidth: 360,
    margin: 0,
  },
  formPane: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px 20px",
  },
  formCard: { width: "100%", maxWidth: 400 },
  h1: { fontSize: 34, fontWeight: 700, letterSpacing: "-0.5px", margin: "0 0 8px", color: "var(--orca-paper)" },
  sub: { fontSize: 16, color: "var(--orca-muted)", margin: "0 0 28px" },
  row: { display: "flex", justifyContent: "flex-end", marginBottom: 20 },
  minor: { fontSize: 14 },
  footNote: { fontSize: 15, color: "var(--orca-muted)", marginTop: 22, textAlign: "center" },
  demoHint: {
    marginTop: 28,
    padding: "12px 14px",
    fontSize: 13,
    lineHeight: 1.5,
    color: "var(--orca-muted)",
    border: "1px dashed var(--orca-line)",
    borderRadius: "var(--orca-radius-sm)",
  },
  kbd: {
    fontFamily: "var(--orca-mono)",
    fontSize: 12,
    padding: "2px 5px",
    background: "var(--orca-abyss)",
    borderRadius: 4,
    color: "var(--orca-ink)",
  },
};
