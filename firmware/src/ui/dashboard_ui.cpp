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

static void drawSensorCard(const Rect &r, const char *title, const char *value, const char *unit)
{
    tft.fillRoundRect(r.x, r.y, r.w, r.h, 8, COLOR_BLUE_PANEL);
    tft.drawRoundRect(r.x, r.y, r.w, r.h, 8, COLOR_BLUE);

    tft.setTextFont(2);
    tft.setTextSize(1);
    tft.setTextDatum(TL_DATUM);
    tft.setTextColor(COLOR_WHITE, COLOR_BLUE_PANEL);
    tft.drawString(title, r.x + 10, r.y + 14);

    tft.setTextFont(4);
    tft.setTextSize(1);
    tft.setTextDatum(MC_DATUM);
    tft.setTextColor(COLOR_WHITE, COLOR_BLUE_PANEL);
    tft.drawString(value, r.x + r.w / 2, r.y + r.h / 2 + 8);

    tft.setTextFont(2);
    tft.setTextSize(1);
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
    tft.setTextFont(4);
    tft.setTextSize(2);
    tft.setTextDatum(MC_DATUM);
    tft.setTextColor(textColor, fill);
    tft.drawString("MANUAL FEED", FEED_RECT.x + FEED_RECT.w / 2, FEED_RECT.y + FEED_RECT.h / 2 + 5);
}

static void drawUI()
{
    char tempBuf[16];
    char phBuf[16];
    char turbBuf[16];
    char rawBuf[24];
    char chipBuf[16];

    formatFloat(tempBuf, sizeof(tempBuf), waterTempValid ? waterTempC : NAN, 1);
    formatFloat(phBuf, sizeof(phBuf), phValid ? phValue : NAN, 2);
    formatFloat(turbBuf, sizeof(turbBuf), turbidityValid ? turbidityNtu : NAN, 1);
    formatFloat(chipBuf, sizeof(chipBuf), chipTempValid ? chipTempC : NAN, 1);
    snprintf(rawBuf, sizeof(rawBuf), "RAW ADC: %d", turbidityRaw);

    drawHeader();
    drawSensorCard(CARD_1_RECT, "Water Temp", tempBuf, "C");
    drawSensorCard(CARD_2_RECT, "pH Level", phBuf, "pH");
    drawSensorCard(CARD_3_RECT, "Turbidity", turbBuf, "NTU");

    tft.setTextFont(2);
    tft.setTextSize(1);
    tft.setTextDatum(TL_DATUM);
    tft.setTextColor(COLOR_BLUE, COLOR_BG);
    tft.drawString(rawBuf, CARD_3_RECT.x + 10, CARD_3_RECT.y + 108);
    char chipLine[24];
    snprintf(chipLine, sizeof(chipLine), "Chip Temp: %s C", chipBuf);
    tft.drawString(chipLine, CARD_1_RECT.x + 8, CARD_1_RECT.y + 108);

    drawManualFeedButton();
    uiDirty = false;
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
        uiDirty = true;
    }
    else
    {
        touchWasDown = true;
    }
}

void dashboardInit(void)
{
    SPI.begin(SPI_SCK_PIN, SPI_MISO_PIN, SPI_MOSI_PIN);
    pinMode(TOUCH_IRQ_PIN, INPUT_PULLUP);
    touch.begin();

    tft.init();
    tft.setRotation(3);
    tft.fillScreen(COLOR_BG);

    lastUiRefreshMs = millis();
    uiDirty = true;
    drawUI();

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
        drawUI();
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
