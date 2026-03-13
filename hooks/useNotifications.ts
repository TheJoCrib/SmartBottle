import { useEffect, useCallback, useRef } from "react";
import { useSettingsStore } from "../stores/settingsStore";
import { notificationService } from "../services/notifications";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { useAuthStore } from "../stores/authStore";

export function useNotifications() {
  const { token } = useAuthStore();
  const { notifications } = useSettingsStore();
  const todayStats = useQuery(api.stats.getToday, token ? { token } : "skip");
  const user = useQuery(api.auth.validateSession, token ? { token } : "skip");
  const lastSmartReminderRef = useRef<number>(0);

  const scheduleReminders = useCallback(async () => {
    if (!notifications.scheduledReminders) {
      await notificationService.cancelAllReminders();
      return;
    }

    await notificationService.scheduleReminders(
      notifications.reminderIntervalHours,
      notifications.quietHoursStart,
      notifications.quietHoursEnd
    );
  }, [
    notifications.scheduledReminders,
    notifications.reminderIntervalHours,
    notifications.quietHoursStart,
    notifications.quietHoursEnd,
  ]);

  const checkSmartReminder = useCallback(async () => {
    if (!notifications.smartReminders || !todayStats || !user) return;

    const now = Date.now();
    if (now - lastSmartReminderRef.current < 60 * 60 * 1000) return;

    if (notifications.quietHoursStart && notifications.quietHoursEnd) {
      const currentHour = new Date().getHours();
      const startHour = parseInt(notifications.quietHoursStart.split(":")[0]);
      const endHour = parseInt(notifications.quietHoursEnd.split(":")[0]);

      if (startHour <= endHour) {
        if (currentHour >= startHour && currentHour < endHour) return;
      } else {
        if (currentHour >= startHour || currentHour < endHour) return;
      }
    }

    const percentage = todayStats.percentage || 0;
    const hoursLeft = (22 - new Date().getHours());

    if (notifications.goalAlerts && hoursLeft > 0) {
      const expectedPercentage = ((24 - hoursLeft) / 16) * 100;
      if (percentage < expectedPercentage - 15) {
        const remaining = (todayStats.goalMl || 2000) - (todayStats.totalMl || 0);
        await notificationService.sendGoalAlert(remaining, hoursLeft);
        lastSmartReminderRef.current = now;
      }
    }
  }, [notifications, todayStats, user]);

  useEffect(() => {
    scheduleReminders();
  }, [scheduleReminders]);

  useEffect(() => {
    if (!notifications.smartReminders) return;

    const interval = setInterval(checkSmartReminder, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, [checkSmartReminder, notifications.smartReminders]);

  return {
    scheduleReminders,
    checkSmartReminder,
  };
}
