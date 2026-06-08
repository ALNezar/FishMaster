// =============================================================================
// audio_manager.h
// =============================================================================
#pragma once

#include <Arduino.h>
#include "logic/risk_engine.h" // Ensure this path is correct for your project

class AudioManager
{
public:
    explicit AudioManager(uint8_t buzzerPin);

    void init();
    void triggerFeedChime();
    void update(RiskLevel riskLevel);
    void stop();

    uint8_t increaseVolume();
    uint8_t decreaseVolume();

private:
    void playBootMelodyBlocking();

    bool updateFeedChime(unsigned long nowMs);

    void resetRiskPatternState(unsigned long nowMs);
    void updateRiskPattern(RiskLevel riskLevel, unsigned long nowMs);

    void buzzerTone(uint16_t frequencyHz);
    void buzzerSilence();

    uint8_t buzzerPin_;
    RiskLevel lastRiskLevel_;

    bool toneActive_;

    bool feedChimePending_;
    bool feedToneActive_;
    uint8_t feedStep_;
    unsigned long feedStepStartMs_;

    uint8_t alarmStep_;
    unsigned long alarmStepStartMs_;
};