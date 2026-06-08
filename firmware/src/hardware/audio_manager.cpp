// =============================================================================
// audio_manager.cpp  —  FishMaster Buzzer Driver
// Raw LEDC: ledcSetup() + ledcAttachPin() + ledcWrite()
// =============================================================================

#include "audio_manager.h"

// =============================================================================
// LEDC Configuration
// Channel 7 (high-speed, paired with Timer 3) — avoids conflicts with
// ESP32Servo (which starts from channel 0) and TFT_eSPI backlight.
// =============================================================================
static const uint8_t  BUZZER_LEDC_CHANNEL    = 7;
static const uint8_t  BUZZER_LEDC_RESOLUTION = 8;   // 8-bit → duty 0-255
static uint8_t        buzzerDutyOn           = 128; // 50% duty = loudest square wave
static const uint8_t  BUZZER_DUTY_OFF        = 0;

namespace
{
// =========================================================================
// Boot Melody: "Drunken Sailor" motif (~6.2s)
// Key: D Minor (starting on A4)
// =========================================================================
static const uint16_t kBootMelodyHz[] = {
    440, 440, 440, 440, 440, 294, 349, 440, // What shall we do with a drunken sailor
    392, 392, 392, 392, 392, 262, 330, 392, // What shall we do with a drunken sailor
    440, 440, 440, 440, 440, 494, 523, 587, // What shall we do with a drunken sailor
    523, 440, 392, 349, 294, 294            // Early in the morning
};

static const uint16_t kBootNoteDurationMs[] = {
    150, 150, 150, 150, 250, 150, 150, 300,
    150, 150, 150, 150, 250, 150, 150, 300,
    150, 150, 150, 150, 250, 150, 150, 300,
    150, 150, 150, 150, 300, 400
};

static const uint16_t kBootGapDurationMs[] = {
    30, 30, 30, 30, 60, 30, 30, 60,
    30, 30, 30, 30, 60, 30, 30, 60,
    30, 30, 30, 30, 60, 30, 30, 60,
    30, 30, 30, 30, 60, 0
};

static const uint8_t kBootMelodyLength =
    sizeof(kBootMelodyHz) / sizeof(kBootMelodyHz[0]);

// =========================================================================
// Feed Chime: cheerful double-beep (E6 → A6)
// =========================================================================
static const uint16_t kFeedChimeHz[]      = {1319, 1760};
static const uint16_t kFeedToneDurationMs = 90;
static const uint16_t kFeedGapDurationMs  = 80;

// =========================================================================
// Risk Alarm Parameters
// =========================================================================
static const uint16_t kLevel1BeepHz       = 900;
static const uint16_t kLevel1BeepOnMs     = 120;
static const uint16_t kLevel1BeepPeriodMs = 5000;

static const uint16_t kLevel2BeepHz       = 1100;
static const uint16_t kLevel2OnMs         = 120;
static const uint16_t kLevel2GapMs        = 120;
static const uint16_t kLevel2CyclePauseMs = 900;

static const uint16_t kSirenHzA    = 880;
static const uint16_t kSirenHzB    = 1180;
static const uint16_t kSirenStepMs = 300;

} // anonymous namespace

// =============================================================================
// Constructor
// =============================================================================
AudioManager::AudioManager(uint8_t buzzerPin)
    : buzzerPin_(buzzerPin),
      lastRiskLevel_(RiskLevel::SAFE),
      toneActive_(false),
      feedChimePending_(false),
      feedToneActive_(false),
      feedStep_(0),
      feedStepStartMs_(0),
      alarmStep_(0),
      alarmStepStartMs_(0)
{
}

// =============================================================================
// Init — bare-metal LEDC setup + boot melody (blocking, in setup())
// =============================================================================
void AudioManager::init()
{
    Serial.println("[AUDIO] init() starting...");
    Serial.printf("[AUDIO] Buzzer pin: GPIO %d\n", buzzerPin_);
    Serial.printf("[AUDIO] LEDC channel: %d, resolution: %d-bit\n",
                  BUZZER_LEDC_CHANNEL, BUZZER_LEDC_RESOLUTION);

    // Step 1: Configure the GPIO as a push-pull output
    pinMode(buzzerPin_, OUTPUT);
    digitalWrite(buzzerPin_, LOW);
    Serial.println("[AUDIO] GPIO configured as OUTPUT");

    // Step 2: Initialize LEDC timer at 1000Hz
    double actualFreq = ledcSetup(BUZZER_LEDC_CHANNEL, 1000, BUZZER_LEDC_RESOLUTION);
    Serial.printf("[AUDIO] ledcSetup() returned: %.2f Hz\n", actualFreq);

    // Step 3: Attach pin to LEDC channel
    ledcAttachPin(buzzerPin_, BUZZER_LEDC_CHANNEL);
    Serial.println("[AUDIO] ledcAttachPin() done");

    // Step 4: Start silent (using wrapper to sync internal boolean state)
    buzzerSilence();
    Serial.println("[AUDIO] LEDC initialized, starting silent");

    // Step 5: Hardware test beep — 1000Hz for 200ms
    Serial.println("[AUDIO] >>> Hardware test beep (1000Hz, 200ms)...");
    buzzerTone(1000);
    delay(200);
    buzzerSilence();
    delay(300);
    Serial.println("[AUDIO] >>> Test beep complete");

    // Step 6: Play boot melody
    Serial.println("[AUDIO] >>> Playing boot melody...");
    playBootMelodyBlocking();
    Serial.println("[AUDIO] >>> Boot melody complete");

    lastRiskLevel_ = RiskLevel::SAFE;
    resetRiskPatternState(millis());
    Serial.println("[AUDIO] init() complete ✔");
}

