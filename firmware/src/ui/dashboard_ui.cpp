// =============================================================================
// dashboard_ui.cpp  —  FishMaster ESP32 TFT Dashboard
// Optimized Version
//
// Changes:
// - Removed heavy animated background redraws
// - Kept clean ocean gradient
// - Added ONLY lightweight bubble animation
// - Lower CPU usage
// - Less SPI traffic
// - Much smoother touch response
// - Reduced flickering
// =============================================================================

#include "dashboard_ui.h"

#include <SPI.h>
#include <TFT_eSPI.h>
#include <XPT2046_Touchscreen.h>
#include <math.h>

// =============================================================================
// Hardware
// =============================================================================

static TFT_eSPI tft;
static XPT2046_Touchscreen touch(TOUCH_CS);

// =============================================================================
// Screen
// =============================================================================

static constexpr int SCREEN_W = 320;
static constexpr int SCREEN_H = 240;

// =============================================================================
// Colors
// =============================================================================

static constexpr uint16_t COL_SKY    = 0x867F;
static constexpr uint16_t COL_OCEAN  = 0x041F;
static constexpr uint16_t COL_MINT   = 0x87F0;
static constexpr uint16_t COL_CORAL  = 0xFACA;
static constexpr uint16_t COL_NAVY   = 0x10A2;
static constexpr uint16_t COL_WHITE  = TFT_WHITE;
static constexpr uint16_t COL_BLACK  = TFT_BLACK;
static constexpr uint16_t COL_BUBBLE = 0xCFFF;

// =============================================================================
// Boot colors
// =============================================================================

static constexpr uint16_t BOOT_OCEAN = 0x2B9D;
static constexpr uint16_t BOOT_CORAL = 0xE16B;
static constexpr uint16_t BOOT_GOLD  = 0xE605;
static constexpr uint16_t BOOT_MINT  = 0x57EA;

// =============================================================================
// Pages
// =============================================================================

enum class Page
{
    HOME,
    ANALYTICS,
    HISTORY,
    SETTINGS
};

static Page currentPage = Page::HOME;

// =============================================================================
// Rect
// =============================================================================

struct Rect
{
    int x;
    int y;
    int w;
    int h;
};

// =============================================================================
// Layout
// =============================================================================

static constexpr Rect CARD_TEMP    = {  8,  58,  96, 100 };
static constexpr Rect CARD_PH      = {112,  58,  96, 100 };
static constexpr Rect CARD_TURB    = {216,  58,  96, 100 };

static constexpr Rect FEED_BTN     = { 40, 165, 240,  42 };

static constexpr Rect NAV_HOME     = { 10, 214,  70, 22 };
static constexpr Rect NAV_GRAPH    = { 88, 214,  70, 22 };
static constexpr Rect NAV_HISTORY  = {166, 214,  70, 22 };
static constexpr Rect NAV_SETTINGS = {244, 214,  70, 22 };

// =============================================================================
// Runtime state
// =============================================================================

static bool  wifiConnected     = false;
static bool  manualFeedRequest = false;

static float waterTemp = 28.4f;
static float phValue   = 7.2f;
static float turbidity = 11.0f;


// =============================================================================
// Touch
// =============================================================================

static unsigned long lastTouchMs = 0;
static constexpr unsigned long TOUCH_DEBOUNCE_MS = 180;

// =============================================================================
// Dirty redraw
// =============================================================================

static bool needsRedraw = true;

static inline void markDirty()
{
    needsRedraw = true;
}

// =============================================================================
// Utility
// =============================================================================

static bool pointInRect(int x, int y, Rect r)
{
    return x >= r.x &&
           x <= r.x + r.w &&
           y >= r.y &&
           y <= r.y + r.h;
}

// =============================================================================
// Background
// =============================================================================

static void drawBackground()
{
    tft.fillScreen(COL_SKY);

    for (int row = 0; row < 160; row++)
    {
        uint16_t c = tft.color565(
            0,
            90 + row / 3,
            170 + row / 5
        );

        tft.drawFastHLine(0, row + 40, SCREEN_W, c);
    }
}

// =============================================================================
// Lightweight bubbles
// =============================================================================


