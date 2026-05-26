#include <Arduino.h>
#include <SPI.h>
#include <TFT_eSPI.h>
#include <XPT2046_Touchscreen.h>

#include <Fonts/FreeSans9pt7b.h>
#include <Fonts/FreeSans12pt7b.h>
#include <Fonts/FreeSansBold12pt7b.h>
#include <Fonts/FreeSansBold18pt7b.h>

#include "../src/sensors/temp_sensor.h"
#include "../src/sensors/turbidity_sensor.h"
#include "../src/sensors/ph_sensor.h"

// ------------------------------------------------------------
// Hardware pinout
// ------------------------------------------------------------
static constexpr uint8_t SPI_SCK_PIN = 18;
static constexpr uint8_t SPI_MOSI_PIN = 23;
static constexpr uint8_t SPI_MISO_PIN = 19;

static constexpr uint8_t TFT_CS_PIN = 15;
static constexpr uint8_t TFT_DC_PIN = 2;
static constexpr uint8_t TFT_RST_PIN = 4;

static constexpr uint8_t TOUCH_CS_PIN = 21;
static constexpr uint8_t TOUCH_IRQ_PIN = 22;

// ------------------------------------------------------------
// Display and touch configuration
// ------------------------------------------------------------
static constexpr int16_t SCREEN_W = 320;
static constexpr int16_t SCREEN_H = 240;

// Raw touch calibration placeholders. Tune after reading actual touch points.
static constexpr int16_t TOUCH_RAW_X_MIN = 220;
static constexpr int16_t TOUCH_RAW_X_MAX = 3800;
static constexpr int16_t TOUCH_RAW_Y_MIN = 300;
static constexpr int16_t TOUCH_RAW_Y_MAX = 3800;

// ------------------------------------------------------------
// Theme
// ------------------------------------------------------------
static constexpr uint16_t COLOR_BG = TFT_BLACK;
static constexpr uint16_t COLOR_BLUE = TFT_BLUE;
static constexpr uint16_t COLOR_BLUE_DARK = 0x0010;
static constexpr uint16_t COLOR_BLUE_PANEL = 0x0018;
static constexpr uint16_t COLOR_WHITE = TFT_WHITE;
static constexpr uint16_t COLOR_GREEN = TFT_GREEN;
static constexpr uint16_t COLOR_RED = TFT_RED;
static constexpr uint16_t COLOR_GRAY = 0x7BEF;

// ------------------------------------------------------------
// UI geometry
// ------------------------------------------------------------
struct Rect
{
    int16_t x;
    int16_t y;
    int16_t w;
    int16_t h;
};

struct ScreenPoint
{
    int16_t x;
    int16_t y;
};

static constexpr Rect HEADER_RECT = {0, 0, SCREEN_W, 32};
static constexpr Rect CARD_1_RECT = {6, 40, 100, 128};
static constexpr Rect CARD_2_RECT = {110, 40, 100, 128};
static constexpr Rect CARD_3_RECT = {214, 40, 100, 128};
static constexpr Rect FEED_RECT = {10, 178, 300, 52};
static constexpr Rect STATUS_RECT = {168, 6, 146, 20};

// ------------------------------------------------------------
// Globals
// ------------------------------------------------------------
TFT_eSPI tft;
XPT2046_Touchscreen touch(TOUCH_CS_PIN, TOUCH_IRQ_PIN);

// Dashboard mode flag.
// Wire this to your network state later. When true, feed is disabled.
bool wifiConnected = false;

static bool lastWifiConnected = false;
static bool touchWasDown = false;
static bool manualFeedFlash = false;

static unsigned long lastRefreshMs = 0;
static unsigned long manualFeedFlashUntilMs = 0;
static constexpr unsigned long REFRESH_INTERVAL_MS = 2000;
static constexpr unsigned long MANUAL_FEED_FLASH_MS = 180;

// Live sensor values.
static bool tempValid = false;
static bool turbidityValid = false;
static bool phValid = false;

static float waterTempC = 0.0f;
static float turbidityNtu = 0.0f;
static int turbidityRaw = 0;
static float phLevel = 0.0f;
static float phVoltage = 0.0f;

static bool phRequestInFlight = false;
static bool phRequestIssued = false;

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------
static bool pointInRect(int16_t x, int16_t y, const Rect &r)
{
    return (x >= r.x) && (x < (r.x + r.w)) && (y >= r.y) && (y < (r.y + r.h));
}

static ScreenPoint mapTouchToScreen(int16_t rawX, int16_t rawY)
{
    ScreenPoint p;
    p.x = map(rawX, TOUCH_RAW_X_MIN, TOUCH_RAW_X_MAX, 0, SCREEN_W - 1);
    p.y = map(rawY, TOUCH_RAW_Y_MIN, TOUCH_RAW_Y_MAX, 0, SCREEN_H - 1);
    p.x = constrain(p.x, 0, SCREEN_W - 1);
    p.y = constrain(p.y, 0, SCREEN_H - 1);
    return p;
}

