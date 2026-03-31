import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  StyleSheet,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as Haptics from "expo-haptics";
import * as Notifications from "expo-notifications";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Feather, Ionicons } from "@expo/vector-icons";

import { useHydrationStore } from "../../stores/hydrationStore";

export default function Settings() {
  const store = useHydrationStore();
  const [goalInput, setGoalInput] = useState(store.dailyGoalMl.toString());

  const handleSaveGoal = useCallback(async () => {
    const goal = parseInt(goalInput, 10);
    if (isNaN(goal) || goal < 100 || goal > 10000) {
      Alert.alert(
        "Ogiltigt v\u00e4rde",
        "Ange ett m\u00e5l mellan 100 och 10 000 ml."
      );
      return;
    }
    await store.setDailyGoal(goal);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [goalInput, store]);

  const handleTestNotification = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== "granted") {
      const { status: newStatus } =
        await Notifications.requestPermissionsAsync();
      if (newStatus !== "granted") {
        Alert.alert(
          "Beh\u00f6righet kr\u00e4vs",
          "Aktivera notiser i inst\u00e4llningarna f\u00f6r att f\u00e5 p\u00e5minnelser."
        );
        return;
      }
    }
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "V\u00e4tskebalans",
        body: "Dags att dricka vatten! Gl\u00f6m inte att h\u00e5lla dig hydrerad.",
        sound: true,
      },
      trigger: null,
    });
  }, []);

  const handleResetIntake = useCallback(() => {
    Alert.alert(
      "\u00c5terst\u00e4ll dagsintag",
      "\u00c4r du s\u00e4ker p\u00e5 att du vill nollst\u00e4lla dagens v\u00e4tskeintag?",
      [
        { text: "Avbryt", style: "cancel" },
        {
          text: "Nollst\u00e4ll",
          style: "destructive",
          onPress: async () => {
            await store.resetDailyIntake();
            Haptics.notificationAsync(
              Haptics.NotificationFeedbackType.Warning
            );
          },
        },
      ]
    );
  }, [store]);

  const handleToggleReminders = useCallback(
    async (value: boolean) => {
      await store.setReminders(value);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    },
    [store]
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar style="light" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        
        <Animated.View
          entering={FadeInDown.duration(400).delay(50)}
          style={styles.header}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            hitSlop={12}
          >
            <Feather name="arrow-left" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Inst\u00e4llningar</Text>
        </Animated.View>

        
        <Animated.View
          entering={FadeInDown.duration(400).delay(100)}
          style={styles.card}
        >
          <View style={styles.cardHeader}>
            <Feather
              name="sliders"
              size={20}
              color="#3B82F6"
              style={styles.cardIcon}
            />
            <Text style={styles.cardTitle}>Dagsm\u00e5l (ml)</Text>
          </View>
          <View style={styles.goalInputRow}>
            <View style={styles.goalInputContainer}>
              <TextInput
                style={styles.goalInput}
                value={goalInput}
                onChangeText={setGoalInput}
                keyboardType="number-pad"
                placeholder="2500"
                placeholderTextColor="#94A3B8"
                selectTextOnFocus
              />
              {goalInput.length > 0 && (
                <TouchableOpacity
                  style={styles.clearInputButton}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setGoalInput("");
                  }}
                  hitSlop={8}
                >
                  <Feather name="x-circle" size={16} color="#94A3B8" />
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity
              style={styles.saveGoalButton}
              onPress={handleSaveGoal}
              activeOpacity={0.85}
            >
              <Feather name="check" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </Animated.View>

        
        <Animated.View
          entering={FadeInDown.duration(400).delay(200)}
          style={styles.card}
        >
          <View style={styles.cardHeader}>
            <Ionicons
              name="notifications-outline"
              size={20}
              color="#8B5CF6"
              style={styles.cardIcon}
            />
            <View style={styles.cardTitleGroup}>
              <Text style={styles.cardTitle}>P\u00e5minnelser</Text>
              <Text style={styles.cardSubtitle}>
                Aktivt varannan timme
              </Text>
            </View>
            <Switch
              value={store.remindersEnabled}
              onValueChange={handleToggleReminders}
              trackColor={{ false: "#334155", true: "#3B82F6" }}
              thumbColor={
                Platform.OS === "android"
                  ? store.remindersEnabled
                    ? "#FFFFFF"
                    : "#94A3B8"
                  : undefined
              }
              ios_backgroundColor="#334155"
            />
          </View>

          <TouchableOpacity
            style={styles.testNotifButton}
            onPress={handleTestNotification}
            activeOpacity={0.8}
          >
            <Ionicons
              name="notifications-outline"
              size={16}
              color="#64748B"
              style={{ marginRight: 8 }}
            />
            <Text style={styles.testNotifText}>Testa Notis</Text>
          </TouchableOpacity>
        </Animated.View>

        
        <Animated.View
          entering={FadeInDown.duration(400).delay(300)}
          style={styles.card}
        >
          <View style={styles.cardHeader}>
            <Feather
              name="trash-2"
              size={20}
              color="#EF4444"
              style={styles.cardIcon}
            />
            <View style={styles.cardTitleGroup}>
              <Text style={styles.cardTitle}>\u00c5terst\u00e4ll</Text>
              <Text style={styles.cardSubtitle}>
                \u00c5terst\u00e4ll dagens v\u00e4tskeintag till 0 ml.
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.resetButton}
            onPress={handleResetIntake}
            activeOpacity={0.8}
          >
            <Ionicons
              name="refresh-outline"
              size={16}
              color="#EF4444"
              style={{ marginRight: 8 }}
            />
            <Text style={styles.resetButtonText}>Nollst\u00e4ll Dagsintag</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0C1425",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.5,
  },

  card: {
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  cardIcon: {
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#0F172A",
    flex: 1,
  },
  cardTitleGroup: {
    flex: 1,
  },
  cardSubtitle: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 2,
  },

  goalInputRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    gap: 10,
  },
  goalInputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 50,
  },
  goalInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: "600",
    color: "#0F172A",
    padding: 0,
  },
  clearInputButton: {
    padding: 4,
  },
  saveGoalButton: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: "#3B82F6",
    alignItems: "center",
    justifyContent: "center",
  },

  testNotifButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#F1F5F9",
  },
  testNotifText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748B",
  },

  resetButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#FEF2F2",
  },
  resetButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#EF4444",
  },
});