// =============================================================================
// Header
// =============================================================================

static void drawHeader()
{
    tft.fillRoundRect(10, 8, 300, 26, 12, COL_NAVY);

    tft.setTextColor(COL_WHITE, COL_NAVY);
    tft.setTextDatum(ML_DATUM);

    tft.setTextFont(4);
    tft.drawString("FishMaster", 18, 22);

    tft.setTextFont(2);

    if (wifiConnected)
    {
        tft.fillCircle(280, 20, 5, COL_MINT);
        tft.drawString("ONLINE", 220, 22);
    }
    else
    {
        tft.fillCircle(280, 20, 5, COL_CORAL);
        tft.drawString("LOCAL", 228, 22);
    }
}

// =============================================================================
// Navbar
// =============================================================================

static void drawNavbar()
{
    static const Rect tabs[4] =
    {
        NAV_HOME,
        NAV_GRAPH,
        NAV_HISTORY,
        NAV_SETTINGS
    };

    static const char* labels[4] =
    {
        "HOME",
        "GRAPH",
        "LOG",
        "SET"
    };

    for (int i = 0; i < 4; i++)
    {
        bool active = ((int)currentPage == i);

        uint16_t fill =
            active ? COL_NAVY : COL_WHITE;

        tft.fillRoundRect(
            tabs[i].x,
            tabs[i].y,
            tabs[i].w,
            tabs[i].h,
            10,
            fill
        );

        tft.setTextDatum(MC_DATUM);

        tft.setTextColor(
            active ? COL_WHITE : COL_NAVY,
            fill
        );

        tft.setTextFont(2);

        tft.drawString(
            labels[i],
            tabs[i].x + tabs[i].w / 2,
            tabs[i].y + 11
        );
    }
}

// =============================================================================
// Sensor card
// =============================================================================

static void drawSensorCard(
    Rect r,
    const char* icon,
    const char* title,
    float value,
    const char* unit,
    uint16_t accent)
{
    tft.fillRoundRect(r.x, r.y, r.w, r.h, 16, COL_WHITE);

    tft.drawRoundRect(r.x, r.y, r.w, r.h, 16, accent);

    tft.setTextColor(accent, COL_WHITE);

    tft.setTextFont(2);

    tft.drawCentreString(
        icon,
        r.x + r.w / 2,
        r.y + 8,
        2
    );

    tft.drawCentreString(
        title,
        r.x + r.w / 2,
        r.y + 24,
        2
    );

    char buf[16];

    snprintf(buf, sizeof(buf), "%.1f", value);

    tft.setTextFont(4);

    tft.drawCentreString(
        buf,
        r.x + r.w / 2,
        r.y + 42,
        4
    );

    tft.drawCentreString(
        unit,
        r.x + r.w / 2,
        r.y + 74,
        4
    );
}

// =============================================================================
// Feed button
// =============================================================================

static void drawFeedButton(bool pressed)
{
    uint16_t fill =
        pressed ? COL_CORAL : COL_MINT;

    tft.fillRoundRect(
        FEED_BTN.x,
        FEED_BTN.y,
        FEED_BTN.w,
        FEED_BTN.h,
        18,
        fill
    );

    tft.drawRoundRect(
        FEED_BTN.x,
        FEED_BTN.y,
        FEED_BTN.w,
        FEED_BTN.h,
        18,
        COL_WHITE
    );

    tft.setTextColor(COL_NAVY, fill);

    tft.setTextDatum(MC_DATUM);
    tft.setTextFont(4);

    tft.drawString(
        "FEED FISH!",
        SCREEN_W / 2,
        186
    );
}

// =============================================================================
// Fish mascot
// =============================================================================

static void drawFishMascot()
{
    tft.fillCircle(34, 188, 14, COL_CORAL);

    tft.fillTriangle(
        20, 188,
        10, 180,
        10, 196,
        COL_CORAL
    );

    tft.fillCircle(39, 184, 2, COL_NAVY);

    bool unhappy =
        (waterTemp > 31.0f || turbidity > 40.0f);

    if (unhappy)
    {
        tft.drawArc(
            38, 192,
            5, 4,
            180, 360,
            COL_NAVY,
            COL_WHITE
        );
    }
    else
    {
        tft.drawArc(
            38, 190,
            5, 4,
            0, 180,
            COL_NAVY,
            COL_WHITE
        );
    }
}

