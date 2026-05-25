#include <Arduino.h>

#include "utility/timer.h"
#include "network/wifi_manager.h"
#include "network/mqtt_manager.h"

#include "sensors/temp_sensor.h"
#include "sensors/turbidity_sensor.h"
#include "sensors/ph_sensor.h"

#if defined(__has_include)
#  if __has_include("driver/temp_sensor.h")
#    include "driver/temp_sensor.h"
#    define HAVE_TSENS 1
#  else
#    define HAVE_TSENS 0
#  endif
#else
#  define HAVE_TSENS 0
#endif

// Timers
unsigned long temperatureTimer = 0;
unsigned long turbidityTimer = 0;
unsigned long deviceInfoTimer = 0;
unsigned long phTimer = 0;

bool phRequested = false;

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

    Serial.println("[BOOT] Initializing pH sensor...");
    phSensorInit();

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
    // Progress non-blocking pH sampler
    phSensorLoop();

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

    // Request pH sample every 5 seconds (non-blocking)
    if (checkTime(phTimer, 5000))
    {
        Serial.println();
        Serial.println("------ pH SENSOR (start sample) ------");
        phSensorRequestSample();
        phRequested = true;
    }

    // When a pH sample completes, publish it
    if (phRequested && phSensorSampleReady())
    {
        float ph = phSensorGetPh();
        float v = phSensorLastVoltage();
        float raw = phSensorLastRawAdc();

        Serial.println();
        Serial.println("------ pH SENSOR ------");
        Serial.print("[PH] Raw ADC (avg) -> ");
        Serial.println((int)raw);
        Serial.print("[PH] Module voltage -> ");
        Serial.print(v, 3);
        Serial.println(" V");
        Serial.print("[PH] pH -> ");
        Serial.println(ph, 3);

        // Read internal chip temperature using driver/temp_sensor.h if available
        float chipTemp = NAN;
#if HAVE_TSENS
        {
            temp_sensor_config_t cfg = TSENS_CONFIG_DEFAULT();
            temp_sensor_handle_t handle = NULL;
            if (temp_sensor_install(&cfg, &handle) == ESP_OK)
            {
                if (temp_sensor_start(handle) == ESP_OK)
                {
                    float celsius = 0.0f;
                    if (temp_sensor_get_celsius(handle, &celsius) == ESP_OK)
                    {
                        chipTemp = celsius;
                        Serial.print("[PH] Internal chip temp -> ");
                        Serial.print(celsius, 2);
                        Serial.println(" C");
                    }
                    temp_sensor_stop(handle);
                }
                temp_sensor_uninstall(handle);
            }
        }
#else
        Serial.println("[PH] Internal chip temp -> N/A (driver not available)");
#endif

        mqttPublishPh(ph, v, chipTemp);
        phRequested = false;
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