#pragma once

/**
 * FishMaster Smart Tank - Network Parameters Template
 * 
 * INSTRUCTIONS: 
 * 1. Copy this file and rename the copy to 'networkparameter.h' (if you haven't already).
 * 2. Replace the placeholder values below with your actual network credentials.
 * 3. Ensure 'networkparameter.h' is added to your .gitignore file to keep your credentials safe.
 */

// WiFi Configuration
const char* WIFI_SSID = "YOUR_WIFI_SSID_HERE";
const char* WIFI_PASS = "YOUR_WIFI_PASSWORD_HERE";

// MQTT Configuration
const char* MQTT_SERVER    = "0.0.0.0";           // Your Broker IP (e.g., 192.168.1.10)
const int   MQTT_PORT      = 1883;                // Default MQTT port
const char* MQTT_CLIENT_ID = "FM-Tankie_Generic"; // Unique ID for your ESP32