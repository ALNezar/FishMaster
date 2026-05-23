#include "turbidity_sensor.h"

#include <Arduino.h>
#include "network/network_parameter.h"

static const byte TURBIDITY_PIN = 33;
static const float ADC_MAX_VALUE = 4095.0f;
static const float ADC_REF_VOLTAGE = 3.3f;

void turbiditySensorInit(void)
{
    pinMode(TURBIDITY_PIN, INPUT);
    analogReadResolution(12);
    analogSetPinAttenuation(TURBIDITY_PIN, ADC_11db);
}

int turbiditySensorReadRaw(void)
{
    return analogRead(TURBIDITY_PIN);
}

float turbiditySensorReadNtu(void)
{
    int rawValue = turbiditySensorReadRaw();
    float voltage = (static_cast<float>(rawValue) / ADC_MAX_VALUE) * ADC_REF_VOLTAGE;

    // Simple linear mapping: scale measured voltage to NTU using tunable constants.
    // NTU = (voltage / TURBIDITY_REF_VOLTAGE) * TURBIDITY_MAX_NTU
    float ntu = (voltage / TURBIDITY_REF_VOLTAGE) * TURBIDITY_MAX_NTU;

    if (ntu < 0.0f)
    {
        ntu = 0.0f;
    }

    return ntu;
}