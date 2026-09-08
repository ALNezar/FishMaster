<div align="center">

<img width="700" alt="Fish logo" src="https://github.com/user-attachments/assets/4a4d854f-14e6-48f2-ba60-82d6c91dfe55" />

# FishMaster

### Aquarium Monitoring and Control System using ESP32

FishMaster is an IoT smart aquarium system using an ESP32 Microcontroller to monitor water quality and control fish feeding.

The system includes a web dashboard where users can view the aquarium from a phone or computer via (pwa) progressive web app.

<p>
    <img src="https://img.shields.io/badge/ESP32-Microcontroller-blue?style=flat-square&logo=espressif&logoColor=white" />
    <img src="https://img.shields.io/badge/Spring_Boot-Backend-brightgreen?style=flat-square&logo=springboot&logoColor=white" />
    <img src="https://img.shields.io/badge/React-Frontend-61DAFB?style=flat-square&logo=react&logoColor=white" />
    <img src="https://img.shields.io/badge/Architecture-Hybrid_IoT-orange?style=flat-square" />
    <img src="https://img.shields.io/badge/IoT-Project-orange?logo=icloud&logoColor=white" />
</p>

</div>

---

### What is FishMaster?

Simply put ... FishMaster is an IoT smart aquarium system that can : monitor water conditions in fresh-water Home Aquarium .

The system consist of two main parts:

- Web system (with spring-boot back-end and react frontend) 
- An Embedded system based on ESP32 microcontroller

  
<img width="686" height="585" alt="image" src="https://github.com/user-attachments/assets/715c9464-1b11-48cf-ba32-a505d2375f43" />

---
The ESP32 uses sensors to check three things:

- pH 
- Water temperature
- Water turbidity (water clarity)
<img width="820" height="286" alt="image" src="https://github.com/user-attachments/assets/7d08e66c-9750-46f4-9625-431837639395" />

---

The sensor data is shown on a local touch screen.

The ESP32 also controls a servo motor that is used as an automatic fish feeder.

The ESP32 can work without the internet. This means the aquarium can still be monitored and controlled even when the Wi-Fi is not working.

The web system lets users check the aquarium from a phone or computer.

The web dashboard can show:

- Current sensor readings
- Charts
- Sensor history
- Feeding controls
- Remote monitoring

If the internet connection is lost, the ESP32 can continue to monitor the aquarium and control the feeder locally.

(●'◡'●)

---

### How it Works

FishMaster can work in two ways.

#### Local System

The ESP32 handles the aquarium directly.

It:

- Reads the sensors
- Shows the readings on the touch screen
- Controls the fish feeder
- Checks water quality
- Gives local alerts
- Gives local saved historical data in the esp32 
- Continues working when Wi-Fi is not available

#### Web System

When the ESP32 has an internet connection, it can send the sensor data to the web system.

Users can then:

- View the current water condition
- View old sensor data
- See charts
- Control feeding
- Monitor the aquarium remotely

<p align="center">
  <img
    src="https://github.com/user-attachments/assets/f4229aad-2049-40a2-a4a0-bb2b33f65444"
    width="100%"
    alt="FishMaster system overview diagram"
  />
  <br>
  <em>Figure 1: FishMaster System Overview</em>
</p>

---

### Cloud Architecture
How It Works

Think of FishMaster as three parts talking to each other in real-time: **the physical aquarium hardware (ESP32)**, **the brain in the cloud (Spring Boot & PostgreSQL)**, and **the user dashboard (React)**. 

To bridge the gap between the hardware and the web, I used **MQTT** (via HiveMQ Cloud), which is a super fast, lightweight messaging protocol perfect for IoT devices. 

The data flows in two main loops: **Up** (monitoring) and **Down** (controlling).

---

#### 1. The Monitoring Loop (Sensors ➡️ Web)
This is how water data gets from the fish tank to your screen:
* **Step 1:** The **ESP32** constantly reads data from the temperature, pH, and turbidity sensors inside the tank.
* **Step 2:** It bundles this data up and shoots it up to the **HiveMQ MQTT Broker** under a specific channel (like `FishMaster/tank_1/sensor`).
* **Step 3:** My **Spring Boot** backend is always listening to that channel. The moment data drops in, Spring Boot catches it, processes it, and saves it safely in a **PostgreSQL** database so we don't lose the history.
* **Step 4:** Finally, the **React frontend** dashboard asks the backend for the newest data via a REST API and updates the charts on your screen automatically.

---

#### 2. The Control Loop (Web ➡️ Aquarium)
This is how you actually trigger actions, like feeding the fish from your phone:
* **Step 1:** You log into the dashboard and click the **"Feed Now"** button.
* **Step 2:** React sends a quick message (a REST POST request) to the **Spring Boot** backend saying, *"Hey, user wants to feed tank_1."*
* **Step 3:** Spring Boot immediately publishes a command to the MQTT broker on the `FishMaster/tank_1/control` channel. 
* **Step 4:** Because the **ESP32** is constantly listening to that specific control channel, it intercepts the command instantly and triggers the physical **Servo Motor** to drop the fish food.

---

### 🚀 Where It's Hosted
Everything on the web side both the React frontend and the Spring Boot backend—is packaged together as a single system (a monolith) and hosted on **Railway**.

<p align="center">
  <img
    width="808"
    height="857"
    alt="FishMaster architecture diagram"
    src="https://github.com/user-attachments/assets/6d2af1ae-e75f-4115-ae4f-6d043bce648a"
  />
  <br>
  <em>Figure 2: FishMaster Cloud Architecture</em>
