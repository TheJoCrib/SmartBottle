
type ActivityLevel =
  | "sedentary"
  | "light"
  | "moderate"
  | "active"
  | "very_active";

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.0,
  light: 1.1,
  moderate: 1.2,
  active: 1.3,
  very_active: 1.5,
};

export function calculateRecommendedIntake(
  weightKg: number,
  activityLevel: ActivityLevel = "moderate"
): number {
  const baseIntake = weightKg * 33;

  const multiplier = ACTIVITY_MULTIPLIERS[activityLevel] || 1.0;
  const recommended = baseIntake * multiplier;

  return Math.round(recommended / 50) * 50;
}

export function calculateHourlyRate(
  currentMl: number,
  goalMl: number,
  hoursRemaining: number
): number {
  const remaining = goalMl - currentMl;
  if (remaining <= 0 || hoursRemaining <= 0) return 0;

  return Math.round(remaining / hoursRemaining);
}

export function getHoursRemaining(): number {
  const now = new Date();
  const endOfDay = new Date(now);
  endOfDay.setHours(22, 0, 0, 0);

  const diff = endOfDay.getTime() - now.getTime();
  return Math.max(0, diff / (1000 * 60 * 60));
}

export function calculateWaterLevel(
  currentWeightG: number,
  emptyWeightG: number,
  fullWeightG: number
): { percentage: number; currentMl: number; capacityMl: number } {
  const waterWeightG = currentWeightG - emptyWeightG;
  const maxWaterWeightG = fullWeightG - emptyWeightG;

  const currentMl = Math.max(0, Math.round(waterWeightG));
  const capacityMl = Math.max(0, Math.round(maxWaterWeightG));

  const percentage = maxWaterWeightG > 0
    ? Math.min(100, Math.max(0, (waterWeightG / maxWaterWeightG) * 100))
    : 0;

  return {
    percentage: Math.round(percentage),
    currentMl,
    capacityMl,
  };
}

export function detectRefill(
  previousWeightG: number,
  currentWeightG: number,
  threshold: number = 50
): boolean {
  return currentWeightG - previousWeightG >= threshold;
}

export function detectConsumption(
  previousWeightG: number,
  currentWeightG: number,
  threshold: number = 10
): number {
  const decrease = previousWeightG - currentWeightG;
  return decrease >= threshold ? Math.round(decrease) : 0;
}

export function formatMl(ml: number): string {
  if (ml >= 1000) {
    return `${(ml / 1000).toFixed(1)}L`;
  }
  return `${ml}ml`;
}

export function getProgressColor(percentage: number): string {
  if (percentage >= 100) return "#10B981";
  if (percentage >= 75) return "#0EA5E9";
  if (percentage >= 50) return "#F59E0B";
  if (percentage >= 25) return "#F97316";
  return "#EF4444";
}

export function getMotivationalMessage(percentage: number): string {
  if (percentage >= 100) return "Goal achieved! Excellent work! 🎉";
  if (percentage >= 90) return "Almost there! Just a bit more! 💪";
  if (percentage >= 75) return "Great progress! Keep it up! 🌟";
  if (percentage >= 50) return "Halfway there! You got this! 💧";
  if (percentage >= 25) return "Good start! Keep drinking! 🚰";
  return "Time to hydrate! 💦";
}
