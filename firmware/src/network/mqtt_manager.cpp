#include "mqtt_manager.h"

#include <Arduino.h>
#include <WiFi.h>
#include <PubSubClient.h>

#include "network_parameter.h"

static WiFiClient espClient;
static PubSubClient mqttClient(espClient);

static void fmMqttReconnect(void)
{
    while (!mqttClient.connected())
    {
        if (mqttClient.connect(MQTT_CLIENT_ID))
        {
            Serial.println("Connected to MQTT broker :D");
        }
        else
        {
            Serial.println("MQTT connect failed, retrying...");
            delay(1000);
        }
    }
}

void mqttSetup(void)
{
    mqttClient.setServer(MQTT_SERVER, MQTT_PORT);
    fmMqttReconnect();
}

void mqttLoop(void)
{
    if (!mqttClient.connected())
    {
        fmMqttReconnect();
    }

    mqttClient.loop();
}

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
