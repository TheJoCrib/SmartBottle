import { useEffect, useState } from "react";

interface BottleSvgProps {
  fillPercentage: number;
  currentMl: number;
  bottleState: "on_scale" | "off_scale" | "disconnected";
  width?: number;
  height?: number;
}

const SHAPE = { widthRatio: 0.36, heightRatio: 0.9 };

export function BottleSvg({
  fillPercentage,
  currentMl,
  bottleState,
  width = 220,
  height = 320,
}: BottleSvgProps) {
  const capsuleW = Math.round(width * SHAPE.widthRatio * 2);
  const capsuleH = Math.round(height * SHAPE.heightRatio);
  const borderRadius = capsuleW / 2;
  const padding = 4;
  const innerW = capsuleW - padding * 2;
  const innerH = capsuleH - padding * 2;
  const innerRadius = borderRadius - padding;

  const fillRatio = Math.min(1, Math.max(0, fillPercentage));
  const isDisconnected = bottleState === "disconnected";
  const isOnScale = bottleState === "on_scale";
  const isOffScale = bottleState === "off_scale";

  const blobSize = innerW * 3;
  const waveExtra = 30;
  const waterHeight = isDisconnected
    ? 0
    : Math.max(0, fillRatio * innerH * 0.88 + waveExtra);

  const containerOpacity = isDisconnected ? 0.3 : 1;
  const capsuleBorderColor = isDisconnected
    ? "rgba(255,255,255,0.08)"
    : "rgba(255,255,255,0.15)";
  const glassBgColor = isDisconnected
    ? "rgba(100,116,139,0.12)"
    : "rgba(255,255,255,0.05)";

  const [animatedHeight, setAnimatedHeight] = useState(waterHeight);
  useEffect(() => {
    const id = requestAnimationFrame(() => setAnimatedHeight(waterHeight));
    return () => cancelAnimationFrame(id);
  }, [waterHeight]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        position: "relative",
      }}
    >
      <div
        style={{
          width,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          opacity: containerOpacity,
          transition: "opacity 400ms ease",
          position: "relative",
          animation: isOffScale ? "pulse-soft 1.4s ease-in-out infinite" : undefined,
        }}
      >
        <div
          style={{
            width: capsuleW,
            height: capsuleH,
            borderRadius,
            border: `2px solid ${capsuleBorderColor}`,
            overflow: "hidden",
            position: "relative",
            background: "transparent",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: isDisconnected
              ? "none"
              : "0 30px 60px rgba(56, 189, 248, 0.15), inset 0 0 30px rgba(255,255,255,0.04)",
          }}
        >
          <div
            style={{
              width: innerW,
              height: innerH,
              borderRadius: innerRadius,
              overflow: "hidden",
              position: "relative",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: glassBgColor,
                borderRadius: innerRadius,
              }}
            />

            {!isDisconnected && (
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: animatedHeight,
                  overflow: "visible",
                  transition: "height 900ms cubic-bezier(0.34, 1.56, 0.64, 1)",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    top: 10,
                    bottom: 0,
                    background:
                      "linear-gradient(180deg, #38BDF8 0%, #0EA5A0 50%, #0369A1 100%)",
                  }}
                />

                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    top: 0,
                    height: blobSize + waveExtra,
                    overflow: "visible",
                    zIndex: 2,
                    animation: isOnScale
                      ? "water-drop-bounce 2s cubic-bezier(0.4,0,0.6,1) infinite"
                      : undefined,
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      width: blobSize,
                      height: blobSize,
                      top: 0,
                      left: (innerW - blobSize) / 2,
                      borderRadius: `${blobSize * 0.43}px`,
                      background: "#7DD3FC",
                      opacity: 0.7,
                      animation: "blob-spin-cw 7s linear infinite",
                      transformOrigin: "center",
                      willChange: "transform",
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      width: blobSize,
                      height: blobSize,
                      top: 3,
                      left: (innerW - blobSize) / 2,
                      borderRadius: `${blobSize * 0.45}px`,
                      background: "#38BDF8",
                      opacity: 0.5,
                      animation: "blob-spin-ccw 5s linear infinite",
                      transformOrigin: "center",
                      willChange: "transform",
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      width: blobSize,
                      height: blobSize,
                      top: 5,
                      left: (innerW - blobSize) / 2,
                      borderRadius: `${blobSize * 0.42}px`,
                      background: "#0369A1",
                      opacity: 0.4,
                      animation: "blob-spin-cw 11s linear infinite",
                      transformOrigin: "center",
                      willChange: "transform",
                    }}
                  />
                </div>
              </div>
            )}

            <div
              style={{
                position: "absolute",
                top: 0,
                left: 8,
                width: 14,
                height: capsuleH * 0.6,
                borderRadius: 7,
                background: "rgba(255, 255, 255, 0.06)",
                pointerEvents: "none",
                zIndex: 5,
              }}
            />
          </div>
        </div>

        <div
          style={{
            position: "absolute",
            top: 0,
            left: "50%",
            transform: "translateX(-50%)",
            width: capsuleW,
            height: capsuleH,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            paddingTop: 8,
            pointerEvents: "none",
          }}
        >
          {!isDisconnected ? (
            <div
              style={{
                marginBottom: 2,
                animation: isOnScale
                  ? "water-drop-bounce 2s cubic-bezier(0.4,0,0.6,1) infinite"
                  : undefined,
              }}
            >
              <WaterDropIcon size={26} color="rgba(255,255,255,0.85)" />
            </div>
          ) : (
            <div style={{ marginBottom: 2 }}>
              <CloudOfflineIcon size={28} color="rgba(255,255,255,0.4)" />
            </div>
          )}

          <div
            style={{
              fontSize: 48,
              fontWeight: 800,
              color: isDisconnected ? "rgba(255,255,255,0.3)" : "#F1F5F9",
              letterSpacing: -2,
              marginTop: 2,
              textShadow: isDisconnected
                ? "none"
                : "0 2px 8px rgba(0,0,0,0.35)",
              fontVariantNumeric: "tabular-nums",
              lineHeight: 1,
            }}
          >
            {isDisconnected ? "—" : currentMl}
          </div>

          <div
            style={{
              fontSize: 15,
              fontWeight: 500,
              color: isDisconnected ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.7)",
              letterSpacing: 0.5,
              marginTop: -4,
              textShadow: isDisconnected ? "none" : "0 1px 4px rgba(0,0,0,0.2)",
            }}
          >
            {isDisconnected ? "Frånkopplad" : "ml kvar"}
          </div>
        </div>
      </div>

      {isOffScale && (
        <div
          style={{
            marginTop: 12,
            padding: "6px 16px",
            borderRadius: 12,
            background: "rgba(56, 189, 248, 0.12)",
            border: "1px solid rgba(56, 189, 248, 0.25)",
            animation: "pulse-soft 1.4s ease-in-out infinite",
          }}
        >
          <span
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: "#38BDF8",
              letterSpacing: 0.3,
            }}
          >
            Dricker...
          </span>
        </div>
      )}
    </div>
  );
}

function WaterDropIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M12 2.5C12 2.5 5 11 5 15.5C5 19.0899 8.13401 22 12 22C15.866 22 19 19.0899 19 15.5C19 11 12 2.5 12 2.5Z"
        fill={color}
      />
    </svg>
  );
}

function CloudOfflineIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M3 3l18 18M16.5 13a4.5 4.5 0 0 0-4.5-4.5 5.94 5.94 0 0 0-1.91.31m-2.46 1.79A5.99 5.99 0 0 0 6 16.5a4.5 4.5 0 0 0 4.5 4.5h6"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
