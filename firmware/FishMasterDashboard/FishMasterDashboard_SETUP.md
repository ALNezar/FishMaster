# TFT_eSPI Setup

Paste this into your TFT_eSPI `User_Setup.h` file for the FishMaster dashboard display wiring.

```cpp
#define ILI9341_DRIVER

#define TFT_MISO 19
#define TFT_MOSI 23
#define TFT_SCLK 18
#define TFT_CS   15
#define TFT_DC   2
#define TFT_RST  4

#define TOUCH_CS 21

#define LOAD_GLCD
#define LOAD_FONT2
#define LOAD_FONT4
#define LOAD_FONT6
#define LOAD_FONT7
#define LOAD_FONT8
#define LOAD_GFXFF
#define SMOOTH_FONT

#define SPI_FREQUENCY      40000000
#define SPI_READ_FREQUENCY 20000000
#define SPI_TOUCH_FREQUENCY 2500000
```

Notes:
- Shared SPI bus: SCK = GPIO 18, MOSI = GPIO 23, MISO = GPIO 19.
- TFT control lines: CS = GPIO 15, DC = GPIO 2, RST = GPIO 4.
- XPT2046 touch controller CS = GPIO 21, IRQ = GPIO 22.
- Keep GPIOs 32, 33, and 35 free for your other sensors.
- The sketch uses landscape rotation 1 and a manual touch-to-screen mapping that you can tune later with real touch samples.
