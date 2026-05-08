import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "./convexApi";
import { BottleSvg } from "./BottleSvg";
import { getGreeting } from "./theme";
import { AnimatedNumber } from "./AnimatedNumber";

interface MirrorPageProps {
  shareCode: string;
}

interface Bottle {
  _id: string;
  name: string;
  icon: string;
  color: string;
  capacityMl: number;
  isActive: boolean;
  isCalibrated: boolean;
  consumedMl: number;
  waterRemainingMl: number;
  fillPercentage: number;
  drinkCount: number;
  lastDrinkAt: number | null;
}

interface MirrorState {
  presenter: { name: string };
  goal: { dailyGoalMl: number };
  streak: number;
  todayIntakeMl: number;
  drinks: Array<{
    _id: string;
    bottleId: string | null;
    amountMl: number;
    timestamp: number;
    isManual: boolean;
  }>;
  lastDrink: { amountMl: number; timestamp: number } | null;
  bottles: Bottle[];
}

export function MirrorPage({ shareCode }: MirrorPageProps) {
  const state = useQuery(api.mirror.getState, { shareCode }) as
    | MirrorState
    | null
    | undefined;

  const [selectedBottleId, setSelectedBottleId] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const lastDrinkTsRef = useRef<number | null>(null);
  const [drinkFlash, setDrinkFlash] = useState<{ amount: number; key: number } | null>(null);

  useEffect(() => {
    if (!state) return;
    if (selectedBottleId === null && state.bottles.length > 0) {
      const active = state.bottles.find((b) => b.isActive) || state.bottles[0];
      setSelectedBottleId(active._id);
      return;
    }
    if (
      selectedBottleId &&
      !state.bottles.find((b) => b._id === selectedBottleId)
    ) {
      setSelectedBottleId(state.bottles[0]?._id ?? null);
    }
  }, [state, selectedBottleId]);

  useEffect(() => {
    if (!state?.lastDrink) return;
    const ts = state.lastDrink.timestamp;
    if (lastDrinkTsRef.current === null) {
      lastDrinkTsRef.current = ts;
      return;
    }
    if (ts > lastDrinkTsRef.current) {
      lastDrinkTsRef.current = ts;
      setDrinkFlash({ amount: state.lastDrink.amountMl, key: ts });
      const t = setTimeout(() => setDrinkFlash(null), 2200);
      return () => clearTimeout(t);
    }
  }, [state?.lastDrink]);

  if (state === undefined) {
    return <CenteredMessage title="Laddar..." />;
  }

  if (state === null) {
    return (
      <CenteredMessage
        title="Inaktiv kod"
        body="Den här länken verkar inte vara aktiv just nu. Be presentatören kontrollera att live-spegling är på."
      />
    );
  }

  const selectedBottle =
    state.bottles.find((b) => b._id === selectedBottleId) ?? null;
  const dailyProgress =
    state.goal.dailyGoalMl > 0
      ? Math.min(1, state.todayIntakeMl / state.goal.dailyGoalMl)
      : 0;

  const showPicker = state.bottles.length > 1;

  const recentDrinks = useMemo(
    () => state.drinks.slice().sort((a, b) => b.timestamp - a.timestamp).slice(0, 6),
    [state.drinks],
  );

  return (
    <div style={pageStyle}>
      <div style={contentStyle}>
        <header style={headerStyle} className="fade-in-up delay-50">
          <div>
            <div style={greetingStyle}>
              {getGreeting()}, {state.presenter.name}
            </div>
            <div style={statusRowStyle}>
              <div style={livePillStyle}>
                <span className="live-pill-dot" />
                <span style={livePillTextStyle}>LIVE</span>
              </div>
              {state.streak > 0 && (
                <div style={streakPillStyle}>
                  <span style={{ fontSize: 14 }}>🔥</span>
                  <span style={streakTextStyle}>
                    {state.streak} dagar
                  </span>
                </div>
              )}
            </div>
          </div>
        </header>

        <section style={progressSectionStyle} className="fade-in-up delay-100">
          <div style={progressHeaderStyle}>
            <div style={progressLabelStyle}>Dagens mål</div>
            <div style={progressValueStyle}>
              <AnimatedNumber value={state.todayIntakeMl} />
              <span style={{ color: "var(--text-muted)" }}> / </span>
              <AnimatedNumber value={state.goal.dailyGoalMl} /> ml
            </div>
          </div>
          <div style={progressTrackStyle}>
            <div
              style={{
                ...progressFillStyle,
                width: `${dailyProgress * 100}%`,
              }}
            />
          </div>
        </section>

        {showPicker && (
          <div className="fade-in-up delay-150">
            <button
              style={pickerButtonStyle}
              onClick={() => setPickerOpen((v) => !v)}
            >
              <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <BottleDot color={selectedBottle?.color || "#38BDF8"} />
                <span style={pickerNameStyle}>
                  {selectedBottle?.name ?? "Välj flaska"}
                </span>
              </span>
              <span
                style={{
                  color: "var(--text-muted)",
                  transform: pickerOpen ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 200ms ease",
                  fontSize: 18,
                  lineHeight: 1,
                }}
              >
                ▾
              </span>
            </button>
            {pickerOpen && (
              <div style={pickerListStyle}>
                {state.bottles.map((b) => {
                  const active = b._id === selectedBottleId;
                  return (
                    <button
                      key={b._id}
                      onClick={() => {
                        setSelectedBottleId(b._id);
                        setPickerOpen(false);
                      }}
                      style={{
                        ...pickerItemStyle,
                        background: active ? "rgba(56,189,248,0.08)" : "transparent",
                      }}
                    >
                      <BottleDot color={b.color || "#38BDF8"} />
                      <div style={{ flex: 1, textAlign: "left" }}>
                        <div style={pickerItemNameStyle}>{b.name}</div>
                        <div style={pickerItemMetaStyle}>
                          {b.isCalibrated
                            ? `${b.capacityMl} ml`
                            : "Ej kalibrerad"}
                        </div>
                      </div>
                      {active && <span style={{ color: "var(--accent)" }}>✓</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <section style={bottleSectionStyle} className="fade-in delay-200">
          {selectedBottle ? (
            <>
              <BottleSvg
                fillPercentage={selectedBottle.fillPercentage}
                bottleState={selectedBottle.isCalibrated ? "on_scale" : "disconnected"}
                color={selectedBottle.color}
                width={Math.min(220, window.innerWidth * 0.55)}
                height={Math.min(window.innerHeight * 0.35, 290)}
              />
              {drinkFlash && (
                <div key={drinkFlash.key} style={drinkFlashStyle}>
                  −{drinkFlash.amount} ml
                </div>
              )}
            </>
          ) : (
            <div style={{ color: "var(--text-muted)", fontSize: 14 }}>
              Inga flaskor att visa
            </div>
          )}
        </section>

        {selectedBottle && (
          <section style={summaryCardStyle} className="fade-in-up delay-350">
            <div style={summaryItemStyle}>
              <div style={summaryValueStyle}>
                <AnimatedNumber value={Math.round(dailyProgress * 100)} suffix="%" />
              </div>
              <div style={summaryLabelStyle}>av mål</div>
            </div>
            <div style={summaryDividerStyle} />
            <div style={summaryItemStyle}>
              <div style={summaryValueStyle}>
                <AnimatedNumber value={state.todayIntakeMl / 1000} decimals={1} suffix="L" />
              </div>
              <div style={summaryLabelStyle}>totalt idag</div>
            </div>
            <div style={summaryDividerStyle} />
            <div style={summaryItemStyle}>
              <div style={summaryValueStyle}>
                <AnimatedNumber value={selectedBottle.waterRemainingMl} />
              </div>
              <div style={summaryLabelStyle}>i flaskan</div>
            </div>
          </section>
        )}

        {recentDrinks.length > 0 && (
          <section style={recentSectionStyle} className="fade-in-up">
            <div style={sectionTitleStyle}>Senaste klunkar</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {recentDrinks.map((d) => (
                <div key={d._id} style={drinkRowStyle}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      background: "rgba(56,189,248,0.12)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 16,
                    }}
                  >
                    💧
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 600 }}>
                      {d.amountMl} ml
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                      {formatTime(d.timestamp)} {d.isManual ? "• manuellt" : "• automatiskt"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <footer style={footerStyle}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <span className="live-pill-dot" />
            <span>Spegling i realtid · uppdateras automatiskt</span>
          </div>
        </footer>
      </div>
    </div>
  );
}

function BottleDot({ color }: { color: string }) {
  return (
    <span
      style={{
        width: 10,
        height: 10,
        borderRadius: 5,
        background: color,
        display: "inline-block",
        boxShadow: `0 0 12px ${color}80`,
      }}
    />
  );
}

function CenteredMessage({ title, body }: { title: string; body?: string }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div style={{ textAlign: "center", maxWidth: 360 }}>
        <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>{title}</div>
        {body && <div style={{ color: "var(--text-secondary)", fontSize: 14, lineHeight: 1.5 }}>{body}</div>}
      </div>
    </div>
  );
}

function formatTime(ts: number): string {
  const date = new Date(ts);
  const hh = date.getHours().toString().padStart(2, "0");
  const mm = date.getMinutes().toString().padStart(2, "0");
  return `${hh}:${mm}`;
}

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "var(--bg)",
  color: "var(--text-primary)",
};

const contentStyle: React.CSSProperties = {
  maxWidth: 480,
  margin: "0 auto",
  padding: "24px 20px 60px 20px",
};

const headerStyle: React.CSSProperties = {
  paddingBottom: 4,
};

const greetingStyle: React.CSSProperties = {
  fontSize: 26,
  fontWeight: 800,
  letterSpacing: -0.5,
};

const statusRowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  marginTop: 8,
};

const livePillStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  background: "rgba(74, 222, 128, 0.12)",
  border: "1px solid rgba(74, 222, 128, 0.25)",
  padding: "4px 10px",
  borderRadius: 10,
};

const livePillTextStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: 1,
  color: "var(--success)",
};

const streakPillStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 4,
  background: "var(--warning-muted)",
  padding: "4px 10px",
  borderRadius: 10,
};

const streakTextStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: "var(--warning)",
};

const progressSectionStyle: React.CSSProperties = {
  paddingTop: 20,
  paddingBottom: 12,
};

const progressHeaderStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 10,
};

const progressLabelStyle: React.CSSProperties = {
  fontSize: 15,
  fontWeight: 700,
};

const progressValueStyle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 500,
  color: "var(--text-secondary)",
};

const progressTrackStyle: React.CSSProperties = {
  height: 8,
  borderRadius: 4,
  background: "var(--surface)",
  overflow: "hidden",
};

const progressFillStyle: React.CSSProperties = {
  height: "100%",
  borderRadius: 4,
  background: "linear-gradient(90deg, #38BDF8 0%, #3B82F6 100%)",
  transition: "width 700ms cubic-bezier(0.4, 0, 0.2, 1)",
};

const pickerButtonStyle: React.CSSProperties = {
  display: "flex",
  width: "100%",
  alignItems: "center",
  justifyContent: "space-between",
  background: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: 12,
  padding: "10px 14px",
  marginBottom: 8,
  fontSize: 14,
};

const pickerNameStyle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
  color: "var(--text-primary)",
};

const pickerListStyle: React.CSSProperties = {
  background: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: 12,
  padding: 4,
  marginBottom: 8,
};

const pickerItemStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  width: "100%",
  padding: "10px 12px",
  borderRadius: 10,
  border: "none",
};

