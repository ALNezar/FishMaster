// =============================================================================
// dashboard_ui.cpp  —  FishMaster ESP32 TFT Dashboard
// Multi-Page UI, Premium Redesign, In-Memory Analytics & Polling Touch
// =============================================================================

#include "dashboard_ui.h"

#include <SPI.h>
#include <TFT_eSPI.h>
#include <XPT2046_Touchscreen.h>
#include <math.h>

// =============================================================================
// Hardware Configuration
// =============================================================================
static TFT_eSPI tft;
static XPT2046_Touchscreen touch(TOUCH_CS);

// =============================================================================
// Display Dimensions
// =============================================================================
static constexpr int SCREEN_W = 320;
static constexpr int SCREEN_H = 240;

// =============================================================================
// Curated Sleek Color Palette (RGB565)
// =============================================================================
static constexpr uint16_t COL_BG       = 0x0A2A;  // Deep Ocean Blue
static constexpr uint16_t COL_CARD     = 0x1125;  // Dark Navy Panel
static constexpr uint16_t COL_TEXT_PRI = 0xFFFF;  // White Text
static constexpr uint16_t COL_TEXT_SEC = 0x7BFF;  // Soft Blue Text

// Accents
static constexpr uint16_t COL_ACC_TEMP = 0xF1A6;  // Coral Red
static constexpr uint16_t COL_ACC_PH   = 0x2E9A;  // Ocean Teal
static constexpr uint16_t COL_ACC_TURB = 0xFE60;  // Golden Yellow
static constexpr uint16_t COL_ACC_NAV  = 0x18E3;  // Lighter Navy for Navbar

// =============================================================================
// UI Geometry & Layout
// =============================================================================
struct Rect
{
    int x;
    int y;
    int w;
    int h;
};

// Home Page Layout
static constexpr Rect CARD_TEMP = {8, 38, 94, 94};
static constexpr Rect CARD_PH   = {113, 38, 94, 94};
static constexpr Rect CARD_TURB = {218, 38, 94, 94};
static constexpr Rect FEED_BTN  = {100, 148, 210, 48};

// Navbar Layout (4 tabs of 80px width)
static constexpr Rect NAV_HOME     = {0, 212, 80, 28};
static constexpr Rect NAV_GRAPH    = {80, 212, 80, 28};
static constexpr Rect NAV_HISTORY  = {160, 212, 80, 28};
static constexpr Rect NAV_SETTINGS = {240, 212, 80, 28};

// Settings Toggles
static constexpr Rect SETTING_1 = {240, 60, 48, 24};
static constexpr Rect SETTING_2 = {240, 100, 48, 24};
static constexpr Rect SETTING_3 = {240, 140, 48, 24};

// =============================================================================
// Calibration Constants for Touch Screen (Rotation 3)
// =============================================================================
static constexpr int TOUCH_RAW_X_MIN = 340;
static constexpr int TOUCH_RAW_X_MAX = 3860;
static constexpr int TOUCH_RAW_Y_MIN = 200;
static constexpr int TOUCH_RAW_Y_MAX = 3860;

// =============================================================================
// Application State
// =============================================================================
enum class Page
{
    HOME,
    ANALYTICS,
    HISTORY,
    SETTINGS
};
static Page currentPage = Page::HOME;
static bool needsFullRedraw = true;

static bool  wifiConnected      = false;
static bool  manualFeedRequest  = false;
static float waterTemp          = NAN;
static float phValue            = NAN;
static float turbidity          = NAN;

// Redraw tracking variables for flicker-free rendering on HOME page
static bool  lastWifiConnected  = false;
static float lastWaterTemp      = -999.0f;
static float lastPhValue        = -999.0f;
static float lastTurbidity      = -999.0f;

static bool  feedButtonPressed  = false;
static unsigned long feedPressActiveUntil = 0;

// Debouncing touch inputs
static unsigned long lastTouchMs = 0;
static constexpr unsigned long TOUCH_DEBOUNCE_MS = 250;

