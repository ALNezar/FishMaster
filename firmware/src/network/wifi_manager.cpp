#include <WiFi.h>
#include "network_parameter.h"

enum class WiFiState
{
    IDLE,
    CONNECTING,
    CONNECTED,
    FAILED
};

static WiFiState wifiState = WiFiState::IDLE;

static unsigned long connectStartMs = 0;
static unsigned long lastDotMs = 0;
static int retryCount = 0;

static constexpr unsigned long WIFI_TIMEOUT_MS = 15000;
static constexpr unsigned long RETRY_BACKOFF_MS = 5000;

bool wifiConnectStart(void)
{
    Serial.println("[WiFi] Starting connection...");

    WiFi.mode(WIFI_STA);
    WiFi.begin(WIFI_SSID, WIFI_PASS);

    wifiState = WiFiState::CONNECTING;
    connectStartMs = millis();
    lastDotMs = millis();

    return true;
}

bool wifiConnectUpdate(void)
{
    if (wifiState == WiFiState::CONNECTED)
        return true;

    if (WiFi.status() == WL_CONNECTED)
    {
        wifiState = WiFiState::CONNECTED;

        Serial.println("\n[WiFi] Connected ✔");
        Serial.print("[WiFi] IP -> ");
        Serial.println(WiFi.localIP());

        retryCount = 0;
        return true;
    }

    // Print progress dot (non-blocking)
    if (millis() - lastDotMs > 500)
    {
        Serial.print(".");
        lastDotMs = millis();
    }

    // Timeout handling
    if (millis() - connectStartMs > WIFI_TIMEOUT_MS)
    {
        Serial.println("\n[WiFi] Connection FAILED (timeout)");

        WiFi.disconnect(true);
        wifiState = WiFiState::FAILED;
        retryCount++;

        return false;
    }

    return false;
}