</p>

---

### Main Features

* **Water Monitoring:** Checks water temperature, pH, and turbidity.
* **Automatic Feeding:** Uses an SG90 servo motor to release fish food.
* **Feeding Schedule:** Allows feeding at set times.
* **Water Safety:** Can stop feeding when the water condition is not safe.
* **Alerts:** Gives local and remote alerts when a water reading is outside the safe range.
* **Data History:** Saves sensor readings so they can be viewed later.
* **Local Display:** Shows live sensor data on a 2.8" TFT touch screen.
* **Remote Monitoring:** Lets users check the aquarium through the web dashboard.
* **Offline Mode:** The ESP32 can continue working when Wi-Fi is not available.
* **Remote Controller:** A wireless controller can be used to control supported aquarium functions.

---

### System Modules

#### Hardware (ESP32)

| Component | Model / Details | Qty | Purpose |
|---|---|---|---|
| ESP32 | ESP32-DevKitC-32E (38-pin, CP2102) | 1 | Main microcontroller |
| Expansion Board | ESP32 38-pin GPIO Expansion Board (Type-C) | 1 | Makes wiring easier |
| pH Sensor | PH 0–14 Liquid Monitoring Sensor | 1 | Measures water pH |
| Turbidity Sensor | FARDUINO Water Turbidity Module | 1 | Checks water clarity |
| Temperature Sensor | DS18B20 Waterproof Probe | 1 | Measures water temperature |
| Display | 2.8" ILI9341 SPI Touch LCD (240x320) | 1 | Shows aquarium data |
| Audio Device | Active/Passive Piezo Buzzer / Speaker | 1 | Gives local alerts |
| Servo Motor | SG90 180° Micro Servo | 1 | Controls the fish feeder |
| Breadboard | MB-102 830-point | 1 | Used for circuit testing |
| Jumper Wires | 140 / 560 pcs set (M-M, M-F, F-F) | 1 set | Connects the components |
| Resistors | 4.7kΩ (0.25W, 5%) | ~10 | Used with the temperature sensor |
| Multimeter | HABOTEST HT109L | 1 | Used for testing the circuit |
| USB Cable | USB Type-C | 1 | Power and programming |
| Power Supply Module | MB102 Breadboard 5V/3.3V Power Supply Module | 1 | Provides power to the breadboard |
| Remote Controller | 2.4GHz Wireless Remote Controller / Receiver | 1 | Wireless manual control |

#### Software (Web)

| Component | Technology / Details | Function |
|---|---|---|
| Backend | Spring Boot (Java) | Receives and processes sensor data |
| Frontend | React (JavaScript) | Shows the dashboard and controls |
| Database | PostgreSQL | Stores users, sensor data, and feeding records |
| MQTT Broker | HiveMQ Cloud (Free Tier, QoS 1) | Sends messages between the ESP32 and backend |

---

## Preview

### Web Dashboard

<p align="center">
  <img
    src="https://github.com/user-attachments/assets/b6e1b513-3dc5-45cb-9a92-ce2e12188653"
    width="80%"
    alt="FishMaster main dashboard"
  />
  <br>
  <em>Main dashboard</em>
</p>

### Sensor Data

<p align="center">
  <img
    src="https://github.com/user-attachments/assets/180b3914-b47b-487f-8dbe-f7e047dc5ecc"
    width="80%"
    alt="FishMaster sensor data charts"
  />
  <br>
  <em>Sensor data and charts</em>
</p>

---

## Hardware Prototype

The FishMaster prototype uses an ESP32 connected to the sensors, touch screen, fish feeder, and wireless remote controller.

<p align="center">
  <img
    src="https://github.com/user-attachments/assets/ddbf2184-5a75-440d-89b2-6ebbb91eaabd"
    width="45%"
    alt="FishMaster breadboard prototype with remote controller"
  />
</p>

<p align="center">
  FishMaster breadboard prototype with wireless remote controller
</p>

---

## TFT Display

The ESP32 has a 2.8-inch TFT touch screen.

The screen shows the current aquarium data without needing a computer or internet connection.

<p align="center">
  <img
    src="https://github.com/user-attachments/assets/148df35d-576a-4393-98cd-1298d25de8e8"
    width="80%"
    alt="FishMaster TFT touchscreen display"
  />
</p>

<p align="center">
  FishMaster TFT touchscreen display
</p>

---

## Project Poster

The following image shows the FishMaster project and its main parts.

<p align="center">
  <img
    src="https://github.com/user-attachments/assets/88e4c59f-ff35-42b5-b0fb-7eab724f2cd7"
    width="45%"
    alt="FishMaster project poster"
  />
</p>

<p align="center">
  FishMaster project poster
</p>

---

## Live Demo (Development)

This is the development version of FishMaster.

It is mainly used to test the website, sensor data, and communication between the ESP32 and web system.

### Demo

[Open FishMaster Dashboard](https://fishmaster.up.railway.app/)

### Current Limitations

- No authentication. The system is currently set up for one client.
- Some features are still being developed.
- Some functions may not work correctly.
- The deployment is mainly for testing the user interface and data flow.

---

<div align="center">

(❁´◡`❁)

<sub>
Made with care by
<a href="https://www.linkedin.com/in/abdalla-nezar-elshiekh/"><b>Abdalla Elshiekh</b></a>
</sub>

<br>

<sub>
ESP32 · Spring Boot · React · PostgreSQL · MQTT
</sub>

</div>
