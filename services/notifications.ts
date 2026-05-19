import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const MOTIVATIONAL_MESSAGES = [
  { title: "Dags att dricka", body: "Ta en klunk vatten — kroppen tackar dig." },
  { title: "Vattenpaus", body: "En liten paus för en stor effekt. Drick lite vatten." },
  { title: "Påminnelse om vätska", body: "Ett glas vatten nu håller tröttheten borta." },
  { title: "Drick upp", body: "Att hålla sig hydrerad ger bättre fokus och energi." },
  { title: "Vattendags", body: "Håll igång din vätskestreak — ta ett glas nu." },
  { title: "Vattenkoll", body: "När drack du senast? Nu är ett bra tillfälle." },
  { title: "Håll dig fräsch", body: "Vatten håller hud och organ i gott skick." },
  { title: "Dags för en klunk", body: "Små klunkar ofta är bättre än stora sällan." },
  { title: "Din kropp tackar dig", body: "Varje klunk räknas mot bättre hälsa." },
  { title: "Glöm inte", body: "Uttorkning smyger sig på — ta lite vatten nu." },
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
      "Du ligger efter ditt mål",
      `Du behöver fortfarande ${liters} L med ${hoursLeft} h kvar. Öka takten!`,
      { type: "goal_alert" }
    );
  }

  async sendMilestoneUnlocked(milestoneName: string): Promise<void> {
    await this.sendNotification(
      "Milstolpe nådd",
      `Du har nått "${milestoneName}". Bra jobbat — fortsätt så!`,
      { type: "milestone" }
    );
  }

  async sendStreakNotification(streakDays: number): Promise<void> {
    await this.sendNotification(
      `${streakDays} dagars streak`,
      `Snyggt! Du har nått ditt vätskemål ${streakDays} dagar i rad.`,
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
