#include <Arduino.h>
#include "utility/timer.h" 
#include "network/wifi_manager.h"
#include "network/mqtt_manager.h"
#include "sensors/temp_sensor.h"

unsigned long sensorTimer = 0; 

void setup() {
    Serial.begin(115200);
    tempSensorInit();
    wifiConnect();
    mqttSetup();
}

void loop() {
    mqttLoop();

    // Much cleaner logic
    if (isReady(sensorTimer, 2000)) {
        float temp = tempSensorReadC();
        
        if (temp == TEMP_SENSOR_ERROR) {
            Serial.println("Sensor error! Check wiring .... <@_@>");
            return; 
        }

        Serial.print(temp);
        Serial.println(" C");
        mqttPublishTemperature(temp);
    }
}
