#include "dashboard_ui.h"

#include <SPI.h>
#include <TFT_eSPI.h>
#include <XPT2046_Touchscreen.h>
#include <math.h>

TFT_eSPI tft = TFT_eSPI();

XPT2046_Touchscreen touch(TOUCH_CS);
static constexpr int SCREEN_W = 320;
static constexpr int SCREEN_H = 240;

static constexpr uint16_t SKY = 0x867F;
static constexpr uint16_t OCEAN = 0x041F;
static constexpr uint16_t MINT = 0x87F0;
static constexpr uint16_t CORAL = 0xFACA;
static constexpr uint16_t SAND = 0xFEF2;
static constexpr uint16_t NAVY = 0x10A2;
static constexpr uint16_t WHITE = TFT_WHITE;
static constexpr uint16_t BUBBLE = 0xCFFF;

enum class Page
{
    HOME,
    ANALYTICS,
    HISTORY,
    SETTINGS
};

static Page currentPage = Page::HOME;

struct Rect
{
    int x;
    int y;
    int w;
    int h;
};

static Rect tempCard = {8, 58, 96, 100};
static Rect phCard = {112, 58, 96, 100};
static Rect turbCard = {216, 58, 96, 100};

static Rect feedBtn = {40, 165, 240, 42};

static Rect navHome = {10, 214, 70, 22};
static Rect navGraph = {88, 214, 70, 22};
static Rect navHistory = {166, 214, 70, 22};
static Rect navSettings = {244, 214, 70, 22};

static bool wifiConnected = false;

static float waterTemp = 28.4f;
static float phValue = 7.2f;
static float turbidity = 11.0f;

static bool manualFeedRequest = false;

static unsigned long lastAnim = 0;
static int bubbleOffset = 0;

static bool pointInRect(int x, int y, Rect r)
{
    return x >= r.x &&
           x <= r.x + r.w &&
           y >= r.y &&
           y <= r.y + r.h;
}

static void drawBubble(int x, int y, int r)
{
    tft.drawCircle(x, y, r, BUBBLE);
}

static void drawBackground()
{
    tft.fillScreen(SKY);

    for (int y = 0; y < 160; y++)
    {
        uint16_t c = tft.color565(
            0,
            80 + (y / 2),
            180 + (y / 4));

        tft.drawFastHLine(0, y + 40, SCREEN_W, c);
    }

    for (int i = 0; i < 12; i++)
    {
        int bx = (i * 28 + bubbleOffset) % SCREEN_W;
        int by = 40 + ((i * 40 + bubbleOffset * 2) % 160);

        drawBubble(bx, by, 4);
    }
}

static void drawHeader()
{
    tft.fillRoundRect(10, 8, 300, 26, 12, NAVY);

    tft.setTextColor(WHITE, NAVY);
    tft.setTextDatum(ML_DATUM);
    tft.setTextFont(4);

    tft.drawString("FishMaster", 18, 22);

    if (wifiConnected)
    {
        tft.fillCircle(280, 20, 5, MINT);
        tft.setTextFont(2);
        tft.drawString("ONLINE", 220, 22);
    }
    else
    {
        tft.fillCircle(280, 20, 5, CORAL);
        tft.setTextFont(2);
        tft.drawString("LOCAL", 228, 22);
    }
}

static void drawCard(
    Rect r,
    const char *emoji,
    const char *title,
    float value,
    const char *unit,
    uint16_t color)
{
    tft.fillRoundRect(r.x, r.y, r.w, r.h, 16, WHITE);

    tft.drawRoundRect(r.x, r.y, r.w, r.h, 16, color);

    tft.setTextColor(color, WHITE);

    tft.setTextFont(2);
    tft.drawCentreString(emoji, r.x + r.w / 2, r.y + 8, 2);

    tft.setTextFont(2);
    tft.drawCentreString(title, r.x + r.w / 2, r.y + 24, 2);

    char buf[16];
    snprintf(buf, sizeof(buf), "%.1f", value);

    tft.setTextFont(4);
    tft.drawCentreString(buf, r.x + r.w / 2, r.y + 42, 4);

    tft.setTextFont(4);
    tft.drawCentreString(unit, r.x + r.w / 2, r.y + 74, 4);
}

