import React from "react";

interface State {
  error: Error | null;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  State
> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ErrorBoundary]", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div
          style={{
            minHeight: "100vh",
            background: "#0F172A",
            color: "#F1F5F9",
            padding: 24,
            fontFamily: "system-ui, sans-serif",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div style={{ maxWidth: 480 }}>
            <div
              style={{
                fontSize: 22,
                fontWeight: 800,
                color: "#F87171",
                marginBottom: 8,
              }}
            >
              Något gick fel
            </div>
            <div
              style={{
                fontSize: 14,
                color: "#94A3B8",
                marginBottom: 16,
                lineHeight: 1.5,
              }}
            >
              Tekniskt fel vid laddning av live-spegling. Kontrollera att Convex
              är deployat och att share-koden är aktiv.
            </div>
            <pre
              style={{
                background: "rgba(248, 113, 113, 0.08)",
                border: "1px solid rgba(248, 113, 113, 0.25)",
                color: "#F87171",
                padding: 12,
                borderRadius: 10,
                fontSize: 12,
                overflow: "auto",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
              {String(this.state.error?.message || this.state.error)}
            </pre>
            <button
              onClick={() => window.location.reload()}
              style={{
                marginTop: 16,
                background: "#3B82F6",
                color: "#FFF",
                fontWeight: 700,
                padding: "10px 16px",
                borderRadius: 12,
                border: "none",
                cursor: "pointer",
              }}
            >
              Ladda om
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
