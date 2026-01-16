
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

The embedded system uses an ESP32 microcontroller with sensors to measure parameters like pH and temperature. Readings appear on a local LCD screen, and a servo-driven feeder handles scheduled feeding. This setup works entirely offline, so the aquarium stays managed even if the network fails.

The web system adds cloud connectivity. The ESP32 uploads data to a backend, and users can view their aquarium through a mobile or web interface. The dashboard includes charts, historical data, and remote monitoring. If the network becomes unavailable, the system automatically switches back to the embedded mode.

This dual design gives remote convenience while staying reliable during connectivity issues.


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

### Main Features

* **Monitoring:** Tracks Temperature, pH, Turbidity, and Ammonia.
* **Feeding:** Uses a servo motor to drop food on a set schedule.
* **Alerts:** Sends a notification if water levels go outside the safe range.
* **Data History:** Saves sensor readings so you can see trends over time.
* **Local Display:** An LCD screen on the device shows data without needing a computer.

---

### System Modules

#### Hardware (ESP32)
| Part | Function |
| :--- | :--- |
| Sensors | Collects water temperature, pH, and clarity data. |
| Servo | Moves the feeder to dispense food. |
| Display | Shows live data locally on the tank. |

#### Software (Web)
| Part | Function |
| :--- | :--- |
| Backend | Spring Boot app that receives data and stores it. |
| Frontend | React dashboard for viewing charts and settings. |
| Database | Stores login info and sensor history. |



---

### Progress

* [ ] Hardware sensor setup
* [x] Basic backend API
* [x] Dashboard UI
* [ ] Support for multiple tanks
* [ ] Support for calibration settings
---

<div align="center">
    <sub>Made with 🐟 by <strong>Abdalla Nezar</strong> | Powered by ESP32 · Spring Boot · React</sub>
</div>