static void formatFloat(char *buffer, size_t bufferSize, float value, uint8_t decimals)
{
    if (isnan(value))
    {
        snprintf(buffer, bufferSize, "N/A");
        return;
    }

    char fmt[8];
    snprintf(fmt, sizeof(fmt), "%%.%uf", decimals);
    snprintf(buffer, bufferSize, fmt, value);
}

static void drawStatusIndicator()
{
    uint16_t fill = wifiConnected ? COLOR_GREEN : COLOR_RED;
    const char *label = wifiConnected ? "Cloud Sync: ON" : "Admin Mode: LOCAL";

    tft.fillRoundRect(STATUS_RECT.x, STATUS_RECT.y, STATUS_RECT.w, STATUS_RECT.h, 6, fill);
    tft.drawRoundRect(STATUS_RECT.x, STATUS_RECT.y, STATUS_RECT.w, STATUS_RECT.h, 6, COLOR_WHITE);

    tft.setFreeFont(&FreeSans9pt7b);
    tft.setTextDatum(MC_DATUM);
    tft.setTextColor(TFT_BLACK, fill);
    tft.drawString(label, STATUS_RECT.x + STATUS_RECT.w / 2, STATUS_RECT.y + STATUS_RECT.h / 2 + 1);
}

static void drawHeader()
{
    tft.fillRect(HEADER_RECT.x, HEADER_RECT.y, HEADER_RECT.w, HEADER_RECT.h, COLOR_BLUE_DARK);
    tft.drawFastHLine(0, HEADER_RECT.h - 1, SCREEN_W, COLOR_BLUE);

    tft.setFreeFont(&FreeSansBold12pt7b);
    tft.setTextDatum(ML_DATUM);
    tft.setTextColor(COLOR_WHITE, COLOR_BLUE_DARK);
    tft.drawString("FISHMASTER DASHBOARD", 10, 18);

    drawStatusIndicator();
}

static void drawSensorCard(const Rect &r, const char *title, const char *value, const char *unit)
{
    tft.fillRoundRect(r.x, r.y, r.w, r.h, 8, COLOR_BLUE_PANEL);
    tft.drawRoundRect(r.x, r.y, r.w, r.h, 8, COLOR_BLUE);

    tft.setFreeFont(&FreeSans12pt7b);
    tft.setTextDatum(TL_DATUM);
    tft.setTextColor(COLOR_WHITE, COLOR_BLUE_PANEL);
    tft.drawString(title, r.x + 10, r.y + 14);

    tft.setFreeFont(&FreeSansBold12pt7b);
    tft.setTextDatum(MC_DATUM);
    tft.setTextColor(COLOR_WHITE, COLOR_BLUE_PANEL);
    tft.drawString(value, r.x + r.w / 2, r.y + r.h / 2 + 8);

    tft.setFreeFont(&FreeSans9pt7b);
    tft.setTextDatum(MC_DATUM);
    tft.setTextColor(COLOR_BLUE, COLOR_BLUE_PANEL);
    tft.drawString(unit, r.x + r.w / 2, r.y + r.h - 18);
}

static void drawManualFeedButton()
{
    const bool enabled = !wifiConnected;
    const bool pressed = manualFeedFlash && enabled;

    uint16_t fill = enabled ? COLOR_BLUE : COLOR_GRAY;
    uint16_t border = enabled ? COLOR_WHITE : COLOR_GRAY;
    uint16_t textColor = enabled ? COLOR_WHITE : COLOR_BLUE_DARK;

    if (pressed)
    {
        fill = COLOR_WHITE;
        border = COLOR_BLUE;
        textColor = COLOR_BLUE_DARK;
    }

    tft.fillRoundRect(FEED_RECT.x, FEED_RECT.y, FEED_RECT.w, FEED_RECT.h, 10, fill);
    tft.drawRoundRect(FEED_RECT.x, FEED_RECT.y, FEED_RECT.w, FEED_RECT.h, 10, border);

    tft.setFreeFont(&FreeSansBold18pt7b);
    tft.setTextDatum(MC_DATUM);
    tft.setTextColor(textColor, fill);
    tft.drawString("MANUAL FEED", FEED_RECT.x + FEED_RECT.w / 2, FEED_RECT.y + FEED_RECT.h / 2 + 5);
}

