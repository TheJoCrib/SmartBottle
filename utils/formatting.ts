import { format, formatDistanceToNow, isToday, isYesterday } from "date-fns";

export function formatMl(ml: number): string {
  if (ml >= 1000) {
    return `${(ml / 1000).toFixed(1)}L`;
  }
  return `${Math.round(ml)}ml`;
}

export function formatLiters(ml: number, decimals: number = 1): string {
  return `${(ml / 1000).toFixed(decimals)}L`;
}

export function formatPercentage(value: number, max: number = 100): string {
  const clamped = Math.min(Math.max(Math.round(value), 0), max);
  return `${clamped}%`;
}

export function formatWeight(grams: number): string {
  if (grams >= 1000) {
    return `${(grams / 1000).toFixed(2)}kg`;
  }
  return `${Math.round(grams)}g`;
}

export function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  return format(date, "MMM d, yyyy");
}

export function formatTime(timestamp: number): string {
  return format(new Date(timestamp), "h:mm a");
}

export function formatDateTime(timestamp: number): string {
  return `${formatDate(timestamp)} at ${formatTime(timestamp)}`;
}

export function formatRelativeTime(timestamp: number): string {
  return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
}

export function formatStreak(days: number): string {
  if (days === 0) return "No streak";
  if (days === 1) return "1 day";
  return `${days} days`;
}

export function formatXP(xp: number): string {
  if (xp >= 10000) {
    return `${(xp / 1000).toFixed(1)}K XP`;
  }
  return `${xp} XP`;
}

export function formatLevel(level: number): string {
  return `Level ${level}`;
}

export function xpForNextLevel(currentXp: number): number {
  const currentLevel = Math.floor(currentXp / 1000) + 1;
  return currentLevel * 1000 - currentXp;
}

export function xpProgress(currentXp: number): number {
  return (currentXp % 1000) / 1000;
}

export function formatHour(hour: number): string {
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${displayHour}:00 ${period}`;
}

export function formatInterval(hours: number): string {
  if (hours < 1) {
    return `${Math.round(hours * 60)} min`;
  }
  if (hours === 1) return "1 hour";
  return `${hours} hours`;
}

export function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
