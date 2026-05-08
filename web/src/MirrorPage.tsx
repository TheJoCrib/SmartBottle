import { useEffect, useRef, useState } from "react";
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

const RECENT_DRINK_WINDOW_MS = 6000;

export function MirrorPage({ shareCode }: MirrorPageProps) {
  const state = useQuery(api.mirror.getState, { shareCode }) as
    | MirrorState
    | null
    | undefined;

  const [selectedBottleId, setSelectedBottleId] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const lastDrinkTsRef = useRef<number | null>(null);
  const [drinkFlash, setDrinkFlash] = useState<{ amount: number; key: number } | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

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

  const recentDrinkTs = selectedBottle?.lastDrinkAt ?? state.lastDrink?.timestamp ?? null;
  const isRecentDrink = recentDrinkTs !== null && now - recentDrinkTs < RECENT_DRINK_WINDOW_MS;

  let bottleState: "on_scale" | "off_scale" | "disconnected" = "on_scale";
  if (!selectedBottle) {
    bottleState = "disconnected";
  } else if (isRecentDrink) {
    bottleState = "off_scale";
  }

  const currentMl = selectedBottle?.waterRemainingMl ?? 0;
  const fillPercentage = selectedBottle?.fillPercentage ?? 0;

  return (
    <div style={pageStyle}>
      <div style={contentStyle}>
        <header style={headerStyle} className="fade-in-up delay-50">
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
                <FireIcon />
                <span style={streakTextStyle}>{state.streak} dagar</span>
              </div>
            )}
          </div>
        </header>

        <section style={progressSectionStyle} className="fade-in-up delay-100">
          <div style={progressHeaderStyle}>
            <div style={progressLabelRowStyle}>
              <div style={progressLabelStyle}>Dagens mål</div>
              {isRecentDrink && (
                <div style={measureBadgeStyle}>
                  <span style={measureDotStyle} />
                  <span style={measureTextStyle}>Mäter...</span>
                </div>
              )}
            </div>
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
          <div className="fade-in-up delay-150" style={{ position: "relative" }}>
            <button
              style={pickerButtonStyle}
              onClick={() => setPickerOpen((v) => !v)}
            >
              <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
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
                  fontSize: 16,
                  lineHeight: 1,
                  display: "inline-flex",
                }}
              >
                <ChevronDownIcon />
              </span>
            </button>
            {pickerOpen && (
              <>
                <div
                  onClick={() => setPickerOpen(false)}
                  style={{
                    position: "fixed",
                    inset: 0,
                    background: "rgba(0,0,0,0.4)",
                    zIndex: 10,
                  }}
                />
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
                          background: active ? "rgba(56,189,248,0.10)" : "transparent",
                        }}
                      >
                        <div
                          style={{
                            width: 44,
                            height: 44,
                            borderRadius: 12,
                            background: (b.color || "#38BDF8") + "20",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <BottleIconSm color={b.color || "#38BDF8"} />
                        </div>
                        <div style={{ flex: 1, textAlign: "left" }}>
                          <div style={pickerItemNameStyle}>{b.name}</div>
                          <div style={pickerItemMetaStyle}>
                            {b.isCalibrated
                              ? `${b.capacityMl} ml`
                              : "Ej kalibrerad"}
                          </div>
                        </div>
                        {active && <CheckIcon color="#38BDF8" />}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}

        <section style={bottleSectionStyle} className="fade-in delay-200">
          {selectedBottle ? (
            <>
              <BottleSvg
                fillPercentage={fillPercentage}
                currentMl={currentMl}
                bottleState={bottleState}
                width={Math.min(220, typeof window !== "undefined" ? window.innerWidth * 0.55 : 220)}
                height={Math.min(typeof window !== "undefined" ? window.innerHeight * 0.4 : 290, 290)}
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

function FireIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path
        d="M13 2C13 2 14.5 5.5 14.5 8C14.5 9.93 13.07 11.5 11.5 11.5C9.93 11.5 8.5 9.93 8.5 8.5C8.5 8.5 7 11 7 14C7 17.5 9.5 20 12.5 20C15.5 20 18 17.5 18 14C18 9.5 13 2 13 2Z"
        fill="#FBBF24"
      />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M6 9L12 15L18 9"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CheckIcon({ color }: { color: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path
        d="M20 6L9 17L4 12"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BottleIconSm({ color }: { color: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path
        d="M9 2v3.5a1 1 0 0 1-.3.7L7 8c-.6.6-1 1.4-1 2.3V20a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-9.7c0-.9-.4-1.7-1-2.3l-1.7-1.8a1 1 0 0 1-.3-.7V2"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path d="M9 2h6" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
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
        {body && (
          <div style={{ color: "var(--text-secondary)", fontSize: 14, lineHeight: 1.5 }}>
            {body}
          </div>
        )}
      </div>
    </div>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "var(--bg)",
  color: "var(--text-primary)",
};

const contentStyle: React.CSSProperties = {
  maxWidth: 480,
  margin: "0 auto",
  padding: "16px 20px 60px 20px",
};

const headerStyle: React.CSSProperties = {
  paddingBottom: 4,
};

const greetingStyle: React.CSSProperties = {
  fontSize: 26,
  fontWeight: 800,
  letterSpacing: -0.5,
  color: "var(--text-primary)",
};

const statusRowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  marginTop: 6,
};

const livePillStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  background: "rgba(74, 222, 128, 0.12)",
  border: "1px solid rgba(74, 222, 128, 0.25)",
  padding: "3px 10px",
  borderRadius: 8,
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
  gap: 3,
  background: "var(--warning-muted)",
  padding: "3px 8px",
  borderRadius: 8,
};

const streakTextStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: "var(--warning)",
};

const progressSectionStyle: React.CSSProperties = {
  paddingTop: 16,
  paddingBottom: 12,
};

const progressHeaderStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 10,
};

const progressLabelRowStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
};

const progressLabelStyle: React.CSSProperties = {
  fontSize: 15,
  fontWeight: 700,
  color: "var(--text-primary)",
};

const measureBadgeStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 5,
  background: "var(--primary-muted)",
  padding: "3px 8px",
  borderRadius: 10,
  animation: "measure-pulse 1.4s ease-in-out infinite",
};

const measureDotStyle: React.CSSProperties = {
  width: 6,
  height: 6,
  borderRadius: 3,
  background: "var(--accent)",
};

const measureTextStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  color: "var(--accent)",
};

const progressValueStyle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 500,
  color: "var(--text-secondary)",
  fontVariantNumeric: "tabular-nums",
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
  background: "var(--accent)",
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
  position: "absolute",
  top: "calc(100% + 4px)",
  left: 0,
  right: 0,
  background: "var(--surface)",
  border: "1px solid var(--border-medium)",
  borderRadius: 16,
  padding: 8,
  zIndex: 20,
  boxShadow: "0 24px 60px rgba(0,0,0,0.5)",
};

const pickerItemStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  width: "100%",
  padding: "10px 12px",
  borderRadius: 12,
  border: "none",
};

const pickerItemNameStyle: React.CSSProperties = {
  fontSize: 16,
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
  paddingTop: 16,
  paddingBottom: 8,
  position: "relative",
};

const drinkFlashStyle: React.CSSProperties = {
  position: "absolute",
  top: "8%",
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
  fontVariantNumeric: "tabular-nums",
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

const footerStyle: React.CSSProperties = {
  marginTop: 36,
  paddingTop: 20,
  textAlign: "center",
  fontSize: 12,
  color: "var(--text-muted)",
  borderTop: "1px solid var(--border)",
};