// =============================================================================
// In-Memory Data Buffers (Real Data Analytics & History)
// =============================================================================
static constexpr int HISTORY_SIZE = 30;
static float tempHistory[HISTORY_SIZE];
static float phHistory[HISTORY_SIZE];
static int historyIndex = 0;
static int historyCount = 0;
static unsigned long lastDataSaveMs = 0;
static constexpr unsigned long DATA_SAVE_INTERVAL_MS = 30000; // Save data point every 30s

static constexpr int LOG_MAX = 5;
static char eventLog[LOG_MAX][32];
static int logCount = 0;

// Settings states
static bool settingCloudSync = true;
static bool settingNightMode = false;
static bool settingAutoFeed  = true;

static void addEventLog(const char* msg)
{
    // Shift logs down
    for (int i = LOG_MAX - 1; i > 0; i--)
    {
        strlcpy(eventLog[i], eventLog[i-1], 32);
    }
    strlcpy(eventLog[0], msg, 32);
    if (logCount < LOG_MAX) logCount++;
    
    if (currentPage == Page::HISTORY) needsFullRedraw = true;
}

// =============================================================================
// Helper Functions
// =============================================================================
static bool pointInRect(int x, int y, const Rect& r)
{
    return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}

static void drawCartoonyFishMascot(int cx, int cy)
{
    // Bold, simplified, cartoony fish
    // Tail
    tft.fillTriangle(cx - 20, cy, cx - 35, cy - 15, cx - 35, cy + 15, COL_ACC_TEMP);
    // Body
    tft.fillCircle(cx, cy, 22, COL_ACC_TEMP);
    // Eye
    tft.fillCircle(cx + 10, cy - 6, 7, COL_TEXT_PRI);
    tft.fillCircle(cx + 12, cy - 6, 3, COL_CARD);
    // Mouth / Lips
    tft.fillCircle(cx + 20, cy + 8, 5, COL_ACC_TURB);
    tft.fillCircle(cx + 18, cy + 8, 4, COL_ACC_TEMP); // inner mask to make an arc
    // Fin
    tft.fillTriangle(cx, cy - 22, cx - 5, cy - 32, cx + 5, cy - 22, COL_ACC_TEMP);
}

static void drawNavbar()
{
    tft.fillRect(0, 212, SCREEN_W, 28, COL_CARD);
    
    const Rect tabs[] = {NAV_HOME, NAV_GRAPH, NAV_HISTORY, NAV_SETTINGS};
    const char* labels[] = {"HOME", "CHART", "LOG", "SET"};
    const Page pages[] = {Page::HOME, Page::ANALYTICS, Page::HISTORY, Page::SETTINGS};
    
    tft.setTextFont(2);
    
    for (int i = 0; i < 4; i++)
    {
        bool active = (currentPage == pages[i]);
        uint16_t color = active ? COL_ACC_TEMP : COL_TEXT_SEC;
        
        tft.setTextColor(color, COL_CARD);
        tft.setTextDatum(MC_DATUM);
        tft.drawString(labels[i], tabs[i].x + tabs[i].w / 2, tabs[i].y + tabs[i].h / 2);
        
        if (active)
        {
            tft.fillRect(tabs[i].x + 10, tabs[i].y, tabs[i].w - 20, 2, COL_ACC_TEMP);
        }
    }
}

static void drawHeader(const char* title)
{
    tft.setTextDatum(ML_DATUM);
    tft.setTextColor(COL_TEXT_PRI, COL_BG);
    tft.setTextFont(4);
    tft.drawString(title, 16, 18);
    tft.drawFastHLine(0, 34, SCREEN_W, COL_CARD);
}

