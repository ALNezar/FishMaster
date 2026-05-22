#include <Arduino.h>
#include "utility/timer.h" 
#include "network/wifi_manager.h"
#include "network/mqtt_manager.h"
#include "sensors/temp_sensor.h"

unsigned long sensorTimer = 0; 
unsigned long deviceInfoTimer = 0;

void setup() {
    Serial.begin(115200);

    Serial.println("--- SENSOR ---");
    Serial.println("[SENSOR] Booting temp sensor<^_^>");
    tempSensorInit();

    wifiConnect();
    mqttSetup();
    mqttPublishDeviceInfo();
}

void loop() {
    mqttLoop();

    if (checkTime(deviceInfoTimer, 60000)) {
        mqttPublishDeviceInfo();
    }

    if (checkTime(sensorTimer, 2000)) {
        Serial.println("--- SENSOR ---");
        float temp = tempSensorReadC();
        
        if (temp == TEMP_SENSOR_ERROR) {
            Serial.println("[SENSOR] Error! Check wiring .... <@_@>");
            return; 
        }

        Serial.print("[SENSOR] Temp -> ");
        Serial.print(temp);
        Serial.println(" C");
        mqttPublishTemperature(temp);
    }
}
