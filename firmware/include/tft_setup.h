#pragma once

// Tell TFT_eSPI that a custom configuration is manually loaded
#define USER_SETUP_LOADED 1

// --- Hardware Driver Selection ---
#define ILI9341_DRIVER 1

// --- Core Hardware SPI Bus Pins (VSPI Bus) ---
#define SPI_SCK  18
#define SPI_MISO 19
#define SPI_MOSI 23

#define TFT_MISO SPI_MISO
#define TFT_MOSI SPI_MOSI
#define TFT_SCLK SPI_SCK

#define TFT_CS   5   // Moved from 15 to match your hardware layout
#define TFT_DC   27  // SAFE PIN: Moved away from dangerous boot-pin GPIO 2
#define TFT_RST  4   // Hardware Reset Pin

#define TOUCH_CS 14  // Changed from 26: Pin 26 is used by the IR Receiver

#define LOAD_GLCD   1  // Standard 8-bit Font
#define LOAD_FONT2  1  // Small 16-pixel Font
#define LOAD_FONT4  1  // Medium 26-pixel Font
#define LOAD_FONT6  1  // Large 48-pixel Font
#define LOAD_FONT7  1  // 7-Segment Digital Font
#define LOAD_FONT8  1  // Extra Large 75-pixel Font
#define LOAD_GFXFF  1  // Adafruit GFX Free Fonts Wrapper
#define SMOOTH_FONT 1  // TrueType Anti-Aliased Font Support

// --- Bus Clock Frequency Optimizations ---
#define SPI_FREQUENCY       27000000  // 27 MHz more tolerant on breadboard wiring
#define SPI_READ_FREQUENCY  16000000  // 16 MHz reliable pixel data read speed
#define SPI_TOUCH_FREQUENCY  2000000  // 2 MHz safe, uncorrupted touch register reads
