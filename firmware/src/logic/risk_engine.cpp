#include "risk_engine.h"

RiskLevel RiskEngine::evaluate(const SensorSnapshot& snapshot)
{
    RiskLevel overall = RiskLevel::SAFE;

    if (snapshot.temperatureValid)
    {
        overall = maxLevel(overall, evaluateTemperature(snapshot.temperatureC));
    }

    if (snapshot.turbidityValid)
    {
        overall = maxLevel(overall, evaluateTurbidity(snapshot.turbidityNtu));
    }

    if (snapshot.phValid)
    {
        overall = maxLevel(overall, evaluatePh(snapshot.ph));
    }

    return overall;
}

RiskLevel RiskEngine::evaluateTemperature(float temperatureC)
{
    if (temperatureC > 33.0f || temperatureC < 22.0f)
    {
        return RiskLevel::CRITICAL;
    }

    if (temperatureC > 31.0f || temperatureC < 24.0f)
    {
        return RiskLevel::HIGH_STRESS;
    }

    if (temperatureC >= 29.5f && temperatureC <= 31.0f)
    {
        return RiskLevel::MINOR_WARNING;
    }

    return RiskLevel::SAFE;
}

RiskLevel RiskEngine::evaluateTurbidity(float turbidityNtu)
{
    if (turbidityNtu > 40.0f)
    {
        return RiskLevel::CRITICAL;
    }

    if (turbidityNtu >= 30.0f)
    {
        return RiskLevel::HIGH_STRESS;
    }

    if (turbidityNtu >= 20.0f)
    {
        return RiskLevel::MINOR_WARNING;
    }

    return RiskLevel::SAFE;
}

RiskLevel RiskEngine::evaluatePh(float ph)
{
    if (ph < 5.5f || ph > 9.0f)
    {
        return RiskLevel::CRITICAL;
    }

    if (ph < 6.0f || ph > 8.5f)
    {
        return RiskLevel::HIGH_STRESS;
    }

    if ((ph >= 6.0f && ph <= 6.5f) || (ph >= 8.0f && ph <= 8.5f))
    {
        return RiskLevel::MINOR_WARNING;
    }

    return RiskLevel::SAFE;
}

RiskLevel RiskEngine::maxLevel(RiskLevel a, RiskLevel b)
{
    return (static_cast<uint8_t>(b) > static_cast<uint8_t>(a)) ? b : a;
}
