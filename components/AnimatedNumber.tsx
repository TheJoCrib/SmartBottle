import React, { useEffect, useRef, useState } from "react";
import { Text, TextProps } from "react-native";

interface AnimatedNumberProps extends Omit<TextProps, "children"> {
  value: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  thousandsSeparator?: string;
}

export function AnimatedNumber({
  value,
  duration = 900,
  decimals = 0,
  prefix,
  suffix,
  thousandsSeparator = " ",
  ...textProps
}: AnimatedNumberProps) {
  const [display, setDisplay] = useState<number>(value);
  const fromRef = useRef<number>(value);
  const startRef = useRef<number>(0);
  const rafRef = useRef<number | null>(null);
  const displayRef = useRef<number>(value);

  displayRef.current = display;

  useEffect(() => {
    if (Number.isNaN(value)) return;

    if (displayRef.current === value) return;

    fromRef.current = displayRef.current;
    startRef.current = Date.now();

    const tick = () => {
      const elapsed = Date.now() - startRef.current;
      const t = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const next = fromRef.current + (value - fromRef.current) * eased;
      setDisplay(t >= 1 ? value : next);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        rafRef.current = null;
      }
    };

    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [value, duration]);

  const formatted = formatNumber(display, decimals, thousandsSeparator);
  const content = `${prefix ?? ""}${formatted}${suffix ?? ""}`;

  return <Text {...textProps}>{content}</Text>;
}

function formatNumber(value: number, decimals: number, separator: string): string {
  if (decimals > 0) {
    const fixed = value.toFixed(decimals);
    if (!separator) return fixed;
    const [intPart, decPart] = fixed.split(".");
    return `${insertSeparators(intPart, separator)}.${decPart}`;
  }
  const rounded = Math.round(value).toString();
  return insertSeparators(rounded, separator);
}

function insertSeparators(intStr: string, separator: string): string {
  if (!separator) return intStr;
  const negative = intStr.startsWith("-");
  const digits = negative ? intStr.slice(1) : intStr;
  const withSep = digits.replace(/\B(?=(\d{3})+(?!\d))/g, separator);
  return negative ? `-${withSep}` : withSep;
}
