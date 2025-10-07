export default function Home() {
  return (
    <main style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
      <h1 style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>October 7th Timeline</h1>
      <p style={{ fontSize: "1.125rem", lineHeight: "1.6", color: "#666" }}>
        An interactive timeline memorial of the October 7th events. This application will
        visualize the timeline and locations of events using an interactive map interface.
      </p>
      <div style={{ marginTop: "2rem", padding: "1rem", background: "#f5f5f5", borderRadius: "8px" }}>
        <h2 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>Project Status</h2>
        <p>Next.js project structure initialized. Map visualization coming soon.</p>
      </div>
    </main>
  );
}
