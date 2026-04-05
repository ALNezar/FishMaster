#include <Arduino.h>
#include <OneWire.h>
#include <DallasTemperature.h>

// --- Configuration ---
#define TEMP_SENSOR_PIN 32    // DS18B20 data pin
#define STATUS_LED 33         // LED pin

OneWire oneWire(TEMP_SENSOR_PIN);
DallasTemperature temperatureSensor(&oneWire);

float temperature = 0;

void setup() {
  Serial.begin(115200);
  delay(2000); 
  
  temperatureSensor.begin();
  
  pinMode(STATUS_LED, OUTPUT);
  digitalWrite(STATUS_LED, LOW); // LED off initially
  
  Serial.println("\n\n");
  Serial.println("╔═══════════════════════════════════════════╗");
  Serial.println("║    FishMaster Temperature Sensor test     ║");
  Serial.println("║    ESP32 + DS18B20 (PlatformIO)           ║");
  Serial.println("╚═══════════════════════════════════════════╝");
  Serial.println("Status: INITIALIZED ✓");
  Serial.print("Temperature Sensor Pin: "); 
  Serial.println(TEMP_SENSOR_PIN);
  Serial.println("────────────────────────────────────────────");
}

void loop() {
  // Request temperature reading
  temperatureSensor.requestTemperatures();
  
  // Get temperature in Celsius
  temperature = temperatureSensor.getTempCByIndex(0);
  
  // Print to Serial Monitor
  Serial.print("┏ (゜ω゜)=👉 Temperature: ");
  
  // Check if sensor is connected
  if (temperature == DEVICE_DISCONNECTED_C) {
    Serial.println("ERROR: Sensor not found!");
    digitalWrite(STATUS_LED, LOW); // LED off on error
  } else {
    Serial.print(temperature);
    Serial.println(" °C");

    if (temperature > 0 && temperature < 50) {
      Serial.println("✓ Reading within normal range");
      
      // Blink LED once to show successful reading
      digitalWrite(STATUS_LED, HIGH);
      delay(200); // LED on 200ms
      digitalWrite(STATUS_LED, LOW);
    } else {
      Serial.println("⚠ Temperature out of expected range!");
      digitalWrite(STATUS_LED, HIGH); // LED solid on for alert
    }
  }
  
  Serial.println("────────────────────────────────────────────");
  delay(2000); // Wait 2 seconds before next reading
}