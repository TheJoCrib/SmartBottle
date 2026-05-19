
#include "HX711.h"

#define HX711_DT_PIN  2
#define HX711_SCK_PIN 3

HX711 scale;

void setup() {
  Serial.begin(115200);
  delay(2000);
  Serial.println("=== Load Cell Test ===");

  scale.begin(HX711_DT_PIN, HX711_SCK_PIN);

  Serial.print("HX711 ready: ");
  Serial.println(scale.is_ready() ? "JA" : "NEJ");

  if (scale.is_ready()) {
    Serial.println("Taring... rör inte lastcellen!");
    scale.tare();
    Serial.println("Klar! Tryck/böj lastcellen nu.");
    Serial.println("---");
  }
}

void loop() {
  if (scale.is_ready()) {
    float raw = scale.get_units(3);
    Serial.print("Vikt: ");
    Serial.print(raw, 1);
    Serial.println(" g");
  } else {
    Serial.println("HX711 svarar inte");
  }
  delay(500);
}
