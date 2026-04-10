
#include <ArduinoBLE.h>
#include <EEPROM.h>
#include "HX711.h"

const int LOADCELL_DOUT_PIN = 2;
const int LOADCELL_SCK_PIN  = 3;

const float         NOISE_THRESHOLD           = 5.0f;
const unsigned long WEIGHT_UPDATE_INTERVAL_MS = 1000;

#define SERVICE_UUID      "12345678-1234-5678-1234-56789abcdef0"
#define WEIGHT_CHAR_UUID  "12345678-1234-5678-1234-56789abcdef1"
#define COMMAND_CHAR_UUID "12345678-1234-5678-1234-56789abcdef3"

const uint32_t EEPROM_MAGIC     = 0xC0FFEE01;
const int      EEPROM_BASE_ADDR = 0;

struct CalibrationRecord {
  uint32_t magic;
  float    scaleFactor;
  long     tareOffset;
};

HX711  scale;
String inputBuffer = "";

BLEService        smartBottleService(SERVICE_UUID);
BLECharacteristic weightCharacteristic(WEIGHT_CHAR_UUID,  BLERead | BLENotify, 4);
BLECharacteristic commandCharacteristic(COMMAND_CHAR_UUID, BLEWrite,            1);

bool          bleReady         = false;
bool          centralConnected = false;
unsigned long lastWeightUpdate = 0;

void setupBLE();
void runFirstTimeCalibration();
void handleSerialCommands();
void handleBleCommand();
void handleTareCommand();
void handleRecalibrationCommand();
void performCalibration(float knownG);
bool loadCalibration();
void saveCalibration();
void clearCalibration();
void broadcastWeight(float grams);

void setup() {
  Serial.begin(57600);
  const unsigned long t0 = millis();
  while (!Serial && millis() - t0 < 1500) { }

  scale.begin(LOADCELL_DOUT_PIN, LOADCELL_SCK_PIN);

  Serial.println(F("================================="));
  Serial.println(F("        WATER SCALE READY"));
  Serial.println(F("================================="));

  if (loadCalibration()) {
    Serial.println(F("Loaded calibration from EEPROM."));
    Serial.print(F("  scale factor = "));
    Serial.println(scale.get_scale(), 4);
    Serial.print(F("  tare offset  = "));
    Serial.println(scale.get_offset());
    Serial.println(F(""));
    Serial.println(F("Commands:"));
    Serial.println(F("  t = re-zero (tare)"));
    Serial.println(F("  c = re-calibrate with a known weight"));
    Serial.println(F("  e = erase saved calibration"));
    Serial.println(F("================================="));
  } else {
    Serial.println(F("No saved calibration. Running first-time setup..."));
    runFirstTimeCalibration();
  }

  setupBLE();
  Serial.println(F("Ready. Broadcasting weight over BLE + Serial."));
}

void loop() {
  if (bleReady) BLE.poll();

  BLEDevice central = BLE.central();
  const bool connectedNow = central && central.connected();
  if (connectedNow && !centralConnected) {
    centralConnected = true;
    Serial.print(F("[BLE] Connected to "));
    Serial.println(central.address());
  } else if (!connectedNow && centralConnected) {
    centralConnected = false;
    Serial.println(F("[BLE] Disconnected"));
  }

  handleSerialCommands();
  handleBleCommand();

  const unsigned long now = millis();
  if (now - lastWeightUpdate >= WEIGHT_UPDATE_INTERVAL_MS) {
    lastWeightUpdate = now;

    float reading = scale.get_units(10);
    if (fabs(reading) < NOISE_THRESHOLD) reading = 0.0f;

    Serial.print(F("HX711 reading: "));
    Serial.println(reading);

    if (centralConnected) {
      broadcastWeight(reading);
    }
  }
}

void setupBLE() {
  Serial.println(F("[BLE] Initializing..."));
  if (!BLE.begin()) {
    Serial.println(F("[BLE] BLE.begin() FAILED - check ArduinoBLE install / board firmware."));
    return;
  }

  BLE.setLocalName("SmartBottle");
  BLE.setDeviceName("SmartBottle");
  BLE.setAdvertisedService(smartBottleService);

  smartBottleService.addCharacteristic(weightCharacteristic);
  smartBottleService.addCharacteristic(commandCharacteristic);
  BLE.addService(smartBottleService);

  uint8_t zero[4] = {0, 0, 0, 0};
  weightCharacteristic.writeValue(zero, sizeof(zero));

  BLE.advertise();
  bleReady = true;
  Serial.println(F("[BLE] Advertising as 'SmartBottle'"));
}

void broadcastWeight(float grams) {
  uint8_t data[4];
  memcpy(data, &grams, sizeof(data));
  weightCharacteristic.writeValue(data, sizeof(data));
}

