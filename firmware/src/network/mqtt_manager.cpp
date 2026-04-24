#include "mqtt_manager.h"

#include <Arduino.h>
#include <WiFi.h>
#include <PubSubClient.h>

#include "network_parameter.h"

static WiFiClient espClient;
static PubSubClient mqttClient(espClient);

void mqttReconnect(void)
{
    if (mqttClient.connected()) return;

    if (mqttClient.connect(MQTT_CLIENT_ID))
    {
        Serial.println("Connected to MQTT broker :D");
    }
    else
    {
        Serial.println("MQTT connect failed");
    }
}
void mqttSetup(void)
{
    mqttClient.setServer(MQTT_SERVER, MQTT_PORT);
    mqttReconnect();
    
}

// Call this function in the main loop to maintain MQTT connection and handle incoming messages
void mqttLoop(void)
{
    if (!mqttClient.connected())
    {
        mqttReconnect();
    }

    mqttClient.loop();
}
// Publish temperature to MQTT broker
bool mqttPublishTemperature(float temp)
{
    char payload[64];
    snprintf(payload, sizeof(payload), "{\"temperature\": %.1f}", temp);

    bool ok = mqttClient.publish(FM_MQTT_TOPIC, payload);
    if (ok)
    {
        Serial.println("Message published successfully :D");
    }
    else
    {
        Serial.println("Failed to publish message D: !");
    }

    return ok;
}