// =============================================================================
// Home page
// =============================================================================

static void drawHomePage()
{
    drawBackground();

    drawHeader();

    drawSensorCard(
        CARD_TEMP,
        "T",
        "TEMP",
        waterTemp,
        "C",
        waterTemp > 30.0f ? COL_CORAL : COL_OCEAN
    );

    drawSensorCard(
        CARD_PH,
        "P",
        "PH",
        phValue,
        "pH",
        (phValue < 6.5f || phValue > 8.0f)
            ? COL_CORAL
            : COL_MINT
    );

    drawSensorCard(
        CARD_TURB,
        "W",
        "CLEAR",
        turbidity,
        "NTU",
        turbidity > 40.0f
            ? COL_CORAL
            : COL_SKY
    );

    drawFeedButton(false);

    drawFishMascot();


    tft.setTextColor(COL_WHITE);
    tft.setTextFont(2);

    tft.drawString(
        turbidity > 40.0f
            ? "Water dirty!"
            : "Tank happy today!",
        58,
        184
    );

    drawNavbar();
}

// =============================================================================
// Analytics
// =============================================================================

static void drawAnalyticsPage()
{
    drawBackground();

    drawHeader();

    tft.fillRoundRect(
        12,
        52,
        296,
        150,
        18,
        COL_WHITE
    );

    tft.drawRoundRect(
        12,
        52,
        296,
        150,
        18,
        COL_NAVY
    );

    for (int x = 20; x < 290; x++)
    {
        int y =
            120 +
            (int)(sinf(x * 0.05f) * 30.0f);

        tft.fillCircle(x, y, 2, COL_OCEAN);
    }

    tft.setTextColor(COL_NAVY, COL_WHITE);

    tft.setTextFont(4);
    tft.drawString("Tank Trends", 70, 70);

    tft.setTextFont(2);
    tft.drawString("Temp stable", 30, 170);
    tft.drawString("pH healthy", 30, 185);

    drawNavbar();
}

// =============================================================================
// History
// =============================================================================

static void drawHistoryPage()
{
    drawBackground();

    drawHeader();

    static const char* logs[] =
    {
        "Feed completed",
        "Cloud synced",
        "pH stable",
        "Water checked",
        "Fish fed"
    };

    int y = 58;

    for (int i = 0; i < 5; i++)
    {
        tft.fillRoundRect(
            18,
            y,
            284,
            24,
            12,
            COL_WHITE
        );

        tft.setTextColor(COL_NAVY, COL_WHITE);

        tft.setTextFont(2);

        tft.drawString(logs[i], 28, y + 7);

        y += 30;
    }

    drawNavbar();
}

// =============================================================================
// Settings
// =============================================================================

static void drawSettingsPage()
{
    drawBackground();

    drawHeader();

    static const char* items[] =
    {
        "Cloud Sync",
        "Alerts",
        "Auto Feed",
        "Night Mode"
    };

    int y = 60;

    for (int i = 0; i < 4; i++)
    {
        tft.fillRoundRect(
            18,
            y,
            284,
            28,
            12,
            COL_WHITE
        );

        tft.setTextColor(COL_NAVY, COL_WHITE);

        tft.setTextFont(2);

        tft.drawString(items[i], 28, y + 8);

        tft.fillRoundRect(
            250,
            y + 4,
            40,
            18,
            9,
            COL_MINT
        );

        tft.fillCircle(
            278,
            y + 13,
            7,
            COL_WHITE
        );

        y += 36;
    }

    drawNavbar();
}

// =============================================================================
// Render
// =============================================================================

static void render()
{
    switch (currentPage)
    {
        case Page::HOME:
            drawHomePage();
            break;

        case Page::ANALYTICS:
            drawAnalyticsPage();
            break;

        case Page::HISTORY:
            drawHistoryPage();
            break;

        case Page::SETTINGS:
            drawSettingsPage();
            break;
    }
}

// =============================================================================
// Touch
// =============================================================================

