import { Link } from "react-router-dom";
import { OrcaWordmark, OrcaMark } from "../components/Brand";

/**
 * Public landing page (no auth required).
 * The hero states the thesis: bring a remote expert to the worker's exact
 * problem, on-site, in real time. The "manifest strip" turns the app's
 * role-based access model (the security spine of the whole project) into the
 * visual signature.
 */
export default function Landing() {
  return (
    <div style={s.page}>
      {/* Top bar */}
      <header style={s.nav}>
        <OrcaWordmark />
        <nav style={{ display: "flex", gap: 12 }}>
          <Link to="/login" className="orca-btn orca-btn--ghost" style={{ minHeight: 44 }}>
            Sign in
          </Link>
          <Link to="/register" className="orca-btn orca-btn--primary" style={{ minHeight: 44 }}>
            Create account
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <main style={s.hero}>
        <p className="orca-code" style={{ color: "var(--orca-hi)" }}>
          On-site expert consultation
        </p>
        <h1 style={s.h1}>
          Bring the expert
          <br />
          to the problem.
        </h1>
        <p style={s.lede}>
          ORCA connects a worker standing in front of a problem with the right verified
          expert — live video, annotated photos, and voice notes that survive a bad signal.
          Built for gloved hands and active sites.
        </p>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
          <Link to="/register" className="orca-btn orca-btn--primary">
            Get started
          </Link>
          <Link to="/login" className="orca-btn orca-btn--ghost">
            I have an account
          </Link>
        </div>

        {/* Signature: role manifest strip — the access model as identity */}
        <section style={s.manifest} aria-label="Who uses ORCA">
          {ROLES.map((r) => (
            <div key={r.code} style={s.manifestCell}>
              <span className="orca-code" style={{ color: "var(--orca-hi)" }}>
                {r.code}
              </span>
              <h3 style={s.roleTitle}>{r.title}</h3>
              <p style={s.roleBody}>{r.body}</p>
            </div>
          ))}
        </section>
      </main>

      <footer style={s.foot}>
        <OrcaMark size={18} />
        <span className="orca-code">ICT2216 · Project ORCA · Group 36</span>
      </footer>
    </div>
  );
}

const ROLES = [
  {
    code: "ROLE / WORKER",
    title: "On the ground",
    body: "Snap a photo, mark it up, and pull an expert into a live call without leaving the spot.",
  },
  {
    code: "ROLE / EXPERT",
    title: "On call",
    body: "Verified specialists join, annotate over the worker's view, and advise in real time.",
  },
  {
    code: "ROLE / ADMIN",
    title: "On record",
    body: "Approve experts, review audit trails, and keep every consultation accountable.",
  },
];

const s = {
  page: {
    minHeight: "100svh",
    display: "flex",
    flexDirection: "column",
    background:
      "radial-gradient(1200px 600px at 70% -10%, rgba(255,179,35,0.10), transparent 60%), var(--orca-deep)",
  },
  nav: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "20px clamp(20px, 5vw, 64px)",
    borderBottom: "1px solid var(--orca-line)",
  },
  hero: {
    flexGrow: 1,
    width: "100%",
    maxWidth: 1080,
    margin: "0 auto",
    padding: "clamp(40px, 8vw, 96px) clamp(20px, 5vw, 64px)",
  },
  h1: {
    fontWeight: 700,
    fontSize: "clamp(40px, 8vw, 76px)",
    lineHeight: 1.02,
    letterSpacing: "-2px",
    margin: "18px 0 22px",
    color: "var(--orca-paper)",
  },
  lede: {
    fontSize: "clamp(17px, 2.5vw, 21px)",
    lineHeight: 1.55,
    color: "var(--orca-muted)",
    maxWidth: 620,
    margin: "0 0 34px",
  },
  manifest: {
    marginTop: "clamp(48px, 9vw, 88px)",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    borderTop: "1px solid var(--orca-line)",
  },
  manifestCell: {
    padding: "28px 28px 28px 0",
    borderRight: "1px solid var(--orca-line)",
  },
  roleTitle: {
    fontSize: 20,
    fontWeight: 600,
    margin: "14px 0 8px",
    color: "var(--orca-ink)",
  },
  roleBody: {
    fontSize: 15,
    lineHeight: 1.55,
    color: "var(--orca-muted)",
    margin: 0,
  },
  foot: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "20px clamp(20px, 5vw, 64px)",
    borderTop: "1px solid var(--orca-line)",
  },
};
