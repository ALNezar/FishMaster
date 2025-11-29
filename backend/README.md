<div align="center">

<img width="7000" height="300" alt="Fish logo" src="https://github.com/user-attachments/assets/4a4d854f-14e6-48f2-ba60-82d6c91dfe55" />

<h1>FISHMASTER</h1>
<h3>Smart Aquarium Monitoring & Control System using ESP32</h3>

<p><strong>FishMaster</strong> is a smart aquarium system built with <strong>ESP32</strong>, <strong>Spring Boot</strong>, and <strong>React</strong>.</p>

<p>
    <img src="https://img.shields.io/badge/ESP32-Microcontroller-blue?logo=espressif&logoColor=white" />
    <img src="https://img.shields.io/badge/Spring%20Boot-Backend-brightgreen?logo=springboot&logoColor=white" />
    <img src="https://img.shields.io/badge/React-Frontend-61DAFB?logo=react&logoColor=white" />
    <img src="https://img.shields.io/badge/IoT-Project-orange?logo=icloud&logoColor=white" />
</p>

</div>

---

### 💧 Overview

FishMaster is a smart aquarium system that monitors and controls key aquarium conditions through two layers: an embedded local system and a web-based system.

The embedded system uses an ESP32 microcontroller with sensors to measure parameters like pH and temperature. Readings appear on a local LCD screen, and a servo-driven feeder handles scheduled feeding. This setup works entirely offline, so the aquarium stays managed even if the network fails.

The web system adds cloud connectivity. The ESP32 uploads data to a backend, and users can view their aquarium through a mobile or web interface. The dashboard includes charts, historical data, and remote monitoring. If the network becomes unavailable, the system automatically switches back to the embedded mode.

This dual design gives remote convenience while staying reliable during connectivity issues.

---

# FishMaster System Overview

FishMaster is an IoT-based monitoring and control system for freshwater aquariums with real-time sensor tracking and a web-based dashboard.

The system monitors:

- **Temperature**
- **pH**
- **Turbidity**
- **Ammonia**

Specialised parameters like nitrate, phosphate, or salinity are not included because they apply to saltwater or brackish setups.

System modes:

- **Online Mode**: Cloud logging, trend analysis, alerts, and PWA remote access.
- **Offline Mode**: Local touchscreen displaying live readings during network outages.

Additional capabilities:

- Automated feeding using a servo.
- Educational resources for beginners.
- One device per aquarium, but users can manage multiple tanks from one account.
- WiFi needed for setup and cloud features. Core monitoring works offline.

---

# System Modules

## Table 1.1: Hardware / Embedded Modules

| No | Module | Description | User |
|----|--------|-------------|------|
| 1 | **Sensor Monitoring** | Collects temperature, pH, ammonia, and turbidity using an ESP32 with a sensor array. Sends data to backend. | All users |
| 2 | **Automated Feeding** | Servo-based food dispenser that runs on user-defined schedules. | All users |
| 3 | **Local Display (Offline Mode)** | Touchscreen showing current readings and status without internet. | All users |

---

## Table 1.2: Software Application Modules

| No | Module | Description | User |
|----|--------|-------------|------|
| 1 | **Login and Authentication** | Registration, login, and authorisation. | All users |
| 2 | **User Profile Management** | Manage personal info and notification settings. | All users |
| 3 | **Tank Management** | Add or update aquarium profiles with targets and device links. | All users |
| 4 | **Data Logging and Visualisation** | Historical readings with interactive charts. | Home hobbyists, Educational institutions |
| 5 | **Alert Configuration** | Thresholds for water parameters with real-time warnings. | All users |
| 6 | **Notification Management** | Push and email alerts for unsafe conditions. | All users |
| 7 | **Educational Content** | Care guides and troubleshooting material. | Home hobbyists, Educational institutions |
| 8 | **Device Settings** | WiFi setup, calibration, and firmware updates for ESP32. | All users |

---

<div align="center">
    <sub>Made with 🐟 by <strong>Abdalla Nezar</strong> | Powered by ESP32 · Spring Boot · React</sub>
</div>