// =============================================================================
// Trigger a feed chime (non-blocking, queued for next update() cycle)
// =============================================================================
void AudioManager::triggerFeedChime()
{
    feedChimePending_ = true;
}

// =============================================================================
// Main update — called every loop() iteration
// =============================================================================
void AudioManager::update(RiskLevel riskLevel)
{
    const unsigned long nowMs = millis();

    if (riskLevel != lastRiskLevel_)
    {
        lastRiskLevel_ = riskLevel;
        resetRiskPatternState(nowMs);
    }

    if (updateFeedChime(nowMs))
    {
        return; // Prioritize chime, suspend alarms temporarily
    }

    updateRiskPattern(riskLevel, nowMs);
}

uint8_t AudioManager::increaseVolume()
{
    if (buzzerDutyOn < 128) {
        buzzerDutyOn = min(128, buzzerDutyOn + 16);
    }
    // Quick preview blip
    buzzerTone(1500);
    delay(20);
    buzzerSilence();
    return buzzerDutyOn;
}

uint8_t AudioManager::decreaseVolume()
{
    if (buzzerDutyOn > 0) {
        buzzerDutyOn = (buzzerDutyOn >= 16) ? (buzzerDutyOn - 16) : 0;
    }
    // Quick preview blip
    if (buzzerDutyOn > 0) {
        buzzerTone(1000);
        delay(20);
        buzzerSilence();
    }
    return buzzerDutyOn;
}

// =============================================================================
// Emergency stop — silence everything
// =============================================================================
void AudioManager::stop()
{
    feedChimePending_ = false;
    feedToneActive_   = false;
    feedStep_         = 0;
    resetRiskPatternState(millis());
    buzzerSilence();
}

// =============================================================================
// Boot melody — blocking (uses delay(), only called from setup())
// =============================================================================
void AudioManager::playBootMelodyBlocking()
{
    for (uint8_t i = 0; i < kBootMelodyLength; ++i)
    {
        const uint16_t freq   = kBootMelodyHz[i];
        const uint16_t noteMs = kBootNoteDurationMs[i];
        const uint16_t gapMs  = kBootGapDurationMs[i];

        if (freq > 0)
        {
            buzzerTone(freq);
        }
        else
        {
            buzzerSilence();
        }

        delay(noteMs);
        buzzerSilence();

        if (gapMs > 0)
        {
            delay(gapMs);
        }
        
        // Prevent ESP32 Watchdog Timer reset during long blocking melodies
        yield(); 
    }
}

// =============================================================================
// Feed chime state machine (non-blocking)
// =============================================================================
bool AudioManager::updateFeedChime(unsigned long nowMs)
{
    if (feedChimePending_)
    {
        feedChimePending_ = false;
        feedToneActive_   = true;
        feedStep_         = 0;
        feedStepStartMs_  = nowMs;
        buzzerTone(kFeedChimeHz[0]);
        return true;
    }

    if (!feedToneActive_) return false;

    switch (feedStep_)
    {
        case 0:
            if (nowMs - feedStepStartMs_ >= kFeedToneDurationMs)
            {
                buzzerSilence();
                feedStep_ = 1;
                feedStepStartMs_ = nowMs;
            }
            break;

        case 1:
            if (nowMs - feedStepStartMs_ >= kFeedGapDurationMs)
            {
                buzzerTone(kFeedChimeHz[1]);
                feedStep_ = 2;
                feedStepStartMs_ = nowMs;
            }
            break;

        case 2:
            if (nowMs - feedStepStartMs_ >= kFeedToneDurationMs)
            {
                buzzerSilence();
                feedToneActive_ = false;
                feedStep_ = 0;
            }
            break;
    }

    return true;
}

// =============================================================================
// Risk pattern state management
// =============================================================================
void AudioManager::resetRiskPatternState(unsigned long nowMs)
{
    alarmStep_        = 0;
    alarmStepStartMs_ = nowMs;
    buzzerSilence();
}

