#include "serial_setup.h"
#include "config.h"
#include <Arduino.h>

String serialReadLine(unsigned long timeoutMs) {
  String s;
  unsigned long start = millis();
  while (true) {
    while (Serial.available()) {
      char c = (char)Serial.read();
      if (c == '\r') continue;
      if (c == '\n') return s;
      s += c;
    }
    if (millis() - start > timeoutMs) return s;
    delay(10);
  }
}

static void promptField(const char* label, String &out, const String &current) {
  Serial.print(label);
  Serial.print(" [");
  Serial.print(current);
  Serial.print("]: ");
  String v = serialReadLine(60000);
  if (v.length()) out = v;
}

void serialSetupWizard(NetConfig &cfg) {
  Serial.println("\n=== FishMaster Serial Setup Wizard ===");
  Serial.println("Leave blank and press Enter to keep current value shown in []");
  promptField("WiFi SSID", cfg.ssid, cfg.ssid);
  promptField("WiFi PASS", cfg.pass, cfg.pass);
  promptField("MQTT SERVER", cfg.mqtt_server, cfg.mqtt_server);
  Serial.print("MQTT PORT ["); Serial.print(cfg.mqtt_port); Serial.print("]: ");
  String p = serialReadLine(20000);
  if (p.length()) cfg.mqtt_port = (uint16_t)atoi(p.c_str());
  promptField("MQTT USER", cfg.mqtt_user, cfg.mqtt_user);
  promptField("MQTT PASS", cfg.mqtt_pass, cfg.mqtt_pass);
  promptField("MQTT CLIENT ID", cfg.client_id, cfg.client_id);
  cfg.valid = true;
  if (configSave(cfg)) {
    Serial.println("Configuration saved to flash.");
  } else {
    Serial.println("Failed to save configuration!");
  }
}
