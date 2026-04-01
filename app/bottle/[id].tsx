import {
  Alert,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  Text,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuthStore } from "../../stores/authStore";
import { useBottleStore } from "../../stores/bottleStore";
import { useHydrationStore } from "../../stores/hydrationStore";
import { bluetoothService } from "../../services/bluetooth";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";
import { colors, spacing, typography } from "../../constants/theme";

export default function BottleDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuthStore();
  const { currentWeight, isConnected, connectedDeviceId } = useBottleStore();
  const hydrationStore = useHydrationStore();

  const bottle = useQuery(
    api.bottles.get,
    token && id ? { token, bottleId: id as any } : "skip",
  );
  const removeBottle = useMutation(api.bottles.remove);

  const isThisBottleConnected =
    bottle && isConnected && connectedDeviceId === bottle.bleDeviceId;

  const isActiveBottle = hydrationStore.activeBottleId === id;

  const handleConnect = async () => {
    if (!bottle?.bleDeviceId) {
      Alert.alert("Fel", "Ingen Bluetooth-enhet kopplad till denna flaska");
      return;
    }
    try {
      await bluetoothService.connect(bottle.bleDeviceId);
      await bluetoothService.subscribeToWeight(() => {});
    } catch (error: any) {
      Alert.alert("Anslutningsfel", error.message);
    }
  };

  const handleDisconnect = async () => {
    try {
      await bluetoothService.disconnect();
    } catch (error: any) {
      console.error("Disconnect error:", error);
    }
  };

  const handleSetActive = async () => {
    if (!bottle || !id) return;
    try {
      await hydrationStore.setActiveBottle({
        id,
        fullWeightG: bottle.fullWeightG,
        emptyWeightG: bottle.emptyWeightG,
        capacityMl: bottle.capacityMl,
      });
      Alert.alert("Klar", "Flaskan har satts som aktiv");
    } catch (error: any) {
      Alert.alert("Fel", error.message);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      "Ta bort flaska",
      "Ar du saker pa att du vill ta bort denna flaska?",
      [
        { text: "Avbryt", style: "cancel" },
        {
          text: "Ta bort",
          style: "destructive",
          onPress: async () => {
            if (!token || !id) return;
            try {
              await removeBottle({ token, bottleId: id as any });
              router.back();
            } catch (error: any) {
              Alert.alert("Fel", error.message);
            }
          },
        },
      ],
    );
  };

  if (!bottle) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Laddar...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        
        <Animated.View
          entering={FadeInDown.delay(50).duration(400)}
          style={styles.headerSection}
        >
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: (bottle.color || colors.primary) + "20" },
            ]}
          >
            <Ionicons
              name="water"
              size={40}
              color={bottle.color || colors.primary}
            />
          </View>
          <Text style={styles.bottleName}>{bottle.name}</Text>
          <Text style={styles.bottleCapacity}>{bottle.capacityMl} ml</Text>
        </Animated.View>

        
        <Animated.View
          entering={FadeInDown.delay(150).duration(400)}
          style={styles.card}
        >
          <Text style={styles.sectionHeader}>KALIBRERINGSDATA</Text>
          <View style={styles.calibrationRow}>
            <Text style={styles.calibrationLabel}>Tom vikt</Text>
            <Text style={styles.calibrationValue}>{bottle.emptyWeightG} g</Text>
          </View>
          <View style={styles.separator} />
          <View style={styles.calibrationRow}>
            <Text style={styles.calibrationLabel}>Full vikt</Text>
            <Text style={styles.calibrationValue}>{bottle.fullWeightG} g</Text>
          </View>
          <View style={styles.separator} />
          <View style={styles.calibrationRow}>
            <Text style={styles.calibrationLabel}>Kapacitet</Text>
            <Text style={[styles.calibrationValue, { color: colors.primary }]}>
              {bottle.capacityMl} ml
            </Text>
          </View>
        </Animated.View>

        
        <Animated.View
          entering={FadeInDown.delay(250).duration(400)}
          style={styles.card}
        >
          <Text style={styles.sectionHeader}>ANSLUTNING</Text>
          <View style={styles.connectionRow}>
            <View style={styles.connectionInfo}>
              <View
                style={[
                  styles.statusDot,
                  {
                    backgroundColor: isThisBottleConnected
                      ? colors.success
                      : colors.textMuted,
                  },
                ]}
              />
              <View>
                <Text style={styles.connectionStatus}>
                  {isThisBottleConnected ? "Ansluten" : "Ej ansluten"}
                </Text>
                {bottle.bleDeviceId && (
                  <Text style={styles.deviceId}>
                    {bottle.bleDeviceId.substring(0, 17)}...
                  </Text>
                )}
              </View>
            </View>
            {bottle.bleDeviceId && (
              <TouchableOpacity
                style={[
                  styles.connectButton,
                  {
                    backgroundColor: isThisBottleConnected
                      ? colors.elevated
                      : colors.primary,
                  },
                ]}
                onPress={
                  isThisBottleConnected ? handleDisconnect : handleConnect
                }
              >
                <Text
                  style={[
                    styles.connectButtonText,
                    {
                      color: isThisBottleConnected
                        ? colors.textSecondary
                        : "#FFFFFF",
                    },
                  ]}
                >
                  {isThisBottleConnected ? "Koppla fran" : "Anslut"}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>

        
        <Animated.View
          entering={FadeInDown.delay(350).duration(400)}
          style={styles.actionsSection}
        >
          {!isActiveBottle && (
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleSetActive}
            >
              <Ionicons
                name="checkmark-circle-outline"
                size={20}
                color="#FFFFFF"
              />
              <Text style={styles.primaryButtonText}>Sätt som aktiv</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.outlinedButton}
            onPress={() => router.push("/bottle/calibrate")}
          >
            <Ionicons name="options-outline" size={20} color={colors.primary} />
            <Text style={styles.outlinedButtonText}>Kalibrera om</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.textButton} onPress={handleDelete}>
            <Text style={styles.textButtonText}>Ta bort flaska</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    ...typography.body,
    color: colors.textMuted,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },

  headerSection: {
    alignItems: "center",
    paddingHorizontal: spacing.page,
    paddingTop: spacing.sectionGap,
    paddingBottom: spacing.sectionGap,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: spacing.cardRadius,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.itemGap,
  },
  bottleName: {
    ...typography.title,
    marginBottom: 4,
  },
  bottleCapacity: {
    ...typography.body,
    color: colors.textSecondary,
  },

  card: {
    backgroundColor: colors.surface,
    borderRadius: spacing.cardRadius,
    borderWidth: 1,
    borderColor: colors.border,
    marginHorizontal: spacing.page,
    marginBottom: spacing.itemGap,
    padding: spacing.cardPadding,
  },
  sectionHeader: {
    ...typography.sectionHeader,
    marginBottom: spacing.itemGap,
  },

  calibrationRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
  },
  calibrationLabel: {
    ...typography.body,
    color: colors.textSecondary,
  },
  calibrationValue: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
  },

  connectionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  connectionInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 12,
  },
  connectionStatus: {
    ...typography.body,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  deviceId: {
    ...typography.caption,
    marginTop: 2,
  },
  connectButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  connectButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },

  actionsSection: {
    paddingHorizontal: spacing.page,
    paddingTop: spacing.itemGap,
    gap: spacing.itemGap,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  outlinedButton: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  outlinedButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: "600",
  },
  textButton: {
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  textButtonText: {
    color: colors.error,
    fontSize: 16,
    fontWeight: "600",
  },
});