// =============================================================================
// Rendering: Home Page
// =============================================================================
static void drawHomeStatic()
{
    tft.fillScreen(COL_BG);
    drawHeader("FISHMASTER");
    
    // Cards
    Rect cards[] = {CARD_TEMP, CARD_PH, CARD_TURB};
    uint16_t accents[] = {COL_ACC_TEMP, COL_ACC_PH, COL_ACC_TURB};
    const char* labels[] = {"TEMP", "pH", "TURB"};
    const char* units[] = {"C", "pH", "NTU"};
    
    for (int i = 0; i < 3; i++)
    {
        tft.fillRoundRect(cards[i].x, cards[i].y, cards[i].w, cards[i].h, 12, COL_CARD);
        tft.fillRoundRect(cards[i].x, cards[i].y, cards[i].w, 6, 4, accents[i]);
        tft.fillRect(cards[i].x, cards[i].y + 4, cards[i].w, 2, accents[i]);
        
        tft.setTextDatum(MC_DATUM);
        tft.setTextColor(COL_TEXT_SEC, COL_CARD);
        tft.setTextFont(2);
        tft.drawString(labels[i], cards[i].x + cards[i].w / 2, cards[i].y + 20);
        tft.drawString(units[i], cards[i].x + cards[i].w / 2, cards[i].y + 78);
    }
    
    // Feed Button (Idle)
    tft.fillRoundRect(FEED_BTN.x, FEED_BTN.y, FEED_BTN.w, FEED_BTN.h, 24, COL_BG);
    tft.drawRoundRect(FEED_BTN.x, FEED_BTN.y, FEED_BTN.w, FEED_BTN.h, 24, COL_ACC_TEMP);
    tft.setTextColor(COL_ACC_TEMP, COL_BG);
    tft.setTextDatum(MC_DATUM);
    tft.setTextFont(4);
    tft.drawString("FEED FISH", FEED_BTN.x + FEED_BTN.w / 2, FEED_BTN.y + FEED_BTN.h / 2);
    
    // Mascot
    drawCartoonyFishMascot(50, 172);
    
    drawNavbar();
    
    // Invalidate dynamic buffers to force redraw
    lastWaterTemp = -999.0f;
    lastPhValue = -999.0f;
    lastTurbidity = -999.0f;
    lastWifiConnected = !wifiConnected;
}

static void drawHomeDynamic()
{
    char buf[16];
    
    // Wi-Fi
    if (wifiConnected != lastWifiConnected)
    {
        tft.fillRect(200, 4, 116, 28, COL_BG);
        tft.setTextDatum(MR_DATUM);
        tft.setTextFont(2);
        if (wifiConnected)
        {
            tft.fillCircle(302, 18, 5, COL_ACC_PH);
            tft.setTextColor(COL_TEXT_PRI, COL_BG);
            tft.drawString("ONLINE", 290, 18);
        }
        else
        {
            tft.fillCircle(302, 18, 5, COL_ACC_TEMP);
            tft.setTextColor(COL_TEXT_SEC, COL_BG);
            tft.drawString("LOCAL", 290, 18);
        }
        lastWifiConnected = wifiConnected;
    }
    
    // Temp
    if (waterTemp != lastWaterTemp)
    {
        tft.fillRect(CARD_TEMP.x + 4, CARD_TEMP.y + 35, CARD_TEMP.w - 8, 30, COL_CARD);
        tft.setTextDatum(MC_DATUM);
        tft.setTextColor(COL_TEXT_PRI, COL_CARD);
        tft.setTextFont(4);
        snprintf(buf, sizeof(buf), isnan(waterTemp) ? "N/A" : "%.1f", waterTemp);
        tft.drawString(buf, CARD_TEMP.x + CARD_TEMP.w / 2, CARD_TEMP.y + 50);
        lastWaterTemp = waterTemp;
    }
    
    // pH
    if (phValue != lastPhValue)
    {
        tft.fillRect(CARD_PH.x + 4, CARD_PH.y + 35, CARD_PH.w - 8, 30, COL_CARD);
        tft.setTextDatum(MC_DATUM);
        tft.setTextColor(COL_TEXT_PRI, COL_CARD);
        tft.setTextFont(4);
        snprintf(buf, sizeof(buf), isnan(phValue) ? "N/A" : "%.2f", phValue);
        tft.drawString(buf, CARD_PH.x + CARD_PH.w / 2, CARD_PH.y + 50);
        lastPhValue = phValue;
    }
    
    // Turbidity
    if (turbidity != lastTurbidity)
    {
        tft.fillRect(CARD_TURB.x + 4, CARD_TURB.y + 35, CARD_TURB.w - 8, 30, COL_CARD);
        tft.setTextDatum(MC_DATUM);
        tft.setTextColor(COL_TEXT_PRI, COL_CARD);
        tft.setTextFont(4);
        snprintf(buf, sizeof(buf), isnan(turbidity) ? "N/A" : "%.1f", turbidity);
        tft.drawString(buf, CARD_TURB.x + CARD_TURB.w / 2, CARD_TURB.y + 50);
        lastTurbidity = turbidity;
    }
}

