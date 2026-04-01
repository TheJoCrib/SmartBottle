import { useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Platform,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Notifications from "expo-notifications";
import { BleManager, Device } from "react-native-ble-plx";
import { bluetoothService } from "../services/bluetooth";
import { notificationService } from "../services/notifications";
import { useBottleStore } from "../stores/bottleStore";
import NetInfo from "@react-native-community/netinfo";

const DEV_CODE = "123";

let rawBleManager: BleManager | null = null;
function getRawBleManager() {
  if (!rawBleManager) rawBleManager = new BleManager();
  return rawBleManager;
}

export default function DevTools() {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [codeInput, setCodeInput] = useState("");
  const [codeError, setCodeError] = useState(false);

  const [bleState, setBleState] = useState<string>("Unknown");
  const [isScanning, setIsScanning] = useState(false);
  const [allDevices, setAllDevices] = useState<Device[]>([]);
  const [blePermissions, setBlePermissions] = useState<string>("Unknown");
  const { isConnected, connectedDeviceId, currentWeight, batteryLevel } = useBottleStore();

  const [notifPermission, setNotifPermission] = useState<string>("Unknown");

  const [networkInfo, setNetworkInfo] = useState<string>("Tap to check");

  const [logs, setLogs] = useState<string[]>([]);
  const scrollRef = useRef<ScrollView>(null);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev, `[${timestamp}] ${message}`]);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const handleCodeSubmit = () => {
    if (codeInput === DEV_CODE) {
      setIsUnlocked(true);
      setCodeError(false);
    } else {
      setCodeError(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  if (!isUnlocked) {
    return (
      <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark">
        <View className="px-6 pt-4">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#94A3B8" />
          </TouchableOpacity>
        </View>
        <View className="flex-1 items-center justify-center px-6">
          <View className="w-20 h-20 bg-gray-800 dark:bg-gray-700 rounded-2xl items-center justify-center mb-6">
            <Ionicons name="lock-closed" size={40} color="#EF4444" />
          </View>
          <Text className="text-xl font-bold text-text-light-primary dark:text-text-dark-primary mb-2">
            Developer Access
          </Text>
          <Text className="text-text-light-muted dark:text-text-dark-muted text-center mb-8">
            Enter the access code to continue
          </Text>
          <TextInput
            className={`w-48 bg-surface-light dark:bg-surface-dark border-2 ${
              codeError ? "border-error-500" : "border-gray-200 dark:border-gray-700"
            } rounded-xl px-4 py-4 text-center text-3xl font-bold text-text-light-primary dark:text-text-dark-primary tracking-[12px]`}
            value={codeInput}
            onChangeText={(t) => {
              setCodeInput(t);
              setCodeError(false);
            }}
            keyboardType="number-pad"
            maxLength={6}
            placeholder="---"
            placeholderTextColor="#64748B"
            secureTextEntry
            autoFocus
            onSubmitEditing={handleCodeSubmit}
          />
          {codeError && (
            <Text className="text-error-500 text-sm mt-2">Wrong code</Text>
          )}
          <TouchableOpacity
            className="bg-error-500 rounded-xl py-3 px-8 mt-6"
            onPress={handleCodeSubmit}
          >
            <Text className="text-white font-semibold text-lg">Unlock</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const checkBleState = async () => {
    try {
      const manager = getRawBleManager();
      const state = await manager.state();
      setBleState(state);
      addLog(`BLE State: ${state}`);
    } catch (e: any) {
      addLog(`BLE State Error: ${e.message}`);
    }
  };

  const checkBlePermissions = async () => {
    try {
      const granted = await bluetoothService.requestPermissions();
      setBlePermissions(granted ? "Granted" : "Denied");
      addLog(`BLE Permissions: ${granted ? "Granted" : "Denied"}`);
    } catch (e: any) {
      setBlePermissions("Error");
      addLog(`BLE Permission Error: ${e.message}`);
    }
  };

  const scanAllDevices = async () => {
    setAllDevices([]);
    setIsScanning(true);
    addLog("Starting BLE scan (all devices, 15s)...");

    try {
      const manager = getRawBleManager();
      const state = await manager.state();
      if (state !== "PoweredOn") {
        addLog(`BLE not powered on (state: ${state}). Cannot scan.`);
        setIsScanning(false);
        return;
      }

      const found = new Set<string>();

      manager.startDeviceScan(null, { allowDuplicates: false }, (error, device) => {
        if (error) {
          addLog(`Scan error: ${error.message}`);
          return;
        }
        if (device && !found.has(device.id)) {
          found.add(device.id);
          setAllDevices((prev) => [...prev, device]);
          addLog(`Found: ${device.name || "Unknown"} (${device.id}) RSSI: ${device.rssi}`);
        }
      });

      setTimeout(() => {
        manager.stopDeviceScan();
        setIsScanning(false);
        addLog(`Scan complete. Found ${found.size} device(s).`);
      }, 15000);
    } catch (e: any) {
      setIsScanning(false);
      addLog(`Scan failed: ${e.message}`);
    }
  };

  const stopBleScan = () => {
    getRawBleManager().stopDeviceScan();
    setIsScanning(false);
    addLog("Scan stopped manually.");
  };

  const checkNotifPermissions = async () => {
    const { status } = await Notifications.getPermissionsAsync();
    setNotifPermission(status);
    addLog(`Notification permission: ${status}`);
  };

  const requestNotifPermissions = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    setNotifPermission(status);
    addLog(`Notification permission after request: ${status}`);
  };

  const sendTestNotification = async () => {
    try {
      await notificationService.sendNotification(
        "Dev Test",
        "This is a test notification from Dev Tools.",
        { type: "dev_test" }
      );
      addLog("Sent: basic test notification");
    } catch (e: any) {
      addLog(`Notification error: ${e.message}`);
    }
  };

  const sendAchievementNotif = async () => {
    try {
      await notificationService.sendAchievementUnlocked("First Sip", "trophy");
      addLog("Sent: achievement notification");
    } catch (e: any) {
      addLog(`Notification error: ${e.message}`);
    }
  };

  const sendStreakNotif = async () => {
    try {
      await notificationService.sendStreakNotification(7);
      addLog("Sent: streak notification (7 days)");
    } catch (e: any) {
      addLog(`Notification error: ${e.message}`);
    }
  };

  const sendGoalAlertNotif = async () => {
    try {
      await notificationService.sendGoalAlert(1500, 4);
      addLog("Sent: goal alert (1500ml remaining, 4h left)");
    } catch (e: any) {
      addLog(`Notification error: ${e.message}`);
    }
  };

  const sendMotivationalNotif = async () => {
    try {
      await notificationService.sendMotivationalMessage();
      addLog("Sent: motivational message");
    } catch (e: any) {
      addLog(`Notification error: ${e.message}`);
    }
  };

  const testHaptic = async (type: string) => {
    try {
      switch (type) {
        case "light":
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          break;
        case "medium":
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          break;
        case "heavy":
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          break;
        case "success":
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          break;
        case "warning":
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          break;
        case "error":
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          break;
        case "selection":
          await Haptics.selectionAsync();
          break;
      }
      addLog(`Haptic: ${type}`);
    } catch (e: any) {
      addLog(`Haptic error: ${e.message}`);
    }
  };

  const checkNetwork = async () => {
    try {
      const state = await NetInfo.fetch();
      const info = `${state.type} | Connected: ${state.isConnected} | Internet: ${state.isInternetReachable}`;
      setNetworkInfo(info);
      addLog(`Network: ${info}`);
    } catch (e: any) {
      addLog(`Network error: ${e.message}`);
    }
  };

  const SectionHeader = ({ title, icon }: { title: string; icon: string }) => (
    <View className="flex-row items-center mb-3 mt-6">
      <Ionicons name={icon as any} size={20} color="#EF4444" />
      <Text className="text-lg font-bold text-text-light-primary dark:text-text-dark-primary ml-2">
        {title}
      </Text>
    </View>
  );

  const DevButton = ({
    label,
    onPress,
    color = "#334155",
    icon,
    loading,
  }: {
    label: string;
    onPress: () => void;
    color?: string;
    icon?: string;
    loading?: boolean;
  }) => (
    <TouchableOpacity
      className="flex-row items-center rounded-xl py-3 px-4 mr-2 mb-2"
      style={{ backgroundColor: color }}
      onPress={onPress}
      disabled={loading}
    >
      {loading ? (
        <ActivityIndicator size="small" color="white" />
      ) : icon ? (
        <Ionicons name={icon as any} size={16} color="white" />
      ) : null}
      <Text className="text-white font-medium text-sm ml-1.5">{label}</Text>
    </TouchableOpacity>
  );

  const InfoRow = ({ label, value }: { label: string; value: string }) => (
    <View className="flex-row justify-between py-2 border-b border-gray-800">
      <Text className="text-text-light-muted dark:text-text-dark-muted text-sm">{label}</Text>
      <Text className="text-text-light-primary dark:text-text-dark-primary text-sm font-mono font-medium">
        {value}
      </Text>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark">
      
      <View className="flex-row items-center px-6 pt-4 pb-2">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Ionicons name="arrow-back" size={24} color="#94A3B8" />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-xl font-bold text-error-500">Dev Tools</Text>
          <Text className="text-xs text-text-light-muted dark:text-text-dark-muted">
            Native Feature Testing
          </Text>
        </View>
        <View className="bg-error-500/20 px-2 py-1 rounded-lg">
          <Text className="text-error-500 text-xs font-bold">DEV</Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        
        <SectionHeader title="Device Info" icon="phone-portrait" />
        <View className="bg-surface-light dark:bg-surface-dark rounded-2xl p-4">
          <InfoRow label="Platform" value={`${Platform.OS} ${Platform.Version}`} />
          <InfoRow label="BLE State" value={bleState} />
          <InfoRow label="BLE Permissions" value={blePermissions} />
          <InfoRow label="Notif Permission" value={notifPermission} />
          <InfoRow label="Network" value={networkInfo} />
          <InfoRow label="Bottle Connected" value={isConnected ? `Yes (${connectedDeviceId})` : "No"} />
          {isConnected && (
            <>
              <InfoRow label="Weight" value={`${currentWeight}g`} />
              <InfoRow label="Battery" value={batteryLevel !== null ? `${batteryLevel}%` : "N/A"} />
            </>
          )}
        </View>
        <View className="flex-row flex-wrap mt-2">
          <DevButton label="Refresh BLE" onPress={checkBleState} icon="refresh" />
          <DevButton label="Check Perms" onPress={checkBlePermissions} icon="shield-checkmark" />
          <DevButton label="Check Network" onPress={checkNetwork} icon="wifi" />
          <DevButton label="Check Notif" onPress={checkNotifPermissions} icon="notifications" />
        </View>

        
        <SectionHeader title="Bluetooth Scanner" icon="bluetooth" />
        <Text className="text-xs text-text-light-muted dark:text-text-dark-muted mb-2">
          Scans for ALL nearby BLE devices (not just SmartBottle). 15 second scan.
        </Text>
        <View className="flex-row flex-wrap">
          <DevButton
            label={isScanning ? "Scanning..." : "Scan All Devices"}
            onPress={scanAllDevices}
            color="#0EA5E9"
            icon="search"
            loading={isScanning}
          />
          {isScanning && (
            <DevButton label="Stop" onPress={stopBleScan} color="#EF4444" icon="stop" />
          )}
        </View>

        {allDevices.length > 0 && (
          <View className="bg-surface-light dark:bg-surface-dark rounded-2xl p-3 mt-2">
            <Text className="text-xs text-text-light-muted dark:text-text-dark-muted mb-2">
              Found {allDevices.length} device(s)
            </Text>
            {allDevices.map((device) => (
              <View
                key={device.id}
                className="border-b border-gray-200 dark:border-gray-700 py-2"
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-1 mr-2">
                    <Text className="text-sm font-medium text-text-light-primary dark:text-text-dark-primary">
                      {device.name || "Unknown Device"}
                    </Text>
                    <Text className="text-[10px] text-text-light-muted dark:text-text-dark-muted font-mono">
                      {device.id}
                    </Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-xs text-text-light-muted dark:text-text-dark-muted">
                      RSSI: {device.rssi ?? "N/A"}
                    </Text>
                    {device.serviceUUIDs && device.serviceUUIDs.length > 0 && (
                      <Text className="text-[10px] text-primary-500">
                        {device.serviceUUIDs.length} service(s)
                      </Text>
                    )}
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        
        <SectionHeader title="Notifications" icon="notifications" />
        <View className="flex-row flex-wrap">
          <DevButton label="Request Permission" onPress={requestNotifPermissions} color="#8B5CF6" icon="key" />
          <DevButton label="Test Basic" onPress={sendTestNotification} color="#8B5CF6" icon="paper-plane" />
          <DevButton label="Achievement" onPress={sendAchievementNotif} color="#F59E0B" icon="trophy" />
          <DevButton label="Streak" onPress={sendStreakNotif} color="#10B981" icon="flame" />
          <DevButton label="Goal Alert" onPress={sendGoalAlertNotif} color="#EF4444" icon="flag" />
          <DevButton label="Motivational" onPress={sendMotivationalNotif} color="#0EA5E9" icon="happy" />
        </View>

        
        <SectionHeader title="Haptics" icon="hand-left" />
        <View className="flex-row flex-wrap">
          <DevButton label="Light" onPress={() => testHaptic("light")} />
          <DevButton label="Medium" onPress={() => testHaptic("medium")} />
          <DevButton label="Heavy" onPress={() => testHaptic("heavy")} />
          <DevButton label="Success" onPress={() => testHaptic("success")} color="#10B981" />
          <DevButton label="Warning" onPress={() => testHaptic("warning")} color="#F59E0B" />
          <DevButton label="Error" onPress={() => testHaptic("error")} color="#EF4444" />
          <DevButton label="Selection" onPress={() => testHaptic("selection")} color="#8B5CF6" />
        </View>

        
        <SectionHeader title="Console" icon="terminal" />
        <View className="bg-gray-900 rounded-2xl p-3 mb-8 min-h-[200px] max-h-[300px]">
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-gray-500 text-xs">{logs.length} entries</Text>
            <TouchableOpacity onPress={() => setLogs([])}>
              <Text className="text-error-500 text-xs font-medium">Clear</Text>
            </TouchableOpacity>
          </View>
          <ScrollView ref={scrollRef} nestedScrollEnabled>
            {logs.length === 0 ? (
              <Text className="text-gray-600 text-xs font-mono">
                Tap any button above to see output here...
              </Text>
            ) : (
              logs.map((log, i) => (
                <Text key={i} className="text-green-400 text-[11px] font-mono mb-0.5">
                  {log}
                </Text>
              ))
            )}
          </ScrollView>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
