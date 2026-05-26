#include "dashboard_ui.h"

#include <SPI.h>
#include "tft_setup.h"
#include <TFT_eSPI.h>
#include <XPT2046_Touchscreen.h>


static constexpr uint8_t SPI_SCK_PIN = 18;
static constexpr uint8_t SPI_MOSI_PIN = 23;
static constexpr uint8_t SPI_MISO_PIN = 19;
static constexpr uint8_t TOUCH_CS_PIN = 21;
static constexpr uint8_t TOUCH_IRQ_PIN = 22;

static constexpr int16_t SCREEN_W = 320;
static constexpr int16_t SCREEN_H = 240;

static constexpr int16_t TOUCH_RAW_X_MIN = 220;
static constexpr int16_t TOUCH_RAW_X_MAX = 3800;
static constexpr int16_t TOUCH_RAW_Y_MIN = 300;
static constexpr int16_t TOUCH_RAW_Y_MAX = 3800;

static constexpr uint16_t COLOR_BG = TFT_BLACK;
static constexpr uint16_t COLOR_BLUE = TFT_BLUE;
static constexpr uint16_t COLOR_BLUE_DARK = 0x0010;
static constexpr uint16_t COLOR_BLUE_PANEL = 0x0018;
static constexpr uint16_t COLOR_WHITE = TFT_WHITE;
static constexpr uint16_t COLOR_GREEN = TFT_GREEN;
static constexpr uint16_t COLOR_RED = TFT_RED;
static constexpr uint16_t COLOR_GRAY = 0x7BEF;
static constexpr uint16_t COLOR_DARK_GREY = 0x3186;

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

TFT_eSPI tft;
XPT2046_Touchscreen touch(TOUCH_CS_PIN, TOUCH_IRQ_PIN);

static bool wifiConnected = false;
static bool lastWifiConnected = false;
static bool touchWasDown = false;
static bool manualFeedFlash = false;
static unsigned long manualFeedFlashUntilMs = 0;
static bool manualFeedPressed = false;
static ScreenPoint lastTouchDownPoint = {0, 0};
static constexpr unsigned long MANUAL_FEED_FLASH_MS = 180;

static bool waterTempValid = false;
static bool phValid = false;
static bool turbidityValid = false;
static bool chipTempValid = false;

static float waterTempC = NAN;
static float phValue = NAN;
static float phVoltage = NAN;
static float phRawAdc = NAN;
static float turbidityNtu = NAN;
static int turbidityRaw = 0;
static float chipTempC = NAN;

static bool uiDirty = true;
static unsigned long lastUiRefreshMs = 0;
static constexpr unsigned long UI_REFRESH_INTERVAL_MS = 2000;

static bool pointInRect(int16_t x, int16_t y, const Rect &r)
{
    return (x >= r.x) && (x < (r.x + r.w)) && (y >= r.y) && (y < (r.y + r.h));
}

static ScreenPoint mapTouchToScreen(int16_t rawX, int16_t rawY)
{
    ScreenPoint p;
    p.x = SCREEN_W - 1 - map(rawX, TOUCH_RAW_X_MIN, TOUCH_RAW_X_MAX, 0, SCREEN_W - 1);
    p.y = SCREEN_H - 1 - map(rawY, TOUCH_RAW_Y_MIN, TOUCH_RAW_Y_MAX, 0, SCREEN_H - 1);
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
    const uint16_t fill = wifiConnected ? COLOR_GREEN : COLOR_RED;
    const char *label = wifiConnected ? "Cloud Sync: ON" : "Admin Mode: LOCAL";

    tft.fillRoundRect(STATUS_RECT.x, STATUS_RECT.y, STATUS_RECT.w, STATUS_RECT.h, 6, fill);
    tft.drawRoundRect(STATUS_RECT.x, STATUS_RECT.y, STATUS_RECT.w, STATUS_RECT.h, 6, COLOR_WHITE);
    tft.setTextFont(2);
    tft.setTextSize(1);
    tft.setTextDatum(MC_DATUM);
    tft.setTextColor(TFT_BLACK, fill);
    tft.drawString(label, STATUS_RECT.x + STATUS_RECT.w / 2, STATUS_RECT.y + STATUS_RECT.h / 2 + 1);
}

