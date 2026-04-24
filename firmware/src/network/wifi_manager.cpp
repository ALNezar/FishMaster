#include "wifi_manager.h"

#include <Arduino.h>
#include <WiFi.h>

#include "network_parameter.h"

bool wifiConnect(void)
{
    WiFi.begin(WIFI_SSID, WIFI_PASS);

    while (WiFi.status() != WL_CONNECTED)
    {
        delay(500);
        Serial.println("Connecting to WiFi<@_@>...");
    }

    Serial.println("Connected to WiFi :D");
    Serial.println(WiFi.localIP());
    return true;
}
