#pragma once
#include "config.h"

void serialSetupWizard(NetConfig &cfg);
String serialReadLine(unsigned long timeoutMs = 60000);
