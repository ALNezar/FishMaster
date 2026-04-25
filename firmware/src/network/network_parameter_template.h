#pragma once

// WiFi Configuration
// Replace with your local WiFi credentials
static const char *WIFI_SSID = "YOUR_WIFI_SSID_HERE";
static const char *WIFI_PASS = "YOUR_WIFI_PASSWORD_HERE";

// MQTT Configuration
// Replace with your HiveMQ Cloud cluster host
static const char *MQTT_SERVER = "YOUR_CLUSTER_ID.s1.eu.hivemq.cloud";
static const int MQTT_PORT = 8883;
static const char *MQTT_USERNAME = "YOUR_HIVEMQ_USERNAME";
static const char *MQTT_PASSWORD = "YOUR_HIVEMQ_PASSWORD";
static const char *MQTT_CLIENT_ID = "FM-Tankie_1";
static const char *FM_MQTT_TOPIC = "FishMaster/Temperature";

// Quick start for testing. Use CA certificate validation before production.
static const bool MQTT_TLS_INSECURE = true;
