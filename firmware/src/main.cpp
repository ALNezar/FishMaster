#include <Arduino.h>
#include <OneWire.h>
#include <DallasTemperature.h>

// CHANGE THIS:
#define TEMP_SENSOR_PIN 32   

OneWire oneWire(TEMP_SENSOR_PIN);
DallasTemperature tempSensor(&oneWire);

void setup() {
  Serial.begin(115200);
  delay(2000);
  tempSensor.begin();
  Serial.println("Temperature Sensor Ready!");
}

void loop() {
  tempSensor.requestTemperatures();
  float temp = tempSensor.getTempCByIndex(0);
  
  Serial.print("Temp: ");
  Serial.print(temp);
  Serial.println(" C");
  
  delay(2000);
}