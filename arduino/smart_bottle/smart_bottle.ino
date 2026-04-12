
#include <ArduinoBLE.h>
#include "HX711.h"

#define HX711_DT_PIN  2
#define HX711_SCK_PIN 3
#define LED_PIN       LED_BUILTIN

#define CALIBRATION_FACTOR 420.0

#define WEIGHT_UPDATE_INTERVAL 1000
#define WEIGHT_SAMPLES         5
#define FILTER_ALPHA           0.2

#define SERVICE_UUID     "12345678-1234-5678-1234-56789abcdef0"
#define WEIGHT_CHAR_UUID "12345678-1234-5678-1234-56789abcdef1"
#define BATTERY_CHAR_UUID "12345678-1234-5678-1234-56789abcdef2"

HX711 scale;

BLEService bottleService(SERVICE_UUID);

BLECharacteristic weightCharacteristic(
  WEIGHT_CHAR_UUID,
  BLERead | BLENotify,
  4
);

BLECharacteristic batteryCharacteristic(
  BATTERY_CHAR_UUID,
  BLERead,
  1
);

float filteredWeight = 0;
unsigned long lastWeightUpdate = 0;
bool wasConnected = false;

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n=== SmartBottle R4 WiFi ===");

  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW);

  Serial.println("Initializing HX711...");
  scale.begin(HX711_DT_PIN, HX711_SCK_PIN);

  unsigned long waitStart = millis();
  while (!scale.is_ready()) {
    if (millis() - waitStart > 5000) {
      Serial.println("ERROR: HX711 not responding! Check wiring:");
      Serial.println("  DT  -> Pin 2");
      Serial.println("  SCK -> Pin 3");
      Serial.println("  VCC -> 5V");
      Serial.println("  GND -> GND");
      while (true) {
        digitalWrite(LED_PIN, HIGH); delay(100);
        digitalWrite(LED_PIN, LOW);  delay(100);
      }
    }
    delay(100);
  }

  scale.set_scale(CALIBRATION_FACTOR);

  Serial.println("Taring... keep load cell empty!");
  delay(2000);
  scale.tare();
  Serial.println("Tare done.");

  Serial.println("Initializing BLE...");
  if (!BLE.begin()) {
    Serial.println("ERROR: BLE failed to start!");
    while (true) {
      digitalWrite(LED_PIN, HIGH); delay(300);
      digitalWrite(LED_PIN, LOW);  delay(300);
    }
  }

  BLE.setLocalName("SmartBottle");
  BLE.setDeviceName("SmartBottle");

  BLE.setAdvertisedService(bottleService);
  bottleService.addCharacteristic(weightCharacteristic);
  bottleService.addCharacteristic(batteryCharacteristic);
  BLE.addService(bottleService);

  float zero = 0.0f;
  weightCharacteristic.writeValue((uint8_t*)&zero, 4);
  uint8_t bat = 100;
  batteryCharacteristic.writeValue(&bat, 1);

  BLE.advertise();

  Serial.println("=== SmartBottle Ready ===");
  Serial.println("Advertising as 'SmartBottle'...");
  Serial.println("Waiting for app to connect...");
}

void loop() {
  BLE.poll();

  BLEDevice central = BLE.central();
  bool isConnected = central && central.connected();

  if (isConnected && !wasConnected) {
    Serial.print("Connected: ");
    Serial.println(central.address());
    digitalWrite(LED_PIN, HIGH);
    wasConnected = true;
  }

  if (!isConnected && wasConnected) {
    Serial.println("Disconnected. Re-advertising...");
    digitalWrite(LED_PIN, LOW);
    wasConnected = false;
    BLE.advertise();
  }

  unsigned long now = millis();
  if (now - lastWeightUpdate >= WEIGHT_UPDATE_INTERVAL) {
    lastWeightUpdate = now;
    readAndSendWeight(isConnected);
  }
}

void readAndSendWeight(bool connected) {
  if (!scale.is_ready()) {
    Serial.println("HX711 not ready");
    return;
  }

  float total = 0;
  int valid = 0;

  for (int i = 0; i < WEIGHT_SAMPLES; i++) {
    if (scale.is_ready()) {
      float reading = scale.get_units();
      if (reading >= -5) {
        total += reading;
        valid++;
      }
    }
    delay(10);
  }

  if (valid == 0) return;

  float raw = total / valid;

  filteredWeight = (1.0 - FILTER_ALPHA) * filteredWeight + FILTER_ALPHA * raw;

  float weight = filteredWeight < 0 ? 0 : filteredWeight;

  Serial.print("Vikt: ");
  Serial.print(weight, 1);
  Serial.println(" g");

  if (connected) {
    uint8_t data[4];
    memcpy(data, &weight, 4);
    weightCharacteristic.writeValue(data, 4);
  }
}