// =============================================================================
// Rendering: Analytics Page
// =============================================================================
static void drawAnalyticsPage()
{
    tft.fillScreen(COL_BG);
    drawHeader("CHART");
    
    // Draw Graph Area
    int gX = 30;
    int gY = 50;
    int gW = 270;
    int gH = 120;
    
    tft.drawFastVLine(gX, gY, gH, COL_TEXT_SEC);
    tft.drawFastHLine(gX, gY + gH, gW, COL_TEXT_SEC);
    
    tft.setTextDatum(MR_DATUM);
    tft.setTextColor(COL_TEXT_SEC, COL_BG);
    tft.setTextFont(2);
    tft.drawString("30C", gX - 4, gY + 10);
    tft.drawString("20C", gX - 4, gY + gH - 10);
    
    if (historyCount == 0)
    {
        tft.setTextDatum(MC_DATUM);
        tft.drawString("Waiting for data...", gX + gW/2, gY + gH/2);
    }
    else
    {
        // Plot Temp History
        float maxT = 32.0f;
        float minT = 20.0f;
        int stepX = gW / HISTORY_SIZE;
        
        int prevX = -1, prevY = -1;
        
        int idx = (historyIndex - historyCount + HISTORY_SIZE) % HISTORY_SIZE;
        for (int i = 0; i < historyCount; i++)
        {
            float t = tempHistory[idx];
            if (!isnan(t))
            {
                int px = gX + i * stepX;
                float norm = constrain((t - minT) / (maxT - minT), 0.0f, 1.0f);
                int py = gY + gH - (int)(norm * gH);
                
                if (prevX != -1)
                {
                    tft.drawLine(prevX, prevY, px, py, COL_ACC_TEMP);
                    tft.drawLine(prevX, prevY+1, px, py+1, COL_ACC_TEMP); // Thicker line
                }
                prevX = px;
                prevY = py;
            }
            idx = (idx + 1) % HISTORY_SIZE;
        }
    }
    
    drawNavbar();
}

// =============================================================================
// Rendering: History Page
// =============================================================================
static void drawHistoryPage()
{
    tft.fillScreen(COL_BG);
    drawHeader("EVENT LOG");
    
    int y = 50;
    tft.setTextDatum(ML_DATUM);
    tft.setTextFont(2);
    
    if (logCount == 0)
    {
        tft.setTextColor(COL_TEXT_SEC, COL_BG);
        tft.drawString("No events recorded.", 20, y);
    }
    else
    {
        for (int i = 0; i < logCount; i++)
        {
            tft.fillRoundRect(16, y, 288, 28, 8, COL_CARD);
            tft.setTextColor(COL_TEXT_PRI, COL_CARD);
            tft.drawString(eventLog[i], 28, y + 14);
            y += 32;
        }
    }
    
    drawNavbar();
}

// =============================================================================
// Rendering: Settings Page
// =============================================================================
static void drawToggle(Rect r, bool state)
{
    uint16_t bg = state ? COL_ACC_PH : COL_CARD;
    tft.fillRoundRect(r.x, r.y, r.w, r.h, r.h/2, bg);
    if (!state) tft.drawRoundRect(r.x, r.y, r.w, r.h, r.h/2, COL_TEXT_SEC);
    
    int cx = state ? r.x + r.w - r.h/2 : r.x + r.h/2;
    tft.fillCircle(cx, r.y + r.h/2 - 1, r.h/2 - 4, COL_TEXT_PRI);
}

static void drawSettingsPage()
{
    tft.fillScreen(COL_BG);
    drawHeader("SETTINGS");
    
    tft.setTextDatum(ML_DATUM);
    tft.setTextFont(2);
    tft.setTextColor(COL_TEXT_PRI, COL_BG);
    
    // Row 1
    tft.drawString("Cloud Telemetry Sync", 20, SETTING_1.y + 12);
    drawToggle(SETTING_1, settingCloudSync);
    
    // Row 2
    tft.drawString("Night Mode Dimming", 20, SETTING_2.y + 12);
    drawToggle(SETTING_2, settingNightMode);
    
    // Row 3
    tft.drawString("Auto Feeder Enabled", 20, SETTING_3.y + 12);
    drawToggle(SETTING_3, settingAutoFeed);
    
    drawNavbar();
}

