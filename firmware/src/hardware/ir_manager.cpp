// =============================================================================
// ir_manager.cpp  —  FishMaster IR Remote Receiver Driver
// =============================================================================

#include "ir_manager.h"
#include <IRremote.hpp>
#include "hardware/audio_manager.h"
#include "ui/dashboard_ui.h"

extern AudioManager audio; // Use the global audio instance to change volume

// Hardware pin for the HX1838 IR Receiver
static constexpr uint8_t IR_RECEIVE_PIN = 26;

// Known IR Codes for our specific remote (8-bit commands)
static constexpr uint8_t IR_CMD_OK    = 0x1C;
static constexpr uint8_t IR_CMD_UP    = 0x18;
static constexpr uint8_t IR_CMD_DOWN  = 0x52;
static constexpr uint8_t IR_CMD_LEFT  = 0x08;
static constexpr uint8_t IR_CMD_RIGHT = 0x5A;
static constexpr uint8_t IR_CMD_STAR  = 0x19; // Volume Down
static constexpr uint8_t IR_CMD_HASH  = 0x0D; // Volume Up

void irManagerInit()
{
    Serial.println("[IR] Initializing IR Receiver...");
    IrReceiver.begin(IR_RECEIVE_PIN, DISABLE_LED_FEEDBACK);
    Serial.printf("[IR] Listening on GPIO %d\n", IR_RECEIVE_PIN);
}

void irManagerLoop()
{
    if (IrReceiver.decode())
    {
        // Filter out repeat flags or errors
        if (!IrReceiver.decodedIRData.flags && IrReceiver.decodedIRData.protocol != UNKNOWN)
        {
            uint8_t cmd = IrReceiver.decodedIRData.command;
            
            // Ignore 0x00 commands which are often caused by electrical noise from WiFi/TFT
            if (cmd != 0x00)
            {
                Serial.printf("[IR] Received command: 0x%02X\n", cmd);
                
                // Map known buttons
                switch (cmd)
                {
                    case IR_CMD_OK:
                    case IR_CMD_UP:
                    case IR_CMD_DOWN:
                    case IR_CMD_LEFT:
                    case IR_CMD_RIGHT:
                        dashboardHandleIrCommand(cmd);
                        break;
                    case IR_CMD_STAR:
                        dashboardShowVolumeOverlay(audio.decreaseVolume());
                        Serial.println("[IR] Volume Down");
                        break;
                    case IR_CMD_HASH:
                        dashboardShowVolumeOverlay(audio.increaseVolume());
                        Serial.println("[IR] Volume Up");
                        break;
                    default:
                        // Unknown code
                        break;
                }
            }
        }
        
        // Clear the data and prepare for the next signal
        IrReceiver.decodedIRData.command = 0; 
        IrReceiver.resume();
    }
}
