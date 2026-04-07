#include <Arduino.h>
#include <OneWire.h>
#include <DallasTemperature.h>

// ===== TEMPERATURE SENSOR =====
#define TEMP_SENSOR_PIN 32
#define STATUS_LED 33

OneWire oneWire(TEMP_SENSOR_PIN);
DallasTemperature temperatureSensor(&oneWire);
float temperature = 0;

// ===== TURBIDITY SENSOR =====
#define TURBIDITY_PIN 34
int turbidityValue = 0;
float voltage = 0;
float ntu = 0;

// ===== CALIBRATION (YOU MUST ADJUST THESE) =====
float cleanVoltage = 1.90; // voltage in clean water
float dirtyVoltage = 1.20; // voltage in dirty water

void setup() {
  Serial.begin(115200);
  delay(2000);

  temperatureSensor.begin();
  pinMode(STATUS_LED, OUTPUT);
  digitalWrite(STATUS_LED, LOW);

  Serial.println("\nFishMaster Sensor System (Calibrated)");
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

  // ADC → Voltage
  voltage = turbidityValue * (3.3 / 4095.0);

  // Voltage → NTU (calibrated mapping)
  ntu = (cleanVoltage - voltage) * (300.0 / (cleanVoltage - dirtyVoltage));

  // Clamp values
  if (ntu < 0) ntu = 0;
  if (ntu > 300) ntu = 300;

  Serial.print("🌊 Voltage: ");
  Serial.print(voltage);
  Serial.println(" V");

  Serial.print("🌊 Turbidity: ");
  Serial.print(ntu);
  Serial.println(" NTU");

  // ===== INTERPRETATION =====
  if (ntu < 50) {
    Serial.println("✓ Water: CLEAR");
  } else if (ntu < 150) {
    Serial.println("~ Water: CLOUDY");
  } else {
    Serial.println("⚠ Water: DIRTY");
  }

  Serial.println("────────────────────────────────────────────");

  delay(2000);
}