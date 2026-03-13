import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  TextInput,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuthStore } from "../../stores/authStore";
import { useSettingsStore } from "../../stores/settingsStore";
import { Ionicons } from "@expo/vector-icons";
import { formatHour, formatInterval, formatMl } from "../../utils/formatting";

export default function Settings() {
  const { token, clearToken } = useAuthStore();
  const {
    theme,
    notifications,
    minimalSocialMode,
    units,
    setTheme,
    setNotifications,
    setMinimalSocialMode,
    setUnits,
  } = useSettingsStore();

  const user = useQuery(api.auth.validateSession, token ? { token } : "skip");
  const updateProfile = useMutation(api.auth.updateProfile);

  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showIntervalModal, setShowIntervalModal] = useState(false);
  const [showQuietHoursModal, setShowQuietHoursModal] = useState(false);
  const [goalInput, setGoalInput] = useState("");
  const [selectedInterval, setSelectedInterval] = useState(notifications.reminderIntervalHours);
  const [quietStart, setQuietStart] = useState(notifications.quietHoursStart || "22:00");
  const [quietEnd, setQuietEnd] = useState(notifications.quietHoursEnd || "07:00");
  const [quietHoursEnabled, setQuietHoursEnabled] = useState(
    notifications.quietHoursStart !== null
  );

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await clearToken();
          router.replace("/(auth)/login");
        },
      },
    ]);
  };

  const handleSaveGoal = async () => {
    const goal = parseInt(goalInput);
    if (isNaN(goal) || goal < 500 || goal > 10000) {
      Alert.alert("Invalid", "Please enter a goal between 500ml and 10,000ml");
      return;
    }
    if (!token) return;

    try {
      await updateProfile({ token, dailyGoalMl: goal, customGoal: true });
      setShowGoalModal(false);
    } catch (error: any) {
      Alert.alert("Error", error.message);
    }
  };

  const handleSaveInterval = () => {
    setNotifications({ reminderIntervalHours: selectedInterval });
    setShowIntervalModal(false);
  };

  const handleSaveQuietHours = () => {
    if (quietHoursEnabled) {
      setNotifications({ quietHoursStart: quietStart, quietHoursEnd: quietEnd });
    } else {
      setNotifications({ quietHoursStart: null, quietHoursEnd: null });
    }
    setShowQuietHoursModal(false);
  };

  const SettingsRow = ({
    icon,
    iconColor = "#64748B",
    title,
    subtitle,
    onPress,
    rightElement,
  }: {
    icon: string;
    iconColor?: string;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    rightElement?: React.ReactNode;
  }) => (
    <TouchableOpacity
      className="flex-row items-center py-4 border-b border-gray-100 dark:border-gray-800"
      onPress={onPress}
      disabled={!onPress && !rightElement}
    >
      <View
        className="w-10 h-10 rounded-xl items-center justify-center mr-3"
        style={{ backgroundColor: iconColor + "20" }}
      >
        <Ionicons name={icon as any} size={20} color={iconColor} />
      </View>
      <View className="flex-1">
        <Text className="font-medium text-text-light-primary dark:text-text-dark-primary">
          {title}
        </Text>
        {subtitle && (
          <Text className="text-xs text-text-light-muted dark:text-text-dark-muted mt-0.5">
            {subtitle}
          </Text>
        )}
      </View>
      {rightElement || (
        <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
      )}
    </TouchableOpacity>
  );

  const INTERVAL_OPTIONS = [0.5, 1, 1.5, 2, 3, 4];
  const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => i);

  return (
    <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        
        <View className="px-6 pt-4 pb-2">
          <Text className="text-2xl font-bold text-text-light-primary dark:text-text-dark-primary">
            Settings
          </Text>
        </View>

        
        <View className="px-6 py-4">
          <TouchableOpacity
            className="flex-row items-center bg-surface-light dark:bg-surface-dark rounded-2xl p-4"
            onPress={() => router.push("/onboarding/profile")}
          >
            <View className="w-16 h-16 bg-primary-100 dark:bg-primary-900 rounded-full items-center justify-center">
              <Text className="text-2xl">{user?.avatar || "👤"}</Text>
            </View>
            <View className="flex-1 ml-4">
              <Text className="text-lg font-semibold text-text-light-primary dark:text-text-dark-primary">
                {user?.name || "User"}
              </Text>
              <Text className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
                {user?.email || ""}
              </Text>
              <View className="flex-row items-center mt-1">
                <Text className="text-xs text-primary-500 font-medium">
                  Level {user?.level || 1}
                </Text>
                <Text className="text-xs text-text-light-muted dark:text-text-dark-muted mx-2">
                  •
                </Text>
                <Text className="text-xs text-text-light-muted dark:text-text-dark-muted">
                  {user?.xp || 0} XP
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        
        <View className="px-6 py-2">
          <Text className="text-sm font-semibold text-text-light-muted dark:text-text-dark-muted uppercase mb-2">
            Hydration
          </Text>
          <View className="bg-surface-light dark:bg-surface-dark rounded-2xl px-4">
            <SettingsRow
              icon="water"
              iconColor="#0EA5E9"
              title="Daily Goal"
              subtitle={`${formatMl(user?.dailyGoalMl || 2000)} / day${user?.customGoal ? " (custom)" : ""}`}
              onPress={() => {
                setGoalInput(String(user?.dailyGoalMl || 2000));
                setShowGoalModal(true);
              }}
            />
            <SettingsRow
              icon="fitness"
              iconColor="#10B981"
              title="Health Profile"
              subtitle="Height, weight, activity, medical conditions"
              onPress={() => router.push("/onboarding/profile")}
            />
            <SettingsRow
              icon="wine"
              iconColor="#F59E0B"
              title="Beverages"
              subtitle="Manage drink types"
              onPress={() => router.push("/drink/log")}
            />
          </View>
        </View>

        
        <View className="px-6 py-2">
          <Text className="text-sm font-semibold text-text-light-muted dark:text-text-dark-muted uppercase mb-2">
            Notifications
          </Text>
          <View className="bg-surface-light dark:bg-surface-dark rounded-2xl px-4">
            <SettingsRow
              icon="notifications"
              iconColor="#8B5CF6"
              title="Reminders"
              subtitle={notifications.scheduledReminders ? "Enabled" : "Disabled"}
              rightElement={
                <Switch
                  value={notifications.scheduledReminders}
                  onValueChange={(value) =>
                    setNotifications({ scheduledReminders: value })
                  }
                  trackColor={{ false: "#E2E8F0", true: "#0EA5E9" }}
                />
              }
            />
            {notifications.scheduledReminders && (
              <SettingsRow
                icon="time"
                iconColor="#8B5CF6"
                title="Reminder Interval"
                subtitle={`Every ${formatInterval(notifications.reminderIntervalHours)}`}
                onPress={() => {
                  setSelectedInterval(notifications.reminderIntervalHours);
                  setShowIntervalModal(true);
                }}
              />
            )}
            <SettingsRow
              icon="bulb"
              iconColor="#F59E0B"
              title="Smart Reminders"
              subtitle="Remind when you haven't drunk in a while"
              rightElement={
                <Switch
                  value={notifications.smartReminders}
                  onValueChange={(value) =>
                    setNotifications({ smartReminders: value })
                  }
                  trackColor={{ false: "#E2E8F0", true: "#0EA5E9" }}
                />
              }
            />
            <SettingsRow
              icon="flag"
              iconColor="#EF4444"
              title="Goal Alerts"
              subtitle="Alert when behind pace"
              rightElement={
                <Switch
                  value={notifications.goalAlerts}
                  onValueChange={(value) =>
                    setNotifications({ goalAlerts: value })
                  }
                  trackColor={{ false: "#E2E8F0", true: "#0EA5E9" }}
                />
              }
            />
            <SettingsRow
              icon="happy"
              iconColor="#10B981"
              title="Motivational Messages"
              rightElement={
                <Switch
                  value={notifications.motivationalMessages}
                  onValueChange={(value) =>
                    setNotifications({ motivationalMessages: value })
                  }
                  trackColor={{ false: "#E2E8F0", true: "#0EA5E9" }}
                />
              }
            />
            <SettingsRow
              icon="moon"
              iconColor="#64748B"
              title="Quiet Hours"
              subtitle={
                notifications.quietHoursStart
                  ? `${notifications.quietHoursStart} - ${notifications.quietHoursEnd}`
                  : "Not set"
              }
              onPress={() => {
                setQuietHoursEnabled(notifications.quietHoursStart !== null);
                setShowQuietHoursModal(true);
              }}
            />
          </View>
        </View>

        
        <View className="px-6 py-2">
          <Text className="text-sm font-semibold text-text-light-muted dark:text-text-dark-muted uppercase mb-2">
            Social
          </Text>
          <View className="bg-surface-light dark:bg-surface-dark rounded-2xl px-4">
            <SettingsRow
              icon="eye-off"
              iconColor="#64748B"
              title="Minimal Mode"
              subtitle="Hide social features"
              rightElement={
                <Switch
                  value={minimalSocialMode}
                  onValueChange={setMinimalSocialMode}
                  trackColor={{ false: "#E2E8F0", true: "#0EA5E9" }}
                />
              }
            />
          </View>
        </View>

        
        <View className="px-6 py-2">
          <Text className="text-sm font-semibold text-text-light-muted dark:text-text-dark-muted uppercase mb-2">
            Device
          </Text>
          <View className="bg-surface-light dark:bg-surface-dark rounded-2xl px-4">
            <SettingsRow
              icon="bluetooth"
              iconColor="#0EA5E9"
              title="Bluetooth"
              subtitle="Manage connected bottles"
              onPress={() => router.push("/bottle/add")}
            />
            <SettingsRow
              icon="color-palette"
              iconColor="#8B5CF6"
              title="Appearance"
              subtitle={
                theme === "system"
                  ? "System"
                  : theme === "dark"
                    ? "Dark"
                    : "Light"
              }
              onPress={() => {
                const nextTheme =
                  theme === "system"
                    ? "light"
                    : theme === "light"
                      ? "dark"
                      : "system";
                setTheme(nextTheme);
              }}
            />
            <SettingsRow
              icon="swap-horizontal"
              iconColor="#319795"
              title="Units"
              subtitle={units === "metric" ? "Metric (ml, kg)" : "Imperial (oz, lbs)"}
              onPress={() => setUnits(units === "metric" ? "imperial" : "metric")}
            />
          </View>
        </View>

        
        <View className="px-6 py-2 pb-8">
          <Text className="text-sm font-semibold text-text-light-muted dark:text-text-dark-muted uppercase mb-2">
            Account
          </Text>
          <View className="bg-surface-light dark:bg-surface-dark rounded-2xl px-4">
            <SettingsRow
              icon="shield-checkmark"
              iconColor="#10B981"
              title="Privacy"
              onPress={() => {}}
            />
            <SettingsRow
              icon="help-circle"
              iconColor="#64748B"
              title="Help & Support"
              onPress={() => {}}
            />
            <SettingsRow
              icon="log-out"
              iconColor="#EF4444"
              title="Logout"
              onPress={handleLogout}
            />
          </View>
        </View>
      </ScrollView>

      
      <Modal visible={showGoalModal} transparent animationType="slide">
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-background-light dark:bg-background-dark rounded-t-3xl p-6">
            <View className="flex-row items-center justify-between mb-6">
              <Text className="text-xl font-bold text-text-light-primary dark:text-text-dark-primary">
                Daily Goal
              </Text>
              <TouchableOpacity onPress={() => setShowGoalModal(false)}>
                <Ionicons name="close" size={24} color="#94A3B8" />
              </TouchableOpacity>
            </View>
            <TextInput
              className="bg-surface-light dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-4 text-center text-3xl font-bold text-text-light-primary dark:text-text-dark-primary mb-2"
              value={goalInput}
              onChangeText={setGoalInput}
              keyboardType="number-pad"
              placeholder="2000"
              placeholderTextColor="#94A3B8"
            />
            <Text className="text-center text-text-light-muted dark:text-text-dark-muted mb-6">
              milliliters per day
            </Text>
            <TouchableOpacity
              className="bg-primary-500 rounded-xl py-4 items-center"
              onPress={handleSaveGoal}
            >
              <Text className="text-white font-semibold text-lg">Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      
      <Modal visible={showIntervalModal} transparent animationType="slide">
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-background-light dark:bg-background-dark rounded-t-3xl p-6">
            <View className="flex-row items-center justify-between mb-6">
              <Text className="text-xl font-bold text-text-light-primary dark:text-text-dark-primary">
                Reminder Interval
              </Text>
              <TouchableOpacity onPress={() => setShowIntervalModal(false)}>
                <Ionicons name="close" size={24} color="#94A3B8" />
              </TouchableOpacity>
            </View>
            <View className="flex-row flex-wrap -m-1 mb-6">
              {INTERVAL_OPTIONS.map((interval) => (
                <TouchableOpacity
                  key={interval}
                  className={`m-1 px-5 py-3 rounded-xl ${
                    selectedInterval === interval
                      ? "bg-primary-500"
                      : "bg-surface-light dark:bg-surface-dark border border-gray-200 dark:border-gray-700"
                  }`}
                  onPress={() => setSelectedInterval(interval)}
                >
                  <Text
                    className={`font-medium ${
                      selectedInterval === interval
                        ? "text-white"
                        : "text-text-light-primary dark:text-text-dark-primary"
                    }`}
                  >
                    {formatInterval(interval)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              className="bg-primary-500 rounded-xl py-4 items-center"
              onPress={handleSaveInterval}
            >
              <Text className="text-white font-semibold text-lg">Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      
      <Modal visible={showQuietHoursModal} transparent animationType="slide">
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-background-light dark:bg-background-dark rounded-t-3xl p-6">
            <View className="flex-row items-center justify-between mb-6">
              <Text className="text-xl font-bold text-text-light-primary dark:text-text-dark-primary">
                Quiet Hours
              </Text>
              <TouchableOpacity onPress={() => setShowQuietHoursModal(false)}>
                <Ionicons name="close" size={24} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <View className="flex-row items-center justify-between mb-6">
              <Text className="font-medium text-text-light-primary dark:text-text-dark-primary">
                Enable Quiet Hours
              </Text>
              <Switch
                value={quietHoursEnabled}
                onValueChange={setQuietHoursEnabled}
                trackColor={{ false: "#E2E8F0", true: "#0EA5E9" }}
              />
            </View>

            {quietHoursEnabled && (
              <View className="mb-6">
                <Text className="text-sm text-text-light-secondary dark:text-text-dark-secondary mb-3">
                  No notifications between:
                </Text>
                <View className="flex-row items-center justify-between">
                  <View className="flex-1 mr-3">
                    <Text className="text-xs text-text-light-muted dark:text-text-dark-muted mb-1">
                      From
                    </Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      <View className="flex-row">
                        {HOUR_OPTIONS.filter((h) => h >= 18 || h <= 2).map((hour) => (
                          <TouchableOpacity
                            key={`start-${hour}`}
                            className={`px-3 py-2 rounded-lg mr-1 ${
                              quietStart === `${String(hour).padStart(2, "0")}:00`
                                ? "bg-primary-500"
                                : "bg-surface-light dark:bg-surface-dark"
                            }`}
                            onPress={() => setQuietStart(`${String(hour).padStart(2, "0")}:00`)}
                          >
                            <Text
                              className={`text-xs ${
                                quietStart === `${String(hour).padStart(2, "0")}:00`
                                  ? "text-white font-medium"
                                  : "text-text-light-secondary dark:text-text-dark-secondary"
                              }`}
                            >
                              {formatHour(hour)}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </ScrollView>
                  </View>
                </View>
                <View className="mt-3">
                  <Text className="text-xs text-text-light-muted dark:text-text-dark-muted mb-1">
                    Until
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View className="flex-row">
                      {HOUR_OPTIONS.filter((h) => h >= 5 && h <= 11).map((hour) => (
                        <TouchableOpacity
                          key={`end-${hour}`}
                          className={`px-3 py-2 rounded-lg mr-1 ${
                            quietEnd === `${String(hour).padStart(2, "0")}:00`
                              ? "bg-primary-500"
                              : "bg-surface-light dark:bg-surface-dark"
                          }`}
                          onPress={() => setQuietEnd(`${String(hour).padStart(2, "0")}:00`)}
                        >
                          <Text
                            className={`text-xs ${
                              quietEnd === `${String(hour).padStart(2, "0")}:00`
                                ? "text-white font-medium"
                                : "text-text-light-secondary dark:text-text-dark-secondary"
                            }`}
                          >
                            {formatHour(hour)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
                </View>
              </View>
            )}

            <TouchableOpacity
              className="bg-primary-500 rounded-xl py-4 items-center"
              onPress={handleSaveQuietHours}
            >
              <Text className="text-white font-semibold text-lg">Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
