import { useState, useCallback, useRef, useEffect } from "react";
import { bluetoothService, Device } from "../services/bluetooth";
import { useBottleStore } from "../stores/bottleStore";

interface UseBluetoothReturn {
  isScanning: boolean;
  isConnecting: boolean;
  isConnected: boolean;
  devices: Device[];
  connectedDeviceId: string | null;
  batteryLevel: number | null;
  error: string | null;
  scan: () => Promise<void>;
  stopScan: () => void;
  connect: (deviceId: string) => Promise<void>;
  disconnect: () => Promise<void>;
  refreshBattery: () => Promise<void>;
}

export function useBluetooth(): UseBluetoothReturn {
  const [isScanning, setIsScanning] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [devices, setDevices] = useState<Device[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { isConnected, connectedDeviceId, batteryLevel } = useBottleStore();

  const batteryIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const scan = useCallback(async () => {
    setError(null);
    setDevices([]);
    setIsScanning(true);

    try {
      await bluetoothService.scanForDevices((device) => {
        setDevices((prev) => {
          if (prev.find((d) => d.id === device.id)) return prev;
          return [...prev, device];
        });
      }, 15000);
    } catch (err: any) {
      setError(err.message || "Failed to scan");
    } finally {
      setIsScanning(false);
    }
  }, []);

  const stopScan = useCallback(() => {
    bluetoothService.stopScan();
    setIsScanning(false);
  }, []);

  const connect = useCallback(async (deviceId: string) => {
    setError(null);
    setIsConnecting(true);

    try {
      await bluetoothService.connect(deviceId);

      await bluetoothService.subscribeToWeight((weightG) => {
      });

      await bluetoothService.readBatteryLevel();

      batteryIntervalRef.current = setInterval(async () => {
        try {
          await bluetoothService.readBatteryLevel();
        } catch {
        }
      }, 60000);
    } catch (err: any) {
      setError(err.message || "Failed to connect");
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    if (batteryIntervalRef.current) {
      clearInterval(batteryIntervalRef.current);
      batteryIntervalRef.current = null;
    }
    await bluetoothService.disconnect();
  }, []);

  const refreshBattery = useCallback(async () => {
    try {
      await bluetoothService.readBatteryLevel();
    } catch {
    }
  }, []);

  useEffect(() => {
    return () => {
      if (batteryIntervalRef.current) {
        clearInterval(batteryIntervalRef.current);
      }
    };
  }, []);

  return {
    isScanning,
    isConnecting,
    isConnected,
    devices,
    connectedDeviceId,
    batteryLevel,
    error,
    scan,
    stopScan,
    connect,
    disconnect,
    refreshBattery,
  };
}
