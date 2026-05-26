# FishMaster Dashboard

Standalone ESP32 dashboard sketch for a 2.8" ILI9341 SPI TFT with XPT2046 touch.

## What it does
- Draws a black/blue/white dashboard UI in landscape mode.
- Shows live readings from the existing FishMaster sensor modules:
  - Water temperature
  - pH level
  - Turbidity
- Refreshes readings every 2 seconds using `millis()`.
- Enables local manual-feed touch only when `wifiConnected` is false.
- Prints `Servo Triggered` to Serial when the manual feed area is touched in local mode.

## Files
- `FishMasterDashboard.ino` - main sketch
- `FishMasterDashboard_SETUP.md` - paste-ready TFT_eSPI setup

## Sensor integration
The sketch uses the existing sensor APIs from the firmware source tree:
- `../src/sensors/temp_sensor.h`
- `../src/sensors/turbidity_sensor.h`
- `../src/sensors/ph_sensor.h`

## Notes
- The pH sensor uses a non-blocking request/read state machine.
- The touch calibration constants at the top of the sketch are placeholders and should be tuned against real raw touch values.
- The `wifiConnected` flag is a UI mode switch; wire it to your network state when integrating with the main firmware.