static void drawHeader()
{
    tft.fillRect(HEADER_RECT.x, HEADER_RECT.y, HEADER_RECT.w, HEADER_RECT.h, COLOR_BLUE_DARK);
    tft.drawFastHLine(0, HEADER_RECT.h - 1, SCREEN_W, COLOR_BLUE);
    tft.setTextFont(4);
    tft.setTextSize(1);
    tft.setTextDatum(ML_DATUM);
    tft.setTextColor(COLOR_WHITE, COLOR_BLUE_DARK);
    tft.drawString("FISHMASTER DASHBOARD", 10, 18);
    drawStatusIndicator();
}
// Draw static frame once and helpers to redraw only dynamic parts
static void drawStaticFrame()
{
    tft.fillScreen(COLOR_BG);

    // Header
    drawHeader();

    // Draw three sensor cards with black fill and 2px blue border
    const Rect cards[3] = {CARD_1_RECT, CARD_2_RECT, CARD_3_RECT};
    for (int i = 0; i < 3; ++i)
    {
        const Rect &r = cards[i];
        tft.fillRoundRect(r.x, r.y, r.w, r.h, 8, TFT_BLACK);
        tft.drawRoundRect(r.x, r.y, r.w, r.h, 8, COLOR_BLUE);
        tft.drawRoundRect(r.x + 1, r.y + 1, r.w - 2, r.h - 2, 7, COLOR_BLUE);
        // Title slot (small font)
        tft.setFreeFont(&FreeSans12pt7b);
        tft.setTextDatum(TL_DATUM);
        tft.setTextColor(COLOR_WHITE, TFT_BLACK);
        // Titles will be drawn by drawSensorValue on first run
    }

    // Draw initial manual feed button background and border
    tft.fillRoundRect(FEED_RECT.x, FEED_RECT.y, FEED_RECT.w, FEED_RECT.h, 10, COLOR_BLUE);
    tft.drawRoundRect(FEED_RECT.x, FEED_RECT.y, FEED_RECT.w, FEED_RECT.h, 10, COLOR_WHITE);
}

static uint16_t valueColorForTemp(float tempC)
{
    if (!isnan(tempC) && tempC > 30.0f)
        return COLOR_RED;
    return COLOR_WHITE;
}

static uint16_t valueColorForPh(float ph)
{
    if (!isnan(ph) && (ph < 6.5f || ph > 8.0f))
        return COLOR_RED;
    return COLOR_WHITE;
}

static void drawSensorValue(const Rect &r, const char *title, const char *valueStr, const char *unit, uint16_t valueColor)
{
    // Title
    tft.setFreeFont(&FreeSans12pt7b);
    tft.setTextDatum(TL_DATUM);
    tft.setTextColor(COLOR_WHITE, TFT_BLACK);
    tft.drawString(title, r.x + 8, r.y + 8);

    // Clear inner area for value without touching border
    const int16_t vx = r.x + 8;
    const int16_t vy = r.y + 28;
    const int16_t vw = r.w - 16;
    const int16_t vh = r.h - 40;
    tft.fillRect(vx, vy, vw, vh, TFT_BLACK);

    // Large centered value using FreeFont
    tft.setFreeFont(&FreeSansBold24pt7b);
    tft.setTextDatum(MC_DATUM);
    tft.setTextColor(valueColor, TFT_BLACK);
    tft.drawString(valueStr, r.x + r.w / 2, r.y + r.h / 2 + 4);

    // Unit small text
    tft.setFreeFont(&FreeSans12pt7b);
    tft.setTextDatum(MC_DATUM);
    tft.setTextColor(COLOR_BLUE, TFT_BLACK);
    tft.drawString(unit, r.x + r.w / 2, r.y + r.h - 12);
}

static void drawManualFeedState(bool pressed, bool enabled)
{
    uint16_t fill = enabled ? (pressed ? COLOR_DARK_GREY : COLOR_BLUE) : COLOR_GRAY;
    uint16_t border = enabled ? COLOR_WHITE : COLOR_GRAY;
    uint16_t textColor = enabled ? COLOR_WHITE : COLOR_BLUE_DARK;

    tft.fillRoundRect(FEED_RECT.x, FEED_RECT.y, FEED_RECT.w, FEED_RECT.h, 10, fill);
    tft.drawRoundRect(FEED_RECT.x, FEED_RECT.y, FEED_RECT.w, FEED_RECT.h, 10, border);
    tft.setFreeFont(&FreeSansBold12pt7b);
    tft.setTextDatum(MC_DATUM);
    tft.setTextColor(textColor, fill);
    tft.drawString("MANUAL FEED", FEED_RECT.x + FEED_RECT.w / 2, FEED_RECT.y + FEED_RECT.h / 2 + 2);
}

static void drawUI()
{
    char buf[24];
    formatFloat(buf, sizeof(buf), waterTempValid ? waterTempC : NAN, 1);
    drawSensorValue(CARD_1_RECT, "Water Temp", buf, "C", valueColorForTemp(waterTempC));

    formatFloat(buf, sizeof(buf), phValid ? phValue : NAN, 2);
    drawSensorValue(CARD_2_RECT, "pH Level", buf, "pH", valueColorForPh(phValue));

    formatFloat(buf, sizeof(buf), turbidityValid ? turbidityNtu : NAN, 1);
    drawSensorValue(CARD_3_RECT, "Turbidity", buf, "NTU", COLOR_WHITE);

    const bool enabled = !wifiConnected;
    const bool showPressed = manualFeedPressed || (manualFeedFlash && enabled);
    drawManualFeedState(showPressed, enabled);

    uiDirty = false;
}

