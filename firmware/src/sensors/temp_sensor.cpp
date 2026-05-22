#include "temp_sensor.h"

#include <OneWire.h>
#include <DallasTemperature.h>

static const byte TEMP_PIN = 32;
static OneWire tempWire(TEMP_PIN);
static DallasTemperature tempSensor(&tempWire);

// Initialize the temperature sensor
void tempSensorInit(void)
{
    tempSensor.begin();
}
// Read temperature in Celsius. Returns TEMP_SENSOR_ERROR if reading fails.
float tempSensorReadC(void)
{
    tempSensor.requestTemperatures();
    return tempSensor.getTempCByIndex(0);
}
