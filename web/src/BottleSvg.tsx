import { useMemo } from "react";

interface BottleSvgProps {
  fillPercentage: number;
  bottleState: "on_scale" | "off_scale" | "disconnected";
  width?: number;
  height?: number;
  color?: string;
}

interface ShapeConfig {
  widthRatio: number;
  heightRatio: number;
}

const SHAPE: ShapeConfig = { widthRatio: 0.36, heightRatio: 0.9 };

export function BottleSvg({
  fillPercentage,
  bottleState,
  width = 220,
  height = 320,
  color,
}: BottleSvgProps) {
  const capsuleW = Math.round(width * SHAPE.widthRatio * 2);
  const capsuleH = Math.round(height * SHAPE.heightRatio);
  const borderRadius = capsuleW / 2;
  const padding = 4;
  const innerW = capsuleW - padding * 2;
  const innerH = capsuleH - padding * 2;

  const fillRatio = Math.min(1, Math.max(0, fillPercentage));
  const isDisconnected = bottleState === "disconnected";
  const isOnScale = bottleState === "on_scale";

  const blobSize = innerW * 3;
  const waveExtra = 30;

  const waterHeight = useMemo(
    () => Math.max(0, fillRatio * innerH * 0.88 + waveExtra),
    [fillRatio, innerH],
  );

  const containerOpacity = isDisconnected ? 0.3 : 1;
  const capsuleBorderColor = isDisconnected
    ? "rgba(255,255,255,0.08)"
    : "rgba(255,255,255,0.18)";
  const glassBgColor = isDisconnected
    ? "rgba(100,116,139,0.12)"
    : "rgba(255,255,255,0.05)";

  const waterLight = color || "#7DD3FC";

  return (
    <div
      style={{
        position: "relative",
        width,
        height,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        opacity: containerOpacity,
        transition: "opacity 400ms ease",
        animation: isOffScalePulse(bottleState) ? "pulse-soft 1.4s ease-in-out infinite" : undefined,
      }}
    >
      <div
        style={{
          width: capsuleW,
          height: capsuleH,
          borderRadius,
          border: `1.5px solid ${capsuleBorderColor}`,
          boxShadow:
            "0 20px 60px rgba(56, 189, 248, 0.18), inset 0 0 30px rgba(255,255,255,0.04)",
          padding,
          overflow: "hidden",
          position: "relative",
          background: glassBgColor,
        }}
      >
        <div
          style={{
            position: "relative",
            width: innerW,
            height: innerH,
            borderRadius: borderRadius - padding,
            overflow: "hidden",
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0) 50%, rgba(255,255,255,0.02) 100%)",
          }}
        >
          {/* Highlight stripe */}
          <div
            style={{
              position: "absolute",
              top: 8,
              left: 8,
              width: 4,
              height: innerH * 0.7,
              borderRadius: 4,
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0) 100%)",
              pointerEvents: "none",
              zIndex: 5,
            }}
          />

          {!isDisconnected && (
            <div
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                width: innerW,
                height: waterHeight,
                overflow: "visible",
                transition: "height 700ms cubic-bezier(0.34, 1.56, 0.64, 1)",
              }}
            >
              {/* Water gradient base */}
              <div
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: Math.max(0, waterHeight - waveExtra),
                  background: `linear-gradient(180deg, ${waterLight} 0%, #38BDF8 45%, #0369A1 100%)`,
                  borderBottomLeftRadius: borderRadius - padding,
                  borderBottomRightRadius: borderRadius - padding,
                  zIndex: 1,
                }}
              />

              {/* Wave / blob layer */}
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: innerW,
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
                    background: waterLight,
                    opacity: 0.7,
                    animation: "blob-spin-cw 7s linear infinite",
                    transformOrigin: "center",
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
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    width: blobSize,
                    height: blobSize,
                    top: 6,
                    left: (innerW - blobSize) / 2,
                    borderRadius: `${blobSize * 0.42}px`,
                    background: "#0EA5E9",
                    opacity: 0.4,
                    animation: "blob-spin-cw 11s linear infinite",
                    transformOrigin: "center",
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Bottle cap */}
        <div
          style={{
            position: "absolute",
            top: -10,
            left: capsuleW / 2 - 22,
            width: 44,
            height: 14,
            borderRadius: 6,
            background: "linear-gradient(180deg, #475569 0%, #334155 100%)",
            border: "1px solid rgba(255,255,255,0.08)",
            zIndex: 4,
          }}
        />
      </div>
    </div>
  );
}

function isOffScalePulse(state: "on_scale" | "off_scale" | "disconnected"): boolean {
  return state === "off_scale";
}
