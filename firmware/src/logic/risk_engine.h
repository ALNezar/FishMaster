#pragma once

#include <stdint.h>

enum class RiskLevel : uint8_t
{
    SAFE = 0,
    MINOR_WARNING = 1,
    HIGH_STRESS = 2,
    CRITICAL = 3,
};

struct SensorSnapshot
{
    float temperatureC;
    bool temperatureValid;

    float turbidityNtu;
    bool turbidityValid;

    float ph;
    bool phValid;
};

class RiskEngine
{
public:
    static RiskLevel evaluate(const SensorSnapshot& snapshot);

private:
    static RiskLevel evaluateTemperature(float temperatureC);
    static RiskLevel evaluateTurbidity(float turbidityNtu);
    static RiskLevel evaluatePh(float ph);
    static RiskLevel maxLevel(RiskLevel a, RiskLevel b);
};
