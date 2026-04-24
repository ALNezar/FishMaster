#pragma once
#include <Arduino.h>

inline bool isReady(unsigned long &lastTime, unsigned long interval) {
    unsigned long now = millis();
    if (now - lastTime >= interval) {
        lastTime = now;
        return true;
    }
    return false;
}