const pickerItemNameStyle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
  color: "var(--text-primary)",
};

const pickerItemMetaStyle: React.CSSProperties = {
  fontSize: 12,
  color: "var(--text-muted)",
  marginTop: 2,
};

const bottleSectionStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  paddingTop: 12,
  paddingBottom: 16,
  position: "relative",
};

const drinkFlashStyle: React.CSSProperties = {
  position: "absolute",
  top: "20%",
  background: "rgba(56, 189, 248, 0.95)",
  color: "#0F172A",
  fontSize: 22,
  fontWeight: 800,
  padding: "10px 18px",
  borderRadius: 14,
  boxShadow: "0 12px 40px rgba(56, 189, 248, 0.5)",
  animation: "fade-in-up 0.5s ease-out",
};

const summaryCardStyle: React.CSSProperties = {
  display: "flex",
  background: "var(--surface)",
  borderRadius: 16,
  border: "1px solid var(--border)",
  padding: "16px 12px",
  marginTop: 12,
};

const summaryItemStyle: React.CSSProperties = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
};

const summaryValueStyle: React.CSSProperties = {
  fontSize: 20,
  fontWeight: 800,
  color: "var(--text-primary)",
};

const summaryLabelStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 500,
  color: "var(--text-muted)",
  marginTop: 2,
};

const summaryDividerStyle: React.CSSProperties = {
  width: 1,
  background: "var(--border)",
};

const recentSectionStyle: React.CSSProperties = {
  marginTop: 28,
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 600,
  letterSpacing: 0.5,
  color: "var(--text-muted)",
  textTransform: "uppercase",
  marginBottom: 12,
};

const drinkRowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  background: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: 12,
  padding: "10px 12px",
};

const footerStyle: React.CSSProperties = {
  marginTop: 36,
  paddingTop: 20,
  textAlign: "center",
  fontSize: 12,
  color: "var(--text-muted)",
  borderTop: "1px solid var(--border)",
};
