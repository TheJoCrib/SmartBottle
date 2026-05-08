import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { QRCodeSVG } from "qrcode.react";
import { api } from "./convexApi";

const TOKEN_KEY = "smartbottle_admin_token";

export function AdminPage() {
  const [token, setToken] = useState<string | null>(() =>
    typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null,
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useMutation(api.auth.login);
  const enable = useMutation(api.mirror.enable);
  const disable = useMutation(api.mirror.disable);

  const me = useQuery(api.mirror.getMyShareCode, token ? { token } : "skip");

  async function onLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const result: any = await login({ email: email.trim(), password });
      if (result?.token) {
        localStorage.setItem(TOKEN_KEY, result.token);
        setToken(result.token);
      }
    } catch (err: any) {
      setError(err?.message || "Inloggning misslyckades");
    } finally {
      setBusy(false);
    }
  }

  async function onEnable() {
    if (!token) return;
    setBusy(true);
    setError(null);
    try {
      await enable({ token });
    } catch (err: any) {
      setError(err?.message || "Kunde inte aktivera");
    } finally {
      setBusy(false);
    }
  }

  async function onDisable() {
    if (!token) return;
    setBusy(true);
    setError(null);
    try {
      await disable({ token });
    } catch (err: any) {
      setError(err?.message || "Kunde inte stänga av");
    } finally {
      setBusy(false);
    }
  }

  function onLogout() {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setEmail("");
    setPassword("");
  }

  if (!token) {
    return (
      <div style={pageWrap}>
        <div style={card}>
          <h1 style={{ ...title, marginBottom: 8 }}>Live Mirror</h1>
          <p style={{ ...sub, marginTop: 0, marginBottom: 24 }}>
            Logga in med ditt SmartBottle-konto för att starta live-spegling
          </p>
          <form onSubmit={onLogin} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <input
              type="email"
              autoComplete="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={input}
            />
            <input
              type="password"
              autoComplete="current-password"
              placeholder="Lösenord"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={input}
            />
            {error && <div style={errorBox}>{error}</div>}
            <button type="submit" disabled={busy} style={primaryBtn(busy)}>
              {busy ? "Loggar in..." : "Logga in"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const enabled = me?.enabled === true;
  const code = me?.code ?? null;
  const mirrorUrl =
    typeof window !== "undefined" && code
      ? `${window.location.origin}/?code=${code}`
      : "";

  return (
    <div style={pageWrap}>
      <div style={card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h1 style={{ ...title, margin: 0 }}>Live Mirror</h1>
          <button onClick={onLogout} style={ghostBtn}>
            Logga ut
          </button>
        </div>

        <div style={{ height: 24 }} />

        <div style={statusRow}>
          <div
            style={{
              ...statusDot,
              background: enabled ? "#4ADE80" : "#64748B",
              animation: enabled ? "live-dot 1.6s ease-in-out infinite" : undefined,
            }}
          />
          <span style={{ fontWeight: 600, fontSize: 15 }}>
            {enabled ? "Spegling aktiv" : "Spegling avstängd"}
          </span>
        </div>

        <p style={{ ...sub, marginTop: 8, marginBottom: 20 }}>
          {enabled
            ? "Kunder kan skanna QR-koden nedan för att se din flaska i realtid."
            : "Tryck på knappen för att aktivera live-spegling. Kunder kan då skanna QR-koden."}
        </p>

        {error && <div style={{ ...errorBox, marginBottom: 16 }}>{error}</div>}

        {enabled && code ? (
          <>
            <div
              style={{
                background: "#FFFFFF",
                padding: 16,
                borderRadius: 16,
                display: "flex",
                justifyContent: "center",
                marginBottom: 16,
              }}
            >
              <QRCodeSVG
                value={mirrorUrl}
                size={240}
                level="M"
                fgColor="#0F172A"
                bgColor="#FFFFFF"
              />
            </div>
            <div style={codeRow}>
              <span style={codeLabel}>Kod</span>
              <span style={codeValue}>{code}</span>
            </div>
            <a
              href={mirrorUrl}
              target="_blank"
              rel="noreferrer"
              style={{ ...sub, fontSize: 13, wordBreak: "break-all", display: "block", marginTop: 8 }}
            >
              {mirrorUrl}
            </a>
            <div style={{ height: 24 }} />
            <button onClick={onDisable} disabled={busy} style={dangerBtn(busy)}>
              Stäng av spegling
            </button>
          </>
        ) : (
          <button onClick={onEnable} disabled={busy} style={primaryBtn(busy)}>
            {busy ? "Aktiverar..." : "Starta live-spegling"}
          </button>
        )}
      </div>
    </div>
  );
}

const pageWrap: React.CSSProperties = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 20,
};

const card: React.CSSProperties = {
  width: "100%",
  maxWidth: 380,
  background: "var(--surface)",
  borderRadius: 20,
  padding: 24,
  border: "1px solid var(--border-medium)",
  boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
};

const title: React.CSSProperties = {
  fontSize: 24,
  fontWeight: 800,
  color: "var(--text-primary)",
  letterSpacing: -0.5,
};

const sub: React.CSSProperties = {
  fontSize: 14,
  color: "var(--text-secondary)",
  lineHeight: 1.5,
};

const input: React.CSSProperties = {
  background: "rgba(255,255,255,0.08)",
  border: "1px solid var(--border-medium)",
  borderRadius: 12,
  padding: "14px 16px",
  fontSize: 16,
  color: "var(--text-primary)",
  outline: "none",
};

const primaryBtn = (busy: boolean): React.CSSProperties => ({
  background: "var(--primary)",
  color: "#FFFFFF",
  fontWeight: 700,
  fontSize: 16,
  padding: "14px 16px",
  borderRadius: 14,
  border: "none",
  cursor: busy ? "not-allowed" : "pointer",
  opacity: busy ? 0.6 : 1,
  width: "100%",
});

const dangerBtn = (busy: boolean): React.CSSProperties => ({
  background: "rgba(248, 113, 113, 0.12)",
  color: "#F87171",
  fontWeight: 700,
  fontSize: 15,
  padding: "12px 16px",
  borderRadius: 14,
  border: "1px solid rgba(248, 113, 113, 0.3)",
  cursor: busy ? "not-allowed" : "pointer",
  opacity: busy ? 0.6 : 1,
  width: "100%",
});

const ghostBtn: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  color: "var(--text-muted)",
  padding: "6px 10px",
  borderRadius: 8,
};

const statusRow: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
};

const statusDot: React.CSSProperties = {
  width: 10,
  height: 10,
  borderRadius: 5,
};

const errorBox: React.CSSProperties = {
  background: "rgba(248, 113, 113, 0.12)",
  color: "#F87171",
  padding: "10px 12px",
  borderRadius: 10,
  fontSize: 13,
  fontWeight: 500,
};

const codeRow: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  background: "rgba(255,255,255,0.04)",
  border: "1px solid var(--border-medium)",
  borderRadius: 12,
  padding: "12px 16px",
};

const codeLabel: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: "var(--text-muted)",
  letterSpacing: 0.5,
  textTransform: "uppercase",
};

const codeValue: React.CSSProperties = {
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
  fontSize: 18,
  fontWeight: 800,
  color: "var(--accent)",
  letterSpacing: 1,
};