static void drawFeedButton(bool pressed)
{
    uint16_t fill = pressed ? CORAL : MINT;

    tft.fillRoundRect(
        feedBtn.x,
        feedBtn.y,
        feedBtn.w,
        feedBtn.h,
        18,
        fill);

    tft.drawRoundRect(
        feedBtn.x,
        feedBtn.y,
        feedBtn.w,
        feedBtn.h,
        18,
        WHITE);

    tft.setTextColor(NAVY, fill);
    tft.setTextDatum(MC_DATUM);
    tft.setTextFont(4);

    tft.drawString(
        "FEED FISH!",
        SCREEN_W / 2,
        186);
}

static void drawNavbar()
{
    Rect tabs[4] = {
        navHome,
        navGraph,
        navHistory,
        navSettings};

    const char *labels[4] = {
        "HOME",
        "GRAPH",
        "LOG",
        "SET"};

    for (int i = 0; i < 4; i++)
    {
        bool active = false;

        if ((int)currentPage == i)
            active = true;

        uint16_t fill = active ? NAVY : WHITE;

        tft.fillRoundRect(
            tabs[i].x,
            tabs[i].y,
            tabs[i].w,
            tabs[i].h,
            10,
            fill);

        tft.setTextDatum(MC_DATUM);

        if (active)
            tft.setTextColor(WHITE, fill);
        else
            tft.setTextColor(NAVY, fill);

        tft.setTextFont(2);

        tft.drawString(
            labels[i],
            tabs[i].x + tabs[i].w / 2,
            tabs[i].y + 11);
    }
}

static void drawFishMascot()
{
    tft.fillCircle(34, 188, 14, CORAL);

    tft.fillTriangle(
        20, 188,
        10, 180,
        10, 196,
        CORAL);

    tft.fillCircle(39, 184, 2, NAVY);

    if (waterTemp > 31 || turbidity > 40)
    {
        tft.drawArc(38, 192, 5, 4, 180, 360, NAVY, WHITE);
    }
    else
    {
        tft.drawArc(38, 190, 5, 4, 0, 180, NAVY, WHITE);
    }
}

static void drawDashboard()
{
    drawBackground();

    drawHeader();

    drawCard(
        tempCard,
        "T",
        "TEMP",
        waterTemp,
        "C",
        waterTemp > 30 ? CORAL : OCEAN);

    drawCard(
        phCard,
        "P",
        "PH",
        phValue,
        "pH",
        (phValue < 6.5 || phValue > 8.0)
            ? CORAL
            : MINT);

    drawCard(
        turbCard,
        "W",
        "CLEAR",
        turbidity,
        "NTU",
        turbidity > 40 ? CORAL : SKY);

    drawFeedButton(false);

    drawFishMascot();

    tft.setTextColor(WHITE);
    tft.setTextFont(2);

    if (turbidity > 40)
    {
        tft.drawString("Water dirty!", 58, 184);
    }
    else
    {
        tft.drawString("Tank happy today!", 58, 184);
    }

    drawNavbar();
}

static void drawAnalytics()
{
    drawBackground();

    drawHeader();

    tft.fillRoundRect(12, 52, 296, 150, 18, WHITE);

    tft.drawRoundRect(12, 52, 296, 150, 18, NAVY);

    for (int x = 20; x < 290; x++)
    {
        int y = 120 + sinf(x * 0.05f) * 30;

        tft.fillCircle(x, y, 2, OCEAN);
    }

    tft.setTextColor(NAVY, WHITE);
    tft.setTextFont(4);

    tft.drawString("Tank Trends", 70, 70);

    tft.setTextFont(2);

    tft.drawString("Temp stable", 30, 170);
    tft.drawString("pH healthy", 30, 185);

    drawNavbar();
}

static void drawHistory()
{
    drawBackground();

    drawHeader();

    const char *logs[] = {
        "Feed completed",
        "Cloud synced",
        "pH stable",
        "Water checked",
        "Fish fed"};

    int y = 58;

    for (int i = 0; i < 5; i++)
    {
        tft.fillRoundRect(18, y, 284, 24, 12, WHITE);

        tft.setTextColor(NAVY, WHITE);
        tft.setTextFont(2);

        tft.drawString(logs[i], 28, y + 7);

        y += 30;
    }

    drawNavbar();
}

