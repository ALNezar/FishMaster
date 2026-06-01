#include <Arduino.h>
#include <WiFi.h>

#include "utility/timer.h"
#include "network/wifi_manager.h"
#include "network/mqtt_manager.h"
#include "network/config.h"
#include "network/serial_setup.h"

#include "ui/dashboard_ui.h"

#include "sensors/temp_sensor.h"
#include "sensors/turbidity_sensor.h"
#include "sensors/ph_sensor.h"

#include "logic/risk_engine.h"
#include "hardware/audio_manager.h"

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

// =====================
// TIMERS
// =====================
static unsigned long tTemp = 0;
static unsigned long tTurb = 0;
static unsigned long tPh = 0;
static unsigned long tDevice = 0;
static unsigned long tUi = 0;

// =====================
// STATE
// =====================
static bool phSampling = false;

static float lastTemp = NAN;
static float lastPh = NAN;
static float lastTurb = NAN;

static bool tempValid = false;
static bool phValid = false;
static bool turbValid = false;

static RiskLevel risk = RiskLevel::SAFE;

static AudioManager audio(22);

#if HAVE_TSENS
static temp_sensor_handle_t tsens = NULL;
#endif

// =====================
// SETUP
// =====================
void setup()
{
    Serial.begin(115200);
    delay(800);

    Serial.println("\n[FISHMASTER BOOT]");

    // Load existing config into global and offer serial setup at boot
    NetConfig &cfg = configGet();
    configLoad(cfg);
    Serial.println("Press 's' + Enter within 5s to open serial setup...");
    unsigned long _boot_t0 = millis();
    while (millis() - _boot_t0 < 5000) {
        if (Serial.available()) {
            String _ln = Serial.readStringUntil('\n');
            _ln.trim();
            if (_ln.equalsIgnoreCase("s")) {
                serialSetupWizard(cfg);
                break;
            }
        }
        delay(50);
    }

    audio.init();

    tempSensorInit();
    phSensorInit();
    turbiditySensorInit();

    dashboardInit();

#if HAVE_TSENS
    temp_sensor_config_t cfg = TSENS_CONFIG_DEFAULT();
    temp_sensor_install(&cfg, &tsens);
    temp_sensor_start(tsens);
#endif

    // NON-BLOCKING WiFi
    wifiConnectStart();

    mqttSetup();
    mqttPublishDeviceInfo();

    Serial.println("[SYSTEM] READY");
}

// =====================
// LOOP
// =====================
void loop()
{
    // =====================
    // NETWORK LAYER
    // =====================
    wifiConnectUpdate();
    mqttLoop();

    // =====================
    // SENSOR LAYER
    // =====================

    phSensorLoop();

    // ---- TEMP ----
    if (checkTime(tTemp, 2000))
    {
        float t = tempSensorReadC();

        if (t != TEMP_SENSOR_ERROR)
        {
            lastTemp = t;
            tempValid = true;
            dashboardSetWaterTemp(t, true);
            mqttPublishTemperature(t);
        }
        else
        {
            tempValid = false;
            dashboardSetWaterTemp(NAN, false);
        }
    }

    // ---- TURBIDITY ----
    if (checkTime(tTurb, 5000))
    {
        int raw = turbiditySensorReadRaw();
        float ntu = turbiditySensorReadNtu();

        lastTurb = ntu;
        turbValid = true;

        dashboardSetTurbidity(ntu, raw, true);
        mqttPublishTurbidity(ntu, raw);
    }

    // ---- pH ----
    if (checkTime(tPh, 5000))
    {
        phSensorRequestSample();
        phSampling = true;
    }

    if (phSampling && phSensorSampleReady())
    {
        float ph = phSensorGetPh();
        float v = phSensorLastVoltage();

        lastPh = ph;
        phValid = (ph >= 0);

        dashboardSetPh(ph, v, ph, true);

#if HAVE_TSENS
        float chipTemp = NAN;
        if (tsens)
            temp_sensor_get_celsius(tsens, &chipTemp);

        mqttPublishPh(ph, v, chipTemp);
#else
        mqttPublishPh(ph, v, NAN);
#endif

        phSampling = false;
    }

    // ---- DEVICE INFO ----
    if (checkTime(tDevice, 60000))
    {
        mqttPublishDeviceInfo();
    }

    // =====================
    // LOGIC LAYER
    // =====================
    SensorSnapshot snap = {
        lastTemp, tempValid,
        lastTurb, turbValid,
        lastPh, phValid
    };

    risk = RiskEngine::evaluate(snap);
    audio.update(risk);

    if (dashboardConsumeManualFeedRequest())
        audio.triggerFeedChime();

    // =====================
    // UI LAYER (FIXED 30 FPS)
    // =====================
    if (millis() - tUi >= 33)
    {
        tUi = millis();
        dashboardLoop();
    }
}