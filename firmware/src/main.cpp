#include <Arduino.h>
#include <OneWire.h>
#include <DallasTemperature.h>

// --- Temperature Sensor ---
#define TEMP_SENSOR_PIN 32
#define STATUS_LED 33

OneWire oneWire(TEMP_SENSOR_PIN);
DallasTemperature temperatureSensor(&oneWire);
float temperature = 0;

// --- Turbidity Sensor ---
#define TURBIDITY_PIN 34
int turbidityValue = 0;
float voltage = 0;
float ntu = 0;

void setup() {
  Serial.begin(115200);
  delay(2000);

  temperatureSensor.begin();
  pinMode(STATUS_LED, OUTPUT);
  digitalWrite(STATUS_LED, LOW);

  Serial.println("\n\n");
  Serial.println("╔═══════════════════════════════════════════════════╗");
  Serial.println("║        FishMaster Sensor System v1                ║");
  Serial.println("╚═══════════════════════════════════════════════════╝");
  Serial.println("Status: INITIALIZED ✓");
  Serial.println("────────────────────────────────────────────");
}

void loop() {

  // ===== TEMPERATURE =====
  temperatureSensor.requestTemperatures();
  temperature = temperatureSensor.getTempCByIndex(0);

  Serial.print("(👉ﾟヮﾟ)👉 Temperature: ");

  if (temperature == DEVICE_DISCONNECTED_C) {
    Serial.println("ERROR: Sensor not found!");
    digitalWrite(STATUS_LED, HIGH);
  } else {
    Serial.print(temperature);
    Serial.println(" °C");

    if (temperature > 0 && temperature < 50) {
      Serial.println("✓ Temperature normal");
      digitalWrite(STATUS_LED, HIGH);
      delay(150);
      digitalWrite(STATUS_LED, LOW);
    } else {
      Serial.println("⚠ Temperature abnormal!");
      digitalWrite(STATUS_LED, HIGH);
    }
  }

  // ===== TURBIDITY =====
  turbidityValue = analogRead(TURBIDITY_PIN);

  // Convert ADC → Voltage
  voltage = turbidityValue * (3.3 / 4095.0);

  // Convert Voltage → NTU (approximation formula)
  ntu = -1120.4 * voltage * voltage + 5742.3 * voltage - 4352.9;

  if (ntu < 0) ntu = 0;

  Serial.print("🌊 Voltage: ");
  Serial.print(voltage);
  Serial.println(" V");

  Serial.print("🌊 Turbidity: ");
  Serial.print(ntu);
  Serial.println(" NTU");

  // Interpretation (this is what your dashboard will use later)
  if (ntu < 5) {
    Serial.println("✓ Water: VERY CLEAR");
  } else if (ntu < 50) {
    Serial.println("~ Water: Slightly Cloudy");
  } else {
    Serial.println("⚠ Water: DIRTY");
  }

  Serial.println("────────────────────────────────────────────");

  delay(2000);
}