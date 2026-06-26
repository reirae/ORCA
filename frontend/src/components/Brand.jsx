/**
 * Brand mark — a sonar ping. The orca "calls" across distance, which is what
 * the app does: connect a worker on-site to an expert anywhere. Inline SVG so
 * it inherits color and needs no asset request (CSP-friendly).
 */
export function OrcaMark({ size = 28 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      style={{ display: "block" }}
    >
      <circle cx="16" cy="16" r="14" stroke="var(--orca-line)" strokeWidth="1.5" />
      <circle cx="16" cy="16" r="9" stroke="var(--orca-faint)" strokeWidth="1.5" />
      <circle cx="16" cy="16" r="4" fill="var(--orca-hi)" />
    </svg>
  );
}

export function OrcaWordmark({ size = 28 }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        userSelect: "none",
      }}
    >
      <OrcaMark size={size} />
      <span
        style={{
          fontWeight: 700,
          fontSize: size * 0.72,
          letterSpacing: "3px",
          color: "var(--orca-ink)",
        }}
      >
        ORCA
      </span>
    </span>
  );
}