static void drawSettings()
{
    drawBackground();

    drawHeader();

    const char *items[] = {
        "Cloud Sync",
        "Alerts",
        "Auto Feed",
        "Night Mode"};

    int y = 60;

    for (int i = 0; i < 4; i++)
    {
        tft.fillRoundRect(18, y, 284, 28, 12, WHITE);

        tft.setTextColor(NAVY, WHITE);
        tft.setTextFont(2);

        tft.drawString(items[i], 28, y + 8);

        tft.fillRoundRect(250, y + 4, 40, 18, 9, MINT);

        tft.fillCircle(278, y + 13, 7, WHITE);

        y += 36;
    }

    drawNavbar();
}

static void render()
{
    switch (currentPage)
    {
    case Page::HOME:
        drawDashboard();
        break;

    case Page::ANALYTICS:
        drawAnalytics();
        break;

    case Page::HISTORY:
        drawHistory();
        break;

    case Page::SETTINGS:
        drawSettings();
        break;
    }
}

static void handleTouch()
{
    if (!touch.touched())
        return;

    TS_Point p = touch.getPoint();

    int x = map(p.x, 200, 3800, 0, SCREEN_W);
    int y = map(p.y, 240, 3800, 0, SCREEN_H);

    x = SCREEN_W - x;

    if (pointInRect(x, y, navHome))
    {
        currentPage = Page::HOME;
        render();
    }

    if (pointInRect(x, y, navGraph))
    {
        currentPage = Page::ANALYTICS;
        render();
    }

    if (pointInRect(x, y, navHistory))
    {
        currentPage = Page::HISTORY;
        render();
    }

    if (pointInRect(x, y, navSettings))
    {
        currentPage = Page::SETTINGS;
        render();
    }

    if (pointInRect(x, y, feedBtn))
    {
        manualFeedRequest = true;

        drawFeedButton(true);

        delay(100);

        drawFeedButton(false);
    }

    delay(150);
}

static void drawBootScreen()
{
    tft.fillScreen(OCEAN);

    for (int i = 0; i < 12; i++)
    {
        drawBubble(
            random(20, 300),
            random(20, 220),
            random(2, 6));
    }

    tft.fillCircle(160, 80, 28, CORAL);

    tft.fillTriangle(
        132, 80,
        112, 64,
        112, 96,
        CORAL);

    tft.fillCircle(170, 72, 4, NAVY);

    tft.setTextColor(WHITE);
    tft.setTextDatum(MC_DATUM);

    tft.setTextFont(4);

    tft.drawString("FishMaster", 160, 140);

    tft.setTextFont(2);

    tft.drawString(
        "Loading Aquarium...",
        160,
        165);

    tft.drawRoundRect(60, 190, 200, 18, 9, WHITE);

    for (int i = 0; i < 196; i += 4)
    {
        tft.fillRoundRect(
            62,
            192,
            i,
            14,
            7,
            MINT);

        delay(20);
    }

    delay(800);
}

void dashboardInit()
{
    SPI.begin();

    touch.begin();
    touch.setRotation(1);

    tft.init();
    tft.setRotation(3);

    drawBootScreen();

    render();
}

void dashboardLoop()
{
    handleTouch();

    if (millis() - lastAnim > 80)
    {
        bubbleOffset += 2;

        if (bubbleOffset > SCREEN_W)
            bubbleOffset = 0;

        lastAnim = millis();

        render();
    }
}

void dashboardSetWifiConnected(bool connected)
{
    wifiConnected = connected;
}

void dashboardSetWaterTemp(float tempC, bool valid)
{
    if (valid)
        waterTemp = tempC;
}

void dashboardSetPh(float ph, float voltage, float rawAdc, bool valid)
{
    if (valid)
        phValue = ph;
}

void dashboardSetTurbidity(float ntu, int rawAdc, bool valid)
{
    if (valid)
        turbidity = ntu;
}

void dashboardSetInternalTemp(float chipTemp, bool valid)
{
}

bool dashboardConsumeManualFeedRequest()
{
    bool r = manualFeedRequest;

    manualFeedRequest = false;

    return r;
}