import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  Modal,
  StyleSheet,
  Platform,
  Pressable,
  KeyboardAvoidingView,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useQuery, useMutation } from "convex/react";
import Slider from "@react-native-community/slider";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "../../convex/_generated/api";
import { useHydrationStore } from "../../stores/hydrationStore";
import { useBottleStore } from "../../stores/bottleStore";
import { useAuthStore } from "../../stores/authStore";
import { useDemoStore } from "../../stores/demoStore";
import { notificationService } from "../../services/notifications";
import { bluetoothService } from "../../services/bluetooth";
import { BottleIcon } from "../../components/BottleIcons";
import { colors, spacing, typography } from "../../constants/theme";

function SettingsRow({
  icon,
  iconColor = colors.textMuted,
  iconBg = colors.surface,
  label,
  value,
  onPress,
  rightElement,
  destructive,
}: {
  icon: React.ReactNode;
  iconColor?: string;
  iconBg?: string;
  label: string;
  value?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  destructive?: boolean;
}) {
  const content = (
    <View style={styles.row}>
      <View style={[styles.rowIcon, { backgroundColor: iconBg }]}>{icon}</View>
      <Text style={[styles.rowLabel, destructive && { color: colors.error }]}>
        {label}
      </Text>
      <View style={styles.rowRight}>
        {rightElement}
        {value && <Text style={styles.rowValue}>{value}</Text>}
        {onPress && !rightElement && (
          <Feather name="chevron-right" size={18} color={colors.textMuted} />
        )}
      </View>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.6}>
        {content}
      </TouchableOpacity>
    );
  }
  return content;
}

function Separator() {
  return <View style={styles.separator} />;
}

