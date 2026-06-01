#include "mqtt_manager.h"

#include <Arduino.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include "network_parameter.h"
#include "config.h"

static WiFiClientSecure espClient;
static PubSubClient mqttClient(espClient);
static unsigned long lastReconnectAttemptMs = 0;

static void printDeviceInfoPayload(const char* payload)
{
    static const bool MQTT_VERBOSE = false;
    if (!MQTT_VERBOSE) return;
    Serial.println("[MQTT] Device info snapshot");
    Serial.print("[MQTT] Topic -> ");
    Serial.println(FM_MQTT_DEVICE_TOPIC);
    Serial.print("[MQTT] Payload -> ");
    Serial.println(payload);
}

static void printTurbidityPayload(float ntu, int rawValue, const char* payload)
{
    static const bool MQTT_VERBOSE = false;
    if (!MQTT_VERBOSE) {
        Serial.print("[MQTT] Turbidity -> raw="); Serial.print(rawValue);
        Serial.print(" ntu="); Serial.println(ntu, 2);
        return;
    }
    Serial.println("[MQTT] Turbidity snapshot");
    Serial.print("[MQTT] Topic -> ");
    Serial.println(FM_MQTT_TURBIDITY_TOPIC);
    Serial.print("[MQTT] Raw -> ");
    Serial.println(rawValue);
    Serial.print("[MQTT] NTU -> ");
    Serial.println(ntu, 2);
    Serial.print("[MQTT] Payload -> ");
    Serial.println(payload);
}

// Helper function to convert MQTT state codes to human-readable strings shroter comment? 
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
    NetConfig &cfg = configGet();
    const char* broker = MQTT_SERVER;
    uint16_t port = MQTT_PORT;
    const char* client_id = MQTT_CLIENT_ID;
    const char* user = MQTT_USERNAME;
    const char* pass = MQTT_PASSWORD;
    if (cfg.valid && cfg.mqtt_server.length() > 0) {
        broker = cfg.mqtt_server.c_str();
        port = cfg.mqtt_port;
        if (cfg.client_id.length()) client_id = cfg.client_id.c_str();
        if (cfg.mqtt_user.length()) user = cfg.mqtt_user.c_str();
        if (cfg.mqtt_pass.length()) pass = cfg.mqtt_pass.c_str();
    }
    Serial.print("[MQTT] Broker -> ");
    Serial.print(broker);
    Serial.print(":");
    Serial.println(port);

    if (mqttClient.connect(client_id, user, pass))
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
    NetConfig &cfg = configGet();
    if (cfg.valid && cfg.mqtt_server.length() > 0) {
        mqttClient.setServer(cfg.mqtt_server.c_str(), cfg.mqtt_port);
    } else {
        mqttClient.setServer(MQTT_SERVER, MQTT_PORT);
    }
    mqttClient.setBufferSize(1024);
    Serial.println("[MQTT] Buffer size set to 1024 bytes");
    Serial.print("[MQTT] Publish topic -> ");
    Serial.println(FM_MQTT_TOPIC);
    Serial.print("[MQTT] Device info topic -> ");
    Serial.println(FM_MQTT_DEVICE_TOPIC);
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
    // Format the temperature as a JSON string
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

bool mqttPublishTurbidity(float ntu, int rawValue)
{
    if (!mqttClient.connected())
    {
        mqttReconnect();
        if (!mqttClient.connected())
        {
            Serial.print("[MQTT] Skip turbidity publish: not connected, state=");
            Serial.print(mqttClient.state());
            Serial.print(" (");
            Serial.print(mqttStateToString(mqttClient.state()));
            Serial.println(")");
            return false;
        }
    }

    char payload[96];
    snprintf(payload, sizeof(payload), "{\"raw_adc\":%d,\"ntu\":%.2f}", rawValue, ntu);

    printTurbidityPayload(ntu, rawValue, payload);

    bool ok = mqttClient.publish(FM_MQTT_TURBIDITY_TOPIC, payload);
    if (ok)
    {
        Serial.println("[MQTT] Turbidity published successfully");
    }
    else
    {
        Serial.println("[MQTT] Failed to publish turbidity");
    }

    return ok;
}