static void handleTouch()
{
    if (wifiConnected)
    {
        touchWasDown = false;
        manualFeedPressed = false;
        return;
    }

    if (!touch.touched())
    {
        // If we previously had a touch down, this is a release event
        if (touchWasDown)
        {
            // If button was pressed and release occurred (inside down-point), trigger action
            if (manualFeedPressed && pointInRect(lastTouchDownPoint.x, lastTouchDownPoint.y, FEED_RECT))
            {
                manualFeedFlash = true;
                manualFeedFlashUntilMs = millis() + MANUAL_FEED_FLASH_MS;
                Serial.println("Servo Triggered");
                uiDirty = true;
            }
            manualFeedPressed = false;
        }
        touchWasDown = false;
        return;
    }

    const TS_Point raw = touch.getPoint();
    const ScreenPoint p = mapTouchToScreen(raw.x, raw.y);

    if (!touchWasDown)
    {
        // touch-down event
        touchWasDown = true;
        if (pointInRect(p.x, p.y, FEED_RECT))
        {
            manualFeedPressed = true;
            lastTouchDownPoint = p;
            // immediate visual feedback
            drawManualFeedState(true, !wifiConnected);
        }
    }
    else
    {
        // still down; no-op
    }
}

void dashboardInit(void)
{
    SPI.begin(SPI_SCK_PIN, SPI_MISO_PIN, SPI_MOSI_PIN);
    pinMode(TOUCH_IRQ_PIN, INPUT_PULLUP);
    touch.begin();

    tft.init();
    tft.setRotation(3);
    // Draw static frame once
    drawStaticFrame();

    lastUiRefreshMs = millis();
    uiDirty = true;

    // Draw initial sensor values (may be NAN)
    char buf[24];
    formatFloat(buf, sizeof(buf), waterTempValid ? waterTempC : NAN, 1);
    drawSensorValue(CARD_1_RECT, "Water Temp", buf, "C", valueColorForTemp(waterTempC));
    formatFloat(buf, sizeof(buf), phValid ? phValue : NAN, 2);
    drawSensorValue(CARD_2_RECT, "pH Level", buf, "pH", valueColorForPh(phValue));
    formatFloat(buf, sizeof(buf), turbidityValid ? turbidityNtu : NAN, 1);
    drawSensorValue(CARD_3_RECT, "Turbidity", buf, "NTU", COLOR_WHITE);

    drawManualFeedState(false, !wifiConnected);

    Serial.println("[DASHBOARD] UI initialized");
}

void dashboardLoop(void)
{
    handleTouch();

    if (manualFeedFlash && millis() >= manualFeedFlashUntilMs)
    {
        manualFeedFlash = false;
        uiDirty = true;
    }

    if (wifiConnected != lastWifiConnected)
    {
        lastWifiConnected = wifiConnected;
        uiDirty = true;
    }

    const unsigned long now = millis();
    if (uiDirty || (now - lastUiRefreshMs >= UI_REFRESH_INTERVAL_MS))
    {
        lastUiRefreshMs = now;

        // Update only dynamic regions (values and button)
        char buf[24];
        formatFloat(buf, sizeof(buf), waterTempValid ? waterTempC : NAN, 1);
        drawSensorValue(CARD_1_RECT, "Water Temp", buf, "C", valueColorForTemp(waterTempC));

        formatFloat(buf, sizeof(buf), phValid ? phValue : NAN, 2);
        drawSensorValue(CARD_2_RECT, "pH Level", buf, "pH", valueColorForPh(phValue));

        formatFloat(buf, sizeof(buf), turbidityValid ? turbidityNtu : NAN, 1);
        drawSensorValue(CARD_3_RECT, "Turbidity", buf, "NTU", COLOR_WHITE);

        // Button state: pressed if user is holding, or flash state after trigger
        const bool enabled = !wifiConnected;
        const bool showPressed = manualFeedPressed || (manualFeedFlash && enabled);
        drawManualFeedState(showPressed, enabled);

        uiDirty = false;
    }
}

void dashboardSetWifiConnected(bool connected)
{
    wifiConnected = connected;
}

void dashboardSetWaterTemp(float tempC, bool valid)
{
    waterTempC = tempC;
    waterTempValid = valid;
    uiDirty = true;
}

void dashboardSetPh(float ph, float voltage, float rawAdc, bool valid)
{
    phValue = ph;
    phVoltage = voltage;
    phRawAdc = rawAdc;
    phValid = valid;
    uiDirty = true;
}

void dashboardSetTurbidity(float ntu, int rawAdc, bool valid)
{
    turbidityNtu = ntu;
    turbidityRaw = rawAdc;
    turbidityValid = valid;
    uiDirty = true;
}

void dashboardSetInternalTemp(float chipTemp, bool valid)
{
    chipTempC = chipTemp;
    chipTempValid = valid;
    uiDirty = true;
}
