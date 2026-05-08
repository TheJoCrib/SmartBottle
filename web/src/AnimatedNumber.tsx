import { useEffect, useRef, useState } from "react";

interface AnimatedNumberProps {
  value: number;
  decimals?: number;
  suffix?: string;
  duration?: number;
}

export function AnimatedNumber({
  value,
  decimals = 0,
  suffix = "",
  duration = 700,
}: AnimatedNumberProps) {
  const [display, setDisplay] = useState(value);
  const startRef = useRef<{ from: number; at: number } | null>(null);
  const targetRef = useRef(value);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (value === targetRef.current && display === value) return;
    startRef.current = { from: display, at: performance.now() };
    targetRef.current = value;

    const tick = (now: number) => {
      if (!startRef.current) return;
      const elapsed = now - startRef.current.at;
      const t = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const next = startRef.current.from + (value - startRef.current.from) * eased;
      setDisplay(next);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        rafRef.current = null;
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [value, duration]);

  const formatted =
    decimals > 0 ? display.toFixed(decimals) : Math.round(display).toString();

  return (
    <span>
      {formatted}
      {suffix}
    </span>
  );
}