static void drawUI()
{
    char tempBuf[16];
    char phBuf[16];
    char turbBuf[16];
    char turbRawBuf[16];

    formatFloat(tempBuf, sizeof(tempBuf), tempValid ? waterTempC : NAN, 1);
    formatFloat(phBuf, sizeof(phBuf), phValid ? phLevel : NAN, 2);
    formatFloat(turbBuf, sizeof(turbBuf), turbidityValid ? turbidityNtu : NAN, 1);
    snprintf(turbRawBuf, sizeof(turbRawBuf), "%d", turbidityValid ? turbidityRaw : 0);

    tft.fillScreen(COLOR_BG);
    drawHeader();

    drawSensorCard(CARD_1_RECT, "Water Temp", tempBuf, "C");
    drawSensorCard(CARD_2_RECT, "pH Level", phBuf, "pH");
    drawSensorCard(CARD_3_RECT, "Turbidity", turbBuf, "NTU");

    // Small raw readout under the turbidity card.
    char rawBuf[24];
    snprintf(rawBuf, sizeof(rawBuf), "RAW ADC: %d", turbidityRaw);

    tft.setFreeFont(&FreeSans9pt7b);
    tft.setTextDatum(TL_DATUM);
    tft.setTextColor(COLOR_BLUE, COLOR_BG);
    tft.drawString(rawBuf, CARD_3_RECT.x + 12, CARD_3_RECT.y + 108);

    drawManualFeedButton();
}

static void refreshLiveSensorData()
{
    const float temp = tempSensorReadC();
    if (temp != TEMP_SENSOR_ERROR)
    {
        waterTempC = temp;
        tempValid = true;
        Serial.print("[TEMP] Temperature -> ");
        Serial.print(waterTempC, 2);
        Serial.println(" C");
    }
    else
    {
        Serial.println("[TEMP] Failed to read sensor");
    }

    turbidityRaw = turbiditySensorReadRaw();
    turbidityNtu = turbiditySensorReadNtu();
    turbidityValid = true;
    Serial.print("[TURBIDITY] Raw ADC -> ");
    Serial.println(turbidityRaw);
    Serial.print("[TURBIDITY] NTU -> ");
    Serial.print(turbidityNtu, 2);
    Serial.println(" NTU");

    if (!phRequestIssued && !phRequestInFlight)
    {
        phSensorRequestSample();
        phRequestInFlight = true;
        phRequestIssued = true;
        Serial.println("[PH] Sample request issued");
    }
}

static void updatePhState()
{
    phSensorLoop();

    if (phRequestInFlight && phSensorSampleReady())
    {
        const float samplePh = phSensorGetPh();
        const float sampleVoltage = phSensorLastVoltage();
        const float sampleRaw = phSensorLastRawAdc();

        if (samplePh >= 0.0f)
        {
            phLevel = samplePh;
            phVoltage = sampleVoltage;
            phValid = true;

            Serial.println("[PH] Sample ready");
            Serial.print("[PH] Raw ADC (avg) -> ");
            Serial.println((int)sampleRaw);
            Serial.print("[PH] Module voltage -> ");
            Serial.print(phVoltage, 3);
            Serial.println(" V");
            Serial.print("[PH] pH -> ");
            Serial.println(phLevel, 3);
        }
        else
        {
            Serial.println("[PH] Sample error");
        }

        phRequestInFlight = false;
        phRequestIssued = false;
    }
}

static void handleTouch()
{
    if (wifiConnected)
    {
        touchWasDown = false;
        return;
    }

    if (!touch.touched())
    {
        touchWasDown = false;
        return;
    }

    const TS_Point raw = touch.getPoint();
    const ScreenPoint p = mapTouchToScreen(raw.x, raw.y);

    if (!touchWasDown && pointInRect(p.x, p.y, FEED_RECT))
    {
        touchWasDown = true;
        manualFeedFlash = true;
        manualFeedFlashUntilMs = millis() + MANUAL_FEED_FLASH_MS;
        Serial.println("Servo Triggered");
        drawManualFeedButton();
    }
    else
    {
        touchWasDown = true;
    }
}

void setup()
{
    Serial.begin(115200);

    SPI.begin(SPI_SCK_PIN, SPI_MISO_PIN, SPI_MOSI_PIN);

    tempSensorInit();
    turbiditySensorInit();
    phSensorInit();

    tft.init();
    tft.setRotation(1);
    tft.fillScreen(COLOR_BG);

    pinMode(TOUCH_IRQ_PIN, INPUT_PULLUP);
    touch.begin();

    drawUI();
    lastRefreshMs = millis();

    Serial.println("[BOOT] FishMaster dashboard ready");
}

void loop()
{
    handleTouch();
    updatePhState();

    if (manualFeedFlash && millis() >= manualFeedFlashUntilMs)
    {
        manualFeedFlash = false;
        drawManualFeedButton();
    }

    if (wifiConnected != lastWifiConnected)
    {
        lastWifiConnected = wifiConnected;
        drawUI();
    }

    const unsigned long now = millis();
    if (now - lastRefreshMs >= REFRESH_INTERVAL_MS)
    {
        lastRefreshMs = now;
        refreshLiveSensorData();
        drawUI();
    }
}
