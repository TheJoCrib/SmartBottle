import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const MOTIVATIONAL_MESSAGES = [
  { title: "Stay Hydrated! 💧", body: "Time for a refreshing drink of water." },
  { title: "Water Break! 🌊", body: "Your body needs water to function at its best." },
  { title: "Hydration Reminder 💦", body: "A glass of water now keeps fatigue away!" },
  { title: "Drink Up! 🥤", body: "Staying hydrated improves focus and energy." },
  { title: "H2O Time! 💧", body: "Keep your hydration streak going!" },
  { title: "Water Check ✨", body: "Have you had water recently? Now's a good time!" },
  { title: "Stay Fresh! 🌿", body: "Water helps maintain healthy skin and organs." },
  { title: "Hydration Hero! 🦸", body: "Heroes drink water. Time for your next glass!" },
  { title: "Your Body Thanks You 🙏", body: "Every sip counts toward better health." },
  { title: "Don't Forget! 📢", body: "Dehydration sneaks up. Grab some water now!" },
];

class NotificationService {
  private scheduledNotifications: string[] = [];

  async requestPermissions(): Promise<boolean> {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();

    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      return false;
    }

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("reminders", {
        name: "Hydration Reminders",
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#0EA5E9",
      });
    }

    return true;
  }

  async scheduleReminders(
    intervalHours: number = 2,
    quietStart: string | null = null,
    quietEnd: string | null = null
  ): Promise<void> {
    await this.cancelAllReminders();

    const hasPermission = await this.requestPermissions();
    if (!hasPermission) return;

    const now = new Date();
    const quietStartHour = quietStart ? parseInt(quietStart.split(":")[0]) : null;
    const quietEndHour = quietEnd ? parseInt(quietEnd.split(":")[0]) : null;

    for (let day = 0; day < 7; day++) {
      for (let hour = 7; hour <= 22; hour += intervalHours) {
        if (quietStartHour !== null && quietEndHour !== null) {
          if (quietStartHour <= quietEndHour) {
            if (hour >= quietStartHour && hour < quietEndHour) continue;
          } else {
            if (hour >= quietStartHour || hour < quietEndHour) continue;
          }
        }

        const scheduledTime = new Date(now);
        scheduledTime.setDate(scheduledTime.getDate() + day);
        scheduledTime.setHours(hour, 0, 0, 0);

        if (scheduledTime <= now) continue;

        const message =
          MOTIVATIONAL_MESSAGES[
            Math.floor(Math.random() * MOTIVATIONAL_MESSAGES.length)
          ];

        try {
          const id = await Notifications.scheduleNotificationAsync({
            content: {
              title: message.title,
              body: message.body,
              sound: true,
              data: { type: "reminder" },
            },
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes.DATE,
              date: scheduledTime,
            },
          });
          this.scheduledNotifications.push(id);
        } catch (error) {
          console.error("Failed to schedule notification:", error);
        }
      }
    }
  }

  async cancelAllReminders(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
    this.scheduledNotifications = [];
  }

  async sendNotification(
    title: string,
    body: string,
    data?: Record<string, any>
  ): Promise<string> {
    const hasPermission = await this.requestPermissions();
    if (!hasPermission) return "";

    return await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
        data,
      },
      trigger: null,
    });
  }

  async sendGoalAlert(remainingMl: number, hoursLeft: number): Promise<void> {
    const liters = (remainingMl / 1000).toFixed(1);
    await this.sendNotification(
      "Behind on your goal 📊",
      `You still need ${liters}L with ${hoursLeft}h left. Pick up the pace!`,
      { type: "goal_alert" }
    );
  }

  async sendAchievementUnlocked(
    achievementName: string,
    achievementIcon: string
  ): Promise<void> {
    await this.sendNotification(
      `Achievement Unlocked! ${achievementIcon}`,
      `You earned "${achievementName}"! Keep up the great work!`,
      { type: "achievement" }
    );
  }

  async sendStreakNotification(streakDays: number): Promise<void> {
    await this.sendNotification(
      `${streakDays} Day Streak! 🔥`,
      `Amazing! You've met your hydration goal ${streakDays} days in a row!`,
      { type: "streak" }
    );
  }

  async sendMotivationalMessage(): Promise<void> {
    const message =
      MOTIVATIONAL_MESSAGES[
        Math.floor(Math.random() * MOTIVATIONAL_MESSAGES.length)
      ];
    await this.sendNotification(message.title, message.body, {
      type: "motivational",
    });
  }

  addNotificationResponseListener(
    callback: (response: Notifications.NotificationResponse) => void
  ): Notifications.EventSubscription {
    return Notifications.addNotificationResponseReceivedListener(callback);
  }

  addNotificationReceivedListener(
    callback: (notification: Notifications.Notification) => void
  ): Notifications.EventSubscription {
    return Notifications.addNotificationReceivedListener(callback);
  }
}

export const notificationService = new NotificationService();
