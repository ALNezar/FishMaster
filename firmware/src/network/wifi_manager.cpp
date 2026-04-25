#include "wifi_manager.h"

#include <Arduino.h>
#include <WiFi.h>

#include "network_parameter.h"

bool wifiConnect(void)
{
    Serial.println("--- NETWORKING ---");
    Serial.print("[WiFi] Connecting to WiFi<@_@>");

    WiFi.begin(WIFI_SSID, WIFI_PASS);

    int dots = 0;
    while (WiFi.status() != WL_CONNECTED)
    {
        delay(500);
        Serial.print(".");
        dots++;
        if (dots >= 30)
        {
            Serial.println();
            Serial.print("[WiFi] Still trying<@_@>");
            dots = 0;
        }
    }

    Serial.println();
    Serial.println("[WiFi] Connected :D");
    Serial.print("[WiFi] IP -> ");
    Serial.println(WiFi.localIP());
    return true;
}
