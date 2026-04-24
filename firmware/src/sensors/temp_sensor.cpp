#include "temp_sensor.h"

#include <OneWire.h>
#include <DallasTemperature.h>

static const byte TEMP_PIN = 32;
static OneWire tempWire(TEMP_PIN);
static DallasTemperature tempSensor(&tempWire);

void tempSensorInit(void)
{
    tempSensor.begin();
}

float tempSensorReadC(void)
{
    tempSensor.requestTemperatures();
    return tempSensor.getTempCByIndex(0);
}
