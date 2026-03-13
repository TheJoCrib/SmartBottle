
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>
#include "HX711.h"

#define HX711_DT_PIN 16
#define HX711_SCK_PIN 17

#define BATTERY_PIN 34

#define LED_PIN 2

#define CALIBRATION_FACTOR 420.0

#define WEIGHT_UPDATE_INTERVAL 1000
#define WEIGHT_SAMPLES 5

#define BATTERY_MAX_VOLTAGE 4.2
#define BATTERY_MIN_VOLTAGE 3.3
#define BATTERY_DIVIDER_RATIO 2.0

#define SERVICE_UUID        "12345678-1234-5678-1234-56789abcdef0"
#define WEIGHT_CHAR_UUID    "12345678-1234-5678-1234-56789abcdef1"
#define BATTERY_CHAR_UUID   "12345678-1234-5678-1234-56789abcdef2"

HX711 scale;

BLEServer* pServer = NULL;
BLECharacteristic* pWeightCharacteristic = NULL;
BLECharacteristic* pBatteryCharacteristic = NULL;

bool deviceConnected = false;
bool oldDeviceConnected = false;
unsigned long lastWeightUpdate = 0;
unsigned long lastBatteryUpdate = 0;

float currentWeight = 0;
uint8_t batteryLevel = 100;

class ServerCallbacks : public BLEServerCallbacks {
  void onConnect(BLEServer* pServer) {
    deviceConnected = true;
    digitalWrite(LED_PIN, HIGH);
    Serial.println("Device connected");
  }

  void onDisconnect(BLEServer* pServer) {
    deviceConnected = false;
    digitalWrite(LED_PIN, LOW);
    Serial.println("Device disconnected");
  }
};

void setup() {
  Serial.begin(115200);
  Serial.println("\n=== SmartBottle Starting ===");

  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW);

  analogReadResolution(12);
  analogSetAttenuation(ADC_11db);

  Serial.println("Initializing HX711...");
  scale.begin(HX711_DT_PIN, HX711_SCK_PIN);

  while (!scale.is_ready()) {
    Serial.println("Waiting for HX711...");
    delay(100);
  }

  scale.set_scale(CALIBRATION_FACTOR);

  Serial.println("Taring scale... Remove all weight!");
  delay(2000);
  scale.tare();
  Serial.println("Scale tared!");

  setupBLE();

  Serial.println("=== SmartBottle Ready ===");
  Serial.println("Waiting for connection...");
}

void setupBLE() {
  Serial.println("Initializing BLE...");

  BLEDevice::init("SmartBottle");

  pServer = BLEDevice::createServer();
  pServer->setCallbacks(new ServerCallbacks());

  BLEService* pService = pServer->createService(SERVICE_UUID);

  pWeightCharacteristic = pService->createCharacteristic(
    WEIGHT_CHAR_UUID,
    BLECharacteristic::PROPERTY_READ |
    BLECharacteristic::PROPERTY_NOTIFY
  );
  pWeightCharacteristic->addDescriptor(new BLE2902());

  pBatteryCharacteristic = pService->createCharacteristic(
    BATTERY_CHAR_UUID,
    BLECharacteristic::PROPERTY_READ
  );

  pService->start();

  BLEAdvertising* pAdvertising = BLEDevice::getAdvertising();
  pAdvertising->addServiceUUID(SERVICE_UUID);
  pAdvertising->setScanResponse(true);
  pAdvertising->setMinPreferred(0x06);
  pAdvertising->setMinPreferred(0x12);
  BLEDevice::startAdvertising();

  Serial.println("BLE initialized and advertising");
}

void loop() {
  unsigned long currentMillis = millis();

  if (currentMillis - lastWeightUpdate >= WEIGHT_UPDATE_INTERVAL) {
    lastWeightUpdate = currentMillis;
    readAndSendWeight();
  }

  if (currentMillis - lastBatteryUpdate >= 30000) {
    lastBatteryUpdate = currentMillis;
    updateBatteryLevel();
  }

  if (!deviceConnected && oldDeviceConnected) {
    delay(500);
    pServer->startAdvertising();
    Serial.println("Restarting advertising...");
    oldDeviceConnected = deviceConnected;
  }

  if (deviceConnected && !oldDeviceConnected) {
    oldDeviceConnected = deviceConnected;
  }

  delay(10);
}

void readAndSendWeight() {
  if (!scale.is_ready()) {
    Serial.println("HX711 not ready");
    return;
  }

  float totalWeight = 0;
  int validSamples = 0;

  for (int i = 0; i < WEIGHT_SAMPLES; i++) {
    if (scale.is_ready()) {
      float reading = scale.get_units();
      if (reading >= 0) {
        totalWeight += reading;
        validSamples++;
      }
    }
    delay(10);
  }

  if (validSamples > 0) {
    currentWeight = totalWeight / validSamples;

    static float filteredWeight = 0;
    filteredWeight = 0.8 * filteredWeight + 0.2 * currentWeight;
    currentWeight = filteredWeight;

    if (currentWeight < 0) currentWeight = 0;

    Serial.print("Weight: ");
    Serial.print(currentWeight);
    Serial.println(" g");

    if (deviceConnected) {
      sendWeight(currentWeight);
    }
  }
}

void sendWeight(float weightG) {
  uint8_t data[4];
  memcpy(data, &weightG, 4);

  pWeightCharacteristic->setValue(data, 4);
  pWeightCharacteristic->notify();
}

void updateBatteryLevel() {
  int adcValue = analogRead(BATTERY_PIN);

  float voltage = (adcValue / 4095.0) * 3.3 * BATTERY_DIVIDER_RATIO;

  float percentage = ((voltage - BATTERY_MIN_VOLTAGE) /
                      (BATTERY_MAX_VOLTAGE - BATTERY_MIN_VOLTAGE)) * 100.0;

  if (percentage > 100) percentage = 100;
  if (percentage < 0) percentage = 0;

  batteryLevel = (uint8_t)percentage;

  Serial.print("Battery: ");
  Serial.print(batteryLevel);
  Serial.print("% (");
  Serial.print(voltage);
  Serial.println("V)");

  pBatteryCharacteristic->setValue(&batteryLevel, 1);
}

