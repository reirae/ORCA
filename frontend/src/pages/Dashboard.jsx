import { Link } from "react-router-dom";
import { useAuth } from "../auth/useAuth";

/**
 * Dashboard — home after login.
 *
 * Placeholder overview of the main areas of the app. Replace with the real
 * home (recent conversations, start-a-consult, etc.) as features are built.
 */
export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div style={{ maxWidth: 920, margin: "0 auto" }}>
      <p className="orca-code" style={{ color: "var(--orca-hi)" }}>
        Signed in as {user?.role}
      </p>
      <h1 style={s.h1}>Hi {user?.name?.split(" ")[0]}.</h1>
      <p style={s.sub}>
        Your workspace. Jump into a consultation, manage your profile, or
        connect with an expert.
      </p>

      <div style={s.grid}>
        {CARDS.map((c) => (
          <Link key={c.to} to={c.to} style={s.card}>
            <div style={s.cardTop}>
              <span className="orca-code" style={{ color: "var(--orca-hi)" }}>
                {c.ids}
              </span>
              <span style={{ ...s.status, ...(c.ready ? s.ready : s.stub) }}>
                {c.ready ? "live" : "stub"}
              </span>
            </div>
            <h3 style={s.cardTitle}>{c.title}</h3>
            <p style={s.cardBody}>{c.body}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

const CARDS = [
  { to: "/experts", ids: "DIRECTORY", title: "Expert directory", body: "Browse verified experts by specialty.", ready: false },
  { to: "/chat", ids: "MESSAGES", title: "Messages & files", body: "Real-time chat, uploads, voice, annotation.", ready: false },
  { to: "/chat", ids: "VIDEO", title: "Video consult", body: "Live peer-to-peer call inside a conversation.", ready: false },
  { to: "/profile", ids: "PROFILE", title: "Your profile", body: "View and update your own details.", ready: false },
  { to: "/admin", ids: "ADMIN", title: "Admin console", body: "Approvals, sessions, audit, chat-log control.", ready: false },
];

const s = {
  h1: { fontSize: 38, fontWeight: 700, letterSpacing: "-1px", margin: "10px 0 12px", color: "var(--orca-paper)" },
  sub: { fontSize: 16, lineHeight: 1.55, color: "var(--orca-muted)", margin: "0 0 32px", maxWidth: 620 },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 },
  card: {
    display: "block",
    padding: 22,
    borderRadius: "var(--orca-radius)",
    border: "1px solid var(--orca-line)",
    background: "var(--orca-slate)",
    textDecoration: "none",
    transition: "border-color 0.15s ease",
  },
  cardTop: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  status: { fontFamily: "var(--orca-mono)", fontSize: 11, padding: "2px 7px", borderRadius: 4, textTransform: "uppercase", letterSpacing: "1px" },
  ready: { background: "rgba(61,214,140,0.15)", color: "var(--orca-signal)" },
  stub: { background: "var(--orca-abyss)", color: "var(--orca-faint)" },
  cardTitle: { fontSize: 19, fontWeight: 600, margin: "0 0 6px", color: "var(--orca-ink)" },
  cardBody: { fontSize: 14, lineHeight: 1.5, color: "var(--orca-muted)", margin: 0 },
};
