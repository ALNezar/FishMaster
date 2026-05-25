#include <Arduino.h>

#include "utility/timer.h"
#include "network/wifi_manager.h"
#include "network/mqtt_manager.h"

#include "sensors/temp_sensor.h"
#include "sensors/turbidity_sensor.h"

// Timers
unsigned long temperatureTimer = 0;
unsigned long turbidityTimer = 0;
unsigned long deviceInfoTimer = 0;

void setup()
{
    Serial.begin(115200);
    delay(1000);

    Serial.println();
    Serial.println("=================================");
    Serial.println(" FishMaster ESP32 Starting...");
    Serial.println("=================================");

    // Initialize sensors
    Serial.println("[BOOT] Initializing temperature sensor...");
    tempSensorInit();

    Serial.println("[BOOT] Initializing turbidity sensor...");
    turbiditySensorInit();

    // Connect WiFi
    Serial.println("[BOOT] Connecting WiFi...");
    wifiConnect();

    // Setup MQTT
    Serial.println("[BOOT] Setting up MQTT...");
    mqttSetup();

    // Publish initial device info
    mqttPublishDeviceInfo();

    Serial.println("[BOOT] System ready ✔");
}

void loop()
{
    // Maintain MQTT connection
    mqttLoop();

    // Publish device info every 60 seconds
    if (checkTime(deviceInfoTimer, 60000))
    {
        mqttPublishDeviceInfo();
    }

    // Read turbidity every 5 seconds
    if (checkTime(turbidityTimer, 5000))
    {
        Serial.println();
        Serial.println("------ TURBIDITY SENSOR ------");

        int rawValue = turbiditySensorReadRaw();
        float ntu = turbiditySensorReadNtu();

        Serial.print("[TURBIDITY] Raw ADC -> ");
        Serial.println(rawValue);

        Serial.print("[TURBIDITY] NTU -> ");
        Serial.print(ntu, 2);
        Serial.println(" NTU");

        mqttPublishTurbidity(ntu, rawValue);
    }

    // Read temperature every 2 seconds
    if (checkTime(temperatureTimer, 2000))
    {
        Serial.println();
        Serial.println("------ TEMPERATURE SENSOR ------");

        float temp = tempSensorReadC();

        // DS18B20 failed
        if (temp == TEMP_SENSOR_ERROR)
        {
            Serial.println("[TEMP] Failed to read sensor!");
            Serial.println("[TEMP] Check:");
            Serial.println("  - Wiring");
            Serial.println("  - GPIO pin");
            Serial.println("  - 4.7k pull-up resistor");
            Serial.println("  - Sensor power");
        }
        else
        {
            Serial.print("[TEMP] Temperature -> ");
            Serial.print(temp, 2);
            Serial.println(" C");

            mqttPublishTemperature(temp);
        }
    }
}