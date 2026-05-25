#include "ph_sensor.h"

#include <Arduino.h>

// Hardware mapping
static const int PH_ADC_PIN = 34; // ADC1 channel, safe for Wi-Fi

// Sampling parameters
static const int SAMPLE_COUNT = 20;
static const unsigned long SAMPLE_WINDOW_MS = 100; // total window to collect samples

// Calibration constants (placeholders - tune with buffer solutions)
// Example: at pH 7.0 the module outputs ~2.5V (before divider). Adjust if different.
static const float CALIBRATION_PH7_V = 2.5f; // V at pH 7.0 (module side)
static const float CALIBRATION_SLOPE = -0.18f; // V per pH (example), tune during calibration

// Internal state
static float last_module_voltage = 0.0f;
static float last_ph = -1.0f;
static float last_avg_adc = 0.0f;

// Sampling state machine
static int samples[SAMPLE_COUNT];
static int collected = 0;
static bool samplingInProgress = false;
static bool sampleReady = false;
static unsigned long samplingStart = 0;
static unsigned long nextSampleAt = 0;
static unsigned long sampleIntervalMs = 0;

// Helper: read raw ADC once
static int readRawAdcOnce()
{
    return analogRead(PH_ADC_PIN);
}

void phSensorInit(void)
{
    analogReadResolution(12); // 0-4095
    analogSetPinAttenuation(PH_ADC_PIN, ADC_11db);
    samplingInProgress = false;
    sampleReady = false;
    collected = 0;
}

void phSensorRequestSample(void)
{
    if (samplingInProgress) return; // already running
    samplingInProgress = true;
    sampleReady = false;
    collected = 0;
    samplingStart = millis();
    sampleIntervalMs = SAMPLE_WINDOW_MS / SAMPLE_COUNT;
    nextSampleAt = samplingStart;
}

void phSensorLoop(void)
{
    if (!samplingInProgress) return;

    unsigned long now = millis();
    if (now < nextSampleAt) return;

    // take a sample
    if (collected < SAMPLE_COUNT)
    {
        samples[collected++] = readRawAdcOnce();
        nextSampleAt += sampleIntervalMs;
    }

    if (collected >= SAMPLE_COUNT)
    {
        samplingInProgress = false;

        // Sort samples (insertion sort)
        for (int i = 1; i < SAMPLE_COUNT; ++i) {
            int key = samples[i];
            int j = i - 1;
            while (j >= 0 && samples[j] > key) {
                samples[j+1] = samples[j];
                --j;
            }
            samples[j+1] = key;
        }

        // Discard highest and lowest spike (one each)
        long sum = 0;
        for (int i = 1; i < SAMPLE_COUNT - 1; ++i) {
            sum += samples[i];
        }
        float avg = static_cast<float>(sum) / (SAMPLE_COUNT - 2);
        last_avg_adc = avg;

        // Convert ADC (0-4095) to pin voltage (0-3.3V)
        const float ADC_MAX = 4095.0f;
        const float V_REF = 3.3f;
        float v_pin = (avg / ADC_MAX) * V_REF;

        // Module voltage before divider (divider halves the voltage)
        float v_module = v_pin * 2.0f;
        last_module_voltage = v_module;

        // Convert module voltage to pH using linear placeholder formula:
        float ph = 7.0f + (CALIBRATION_PH7_V - v_module) / CALIBRATION_SLOPE;

        // Clamp pH to 0-14
        if (ph < 0.0f) ph = 0.0f;
        if (ph > 14.0f) ph = 14.0f;

        last_ph = ph;
        sampleReady = true;
    }
}

bool phSensorSampleReady(void)
{
    return sampleReady;
}

float phSensorGetPh(void)
{
    sampleReady = false;
    return last_ph;
}

float phSensorLastVoltage(void)
{
    return last_module_voltage;
}

float phSensorLastRawAdc(void)
{
    return last_avg_adc;
}