static TS_Point readTouchPoint()
{
    digitalWrite(TFT_CS, HIGH);

    delayMicroseconds(10);

    return touch.getPoint();
}

static void handleTouch()
{
    digitalWrite(TFT_CS, HIGH);

    bool touchedNow = touch.touched();

    if (!touchedNow)
        return;

    unsigned long now = millis();

    if (now - lastTouchMs < TOUCH_DEBOUNCE_MS)
        return;

    TS_Point p = readTouchPoint();

    // FIX 1: Remove the 2800 upper limit! Only check if pressure is strong enough (> 150)
    if (p.z < 150)
        return;

    int x = map(p.x, 340, 3860, 0, SCREEN_W);
    int y = map(p.y, 200, 3860, 0, SCREEN_H);

    // Mirroring calculation matching your setup
    x = SCREEN_W - x;

    x = constrain(x, 0, SCREEN_W - 1);
    y = constrain(y, 0, SCREEN_H - 1);

    // FIX 2: Debugging radar lines. Open your Serial Monitor to see these!
    Serial.print("Touch Detected -> Raw X: "); Serial.print(p.x);
    Serial.print(" | Raw Y: "); Serial.print(p.y);
    Serial.print(" | Pressure Z: "); Serial.print(p.z);
    Serial.print(" -> TARGET MAPPED X: "); Serial.print(x);
    Serial.print(" | Y: "); Serial.println(y);

    lastTouchMs = now;

    if (pointInRect(x, y, NAV_HOME))
    {
        Serial.println("[NAV] Home Clicked!");
        currentPage = Page::HOME;
        markDirty();
    }

    if (pointInRect(x, y, NAV_GRAPH))
    {
        Serial.println("[NAV] Graph Clicked!");
        currentPage = Page::ANALYTICS;
        markDirty();
    }

    if (pointInRect(x, y, NAV_HISTORY))
    {
        Serial.println("[NAV] History Clicked!");
        currentPage = Page::HISTORY;
        markDirty();
    }

    if (pointInRect(x, y, NAV_SETTINGS))
    {
        Serial.println("[NAV] Settings Clicked!");
        currentPage = Page::SETTINGS;
        markDirty();
    }

    if (pointInRect(x, y, FEED_BTN))
    {
        Serial.println("[BTN] Feed Fish Clicked!");
        manualFeedRequest = true;

        drawFeedButton(true);
        delay(80);
        drawFeedButton(false);
    }
}

// =============================================================================
// Init
// =============================================================================

void dashboardInit()
{
    SPI.begin(
        TFT_SCLK,
        TFT_MISO,
        TFT_MOSI
    );

    pinMode(TFT_CS, OUTPUT);
    digitalWrite(TFT_CS, HIGH);

    pinMode(TOUCH_CS, OUTPUT);
    digitalWrite(TOUCH_CS, HIGH);

    touch.begin();
    touch.setRotation(1);

    tft.init();
    tft.setRotation(3);

    render();
}

// =============================================================================
// Main loop
// =============================================================================
void dashboardLoop()
{
    handleTouch();

    if (needsRedraw)
    {
        needsRedraw = false;
        render();
    }
}

// =============================================================================
// Sensor setters
// =============================================================================

void dashboardSetWifiConnected(bool connected)
{
    if (connected != wifiConnected)
    {
        wifiConnected = connected;
        markDirty();
    }
}

void dashboardSetWaterTemp(float tempC, bool valid)
{
    if (valid && fabsf(tempC - waterTemp) > 0.05f)
    {
        waterTemp = tempC;
        markDirty();
    }
}

void dashboardSetPh(
    float ph,
    float,
    float,
    bool valid)
{
    if (valid && fabsf(ph - phValue) > 0.05f)
    {
        phValue = ph;
        markDirty();
    }
}

void dashboardSetTurbidity(
    float ntu,
    int,
    bool valid)
{
    if (valid && fabsf(ntu - turbidity) > 0.05f)
    {
        turbidity = ntu;
        markDirty();
    }
}

void dashboardSetInternalTemp(float, bool)
{
}

bool dashboardConsumeManualFeedRequest()
{
    bool r = manualFeedRequest;

    manualFeedRequest = false;

    return r;
}