void handleBleCommand() {
  if (!bleReady) return;
  if (!commandCharacteristic.written()) return;

  const int len = commandCharacteristic.valueLength();
  if (len <= 0) return;

  const uint8_t* value = commandCharacteristic.value();
  const char cmd = tolower((char)value[0]);
  switch (cmd) {
    case 't':
      scale.tare();
      saveCalibration();
      Serial.println(F("[BLE] Tared and saved."));
      break;
    case 'e':
      clearCalibration();
      Serial.println(F("[BLE] Calibration erased. Reboot to recalibrate."));
      break;
    default:
      break;
  }
}

void handleSerialCommands() {
  while (Serial.available()) {
    const char ch = (char)Serial.read();
    if (ch == '\n' || ch == '\r') {
      inputBuffer.trim();
      if (inputBuffer.length() > 0) {
        const char cmd = tolower(inputBuffer[0]);
        if (cmd == 't') {
          handleTareCommand();
        } else if (cmd == 'c') {
          handleRecalibrationCommand();
        } else if (cmd == 'e') {
          clearCalibration();
          Serial.println(F("Calibration erased. Reboot to recalibrate."));
        }
      }
      inputBuffer = "";
    } else {
      inputBuffer += ch;
    }
  }
}

void handleTareCommand() {
  scale.tare();
  saveCalibration();
  Serial.println(F("[TARE] Zeroed and saved."));
}

void handleRecalibrationCommand() {
  Serial.println(F("Remove everything. Taring in 3s..."));
  const unsigned long waitStart = millis();
  while (millis() - waitStart < 3000) {
    if (bleReady) BLE.poll();
  }
  scale.set_scale();
  scale.tare();
  Serial.println(F("Place drink, type grams + Enter."));
  inputBuffer = "";
  while (true) {
    if (bleReady) BLE.poll();
    while (Serial.available()) {
      const char c = (char)Serial.read();
      if (c == '\n' || c == '\r') {
        inputBuffer.trim();
        const float knownG = inputBuffer.toFloat();
        if (knownG > 0) {
          performCalibration(knownG);
          Serial.println(F("Re-calibrated and saved!"));
          inputBuffer = "";
          return;
        }
        inputBuffer = "";
      } else {
        inputBuffer += c;
      }
    }
  }
}

void runFirstTimeCalibration() {
  Serial.println(F("Make sure scale is EMPTY..."));
  delay(3000);
  scale.set_scale();
  scale.tare();
  Serial.println(F("Scale zeroed!"));
  Serial.println(F(""));
  Serial.println(F("Now place your drink on the scale."));
  Serial.println(F("Then type its weight in grams + Enter."));
  Serial.println(F("Example: 553"));
  Serial.println(F("================================="));

  inputBuffer = "";
  while (true) {
    while (Serial.available()) {
      const char ch = (char)Serial.read();
      if (ch == '\n' || ch == '\r') {
        inputBuffer.trim();
        const float knownG = inputBuffer.toFloat();
        if (knownG > 0) {
          Serial.print(F("Calibrating with "));
          Serial.print(knownG, 1);
          Serial.println(F("g..."));
          performCalibration(knownG);
          Serial.println(F("Calibration done and saved to EEPROM!"));
          Serial.println(F("Place = shows weight. Remove = shows 0."));
          Serial.println(F("t = re-zero  |  c = re-calibrate  |  e = erase"));
          inputBuffer = "";
          return;
        } else {
          Serial.println(F("Type a number like 553 then Enter."));
        }
        inputBuffer = "";
      } else {
        inputBuffer += ch;
      }
    }
  }
}

void performCalibration(float knownG) {
  const float raw = scale.get_units(10);
  float factor = raw / knownG;
  if (factor > 0) factor = -factor;
  scale.set_scale(factor);
  saveCalibration();
}

bool loadCalibration() {
  CalibrationRecord rec;
  EEPROM.get(EEPROM_BASE_ADDR, rec);
  if (rec.magic == EEPROM_MAGIC) {
    scale.set_scale(rec.scaleFactor);
    scale.set_offset(rec.tareOffset);
    return true;
  }
  scale.set_scale();
  return false;
}

void saveCalibration() {
  CalibrationRecord rec;
  rec.magic       = EEPROM_MAGIC;
  rec.scaleFactor = scale.get_scale();
  rec.tareOffset  = scale.get_offset();
  EEPROM.put(EEPROM_BASE_ADDR, rec);
}

void clearCalibration() {
  CalibrationRecord rec;
  rec.magic       = 0;
  rec.scaleFactor = 0.0f;
  rec.tareOffset  = 0;
  EEPROM.put(EEPROM_BASE_ADDR, rec);
}
