export function LandingPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        textAlign: "center",
      }}
    >
      <div
        style={{
          width: 80,
          height: 80,
          borderRadius: 24,
          background: "linear-gradient(135deg, #38BDF8 0%, #0369A1 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 24,
          boxShadow: "0 20px 60px rgba(56, 189, 248, 0.3)",
        }}
      >
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 2C8 8 6 11 6 14a6 6 0 0 0 12 0c0-3-2-6-6-12z"
            fill="#FFFFFF"
          />
        </svg>
      </div>
      <h1
        style={{
          fontSize: 28,
          fontWeight: 800,
          letterSpacing: -0.5,
          marginBottom: 8,
        }}
      >
        SmartBottle Live
      </h1>
      <p
        style={{
          fontSize: 15,
          color: "var(--text-secondary)",
          lineHeight: 1.5,
          maxWidth: 320,
          margin: "0 0 32px 0",
        }}
      >
        Skanna en QR-kod på SmartBottle-stativet för att se en flaska i realtid.
      </p>
      <a
        href="/admin"
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: "var(--accent)",
          textDecoration: "none",
        }}
      >
        Är du presentatör? Logga in →
      </a>
    </div>
  );
}
