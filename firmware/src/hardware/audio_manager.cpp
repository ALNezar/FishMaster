// =============================================================================
// audio_manager.cpp  —  FishMaster Buzzer Driver
// Raw LEDC: ledcSetup() + ledcAttachPin() + ledcWrite() — most explicit API
// =============================================================================

#include "audio_manager.h"

// =============================================================================
// LEDC Configuration
// Channel 7 (high-speed, paired with Timer 3) — avoids conflicts with
// ESP32Servo (which starts from channel 0) and TFT_eSPI backlight.
// =============================================================================
static const uint8_t  BUZZER_LEDC_CHANNEL    = 7;
static const uint8_t  BUZZER_LEDC_RESOLUTION = 8;   // 8-bit → duty 0-255
static const uint8_t  BUZZER_DUTY_ON         = 128;  // 50% duty = loudest square wave
static const uint8_t  BUZZER_DUTY_OFF        = 0;

namespace
{
// =========================================================================
// Boot Melody: "Wellerman" sea-shanty inspired motif (~4.7s)
// =========================================================================
static const uint16_t kBootMelodyHz[] = {
    294, 349, 392, 392, 440, 392, 349, 330,
    294, 330, 349, 392, 440, 392, 349, 330,
    294, 0, 294, 349, 392, 440, 392, 294
};

static const uint16_t kBootNoteDurationMs[] = {
    190, 190, 280, 190, 280, 190, 190, 240,
    190, 190, 240, 320, 190, 190, 190, 240,
    320, 120, 190, 190, 280, 280, 260, 420
};

static const uint16_t kBootGapDurationMs[] = {
    30, 30, 60, 30, 60, 30, 30, 40,
    30, 30, 40, 70, 30, 30, 30, 40,
    70, 40, 30, 30, 60, 60, 50, 0
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

    // Step 4: Start silent
    ledcWrite(BUZZER_LEDC_CHANNEL, BUZZER_DUTY_OFF);
    Serial.println("[AUDIO] LEDC initialized, starting silent");

    // Step 5: Hardware test beep — 1000Hz for 200ms
    Serial.println("[AUDIO] >>> Hardware test beep (1000Hz, 200ms)...");
    ledcWrite(BUZZER_LEDC_CHANNEL, BUZZER_DUTY_ON);
    delay(200);
    ledcWrite(BUZZER_LEDC_CHANNEL, BUZZER_DUTY_OFF);
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
        return;
    }

    updateRiskPattern(riskLevel, nowMs);
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

    if (!feedToneActive_)
    {
        return false;
    }

    if (feedStep_ == 0)
    {
        if (nowMs - feedStepStartMs_ >= kFeedToneDurationMs)
        {
            buzzerSilence();
            feedStep_ = 1;
            feedStepStartMs_ = nowMs;
        }
        return true;
    }

    if (feedStep_ == 1)
    {
        if (nowMs - feedStepStartMs_ >= kFeedGapDurationMs)
        {
            buzzerTone(kFeedChimeHz[1]);
            feedStep_ = 2;
            feedStepStartMs_ = nowMs;
        }
        return true;
    }

    if (nowMs - feedStepStartMs_ >= kFeedToneDurationMs)
    {
        buzzerSilence();
        feedToneActive_ = false;
        feedStep_ = 0;
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
// Risk alarm patterns (non-blocking)
// =============================================================================
void AudioManager::updateRiskPattern(RiskLevel riskLevel, unsigned long nowMs)
{
    switch (riskLevel)
    {
        case RiskLevel::SAFE:
            return;

        case RiskLevel::MINOR_WARNING:
        {
            if (alarmStep_ == 0)
            {
                buzzerTone(kLevel1BeepHz);
                alarmStep_ = 1;
                alarmStepStartMs_ = nowMs;
                return;
            }
            if (alarmStep_ == 1)
            {
                if (nowMs - alarmStepStartMs_ >= kLevel1BeepOnMs)
                {
                    buzzerSilence();
                    alarmStep_ = 2;
                    alarmStepStartMs_ = nowMs;
                }
                return;
            }
            if (nowMs - alarmStepStartMs_ >= (kLevel1BeepPeriodMs - kLevel1BeepOnMs))
            {
                alarmStep_ = 0;
                alarmStepStartMs_ = nowMs;
            }
            return;
        }

        case RiskLevel::HIGH_STRESS:
        {
            if (alarmStep_ == 0)
            {
                buzzerTone(kLevel2BeepHz);
                alarmStep_ = 1;
                alarmStepStartMs_ = nowMs;
                return;
            }
            if (alarmStep_ == 1)
            {
                if (nowMs - alarmStepStartMs_ >= kLevel2OnMs)
                {
                    buzzerSilence();
                    alarmStep_ = 2;
                    alarmStepStartMs_ = nowMs;
                }
                return;
            }
            if (alarmStep_ == 2)
            {
                if (nowMs - alarmStepStartMs_ >= kLevel2GapMs)
                {
                    buzzerTone(kLevel2BeepHz);
                    alarmStep_ = 3;
                    alarmStepStartMs_ = nowMs;
                }
                return;
            }
            if (alarmStep_ == 3)
            {
                if (nowMs - alarmStepStartMs_ >= kLevel2OnMs)
                {
                    buzzerSilence();
                    alarmStep_ = 4;
                    alarmStepStartMs_ = nowMs;
                }
                return;
            }
            if (nowMs - alarmStepStartMs_ >= kLevel2CyclePauseMs)
            {
                alarmStep_ = 0;
                alarmStepStartMs_ = nowMs;
            }
            return;
        }

        case RiskLevel::CRITICAL:
        {
            if (alarmStep_ == 0)
            {
                buzzerTone(kSirenHzA);
                alarmStep_ = 1;
                alarmStepStartMs_ = nowMs;
                return;
            }
            if (nowMs - alarmStepStartMs_ >= kSirenStepMs)
            {
                if (alarmStep_ == 1)
                {
                    buzzerTone(kSirenHzB);
                    alarmStep_ = 2;
                }
                else
                {
                    buzzerTone(kSirenHzA);
                    alarmStep_ = 1;
                }
                alarmStepStartMs_ = nowMs;
            }
            return;
        }
    }
}

// =============================================================================
// Low-level buzzer control — raw LEDC: ledcSetup() + ledcWrite()
// No tone()/noTone()/ledcWriteTone() — these have known issues on ESP32
// =============================================================================
void AudioManager::buzzerTone(uint16_t frequencyHz)
{
    // Reconfigure LEDC timer to the desired frequency
    ledcSetup(BUZZER_LEDC_CHANNEL, frequencyHz, BUZZER_LEDC_RESOLUTION);
    // Re-attach pin (idempotent but ensures pin stays bound after timer reconfig)
    ledcAttachPin(buzzerPin_, BUZZER_LEDC_CHANNEL);
    // 50% duty = square wave = maximum volume for passive piezo
    ledcWrite(BUZZER_LEDC_CHANNEL, BUZZER_DUTY_ON);
    toneActive_ = true;
}

void AudioManager::buzzerSilence()
{
    ledcWrite(BUZZER_LEDC_CHANNEL, BUZZER_DUTY_OFF);
    toneActive_ = false;
}