// =============================================================================
// Rendering: Router
// =============================================================================
static void renderPageStatic()
{
    switch (currentPage)
    {
        case Page::HOME:      drawHomeStatic(); break;
        case Page::ANALYTICS: drawAnalyticsPage(); break;
        case Page::HISTORY:   drawHistoryPage(); break;
        case Page::SETTINGS:  drawSettingsPage(); break;
    }
    needsFullRedraw = false;
}

// =============================================================================
// Rendering: Boot Splash Screen
// =============================================================================
static void drawBootSplash()
{
    tft.fillScreen(COL_BG);
    tft.setTextDatum(MC_DATUM);
    tft.setTextColor(COL_TEXT_PRI, COL_BG);
    tft.setTextFont(4);
    tft.drawString("FISHMASTER", SCREEN_W / 2, SCREEN_H / 2 - 20);
    
    tft.setTextColor(COL_TEXT_SEC, COL_BG);
    tft.setTextFont(2);
    tft.drawString("Smart Aquarium System", SCREEN_W / 2, SCREEN_H / 2 + 10);
    
    tft.fillRect(SCREEN_W / 2 - 80, SCREEN_H / 2, 160, 2, COL_ACC_TEMP);
}

// =============================================================================
// Touch System & SPI Bus Arbitration
// =============================================================================
static void handleTouch()
{
    digitalWrite(TFT_CS, HIGH);
    if (!touch.touched()) return;
    
    unsigned long now = millis();
    if (now - lastTouchMs < TOUCH_DEBOUNCE_MS) return;
    
    TS_Point p = touch.getPoint();
    
    if (p.x == 0 && p.y == 0) return;
    if (p.x >= 4095 && p.y >= 4095 && p.z >= 4095) return;
    
    int x = map(p.x, TOUCH_RAW_X_MIN, TOUCH_RAW_X_MAX, 0, SCREEN_W);
    int y = map(p.y, TOUCH_RAW_Y_MIN, TOUCH_RAW_Y_MAX, 0, SCREEN_H);
    x = constrain(x, 0, SCREEN_W - 1);
    y = constrain(y, 0, SCREEN_H - 1);
    
    Serial.printf("[TOUCH] Mapped X: %d | Y: %d\n", x, y);
    lastTouchMs = now;
    
    // Navbar Routing
    if (y >= 212)
    {
        Page newPage = currentPage;
        if (pointInRect(x, y, NAV_HOME)) newPage = Page::HOME;
        else if (pointInRect(x, y, NAV_GRAPH)) newPage = Page::ANALYTICS;
        else if (pointInRect(x, y, NAV_HISTORY)) newPage = Page::HISTORY;
        else if (pointInRect(x, y, NAV_SETTINGS)) newPage = Page::SETTINGS;
        
        if (newPage != currentPage)
        {
            currentPage = newPage;
            needsFullRedraw = true;
            return;
        }
    }
    
    // Page specific touches
    if (currentPage == Page::HOME)
    {
        if (pointInRect(x, y, FEED_BTN))
        {
            Serial.println("[BTN] Feed Fish Button Pressed!");
            manualFeedRequest = true;
            feedButtonPressed = true;
            feedPressActiveUntil = millis() + 150;
            
            tft.fillRoundRect(FEED_BTN.x, FEED_BTN.y, FEED_BTN.w, FEED_BTN.h, 24, COL_ACC_TEMP);
            tft.setTextColor(COL_CARD, COL_ACC_TEMP);
            tft.setTextDatum(MC_DATUM);
            tft.setTextFont(4);
            tft.drawString("FEEDING...", FEED_BTN.x + FEED_BTN.w / 2, FEED_BTN.y + FEED_BTN.h / 2);
            
            addEventLog("Manual Feed Triggered");
        }
    }
    else if (currentPage == Page::SETTINGS)
    {
        if (pointInRect(x, y, {SETTING_1.x - 20, SETTING_1.y - 10, SETTING_1.w + 40, SETTING_1.h + 20}))
        {
            settingCloudSync = !settingCloudSync;
            needsFullRedraw = true;
            addEventLog(settingCloudSync ? "Cloud Sync Enabled" : "Cloud Sync Disabled");
        }
        else if (pointInRect(x, y, {SETTING_2.x - 20, SETTING_2.y - 10, SETTING_2.w + 40, SETTING_2.h + 20}))
        {
            settingNightMode = !settingNightMode;
            needsFullRedraw = true;
            addEventLog(settingNightMode ? "Night Mode Enabled" : "Night Mode Disabled");
        }
        else if (pointInRect(x, y, {SETTING_3.x - 20, SETTING_3.y - 10, SETTING_3.w + 40, SETTING_3.h + 20}))
        {
            settingAutoFeed = !settingAutoFeed;
            needsFullRedraw = true;
            addEventLog(settingAutoFeed ? "Auto Feeder Enabled" : "Auto Feeder Disabled");
        }
    }
}

