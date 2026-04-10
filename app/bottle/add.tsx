import { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useMutation } from "convex/react";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown } from "react-native-reanimated";
import { api } from "../../convex/_generated/api";
import { useAuthStore } from "../../stores/authStore";
import { useBottleStore } from "../../stores/bottleStore";
import { bluetoothService, Device } from "../../services/bluetooth";
import { Feather } from "@expo/vector-icons";
import { BOTTLE_MODELS } from "../../constants/bottleModels";
import { BottleIcon } from "../../components/BottleIcons";
import { colors, spacing } from "../../constants/theme";

const BOTTLE_COLORS = [
  "#3B82F6", "#10B981", "#F59E0B", "#EF4444",
  "#8B5CF6", "#EC4899", "#06B6D4", "#64748B",
];

export default function AddBottle() {
  const { token } = useAuthStore();
  const createBottle = useMutation(api.bottles.create);
  const connectedDeviceId = useBottleStore((s) => s.connectedDeviceId);
  const isBleConnected = useBottleStore((s) => s.isConnected);

  const [name, setName] = useState("");
  const [color, setColor] = useState(BOTTLE_COLORS[0]);
  const [modelId, setModelId] = useState("water-bottle");
  const [isScanning, setIsScanning] = useState(false);
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [selectedDeviceName, setSelectedDeviceName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const selectedModel = BOTTLE_MODELS.find((m) => m.id === modelId) || BOTTLE_MODELS[0];

  const hasConnectedScale = isBleConnected && !!connectedDeviceId;

  const handleScan = async () => {
    setIsScanning(true);
    setDevices([]);
    try {
      await bluetoothService.scanForDevices((device) => {
        setDevices((prev) => {
          if (prev.find((d) => d.id === device.id)) return prev;
          return [...prev, device];
        });
      }, 10000);
    } catch (error: any) {
      Alert.alert("Sökfel", error.message);
    } finally {
      setIsScanning(false);
    }
  };

  const handleStopScan = () => {
    bluetoothService.stopScan();
    setIsScanning(false);
  };

  const handleCreate = async () => {
    if (!token || !name.trim()) {
      Alert.alert("Fel", "Ange ett namn för flaskan");
      return;
    }
    const deviceIdToSave = selectedDeviceId || connectedDeviceId || undefined;
    setIsLoading(true);
    try {
      const newBottleId = await createBottle({
        token,
        name: name.trim(),
        icon: selectedModel.iconName,
        color,
        capacityMl: 0,
        emptyWeightG: 0,
        fullWeightG: 0,
        bleDeviceId: deviceIdToSave,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace({
        pathname: "/bottle/calibrate",
        params: newBottleId ? { bottleId: String(newBottleId) } : {},
      });
    } catch (error: any) {
      Alert.alert("Fel", error.message || "Kunde inte skapa flaskan");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        
        <Animated.View entering={FadeInDown.duration(300).delay(50)} style={styles.card}>
          <Text style={styles.cardLabel}>NAMN</Text>
          <TextInput
            style={styles.nameInput}
            placeholder="T.ex. Jobbet, Gymmet, Hemma..."
            placeholderTextColor={colors.textMuted}
            value={name}
            onChangeText={setName}
            autoFocus
            returnKeyType="done"
          />
        </Animated.View>

        
        <Animated.View entering={FadeInDown.duration(300).delay(100)} style={styles.card}>
          <Text style={styles.cardLabel}>FLASKTYP</Text>
          <View style={styles.modelGrid}>
            {BOTTLE_MODELS.map((model) => {
              const sel = model.id === modelId;
              return (
                <TouchableOpacity
                  key={model.id}
                  style={[styles.modelCard, sel && styles.modelCardSel]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setModelId(model.id);
                  }}
                  activeOpacity={0.7}
                >
                  <BottleIcon modelKey={model.id} size={28} color={sel ? colors.accent : colors.textMuted} />
                  <Text style={[styles.modelName, sel && { color: colors.accent }]}>{model.name}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Animated.View>

        
        <Animated.View entering={FadeInDown.duration(300).delay(150)} style={styles.card}>
          <Text style={styles.cardLabel}>FÄRG</Text>
          <View style={styles.colorRow}>
            {BOTTLE_COLORS.map((c) => (
              <TouchableOpacity
                key={c}
                style={[styles.colorDot, { backgroundColor: c }, color === c && styles.colorDotSel]}
                onPress={() => {
                  Haptics.selectionAsync();
                  setColor(c);
                }}
              >
                {color === c && <Feather name="check" size={16} color="#FFF" />}
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        
        <Animated.View entering={FadeInDown.duration(300).delay(200)} style={styles.card}>
          <View style={styles.bleHeader}>
            <Text style={styles.cardLabel}>BLUETOOTH</Text>
            <TouchableOpacity
              style={styles.scanBtn}
              onPress={isScanning ? handleStopScan : handleScan}
              activeOpacity={0.7}
            >
              {isScanning ? (
                <ActivityIndicator size="small" color={colors.accent} />
              ) : (
                <Feather name="search" size={16} color={colors.accent} />
              )}
              <Text style={styles.scanBtnText}>{isScanning ? "Stoppa" : "Sök enheter"}</Text>
            </TouchableOpacity>
          </View>

          {selectedDeviceId ? (
            <TouchableOpacity
              style={styles.deviceSelected}
              onPress={() => {
                setSelectedDeviceId(null);
                setSelectedDeviceName(null);
              }}
              activeOpacity={0.7}
            >
              <View style={styles.deviceDot}>
                <Feather name="bluetooth" size={16} color={colors.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.deviceName}>{selectedDeviceName || "SmartBottle"}</Text>
                <Text style={styles.deviceMeta}>{selectedDeviceId.substring(0, 20)}...</Text>
              </View>
              <Feather name="check-circle" size={20} color={colors.success} />
            </TouchableOpacity>
          ) : (
            <>
              
              {hasConnectedScale && (
                <TouchableOpacity
                  style={styles.reuseCard}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedDeviceId(connectedDeviceId);
                    setSelectedDeviceName("SmartBottle (ansluten)");
                  }}
                  activeOpacity={0.8}
                >
                  <View style={styles.reuseIcon}>
                    <Feather name="bluetooth" size={18} color={colors.success} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.deviceName}>Använd ansluten våg</Text>
                    <Text style={styles.deviceMeta}>
                      Dela samma SmartBottle-våg mellan flaskor
                    </Text>
                  </View>
                  <Feather name="chevron-right" size={16} color={colors.textMuted} />
                </TouchableOpacity>
              )}

              {devices.length > 0 ? (
                <View style={styles.deviceList}>
                  {devices.map((device, i) => (
                    <TouchableOpacity
                      key={device.id}
                      style={[styles.deviceRow, i < devices.length - 1 && styles.deviceRowBorder]}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setSelectedDeviceId(device.id);
                        setSelectedDeviceName(device.name || "SmartBottle");
                      }}
                      activeOpacity={0.7}
                    >
                      <Feather name="bluetooth" size={16} color={colors.textMuted} />
                      <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text style={styles.deviceName}>{device.name || "SmartBottle"}</Text>
                        <Text style={styles.deviceMeta}>{device.rssi || "--"} dBm</Text>
                      </View>
                      <Feather name="chevron-right" size={16} color={colors.textMuted} />
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                !hasConnectedScale && (
                  <View style={styles.bleEmpty}>
                    <Feather name="bluetooth" size={24} color={colors.textMuted} />
                    <Text style={styles.bleEmptyText}>
                      Tryck "Sök enheter" för att hitta din SmartBottle
                    </Text>
                  </View>
                )
              )}
            </>
          )}
        </Animated.View>

        
        <Animated.View entering={FadeInDown.duration(300).delay(250)} style={styles.infoRow}>
          <Feather name="info" size={14} color={colors.textMuted} />
          <Text style={styles.infoText}>
            Kapaciteten beräknas automatiskt vid kalibrering
          </Text>
        </Animated.View>
      </ScrollView>

      
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.createBtn, (!name.trim() || isLoading) && { opacity: 0.4 }]}
          onPress={handleCreate}
          disabled={isLoading || !name.trim()}
          activeOpacity={0.85}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFF" size="small" />
          ) : (
            <>
              <Feather name="plus" size={20} color="#FFF" style={{ marginRight: 8 }} />
              <Text style={styles.createBtnText}>Skapa och kalibrera</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  scrollContent: { padding: spacing.page, paddingBottom: 20 },

  card: {
    backgroundColor: colors.surface,
    borderRadius: spacing.cardRadius,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 14,
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: 12,
  },

  nameInput: {
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 16,
    fontWeight: "500",
    color: colors.textPrimary,
  },

  modelGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  modelCard: {
    width: "30%",
    flexGrow: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: colors.background,
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  modelCardSel: {
    borderColor: colors.accent,
    backgroundColor: colors.primaryMuted,
  },
  modelName: {
    marginTop: 6,
    fontSize: 11,
    fontWeight: "600",
    color: colors.textSecondary,
    textAlign: "center",
  },

  colorRow: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
  },
  colorDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  colorDotSel: {
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.9)",
  },

  bleHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  scanBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: colors.primaryMuted,
  },
  scanBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.accent,
  },
  deviceSelected: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primaryMuted,
    borderWidth: 1,
    borderColor: colors.accent + "30",
    borderRadius: 12,
    padding: 12,
  },
  reuseCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(16, 185, 129, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.25)",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  reuseIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(16, 185, 129, 0.18)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  deviceDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.accent + "20",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  deviceName: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  deviceMeta: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 1,
  },
  deviceList: {
    borderRadius: 12,
    backgroundColor: colors.background,
    overflow: "hidden",
  },
  deviceRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
  },
  deviceRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  bleEmpty: {
    alignItems: "center",
    paddingVertical: 20,
  },
  bleEmptyText: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 18,
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 12,
    color: colors.textMuted,
  },

  footer: {
    paddingHorizontal: spacing.page,
    paddingBottom: 16,
  },
  createBtn: {
    flexDirection: "row",
    backgroundColor: colors.primary,
    borderRadius: 14,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
  },
  createBtnText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
