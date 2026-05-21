import decks from "./decks.json";

export default function Home() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "2rem", padding: "2rem" }}>
      <h1 style={{ fontSize: "1.6rem", fontWeight: 700, color: "#fff", letterSpacing: "-0.02em" }}>AI Collective Slide Decks</h1>
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem", width: "100%", maxWidth: "400px" }}>
        {decks.map((d) => (
          <a
            key={d.href}
            href={d.href}
            style={{
              display: "block",
              background: "#1a1a1a",
              border: "1px solid #333",
              borderRadius: "12px",
              padding: "1.2rem 1.5rem",
              color: "#fff",
              textDecoration: "none",
              transition: "border-color 0.15s",
            }}
          >
            <div style={{ fontWeight: 700, fontSize: "1.1rem" }}>{d.name}</div>
            <div style={{ color: "#888", fontSize: "0.85rem", marginTop: "0.3rem" }}>{d.desc}</div>
          </a>
        ))}
      </div>
      <a href="/remote" style={{ color: "#888", fontSize: "0.85rem", marginTop: "1rem" }}>Remote Control</a>
    </div>
  );
}
