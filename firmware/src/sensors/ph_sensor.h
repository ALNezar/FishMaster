#pragma once

// Non-blocking pH sensor interface for pH-4502C on ADC1 GPIO34

void phSensorInit(void);
// Start a non-blocking sampling run. Call `phSensorLoop()` frequently from `loop()`.
void phSensorRequestSample(void);
// Call frequently to progress sampling state machine
void phSensorLoop(void);
// Returns true when a new sample is ready
bool phSensorSampleReady(void);
// Retrieve last measured pH value (0-14). Returns negative on error.
float phSensorGetPh(void);
// Returns the last measured module voltage (after multiplying by 2.0 for divider)
float phSensorLastVoltage(void);
// Returns last averaged raw ADC value (0-4095)
float phSensorLastRawAdc(void);
