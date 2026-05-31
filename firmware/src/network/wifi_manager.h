#pragma once

#include <Arduino.h>

bool wifiConnect(void);              // old (you can keep or remove)
bool wifiConnectStart(void);
bool wifiConnectUpdate(void);
void wifiReconnectTask(void);