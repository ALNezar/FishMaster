#include "mqtt_manager.h"

#include <Arduino.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>

#include "network_parameter.h"

static WiFiClientSecure espClient;
static PubSubClient mqttClient(espClient);
static unsigned long lastReconnectAttemptMs = 0;

static const char* mqttStateToString(int state)
{
    switch (state)
    {
        case MQTT_CONNECTION_TIMEOUT: return "Connection timeout";
        case MQTT_CONNECTION_LOST: return "Connection lost";
        case MQTT_CONNECT_FAILED: return "TCP connect failed";
        case MQTT_DISCONNECTED: return "Client disconnected";
        case MQTT_CONNECTED: return "Connected";
        case MQTT_CONNECT_BAD_PROTOCOL: return "Bad protocol";
        case MQTT_CONNECT_BAD_CLIENT_ID: return "Bad client ID";
        case MQTT_CONNECT_UNAVAILABLE: return "Broker unavailable";
        case MQTT_CONNECT_BAD_CREDENTIALS: return "Bad credentials";
        case MQTT_CONNECT_UNAUTHORIZED: return "Unauthorized";
        default: return "Unknown state";
    }
}

void mqttReconnect(void)
{
    if (mqttClient.connected()) return;

    if (WiFi.status() != WL_CONNECTED)
    {
        Serial.println("[MQTT] Skipping connect: WiFi is not connected");
        return;
    }

    unsigned long now = millis();
    if (now - lastReconnectAttemptMs < 5000)
    {
        return;
    }
    lastReconnectAttemptMs = now;

    Serial.println("[MQTT] Connecting...");
    Serial.print("[MQTT] Broker -> ");
    Serial.print(MQTT_SERVER);
    Serial.print(":");
    Serial.println(MQTT_PORT);

    if (mqttClient.connect(MQTT_CLIENT_ID, MQTT_USERNAME, MQTT_PASSWORD))
    {
        Serial.println("[MQTT] Connected ✔");
        lastReconnectAttemptMs = 0;
    }
    else
    {
        Serial.print("[MQTT] Connect FAILED ✖, rc=");
        Serial.print(mqttClient.state());
        Serial.print(" (");
        Serial.print(mqttStateToString(mqttClient.state()));
        Serial.println(")");
    }
}

void mqttSetup(void)
{
    if (MQTT_TLS_INSECURE)
    {
        espClient.setInsecure();
        Serial.println("[MQTT] TLS mode: insecure (testing only)");
    }

    mqttClient.setServer(MQTT_SERVER, MQTT_PORT);
    Serial.print("[MQTT] Publish topic -> ");
    Serial.println(FM_MQTT_TOPIC);
    mqttReconnect();
}

// Call this function in the main loop to maintain MQTT connection and handle incoming messages
void mqttLoop(void)
{
    if (WiFi.status() != WL_CONNECTED)
    {
        return;
    }

    if (!mqttClient.connected())
    {
        mqttReconnect();
    }

    mqttClient.loop();
}
// Publish temperature to MQTT broker
bool mqttPublishTemperature(float temp)
{
    if (!mqttClient.connected())
    {
        mqttReconnect();
        if (!mqttClient.connected())
        {
            Serial.print("[MQTT] Skip publish: not connected, state=");
            Serial.print(mqttClient.state());
            Serial.print(" (");
            Serial.print(mqttStateToString(mqttClient.state()));
            Serial.println(")");
            return false;
        }
    }

    char payload[64];
    snprintf(payload, sizeof(payload), "{\"temperature\": %.1f}", temp);

    bool ok = mqttClient.publish(FM_MQTT_TOPIC, payload);
    if (ok)
    {
        Serial.println("[MQTT] Message published successfully :D");
    }
    else
    {
        Serial.println("[MQTT] Failed to publish message D: !");
    }

    return ok;
}
