import { useState } from "react";
import { Link } from "react-router-dom";
import { OrcaWordmark } from "../components/Brand";

/**
 * Register page — not yet wired.
 *
 * The form fields and role choice are laid out (name, email, password, role).
 * The submit currently does nothing but show a notice. To finish it:
 *   - POST /api/auth/register (hash the password server-side)
 *   - Worker -> email verification before activation
 *   - Expert -> admin approval before access; land on /verify-pending
 */
export default function Register() {
  const [role, setRole] = useState("worker");

  function handleSubmit(e) {
    e.preventDefault();
    // TODO: implement registration (POST /api/auth/register).
    alert("Account creation isn't available yet.");
  }

  return (
    <div style={s.wrap}>
      <header style={s.top}>
        <Link to="/" style={{ textDecoration: "none" }}>
          <OrcaWordmark />
        </Link>
      </header>

      <main style={s.center}>
        <div style={s.card}>
          <h1 style={s.h1}>Create your account</h1>
          <p style={s.sub}>
            Workers are activated after email verification. Experts are reviewed by an admin
            before access is granted.
          </p>

          <form onSubmit={handleSubmit} noValidate>
            <div className="orca-field">
              <label htmlFor="name">Full name</label>
              <input id="name" type="text" placeholder="Jane Smith" autoComplete="name" />
            </div>
            <div className="orca-field">
              <label htmlFor="email">Email</label>
              <input id="email" type="email" placeholder="you@orca.com" autoComplete="email" />
            </div>
            <div className="orca-field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                autoComplete="new-password"
              />
            </div>

            <div className="orca-field">
              <label>I am a…</label>
              <div style={s.roleRow}>
                {["worker", "expert"].map((r) => (
                  <button
                    type="button"
                    key={r}
                    onClick={() => setRole(r)}
                    className="orca-btn"
                    style={{
                      flex: 1,
                      textTransform: "capitalize",
                      background: role === r ? "var(--orca-hi)" : "transparent",
                      color: role === r ? "var(--orca-abyss)" : "var(--orca-ink)",
                      border: `1px solid ${role === r ? "var(--orca-hi)" : "var(--orca-line)"}`,
                    }}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <button type="submit" className="orca-btn orca-btn--primary orca-btn--block">
              Create account
            </button>
          </form>

          <p style={s.footNote}>
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </main>
    </div>
  );
}

const s = {
  wrap: { minHeight: "100svh", display: "flex", flexDirection: "column" },
  top: { padding: "20px clamp(20px,5vw,64px)", borderBottom: "1px solid var(--orca-line)" },
  center: { flexGrow: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 20px" },
  card: { width: "100%", maxWidth: 420 },
  h1: { fontSize: 32, fontWeight: 700, letterSpacing: "-0.5px", margin: "0 0 10px", color: "var(--orca-paper)" },
  sub: { fontSize: 15, lineHeight: 1.5, color: "var(--orca-muted)", margin: "0 0 26px" },
  roleRow: { display: "flex", gap: 12 },
  footNote: { fontSize: 15, color: "var(--orca-muted)", marginTop: 22, textAlign: "center" },
};
