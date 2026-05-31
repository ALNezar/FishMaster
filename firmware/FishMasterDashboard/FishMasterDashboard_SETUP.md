# TFT_eSPI Setup

Paste this into your TFT_eSPI `User_Setup.h` file for the FishMaster dashboard display wiring.

```cpp
#define ILI9341_DRIVER

#define SPI_SCK  18
#define SPI_MISO 19
#define SPI_MOSI 23

#define TFT_MISO SPI_MISO
#define TFT_MOSI SPI_MOSI
#define TFT_SCLK SPI_SCK
#define TFT_CS   5
#define TFT_DC   27
#define TFT_RST  4

#define TOUCH_CS 14

// T_IRQ is not connected; the touch controller is polled

#define LOAD_GLCD
#define LOAD_FONT2
#define LOAD_FONT4
#define LOAD_FONT6
#define LOAD_FONT7
#define LOAD_FONT8
#define LOAD_GFXFF
#define SMOOTH_FONT

#define SPI_FREQUENCY      27000000
#define SPI_READ_FREQUENCY 16000000
#define SPI_TOUCH_FREQUENCY 2000000
```

