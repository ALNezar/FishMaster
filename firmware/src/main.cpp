#include <Arduino.h> 

void setup() {
  Serial.begin(115200);
  delay(1000); 
  Serial.println("ESP32 Test Started!");
}

void loop() {
  Serial.println("System Running...");
  delay(2000); 
}
