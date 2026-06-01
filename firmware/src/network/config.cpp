#include "config.h"
#include <Preferences.h>

static const char* NS = "fm_cfg";
static NetConfig g_cfg;

bool configLoad(NetConfig &out) {
  Preferences p;
  if (!p.begin(NS, true)) return false;
  if (!p.isKey("ssid")) { p.end(); return false; }
  out.ssid = p.getString("ssid", "");
  out.pass = p.getString("pass", "");
  out.mqtt_server = p.getString("mqtt", "");
  out.mqtt_port = static_cast<uint16_t>(p.getUInt("mport"));
  if (out.mqtt_port == 0) out.mqtt_port = 8883;
  out.mqtt_user = p.getString("muser", "");
  out.mqtt_pass = p.getString("mpass", "");
  out.client_id = p.getString("cid", "");
  out.valid = true;
  g_cfg = out;
  p.end();
  return true;
}

bool configSave(const NetConfig &in) {
  Preferences p;
  if (!p.begin(NS, false)) return false;
  p.putString("ssid", in.ssid);
  p.putString("pass", in.pass);
  p.putString("mqtt", in.mqtt_server);
  p.putUInt("mport", in.mqtt_port);
  p.putString("muser", in.mqtt_user);
  p.putString("mpass", in.mqtt_pass);
  p.putString("cid", in.client_id);
  p.end();
  g_cfg = in;
  return true;
}

void configReset() {
  Preferences p;
  if (p.begin(NS, false)) {
    p.clear();
    p.end();
  }
  g_cfg = NetConfig();
}

NetConfig& configGet() { return g_cfg; }
