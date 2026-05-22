#pragma once

void mqttSetup(void);
void mqttLoop(void);
bool mqttPublishTemperature(float temp);
bool mqttPublishDeviceInfo(void);
