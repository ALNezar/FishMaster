#include <Arduino.h>
#include <WiFi.h>

#include "utility/timer.h"
#include "network/wifi_manager.h"
#include "network/mqtt_manager.h"

#include "ui/dashboard_ui.h"

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
unsigned long chipTempTimer = 0;

// State
static bool waterTempValid = false;
static bool turbidityValid = false;
static bool phValid = false;
static bool chipTempValid = false;

static float currentWaterTemp = NAN;
static float currentTurbidityNtu = NAN;
static int currentTurbidityRaw = 0;

static float currentPh = NAN;
static float currentPhVoltage = NAN;
static float currentPhRawAdc = NAN;

static float currentChipTemp = NAN;

static bool phSampling = false;

// TSENS handle (IMPORTANT FIX)
#if HAVE_TSENS
static temp_sensor_handle_t tsens_handle = NULL;
#endif

void setup()
{
    Serial.begin(115200);
    delay(1000);

    Serial.println("FishMaster Starting...");

    tempSensorInit();
    phSensorInit();
    turbiditySensorInit();

    dashboardInit();

#if HAVE_TSENS
    temp_sensor_config_t cfg = TSENS_CONFIG_DEFAULT();
    temp_sensor_install(&cfg, &tsens_handle);
    temp_sensor_start(tsens_handle);
#endif

    wifiConnect();
    mqttSetup();

    mqttPublishDeviceInfo();

    Serial.println("System ready ✔");
}

void loop()
{
    phSensorLoop();
    mqttLoop();

    dashboardSetWifiConnected(WiFi.status() == WL_CONNECTED);

    // DEVICE INFO
    if (checkTime(deviceInfoTimer, 60000))
    {
        mqttPublishDeviceInfo();
    }

    // TURBIDITY
    if (checkTime(turbidityTimer, 5000))
    {
        int raw = turbiditySensorReadRaw();
        float ntu = turbiditySensorReadNtu();

        currentTurbidityRaw = raw;
        currentTurbidityNtu = ntu;
        turbidityValid = true;

        dashboardSetTurbidity(ntu, raw, true);
        mqttPublishTurbidity(ntu, raw);
    }

    // pH REQUEST
    if (checkTime(phTimer, 5000))
    {
        phSensorRequestSample();
        phSampling = true;
    }

    // pH READY
    if (phSampling && phSensorSampleReady())
    {
        currentPh = phSensorGetPh();
        currentPhVoltage = phSensorLastVoltage();
        currentPhRawAdc = phSensorLastRawAdc();

        phValid = (currentPh >= 0.0f);

        dashboardSetPh(currentPh, currentPhVoltage, currentPhRawAdc, phValid);

        float chipTemp = NAN;

#if HAVE_TSENS
        if (tsens_handle)
        {
            if (temp_sensor_get_celsius(tsens_handle, &chipTemp) == ESP_OK)
            {
                currentChipTemp = chipTemp;
                chipTempValid = true;
                dashboardSetInternalTemp(chipTemp, true);
            }
        }
#endif

        mqttPublishPh(currentPh, currentPhVoltage, chipTemp);

        phSampling = false;
    }

    // CHIP TEMP (separate timer FIX)
    if (checkTime(chipTempTimer, 15000))
    {
#if HAVE_TSENS
        float t = NAN;
        if (tsens_handle && temp_sensor_get_celsius(tsens_handle, &t) == ESP_OK)
        {
            currentChipTemp = t;
            dashboardSetInternalTemp(t, true);
        }
#endif
    }

    // WATER TEMP
    if (checkTime(temperatureTimer, 2000))
    {
        float temp = tempSensorReadC();

        if (temp == TEMP_SENSOR_ERROR)
        {
            waterTempValid = false;
            dashboardSetWaterTemp(NAN, false);
        }
        else
        {
            currentWaterTemp = temp;
            waterTempValid = true;

            dashboardSetWaterTemp(temp, true);
            mqttPublishTemperature(temp);
        }
    }

    dashboardLoop();
}