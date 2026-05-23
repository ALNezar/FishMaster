#pragma once

void mqttSetup(void);
void mqttLoop(void);
bool mqttPublishTemperature(float temp);
bool mqttPublishTurbidity(float ntu, int rawValue);
bool mqttPublishDeviceInfo(void);