// =============================================================================
// Background Data Collector
// =============================================================================
static void updateDataBuffers()
{
    if (millis() - lastDataSaveMs >= DATA_SAVE_INTERVAL_MS)
    {
        lastDataSaveMs = millis();
        tempHistory[historyIndex] = waterTemp;
        phHistory[historyIndex]   = phValue;
        
        historyIndex = (historyIndex + 1) % HISTORY_SIZE;
        if (historyCount < HISTORY_SIZE) historyCount++;
        
        if (currentPage == Page::ANALYTICS) needsFullRedraw = true;
    }
}

// =============================================================================
// Public API Implementations
// =============================================================================

void dashboardInit()
{
    SPI.begin(TFT_SCLK, TFT_MISO, TFT_MOSI);
    pinMode(TFT_CS, OUTPUT);
    digitalWrite(TFT_CS, HIGH);
    pinMode(TOUCH_CS, OUTPUT);
    digitalWrite(TOUCH_CS, HIGH);
    
    tft.init();
    tft.setRotation(3);
    
    touch.begin();
    touch.setRotation(3);
    
    addEventLog("System Booted");
    
    drawBootSplash();
    delay(1500);
    
    needsFullRedraw = true;
}

void dashboardLoop()
{
    handleTouch();
    updateDataBuffers();
    
    if (needsFullRedraw)
    {
        renderPageStatic();
    }
    
    if (currentPage == Page::HOME)
    {
        if (feedButtonPressed && millis() >= feedPressActiveUntil)
        {
            feedButtonPressed = false;
            // Restore idle button state
            tft.fillRoundRect(FEED_BTN.x, FEED_BTN.y, FEED_BTN.w, FEED_BTN.h, 24, COL_BG);
            tft.drawRoundRect(FEED_BTN.x, FEED_BTN.y, FEED_BTN.w, FEED_BTN.h, 24, COL_ACC_TEMP);
            tft.setTextColor(COL_ACC_TEMP, COL_BG);
            tft.setTextDatum(MC_DATUM);
            tft.setTextFont(4);
            tft.drawString("FEED FISH", FEED_BTN.x + FEED_BTN.w / 2, FEED_BTN.y + FEED_BTN.h / 2);
        }
        
        drawHomeDynamic();
    }
}

void dashboardSetWifiConnected(bool connected)
{
    if (connected && !wifiConnected) addEventLog("WiFi Connected");
    else if (!connected && wifiConnected) addEventLog("WiFi Disconnected");
    wifiConnected = connected;
}

void dashboardSetWaterTemp(float tempC, bool valid) { waterTemp = valid ? tempC : NAN; }
void dashboardSetPh(float ph, float, float, bool valid) { phValue = valid ? ph : NAN; }
void dashboardSetTurbidity(float ntu, int, bool valid) { turbidity = valid ? ntu : NAN; }
void dashboardSetInternalTemp(float, bool) {}

bool dashboardConsumeManualFeedRequest()
{
    bool r = manualFeedRequest;
    manualFeedRequest = false;
    return r;
}