function TestButton({
  icon,
  label,
  onPress,
}: {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.testBtn}
      onPress={onPress}
      activeOpacity={0.6}
    >
      {icon}
      <Text style={styles.testBtnLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function Settings() {
  const store = useHydrationStore();
  const bottleStore = useBottleStore();
  const authStore = useAuthStore();
  const demoStore = useDemoStore();
  const insets = useSafeAreaInsets();

  const user = useQuery(
    api.auth.validateSession,
    authStore.token ? { token: authStore.token } : "skip",
  );
  const bottles = useQuery(
    api.bottles.list,
    authStore.token ? { token: authStore.token } : "skip",
  );

  const deleteAccount = useMutation(api.auth.deleteAccount);
  const logoutMutation = useMutation(api.auth.logout);
  const removeBottle = useMutation(api.bottles.remove);

  const [showBottlesModal, setShowBottlesModal] = useState(false);
  const [demoCapacityInput, setDemoCapacityInput] = useState("1000");
  const [testPanelExpanded, setTestPanelExpanded] = useState(false);
  const [scheduledCount, setScheduledCount] = useState(0);

  const refreshScheduledCount = useCallback(async () => {
    try {
      const Notifications = await import("expo-notifications");
      const list = await Notifications.getAllScheduledNotificationsAsync();
      setScheduledCount(list.length);
    } catch {
      setScheduledCount(0);
    }
  }, []);

  useEffect(() => {
    if (testPanelExpanded) refreshScheduledCount();
  }, [testPanelExpanded, refreshScheduledCount]);

  const fireTestReminder = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await notificationService.sendMotivationalMessage();
  }, []);

  const fireTestGoalAlert = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await notificationService.sendGoalAlert(800, 3);
  }, []);

  const fireTestMilestone = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await notificationService.sendMilestoneUnlocked("Första litern");
  }, []);

  const fireTestStreak = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await notificationService.sendStreakNotification(3);
  }, []);

  const fireTestMotivational = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await notificationService.sendMotivationalMessage();
  }, []);

  const scheduleDelayedTest = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const Notifications = await import("expo-notifications");
      const granted = await notificationService.requestPermissions();
      if (!granted) {
        Alert.alert("Notiser blockerade", "Aktivera notiser för SmartBottle i systeminställningarna.");
        return;
      }
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Schemalagd testnotis",
          body: "Den här notisen schemalades för 10 sekunder sedan. Lås gärna telefonen för att testa låsskärmen.",
          sound: true,
          data: { type: "scheduled_test" },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: 10,
        },
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Schemalagd", "Notisen kommer om 10 sekunder. Lås telefonen för att testa.");
      refreshScheduledCount();
    } catch (e: any) {
      Alert.alert("Fel", e?.message || "Kunde inte schemalägga.");
    }
  }, [refreshScheduledCount]);

  const cancelAllScheduled = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await notificationService.cancelAllReminders();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    refreshScheduledCount();
  }, [refreshScheduledCount]);

  const [editingGoal, setEditingGoal] = useState<"daily" | "weekly" | "monthly" | null>(null);
  const [editValue, setEditValue] = useState("");

  const startEditGoal = useCallback((type: "daily" | "weekly" | "monthly") => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const values = { daily: store.dailyGoalMl, weekly: store.weeklyGoalMl, monthly: store.monthlyGoalMl };
    setEditValue(String(values[type]));
    setEditingGoal(type);
  }, [store]);

  const saveGoal = useCallback(async () => {
    if (!editingGoal) return;
    const val = parseInt(editValue, 10);
    if (isNaN(val) || val < 100) {
      setEditingGoal(null);
      return;
    }
    if (editingGoal === "daily") await store.setDailyGoal(val);
    else if (editingGoal === "weekly") await store.setWeeklyGoal(val);
    else await store.setMonthlyGoal(val);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setEditingGoal(null);
  }, [editingGoal, editValue, store]);

  const handleLogout = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert("Logga ut", "Är du säker?", [
      { text: "Avbryt", style: "cancel" },
      {
        text: "Logga ut",
        style: "destructive",
        onPress: async () => {
          try {
            if (authStore.token) {
              await logoutMutation({ token: authStore.token });
            }
          } catch (e) {
            console.warn("Backend logout failed:", e);
          }
          try {
            await notificationService.cancelAllReminders();
          } catch (e) {
            console.warn("Failed to cancel reminders on logout:", e);
          }
          await store.resetAll();
          demoStore.stopSimulation();
          try {
            await bluetoothService.disconnect();
          } catch (e) {
            console.warn("BLE disconnect on logout failed:", e);
          }
          await authStore.clearToken();
          router.replace("/(auth)/login");
        },
      },
    ]);
  }, [authStore, store, demoStore, logoutMutation]);

  const handleResetIntake = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert("Återställ dagsintag", "Nollställa dagens vätskeintag?", [
      { text: "Avbryt", style: "cancel" },
      {
        text: "Nollställ",
        style: "destructive",
        onPress: async () => {
          await store.resetDailyIntake();
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        },
      },
    ]);
  }, [store]);

  const handleDeleteAccount = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Alert.alert(
      "Radera konto",
      "Är du HELT säker? ALL din data raderas permanent. Detta kan inte ångras.",
      [
        { text: "Avbryt", style: "cancel" },
        {
          text: "Radera allt",
          style: "destructive",
          onPress: () => {
            Alert.alert(
              "Sista varningen",
              "Ditt konto, alla flaskor, all historik och all statistik kommer att raderas permanent.",
              [
                { text: "Avbryt", style: "cancel" },
                {
                  text: "Ja, radera mitt konto",
                  style: "destructive",
                  onPress: async () => {
                    try {
                      if (authStore.token) {
                        await deleteAccount({ token: authStore.token });
                      }
                      await store.resetAll();
                      demoStore.stopSimulation();
                      try {
                        await bluetoothService.disconnect();
                      } catch (e) {
                        console.warn("BLE disconnect on account delete failed:", e);
                      }
                      await AsyncStorage.removeItem("hasSeenIntro");
                      await authStore.clearToken();
                      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                      router.replace("/(auth)/login");
                    } catch (e: any) {
                      Alert.alert("Fel", e.message || "Kunde inte radera kontot");
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  }, [authStore, deleteAccount]);

  const formatMl = (ml: number) => {
    if (ml >= 10000) return `${(ml / 1000).toFixed(0)} L`;
    if (ml >= 1000) return `${(ml / 1000).toFixed(1)} L`;
    return `${ml} ml`;
  };

  const bottleCount = bottles?.length ?? 0;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar style="light" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
      >
        
        <Animated.View
          entering={FadeInDown.duration(300)}
          style={styles.titleSection}
        >
          <Text style={styles.pageTitle}>Inställningar</Text>
        </Animated.View>

        
        <Text style={styles.sectionHeader}>KONTO</Text>
        <Animated.View
          entering={FadeInDown.duration(300).delay(50)}
          style={styles.card}
        >
          <SettingsRow
            icon={<Feather name="user" size={18} color={colors.accent} />}
            iconBg={colors.primaryMuted}
            label="Profil"
            value={user?.name || ""}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push("/onboarding/profile");
            }}
          />
          <Separator />
          <SettingsRow
            icon={<Feather name="log-out" size={18} color={colors.error} />}
            iconBg={colors.errorMuted}
            label="Logga ut"
            destructive
            onPress={handleLogout}
          />
        </Animated.View>

        
        <Text style={styles.sectionHeader}>FLASKOR</Text>
        <Animated.View
          entering={FadeInDown.duration(300).delay(100)}
          style={styles.card}
        >
          <SettingsRow
            icon={<BottleIcon modelKey="water-bottle" size={18} color={colors.success} />}
            iconBg={colors.successMuted}
            label="Mina flaskor"
            value={`${bottleCount} st`}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowBottlesModal(true);
            }}
          />
          <Separator />
          <SettingsRow
            icon={<Feather name="plus-circle" size={18} color={colors.accent} />}
            iconBg={colors.primaryMuted}
            label="Lägg till ny flaska"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push("/bottle/add");
            }}
          />
        </Animated.View>

        
        <Text style={styles.sectionHeader}>MÅL</Text>
        <Animated.View
          entering={FadeInDown.duration(300).delay(150)}
          style={styles.card}
        >
          
          {editingGoal === "daily" ? (
            <View style={styles.goalEditRow}>
              <View style={[styles.rowIcon, { backgroundColor: colors.warningMuted }]}>
                <Feather name="target" size={18} color={colors.warning} />
              </View>
              <Text style={[styles.rowLabel, { flex: 0, marginRight: 8 }]}>Dagsmål</Text>
              <TextInput
                style={styles.goalInlineInput}
                value={editValue}
                onChangeText={setEditValue}
                keyboardType="number-pad"
                autoFocus
                selectTextOnFocus
                onBlur={saveGoal}
                onSubmitEditing={saveGoal}
                returnKeyType="done"
              />
              <Text style={styles.goalUnit}>ml</Text>
            </View>
          ) : (
            <SettingsRow
              icon={<Feather name="target" size={18} color={colors.warning} />}
              iconBg={colors.warningMuted}
              label="Dagsmål"
              value={formatMl(store.dailyGoalMl)}
              onPress={() => startEditGoal("daily")}
            />
          )}
          <Separator />
          
          {editingGoal === "weekly" ? (
            <View style={styles.goalEditRow}>
              <View style={[styles.rowIcon, { backgroundColor: colors.warningMuted }]}>
                <Feather name="target" size={18} color={colors.warning} />
              </View>
              <Text style={[styles.rowLabel, { flex: 0, marginRight: 8 }]}>Veckomål</Text>
              <TextInput
                style={styles.goalInlineInput}
                value={editValue}
                onChangeText={setEditValue}
                keyboardType="number-pad"
                autoFocus
                selectTextOnFocus
                onBlur={saveGoal}
                onSubmitEditing={saveGoal}
                returnKeyType="done"
              />
              <Text style={styles.goalUnit}>ml</Text>
            </View>
          ) : (
            <SettingsRow
              icon={<Feather name="target" size={18} color={colors.warning} />}
              iconBg={colors.warningMuted}
              label="Veckomål"
              value={formatMl(store.weeklyGoalMl)}
              onPress={() => startEditGoal("weekly")}
            />
          )}
          <Separator />
          
          {editingGoal === "monthly" ? (
            <View style={styles.goalEditRow}>
              <View style={[styles.rowIcon, { backgroundColor: colors.warningMuted }]}>
                <Feather name="target" size={18} color={colors.warning} />
              </View>
              <Text style={[styles.rowLabel, { flex: 0, marginRight: 8 }]}>Månadsmål</Text>
              <TextInput
                style={styles.goalInlineInput}
                value={editValue}
                onChangeText={setEditValue}
                keyboardType="number-pad"
                autoFocus
                selectTextOnFocus
                onBlur={saveGoal}
                onSubmitEditing={saveGoal}
                returnKeyType="done"
              />
              <Text style={styles.goalUnit}>ml</Text>
            </View>
          ) : (
            <SettingsRow
              icon={<Feather name="target" size={18} color={colors.warning} />}
              iconBg={colors.warningMuted}
              label="Månadsmål"
              value={formatMl(store.monthlyGoalMl)}
              onPress={() => startEditGoal("monthly")}
            />
          )}
        </Animated.View>

        
        <Text style={styles.sectionHeader}>INSTÄLLNINGAR</Text>
        <Animated.View
          entering={FadeInDown.duration(300).delay(200)}
          style={styles.card}
        >
          <SettingsRow
            icon={
              <Ionicons
                name="notifications-outline"
                size={18}
                color="#8B5CF6"
              />
            }
            iconBg="rgba(139,92,246,0.12)"
            label="Påminnelser"
            rightElement={
              <Switch
                value={store.remindersEnabled}
                onValueChange={async (v) => {
                  await store.setReminders(v);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                trackColor={{ false: colors.elevated, true: colors.primary }}
                thumbColor={Platform.OS === "android" ? "#FFF" : undefined}
                ios_backgroundColor={colors.elevated}
              />
            }
          />
          <Separator />
          <SettingsRow
            icon={
              <Feather
                name="bluetooth"
                size={18}
                color={
                  bottleStore.isConnected ? colors.success : colors.textMuted
                }
              />
            }
            iconBg={
              bottleStore.isConnected ? colors.successMuted : colors.surface
            }
            label="Bluetooth"
            value={bottleStore.isConnected ? "Ansluten" : "Ej ansluten"}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push("/bottle/add");
            }}
          />
          <Separator />
          <SettingsRow
            icon={
              <Feather name="play-circle" size={18} color={colors.accent} />
            }
            iconBg={colors.primaryMuted}
            label="Demoläge"
            rightElement={
              <Switch
                value={store.demoMode}
                onValueChange={async (v) => {
                  await store.setDemoMode(v);
                  if (v) {
                    const cap = parseInt(demoCapacityInput) || 1000;
                    const emptyW = 200;
                    const fullW = emptyW + cap;
                    demoStore.startSimulation(fullW, emptyW);
                  } else {
                    demoStore.stopSimulation();
                  }
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                trackColor={{ false: colors.elevated, true: colors.primary }}
                thumbColor={Platform.OS === "android" ? "#FFF" : undefined}
                ios_backgroundColor={colors.elevated}
              />
            }
          />
          {store.demoMode && (() => {
            const customCap = parseInt(demoCapacityInput) || 1000;
            const demoEmpty = 200;
            const demoFull = demoEmpty + customCap;
            const currentMl = Math.max(0, Math.round(demoStore.simulatedWeight - demoEmpty));
            const pct = customCap > 0 ? Math.round((currentMl / customCap) * 100) : 0;

            return (
              <View style={styles.demoSection}>
                
                <View style={styles.demoRow}>
                  <Text style={styles.demoLabel}>Flaskstorlek</Text>
                  <View style={styles.demoCapInput}>
                    <TextInput
                      style={styles.demoCapText}
                      value={demoCapacityInput}
                      onChangeText={(t) => {
                        setDemoCapacityInput(t);
                        const cap = parseInt(t) || 1000;
                        const full = demoEmpty + cap;
                        demoStore.startSimulation(full, demoEmpty);
                      }}
                      keyboardType="number-pad"
                      selectTextOnFocus
                      returnKeyType="done"
                    />
                    <Text style={styles.demoCapUnit}>ml</Text>
                  </View>
                </View>

                
                <View style={[styles.demoRow, { marginTop: 12 }]}>
                  <View>
                    <Text style={styles.demoLabel}>Vattennivå</Text>
                    <Text style={styles.demoValue}>{currentMl} ml ({pct}%)</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.refillBtn}
                    onPress={() => {
                      demoStore.refill(demoFull);
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    }}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="water-outline" size={14} color={colors.accent} />
                    <Text style={styles.refillText}>Fyll på</Text>
                  </TouchableOpacity>
                </View>

                
                <Slider
                  style={{ width: "100%", height: 40 }}
                  minimumValue={demoEmpty}
                  maximumValue={demoFull}
                  value={demoStore.simulatedWeight || demoFull}
                  onValueChange={(v) => {
                    demoStore.setWeight(Math.round(v));
                  }}
                  onSlidingComplete={(v) => {
                    demoStore.setWeight(Math.round(v));
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  minimumTrackTintColor={colors.accent}
                  maximumTrackTintColor={colors.elevated}
                  thumbTintColor={colors.accent}
                />
                <View style={styles.demoScale}>
                  <Text style={styles.demoScaleText}>Tom (0 ml)</Text>
                  <Text style={styles.demoScaleText}>Full ({customCap} ml)</Text>
                </View>
              </View>
            );
          })()}
        </Animated.View>

        
        <Text style={styles.sectionHeader}>TEST NOTISER</Text>
        <Animated.View
          entering={FadeInDown.duration(300).delay(225)}
          style={styles.card}
        >
          <SettingsRow
            icon={
              <Ionicons
                name="flask-outline"
                size={18}
                color="#8B5CF6"
              />
            }
            iconBg="rgba(139,92,246,0.12)"
            label="Testa notiser"
            value={testPanelExpanded ? "Dölj" : "Visa"}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setTestPanelExpanded((v) => !v);
            }}
          />
          {testPanelExpanded && (
            <View style={styles.testPanel}>
              <Text style={styles.testHelp}>
                Skicka riktiga notiser till din enhet för att se hur de ser ut.
              </Text>
              <View style={styles.testGrid}>
                <TestButton
                  icon={<Feather name="bell" size={16} color={colors.accent} />}
                  label="Påminnelse"
                  onPress={fireTestReminder}
                />
                <TestButton
                  icon={<Feather name="alert-triangle" size={16} color={colors.warning} />}
                  label="Mål-varning"
                  onPress={fireTestGoalAlert}
                />
                <TestButton
                  icon={<Feather name="award" size={16} color={colors.success} />}
                  label="Milstolpe"
                  onPress={fireTestMilestone}
                />
                <TestButton
                  icon={<Ionicons name="flame-outline" size={16} color={colors.error} />}
                  label="Streak"
                  onPress={fireTestStreak}
                />
                <TestButton
                  icon={<Feather name="zap" size={16} color="#8B5CF6" />}
                  label="Motiverande"
                  onPress={fireTestMotivational}
                />
                <TestButton
                  icon={<Feather name="clock" size={16} color={colors.textSecondary} />}
                  label="Om 10 sek"
                  onPress={scheduleDelayedTest}
                />
              </View>
              <View style={styles.testFooter}>
                <Text style={styles.testCountLabel}>
                  Schemalagda: <Text style={styles.testCountValue}>{scheduledCount} st</Text>
                </Text>
                <TouchableOpacity
                  style={styles.testCancelBtn}
                  onPress={cancelAllScheduled}
                  activeOpacity={0.7}
                >
                  <Feather name="x-circle" size={14} color={colors.error} />
                  <Text style={styles.testCancelText}>Avbryt alla</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </Animated.View>

        
        <Text style={styles.sectionHeader}>DATA</Text>
        <Animated.View
          entering={FadeInDown.duration(300).delay(250)}
          style={styles.card}
        >
          <SettingsRow
            icon={<Feather name="trash-2" size={18} color={colors.error} />}
            iconBg={colors.errorMuted}
            label="Återställ dagsintag"
            destructive
            onPress={handleResetIntake}
          />
          <Separator />
          <SettingsRow
            icon={<Feather name="alert-triangle" size={18} color={colors.error} />}
            iconBg={colors.errorMuted}
            label="Radera mitt konto"
            destructive
            onPress={handleDeleteAccount}
          />
        </Animated.View>

        
        <Animated.View
          entering={FadeInDown.duration(300).delay(300)}
          style={styles.card}
        >
          <SettingsRow
            icon={<Feather name="info" size={18} color={colors.textMuted} />}
            label="Om"
            value="SmartBottle v1.0.2"
          />
        </Animated.View>
      </ScrollView>

      
      <Modal visible={showBottlesModal} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setShowBottlesModal(false)}>
          <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(15, 23, 42, 0.85)" }]} />
          <Pressable
            style={[styles.bottlesSheet, { paddingBottom: Math.max(24, insets.bottom + 12) }]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHandle} />
            <View style={styles.bottlesHeader}>
              <Text style={styles.modalTitle}>Mina flaskor</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowBottlesModal(false);
                  router.push("/bottle/add");
                }}
                style={styles.addBottleBtn}
                activeOpacity={0.7}
              >
                <Feather name="plus" size={18} color={colors.accent} />
                <Text style={styles.addBottleBtnText}>Lägg till</Text>
              </TouchableOpacity>
            </View>

            {bottles && bottles.length > 0 ? (
              <ScrollView style={{ maxHeight: 400 }} showsVerticalScrollIndicator={false}>
                {bottles.map((bottle: any, idx: number) => {
                  const isActive = bottle._id === store.activeBottleId;
                  const isCalibrated = bottle.fullWeightG > 0;
                  const capacityMl = isCalibrated ? bottle.fullWeightG - bottle.emptyWeightG : 0;
                  const createdDate = bottle.createdAt
                    ? new Date(bottle.createdAt).toLocaleDateString("sv-SE")
                    : "";

                  return (
                    <View key={bottle._id}>
                      {idx > 0 && <View style={styles.bottleSep} />}
                      <TouchableOpacity
                        style={styles.bottleItem}
                        activeOpacity={0.6}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setShowBottlesModal(false);
                          router.push(`/bottle/${bottle._id}` as any);
                        }}
                      >
                        <View style={[styles.bottleIcon, { backgroundColor: (bottle.color || colors.accent) + "20" }]}>
                          <MaterialCommunityIcons
                            name="bottle-wine"
                            size={22}
                            color={bottle.color || colors.accent}
                          />
                        </View>
                        <View style={styles.bottleInfo}>
                          <View style={styles.bottleNameRow}>
                            <Text style={styles.bottleName}>{bottle.name}</Text>
                            {isActive && (
                              <View style={styles.activePill}>
                                <Text style={styles.activePillText}>Aktiv</Text>
                              </View>
                            )}
                          </View>
                          <Text style={styles.bottleMeta}>
                            {isCalibrated ? `${capacityMl} ml` : "Ej kalibrerad"}
                            {createdDate ? `  •  Skapad ${createdDate}` : ""}
                          </Text>
                        </View>
                        <View style={styles.bottleActions}>
                          <TouchableOpacity
                            hitSlop={12}
                            onPress={() => {
                              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                              Alert.alert(
                                "Ta bort flaska",
                                `Vill du ta bort "${bottle.name}"? All data för denna flaska raderas.`,
                                [
                                  { text: "Avbryt", style: "cancel" },
                                  {
                                    text: "Ta bort",
                                    style: "destructive",
                                    onPress: async () => {
                                      if (authStore.token) {
                                        try {
                                          await removeBottle({ token: authStore.token, bottleId: bottle._id });
                                          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                                        } catch {}
                                      }
                                    },
                                  },
                                ]
                              );
                            }}
                          >
                            <Feather name="trash-2" size={16} color={colors.error} />
                          </TouchableOpacity>
                          <Feather name="chevron-right" size={18} color={colors.textMuted} style={{ marginLeft: 12 }} />
                        </View>
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </ScrollView>
            ) : (
              <View style={styles.emptyBottles}>
                <MaterialCommunityIcons name="bottle-wine-outline" size={40} color={colors.textMuted} />
                <Text style={styles.emptyBottlesText}>Inga flaskor ännu</Text>
                <Text style={styles.emptyBottlesDesc}>Lägg till din första flaska för att börja spåra</Text>
              </View>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  titleSection: {
    paddingHorizontal: spacing.page,
    paddingTop: 8,
    paddingBottom: 16,
  },
  pageTitle: { ...typography.header },

  sectionHeader: {
    ...typography.sectionHeader,
    paddingHorizontal: spacing.page,
    marginTop: 8,
    marginBottom: 8,
  },

  card: {
    marginHorizontal: spacing.page,
    marginBottom: 16,
    backgroundColor: colors.surface,
    borderRadius: spacing.cardRadius,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    height: spacing.rowHeight,
    paddingHorizontal: spacing.cardPadding,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  rowLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
    color: colors.textPrimary,
  },
  rowRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  rowValue: {
    fontSize: 15,
    color: colors.textMuted,
  },

  separator: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: spacing.separatorInset,
  },

  demoSection: {
    paddingHorizontal: spacing.cardPadding,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: 4,
    paddingTop: 12,
  },
  demoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  demoLabel: { fontSize: 13, fontWeight: "600", color: colors.textSecondary },
  refillBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: colors.primaryMuted,
  },
  refillText: { fontSize: 12, fontWeight: "600", color: colors.accent },
  demoValue: { fontSize: 13, fontWeight: "500", color: colors.accent, marginTop: 2 },
  demoCapInput: { flexDirection: "row", alignItems: "center", backgroundColor: colors.inputBg, borderRadius: 10, paddingHorizontal: 10, height: 34 },
  demoCapText: { fontSize: 16, fontWeight: "700", color: colors.accent, minWidth: 50, textAlign: "right", padding: 0 },
  demoCapUnit: { fontSize: 13, color: colors.textMuted, marginLeft: 4 },
  demoScale: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 4 },
  demoScaleText: { fontSize: 11, color: colors.textMuted },

  testPanel: {
    paddingHorizontal: spacing.cardPadding,
    paddingBottom: 14,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
  },
  testHelp: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 12,
    lineHeight: 16,
  },
  testGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  testBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: colors.elevated,
    borderWidth: 1,
    borderColor: colors.border,
    minWidth: "31%",
  },
  testBtnLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textPrimary,
    flexShrink: 1,
  },
  testFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  testCountLabel: {
    fontSize: 12,
    color: colors.textMuted,
  },
  testCountValue: {
    fontWeight: "700",
    color: colors.textPrimary,
  },
  testCancelBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: colors.errorMuted,
  },
  testCancelText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.error,
  },

  goalEditRow: {
    flexDirection: "row",
    alignItems: "center",
    height: spacing.rowHeight,
    paddingHorizontal: spacing.cardPadding,
  },
  goalInlineInput: {
    flex: 1,
    backgroundColor: "transparent",
    borderWidth: 0,
    height: 38,
    paddingHorizontal: 4,
    fontSize: 17,
    fontWeight: "600",
    color: colors.accent,
    textAlign: "right",
  },
  goalUnit: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.textMuted,
    marginLeft: 4,
  },

  bottlesSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    borderWidth: 1,
    borderColor: colors.borderMedium,
    borderBottomWidth: 0,
    maxHeight: "80%",
  },
  bottlesHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  addBottleBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: colors.primaryMuted,
  },
  addBottleBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.accent,
  },
  bottleSep: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: 62,
  },
  bottleItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
  },
  bottleIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  bottleInfo: {
    flex: 1,
  },
  bottleNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  bottleName: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  activePill: {
    backgroundColor: colors.primaryMuted,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  activePillText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.accent,
  },
  bottleMeta: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  bottleActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  emptyBottles: {
    alignItems: "center",
    paddingVertical: 32,
  },
  emptyBottlesText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textSecondary,
    marginTop: 12,
  },
  emptyBottlesDesc: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 4,
    textAlign: "center",
  },

  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 12,
    borderWidth: 1,
    borderColor: colors.borderMedium,
    borderBottomWidth: 0,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.elevated,
    alignSelf: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 16,
  },
  modalInput: {
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 14,
    height: 52,
    paddingHorizontal: 16,
    fontSize: 20,
    fontWeight: "700",
    color: colors.textPrimary,
    textAlign: "center",
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
  },
  modalCancel: {
    flex: 1,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: colors.elevated,
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  modalSave: {
    flex: 1.3,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: colors.primary,
  },
  modalSaveText: { fontSize: 16, fontWeight: "700", color: "#FFFFFF" },
});
