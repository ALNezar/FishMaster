#pragma once

#include <Arduino.h>

inline bool checkTime(unsigned long &lastTime, unsigned long interval)
{
    unsigned long CurrentTime = millis();

    if (CurrentTime - lastTime >= interval) {
        lastTime = CurrentTime;
        return true;
    }

    return false;
}
