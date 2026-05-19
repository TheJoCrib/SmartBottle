import {
  BleManager,
  Device,
  Characteristic,
  BleErrorCode,
} from "react-native-ble-plx";
import { Platform, PermissionsAndroid } from "react-native";
import { useBottleStore } from "../stores/bottleStore";
import {
  BLE_SERVICE_UUID,
  BLE_WEIGHT_CHAR_UUID,
  BLE_COMMAND_CHAR_UUID,
} from "../constants";

const SMART_BOTTLE_SERVICE_UUID = BLE_SERVICE_UUID;
const WEIGHT_CHARACTERISTIC_UUID = BLE_WEIGHT_CHAR_UUID;
const COMMAND_CHARACTERISTIC_UUID = BLE_COMMAND_CHAR_UUID;

class BluetoothService {
  private manager: BleManager;
  private connectedDevice: Device | null = null;
  private weightSubscription: any = null;
  private disconnectSubscription: { remove: () => void } | null = null;

  constructor() {
    this.manager = new BleManager();
  }

  async requestPermissions(): Promise<boolean> {
    if (Platform.OS === "android") {
      const apiLevel = Platform.Version;

      if (apiLevel >= 31) {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ]);

        return (
          granted["android.permission.BLUETOOTH_SCAN"] ===
            PermissionsAndroid.RESULTS.GRANTED &&
          granted["android.permission.BLUETOOTH_CONNECT"] ===
            PermissionsAndroid.RESULTS.GRANTED &&
          granted["android.permission.ACCESS_FINE_LOCATION"] ===
            PermissionsAndroid.RESULTS.GRANTED
        );
      } else {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      }
    }

    return true;
  }

  async isBluetoothEnabled(): Promise<boolean> {
    const state = await this.manager.state();
    return state === "PoweredOn";
  }

  async scanForDevices(
    onDeviceFound: (device: Device) => void,
    timeout: number = 10000
  ): Promise<void> {
    const hasPermission = await this.requestPermissions();
    if (!hasPermission) {
      throw new Error("Bluetooth permissions not granted");
    }

    const isEnabled = await this.isBluetoothEnabled();
    if (!isEnabled) {
      throw new Error("Bluetooth is not enabled");
    }

    return new Promise((resolve, reject) => {
      const foundDevices = new Set<string>();

      this.manager.startDeviceScan(
        [SMART_BOTTLE_SERVICE_UUID],
        { allowDuplicates: false },
        (error, device) => {
          if (error) {
            this.manager.stopDeviceScan();
            reject(error);
            return;
          }

          if (device && !foundDevices.has(device.id)) {
            foundDevices.add(device.id);
            onDeviceFound(device);
          }
        }
      );

      setTimeout(() => {
        this.manager.stopDeviceScan();
        resolve();
      }, timeout);
    });
  }

  stopScan(): void {
    this.manager.stopDeviceScan();
  }

  async connect(deviceId: string): Promise<Device> {
    const hasPermission = await this.requestPermissions();
    if (!hasPermission) {
      throw new Error("Bluetooth permissions not granted");
    }

    if (this.connectedDevice && this.connectedDevice.id === deviceId) {
      return this.connectedDevice;
    }

    if (this.connectedDevice) {
      await this.disconnect();
    }

    const device = await this.manager.connectToDevice(deviceId, {
      autoConnect: true,
      timeout: 10000,
    });

    await device.discoverAllServicesAndCharacteristics();

    this.connectedDevice = device;

    useBottleStore.getState().setConnected(true, deviceId);

    if (this.disconnectSubscription) {
      this.disconnectSubscription.remove();
      this.disconnectSubscription = null;
    }
    this.disconnectSubscription = this.manager.onDeviceDisconnected(
      deviceId,
      () => {
        this.handleDisconnect();
      },
    );

    return device;
  }

  async disconnect(): Promise<void> {
    if (this.connectedDevice) {
      if (this.weightSubscription) {
        this.weightSubscription.remove();
        this.weightSubscription = null;
      }
      if (this.disconnectSubscription) {
        this.disconnectSubscription.remove();
        this.disconnectSubscription = null;
      }

      try {
        await this.manager.cancelDeviceConnection(this.connectedDevice.id);
      } catch (error) {
        console.log("Error disconnecting:", error);
      }

      this.connectedDevice = null;
      useBottleStore.getState().disconnect();
    }
  }

  private handleDisconnect(): void {
    if (this.weightSubscription) {
      this.weightSubscription.remove();
      this.weightSubscription = null;
    }
    if (this.disconnectSubscription) {
      this.disconnectSubscription.remove();
      this.disconnectSubscription = null;
    }
    this.connectedDevice = null;
    useBottleStore.getState().disconnect();
  }

  async subscribeToWeight(
    onWeight: (weightG: number) => void
  ): Promise<void> {
    if (!this.connectedDevice) {
      throw new Error("No device connected");
    }

    if (this.weightSubscription) {
      this.weightSubscription.remove();
      this.weightSubscription = null;
    }

    this.weightSubscription = this.connectedDevice.monitorCharacteristicForService(
      SMART_BOTTLE_SERVICE_UUID,
      WEIGHT_CHARACTERISTIC_UUID,
      (error, characteristic) => {
        if (error) {
          if ((error as any)?.errorCode === BleErrorCode.OperationCancelled) {
            return;
          }
          console.warn("Weight subscription error:", error.message);
          return;
        }

        if (characteristic?.value) {
          const data = this.decodeBase64(characteristic.value);
          const weightG = this.parseWeightData(data);
          onWeight(weightG);
          useBottleStore.getState().setWeight(weightG);
        }
      }
    );
  }

  async connectAndStream(
    deviceId: string,
    onWeight?: (weightG: number) => void,
  ): Promise<void> {
    await this.connect(deviceId);
    await this.subscribeToWeight(onWeight ?? (() => {}));
  }

  async sendCommand(command: string): Promise<void> {
    if (!this.connectedDevice) {
      throw new Error("No device connected");
    }
    const base64 = this.encodeBase64(command);
    await this.connectedDevice.writeCharacteristicWithResponseForService(
      SMART_BOTTLE_SERVICE_UUID,
      COMMAND_CHARACTERISTIC_UUID,
      base64
    );
  }

  async tare(): Promise<void> {
    await this.sendCommand("t");
  }

  async eraseCalibration(): Promise<void> {
    await this.sendCommand("e");
  }

  private encodeBase64(value: string): string {
    return btoa(value);
  }

  private decodeBase64(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }

  private parseWeightData(data: Uint8Array): number {
    if (data.length >= 4) {
      const buffer = data.buffer.slice(data.byteOffset, data.byteOffset + 4);
      const view = new DataView(buffer);
      return Math.round(view.getFloat32(0, true));
    } else if (data.length >= 2) {
      return data[0] | (data[1] << 8);
    }
    return 0;
  }

  isConnected(): boolean {
    return this.connectedDevice !== null;
  }

  getConnectedDeviceId(): string | null {
    return this.connectedDevice?.id || null;
  }
}

export const bluetoothService = new BluetoothService();

export type { Device };
