#pragma once

void tempSensorInit(void);
float tempSensorReadC(void);


/* 
Define a special error value for temperature readings. 
The DS18B20 returns -127.0°C if it fails to read the sensor.
*/
static const float TEMP_SENSOR_ERROR = -127.0f;
