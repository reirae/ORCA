import { Link } from "react-router-dom";
import { OrcaMark } from "../components/Brand";

export default function NotFound() {
  return (
    <div style={s.wrap}>
      <OrcaMark size={40} />
      <h1 style={s.h1}>Nothing here.</h1>
      <p style={s.sub}>That page doesn’t exist, or you don’t have access to it.</p>
      <Link to="/" className="orca-btn orca-btn--primary">
        Back to start
      </Link>
    </div>
  );
}

const s = {
  wrap: {
    minHeight: "100svh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    padding: 20,
    textAlign: "center",
  },
  h1: { fontSize: 40, fontWeight: 700, letterSpacing: "-1px", margin: 0, color: "var(--orca-paper)" },
  sub: { fontSize: 16, color: "var(--orca-muted)", margin: "0 0 12px" },
};