bool mqttPublishDeviceInfo(void)
{
    if (WiFi.status() != WL_CONNECTED)
    {
        Serial.println("[MQTT] Skip device info publish: WiFi is not connected");
        return false;
    }

    if (!mqttClient.connected())
    {
        mqttReconnect();
        if (!mqttClient.connected())
        {
            Serial.print("[MQTT] Skip device info publish: not connected, state=");
            Serial.print(mqttClient.state());
            Serial.print(" (");
            Serial.print(mqttStateToString(mqttClient.state()));
            Serial.println(")");
            return false;
        }
    }

    const String macAddress = WiFi.macAddress();
    const String ipAddress = WiFi.localIP().toString();
    const String wifiNetwork = WiFi.SSID();
    char chipIdBuffer[17];
    snprintf(chipIdBuffer, sizeof(chipIdBuffer), "%llX", static_cast<unsigned long long>(ESP.getEfuseMac()));

    char payload[384];
    snprintf(
        payload,
        sizeof(payload),
        "{\"device_id\":\"%s\",\"firmware_version\":\"%s\",\"cpu_mhz\":%u,\"free_heap\":%u,\"heap_total\":%u,\"mac_address\":\"%s\",\"ip_address\":\"%s\",\"wifi_ssid\":\"%s\",\"rssi_dbm\":%d,\"uptime_ms\":%lu,\"chip_id\":\"0x%s\"}",
        MQTT_CLIENT_ID,
        FM_FIRMWARE_VERSION,
        ESP.getCpuFreqMHz(),
        static_cast<unsigned int>(ESP.getFreeHeap()),
        static_cast<unsigned int>(ESP.getHeapSize()),
        macAddress.c_str(),
        ipAddress.c_str(),
        wifiNetwork.c_str(),
        WiFi.RSSI(),
        static_cast<unsigned long>(millis()),
        chipIdBuffer);

    printDeviceInfoPayload(payload);
    Serial.print("[MQTT] Device info payload length -> ");
    Serial.println(strlen(payload));

    bool ok = mqttClient.publish(FM_MQTT_DEVICE_TOPIC, payload, true);
    if (ok)
    {
        Serial.println("[MQTT] Device info published successfully");
    }
    else
    {
        Serial.print("[MQTT] Failed to publish device info, state=");
        Serial.print(mqttClient.state());
        Serial.print(" (");
        Serial.print(mqttStateToString(mqttClient.state()));
        Serial.println(")");
        Serial.println("[MQTT] Hint: if state is Connected, the packet may still exceed broker/client limits.");
    }

    return ok;
}

bool mqttPublishPh(float ph, float moduleVoltage, float internalChipTemp)
{
    if (!mqttClient.connected())
    {
        mqttReconnect();
        if (!mqttClient.connected())
        {
            Serial.print("[MQTT] Skip pH publish: not connected, state=");
            Serial.print(mqttClient.state());
            Serial.println();
            return false;
        }
    }
    StaticJsonDocument<128> doc;
    doc["ph_voltage"] = moduleVoltage;
    doc["ph_value"] = ph;
    doc["internal_chip_temp"] = internalChipTemp;
    doc["uptime_ms"] = static_cast<unsigned long>(millis());

    char payload[256];
    size_t n = serializeJson(doc, payload, sizeof(payload));

    Serial.println("[MQTT] pH payload -> ");
    Serial.println(payload);

    bool ok = mqttClient.publish(FM_MQTT_PH_TOPIC, payload);
    if (ok)
    {
        Serial.println("[MQTT] pH published successfully");
    }
    else
    {
        Serial.println("[MQTT] Failed to publish pH");
    }

    return ok;
}
