#pragma once
#include <Arduino.h>

struct NetConfig {
  String ssid;
  String pass;
  String mqtt_server;
  uint16_t mqtt_port = 8883;
  String mqtt_user;
  String mqtt_pass;
  String client_id;
  bool valid = false;
};

bool configLoad(NetConfig &out);
bool configSave(const NetConfig &in);
void configReset();
NetConfig& configGet();