// =============================================================================
// Risk alarm patterns (non-blocking state machine)
// =============================================================================
void AudioManager::updateRiskPattern(RiskLevel riskLevel, unsigned long nowMs)
{
    switch (riskLevel)
    {
        case RiskLevel::SAFE:
            return;

        case RiskLevel::MINOR_WARNING:
            switch (alarmStep_)
            {
                case 0:
                    buzzerTone(kLevel1BeepHz);
                    alarmStep_ = 1;
                    alarmStepStartMs_ = nowMs;
                    break;
                case 1:
                    if (nowMs - alarmStepStartMs_ >= kLevel1BeepOnMs)
                    {
                        buzzerSilence();
                        alarmStep_ = 2;
                        alarmStepStartMs_ = nowMs;
                    }
                    break;
                case 2:
                    if (nowMs - alarmStepStartMs_ >= (kLevel1BeepPeriodMs - kLevel1BeepOnMs))
                    {
                        alarmStep_ = 0;
                        // Time reset happens in Step 0
                    }
                    break;
            }
            break;

        case RiskLevel::HIGH_STRESS:
            switch (alarmStep_)
            {
                case 0:
                    buzzerTone(kLevel2BeepHz);
                    alarmStep_ = 1;
                    alarmStepStartMs_ = nowMs;
                    break;
                case 1:
                    if (nowMs - alarmStepStartMs_ >= kLevel2OnMs)
                    {
                        buzzerSilence();
                        alarmStep_ = 2;
                        alarmStepStartMs_ = nowMs;
                    }
                    break;
                case 2:
                    if (nowMs - alarmStepStartMs_ >= kLevel2GapMs)
                    {
                        buzzerTone(kLevel2BeepHz);
                        alarmStep_ = 3;
                        alarmStepStartMs_ = nowMs;
                    }
                    break;
                case 3:
                    if (nowMs - alarmStepStartMs_ >= kLevel2OnMs)
                    {
                        buzzerSilence();
                        alarmStep_ = 4;
                        alarmStepStartMs_ = nowMs;
                    }
                    break;
                case 4:
                    if (nowMs - alarmStepStartMs_ >= kLevel2CyclePauseMs)
                    {
                        alarmStep_ = 0;
                        // Time reset happens in Step 0
                    }
                    break;
            }
            break;

        case RiskLevel::CRITICAL:
            switch (alarmStep_)
            {
                case 0:
                    buzzerTone(kSirenHzA);
                    alarmStep_ = 1;
                    alarmStepStartMs_ = nowMs;
                    break;
                case 1:
                    if (nowMs - alarmStepStartMs_ >= kSirenStepMs)
                    {
                        buzzerTone(kSirenHzB);
                        alarmStep_ = 2;
                        alarmStepStartMs_ = nowMs;
                    }
                    break;
                case 2:
                    if (nowMs - alarmStepStartMs_ >= kSirenStepMs)
                    {
                        buzzerTone(kSirenHzA);
                        alarmStep_ = 3;
                        alarmStepStartMs_ = nowMs;
                    }
                    break;
                case 3:
                    if (nowMs - alarmStepStartMs_ >= kSirenStepMs)
                    {
                        buzzerTone(kSirenHzB);
                        alarmStep_ = 4;
                        alarmStepStartMs_ = nowMs;
                    }
                    break;
                case 4:
                    // Mandatory quiet cooldown between siren bursts (3 seconds)
                    if (nowMs - alarmStepStartMs_ >= kSirenStepMs)
                    {
                        buzzerSilence();
                        alarmStep_ = 5;
                        alarmStepStartMs_ = nowMs;
                    }
                    break;
                case 5:
                    if (nowMs - alarmStepStartMs_ >= 3000)
                    {
                        alarmStep_ = 0; // restart siren burst
                    }
                    break;
            }
            break;
    }
}

// =============================================================================
// Low-level buzzer control — raw LEDC: ledcSetup() + ledcWrite()
// =============================================================================
void AudioManager::buzzerTone(uint16_t frequencyHz)
{
    ledcSetup(BUZZER_LEDC_CHANNEL, frequencyHz, BUZZER_LEDC_RESOLUTION);
    ledcAttachPin(buzzerPin_, BUZZER_LEDC_CHANNEL);
    if (buzzerDutyOn > 0) {
        ledcWrite(BUZZER_LEDC_CHANNEL, buzzerDutyOn);
    } else {
        ledcWrite(BUZZER_LEDC_CHANNEL, BUZZER_DUTY_OFF);
    }
    toneActive_ = true;
}

void AudioManager::buzzerSilence()
{
    ledcWrite(BUZZER_LEDC_CHANNEL, BUZZER_DUTY_OFF);
    toneActive_ = false;
}