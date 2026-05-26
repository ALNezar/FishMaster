#pragma once

#include <Arduino.h>

void dashboardInit(void);
void dashboardLoop(void);

void dashboardSetWifiConnected(bool connected);
void dashboardSetWaterTemp(float tempC, bool valid);
void dashboardSetPh(float phValue, float phVoltage, float rawAdc, bool valid);
void dashboardSetTurbidity(float ntu, int rawAdc, bool valid);
void dashboardSetInternalTemp(float chipTempC, bool valid);
