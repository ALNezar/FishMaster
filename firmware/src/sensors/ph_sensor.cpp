#include "ph_sensor.h"
#include <Arduino.h>

// ===================== CONFIG =====================
static const int PH_ADC_PIN = 34;

// more realistic sampling
static const int SAMPLE_COUNT = 10;
static const unsigned long SAMPLE_INTERVAL_MS = 50;

// calibration (YOU MUST TUNE THIS)
static const float CALIBRATION_PH7_V = 2.5f;
static const float CALIBRATION_SLOPE  = -0.18f;

// ===================== STATE =====================
static int samples[SAMPLE_COUNT];
static int collected = 0;

static bool sampling = false;
static bool ready = false;

static unsigned long lastSampleTime = 0;

// outputs
static float last_ph = -1.0f;
static float last_voltage = 0.0f;
static float last_adc = 0.0f;

// ===================== INIT =====================
void phSensorInit(void)
{
    analogReadResolution(12);
    analogSetPinAttenuation(PH_ADC_PIN, ADC_11db);

    sampling = false;
    ready = false;
    collected = 0;
}

// ===================== START SAMPLE =====================
void phSensorRequestSample(void)
{
    if (sampling) return;

    sampling = true;
    ready = false;
    collected = 0;
    lastSampleTime = millis();
}

// ===================== LOOP =====================
void phSensorLoop(void)
{
    if (!sampling) return;

    unsigned long now = millis();

    // take sample every interval
    if (now - lastSampleTime >= SAMPLE_INTERVAL_MS)
    {
        lastSampleTime = now;

        samples[collected++] = analogRead(PH_ADC_PIN);

        if (collected >= SAMPLE_COUNT)
        {
            sampling = false;

            // ===== sort =====
            for (int i = 1; i < SAMPLE_COUNT; i++)
            {
                int key = samples[i];
                int j = i - 1;

                while (j >= 0 && samples[j] > key)
                {
                    samples[j + 1] = samples[j];
                    j--;
                }
                samples[j + 1] = key;
            }

            // ===== trim noise (remove min/max) =====
            long sum = 0;
            for (int i = 1; i < SAMPLE_COUNT - 1; i++)
            {
                sum += samples[i];
            }

            float avg = sum / float(SAMPLE_COUNT - 2);
            last_adc = avg;

            // ===== convert ADC → voltage =====
            float v_pin = (avg / 4095.0f) * 3.3f;

            // adjust ONLY if you really use divider
            float v_module = v_pin * 2.0f;
            last_voltage = v_module;

            // ===== pH conversion =====
            float ph = 7.0f + (CALIBRATION_PH7_V - v_module) / CALIBRATION_SLOPE;

            if (ph < 0) ph = 0;
            if (ph > 14) ph = 14;

            last_ph = ph;
            ready = true;
        }
    }
}

// ===================== OUTPUT =====================
bool phSensorSampleReady(void)
{
    return ready;
}

float phSensorGetPh(void)
{
    ready = false;
    return last_ph;
}

float phSensorLastVoltage(void)
{
    return last_voltage;
}

float phSensorLastRawAdc(void)
{
    return last_adc;
}