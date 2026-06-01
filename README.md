<div align="center">

<img width="700" alt="Fish logo" src="https://github.com/user-attachments/assets/4a4d854f-14e6-48f2-ba60-82d6c91dfe55" />

# FishMaster 
### Aquarium Monitoring and Control System using ESP32

FishMaster is an IoT aquarium monitor that tracks water quality and controls feeding using an ESP32 with a Spring Boot backend and React frontend.

<p>
    <img src="https://img.shields.io/badge/ESP32-Microcontroller-blue?style=flat-square&logo=espressif&logoColor=white" />
    <img src="https://img.shields.io/badge/Spring_Boot-Backend-brightgreen?style=flat-square&logo=springboot&logoColor=white" />
    <img src="https://img.shields.io/badge/React-Frontend-61DAFB?style=flat-square&logo=react&logoColor=white" />
    <img src="https://img.shields.io/badge/Architecture-Hybrid_IoT-orange?style=flat-square" />
    <img src="https://img.shields.io/badge/IoT-Project-orange?logo=icloud&logoColor=white" />
    <img src="https://img.shields.io/badge/status-in%20development-orange" />
</p>

</div>

---

### 💧 Overview

FishMaster is a smart aquarium system that monitors and controls key aquarium conditions through two layers: an embedded local system and a web-based system.

The embedded system uses an ESP32 microcontroller with sensors to measure 3 main parameters (pH, Temperature and Turbidity). Readings appear on a local LCD touch screen, and a servo-driven feeder handles scheduled and condition-based feeding. This setup works entirely offline, so the aquarium stays managed even if the network fails.

The web system adds cloud connectivity. The ESP32 uploads data to a backend, and users can view their aquarium through a mobile or web interface. The dashboard includes charts, historical data, and remote monitoring. If the network becomes unavailable, the system automatically switches back to the embedded mode.

---

### How it Works

The system is designed to work whether or not there is an internet connection.

* **Local System (Offline):** The ESP32 reads sensors and controls a servo motor for feeding. It shows the current readings on an LCD screen. If the Wi-Fi goes down, the feeding and monitoring still work.
* **Web System (Online):** The ESP32 sends data to the backend. Users log in to a website to see charts, check history, and manage settings for multiple tanks.

<p align="center">
  <img src="https://github.com/user-attachments/assets/f4229aad-2049-40a2-a4a0-bb2b33f65444" width="100%" alt="fishmaster System Overview diagram">
  <br>
  <em>Figure 1: Fishmaster System Overview diagram</em>
</p>

---

### ☁️ Cloud Architecture

FishMaster uses a hybrid IoT architecture with two main data flows:

- 🔵 **Sensor data:** ESP32 publishes readings via MQTT → HiveMQ broker → Spring Boot backend → React dashboard via WebSocket
- 🔴 **Control commands:** Dashboard sends commands via REST API → backend publishes to MQTT → ESP32 subscribes and acts (including triggering the servo feeder)

<p align="center">
<img width="808" height="857" alt="Fishmaster_architecture_diagram" src="https://github.com/user-attachments/assets/6d2af1ae-e75f-4115-ae4f-6d043bce648a" />
  <br>
  <em>Figure 2: Fishmaster Cloud Architecture — ESP32 → HiveMQ → Spring Boot → React</em>
</p>

---

### Main Features

* **Monitoring:** Tracks Temperature, pH, and Turbidity in real time.
* **Feeding:** Uses a servo motor (SG90) to dispense food on a set schedule. Feeding is paused automatically if water quality is unsafe (e.g. high turbidity).
* **Alerts:** Sends a remote notification and sounds a local audible alarm if any water parameter goes outside the safe range.
* **Data History:** Saves all sensor readings so you can view trends over time.
* **Local Display:** A 2.8" ILI9341 touch LCD on the device shows live data without needing a computer or internet connection.
* **Offline Mode:** The device continues monitoring and feeding even when Wi-Fi is unavailable.

---

### System Modules

#### Hardware (ESP32)

| Component | Model / Details | Qty | Purpose |
|---|---|---|---|
| ESP32 | ESP32-DevKitC-32E (38-pin, CP2102) | 1 | Main microcontroller |
| Expansion Board | ESP32 38-pin GPIO Expansion Board (Type-C) | 1 | Easier wiring, stable connections |
| pH Sensor | PH 0–14 Liquid Monitoring Sensor | 1 | Water pH detection |
| Turbidity Sensor | FARDUINO Water Turbidity Module | 1 | Water clarity detection |
| Temperature Sensor | DS18B20 Waterproof Probe | 1 | Water temperature |
| Display | 2.8" ILI9341 SPI Touch LCD (240x320) | 1 | Local UI display |
| Audio Device | Active/Passive Piezo Buzzer / Speaker | 1 | Local audible alerts & notifications |
| Servo Motor | SG90 180° Micro Servo | 1 | Automatic fish feeder |
| Breadboard | MB-102 830-point | 1 | Circuit prototyping |
| Jumper Wires | 140 / 560 pcs set (M-M, M-F, F-F) | 1 set | Circuit connections |
| Resistors | 4.7kΩ (0.25W, 5%) | ~10 | Pull-up for DS18B20 |
| Multimeter | HABOTEST HT109L | 1 | Debugging & testing |
| USB Cable | USB Type-C | 1 | Power & programming |
| Power Supply Module | MB102 Breadboard 5V/3.3V Power Supply Module | 1 | Provides stable power to breadboard |

#### Software (Web)

| Component | Technology / Details | Function |
|---|---|---|
| Backend | Spring Boot (Java) | Receives sensor data via MQTT, processes it, exposes REST API |
| Frontend | React (JavaScript) | Displays dashboard, charts, alerts and feeding controls |
| Database | PostgreSQL | Stores user data, sensor history and feeding logs |
| MQTT Broker | HiveMQ Cloud (Free Tier, QoS 1) | Handles real-time messaging between ESP32 and backend |

---
## 📸 Preview

<p align="center">
  <img src="https://github.com/user-attachments/assets/b6e1b513-3dc5-45cb-9a92-ce2e12188653" width="80%" />
  <br>
  <em>Main dashboard view</em>
</p>

<p align="center">
  <img src="https://github.com/user-attachments/assets/180b3914-b47b-487f-8dbe-f7e047dc5ecc" width="80%" />
  <br>
  <em>Sensor data charts</em>
</p>

---

## 🌐 Live Demo (Development)

⚠️ This is a development deployment and may be partially functional.

- No authentication (single client setup)
- Some features may not work fully
- Mainly for testing UI and data flow

👉 https://fishmaster.up.railway.app/

---

### Progress

* [x] Hardware sensor setup
* [x] Basic backend API
* [x] Dashboard UI
* [x] Support for multiple tanks
* [ ] Servo feeder integration
* [x] Audio alert integration
* [x] Condition-based feeding logic
* [x] Support for calibration settings
* [x] Offline/online mode switching

---

<div align="center">
  <sub>
    Made with 🐟 by <a href="https://www.linkedin.com/in/abdalla-nezar-elshiekh/"><b>Abdalla Elshiekh</b></a>  
    | Powered by ESP32 ⚡ · Spring Boot 🟢 · React 🔷
  </sub>
</div>
