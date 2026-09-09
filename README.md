<div align="center">

<img width="700" alt="Fish logo" src="https://github.com/user-attachments/assets/4a4d854f-14e6-48f2-ba60-82d6c91dfe55" />

# FishMaster

### Aquarium Monitoring and Control System using ESP32

FishMaster is an IoT smart aquarium system using an ESP32 Microcontroller to monitor water quality and control fish feeding.

The system includes a web dashboard where users can view the aquarium condition and feed fish from a phone or computer via a Progressive Web App (PWA).

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

Simply put ... FishMaster is an IoT smart aquarium system that can monitor water conditions in a fresh-water home aquarium.

The system consists of two main parts:

- Web system (Spring Boot backend + React frontend)
- Embedded system based on ESP32 microcontroller

<img width="686" height="585" alt="image" src="https://github.com/user-attachments/assets/715c9464-1b11-48cf-ba32-a505d2375f43" />

---

The ESP32 uses sensors to check three things:

- pH
- Water temperature
- Water turbidity (water clarity)

<img width="820" height="286" alt="image" src="https://github.com/user-attachments/assets/7d08e66c-9750-46f4-9625-431837639395" />

---

The sensor data is shown on a local 2.8" touch screen.

The ESP32 also controls a servo motor that is used as an automatic fish feeder.

The ESP32 can work **without the internet**. This means the aquarium can still be monitored and controlled even when the Wi-Fi is not working.

The web system lets users check the aquarium from a phone or computer.

The web dashboard can show:

- Current sensor readings
- Charts
- Sensor history
- Feeding controls
- Remote monitoring
- Fish species management (including custom species profiles)
- Alert configuration

If the internet connection is lost, the ESP32 can continue to monitor the aquarium, show data on the local screen, and trigger local alerts.

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
- Gives local alerts (buzzer)
- Stores local historical data on the ESP32
- Continues working when Wi-Fi is not available
- Accepts input from a local 1×4 keypad and wireless remote controller

#### Web System

When the ESP32 has an internet connection, it can send the sensor data to the web system.

Users can then:

- View the current water condition
- View old sensor data
- See charts
- Control feeding
- Monitor the aquarium remotely
- Manage fish species and custom profiles
- Set alert thresholds

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

Think of FishMaster as three parts talking to each other in real-time:

- the physical aquarium hardware (ESP32)
- the brain in the cloud (Spring Boot & PostgreSQL)
- the user dashboard (React)

To bridge the gap between the hardware and the web, MQTT (via HiveMQ Cloud) is used. It is a fast, lightweight messaging protocol perfect for IoT devices.

The data flows in two main loops: **Up** (monitoring) and **Down** (controlling).

---

#### 1. The Monitoring Loop (Sensors → Web)

This is how water data gets from the fish tank to your screen:

1. The **ESP32** constantly reads data from the temperature, pH, and turbidity sensors.
2. It bundles this data and publishes it to the **HiveMQ MQTT Broker** under a specific topic (e.g. `FishMaster/tank_1/sensor`).
3. The **Spring Boot** backend is always listening to that topic. When new data arrives, Spring Boot processes it and saves it in a **PostgreSQL** database.
4. The **React frontend** asks the backend for the newest data via REST API and updates the charts automatically.

---

#### 2. The Control Loop (Web → Aquarium)

This is how you trigger actions, such as feeding the fish from your phone:

1. You log into the dashboard and click the **"Feed Now"** button.
2. React sends a REST POST request to the **Spring Boot** backend.
3. Spring Boot immediately publishes a command to the MQTT broker on the control topic (e.g. `FishMaster/tank_1/control`).
4. The **ESP32** is listening to that control topic, receives the command, and triggers the physical **SG90 servo motor** to drop the fish food.

---

### Where It's Hosted

Everything on the web side (React frontend + Spring Boot backend) is packaged as a single system (monolith) and hosted on **Railway**.

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

* **Water Monitoring** – Checks water temperature, pH, and turbidity in real time.
* **Automatic Feeding** – Uses an SG90 servo motor to release fish food.
* **Feeding Schedule** – Allows feeding at set times.
* **Water Safety** – Can stop or delay feeding when water condition is not safe.
* **Alerts** – Gives local (buzzer) and remote alerts when a reading is outside the safe range.
* **Data History** – Saves sensor readings so they can be viewed later (both locally and in the cloud).
* **Local Display** – Shows live sensor data on a 2.8" ILI9341 TFT touch screen.
* **Remote Monitoring** – Lets users check the aquarium through the web dashboard (PWA).
* **Offline Mode** – The ESP32 continues working when Wi-Fi is not available.
* **Fish Species Management** – Built-in fish species database with recommended water parameter ranges. Users can also create custom species profiles.
* **Remote Controller** – A 2.4 GHz wireless remote controller can be used for manual control.
* **Local Keypad** – 1×4 keypad for basic local input without the web interface.

---

### System Modules

#### Hardware (ESP32)

| Component           | Model / Details                              | Qty   | Purpose                          |
| ------------------- | -------------------------------------------- | ----- | -------------------------------- |
| ESP32               | ESP32-DevKitC-32E (38-pin, CP2102)           | 1     | Main microcontroller             |
| Expansion Board     | ESP32 38-pin GPIO Expansion Board (Type-C)   | 1     | Makes wiring easier              |
| pH Sensor           | PH 0–14 Liquid Monitoring Sensor             | 1     | Measures water pH                |
| Turbidity Sensor    | FARDUINO Water Turbidity Module              | 1     | Checks water clarity             |
| Temperature Sensor  | DS18B20 Waterproof Probe                     | 1     | Measures water temperature       |
| Display             | 2.8" ILI9341 SPI Touch LCD (240×320)         | 1     | Shows aquarium data              |
| Keypad              | 1×4 Membrane Keypad                          | 1     | Local input control              |
| Audio Device        | Active/Passive Piezo Buzzer                  | 1     | Gives local alerts               |
| Servo Motor         | SG90 180° Micro Servo                        | 1     | Controls the fish feeder         |
| Breadboard          | MB-102 830-point                             | 1     | Used for circuit testing         |
| Jumper Wires        | 140 / 560 pcs set (M-M, M-F, F-F)            | 1 set | Connects the components          |
| Resistors           | 4.7 kΩ (0.25 W, 5%)                          | ~10   | Used with the temperature sensor |
| Multimeter          | HABOTEST HT109L                              | 1     | Used for testing the circuit     |
| USB Cable           | USB Type-C                                   | 1     | Power and programming            |
| Power Supply Module | MB102 Breadboard 5 V / 3.3 V Power Supply    | 1     | Provides power to the breadboard |
| Remote Controller   | 2.4 GHz Wireless Remote Controller / Receiver| 1     | Wireless manual control          |

#### Software (Web)

| Component   | Technology / Details            | Function                                       |
| ----------- | ------------------------------- | ---------------------------------------------- |
| Backend     | Spring Boot (Java)              | Receives and processes sensor data, handles alerts, authentication, and MQTT |
| Frontend    | React (JavaScript) + PWA        | Shows the dashboard and controls               |
| Database    | PostgreSQL                      | Stores users, sensor data, tanks, fish species, and feeding records |
| MQTT Broker | HiveMQ Cloud (Free Tier, QoS 1) | Sends messages between the ESP32 and backend   |

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

The FishMaster prototype uses an ESP32 connected to the sensors, touch screen, fish feeder, wireless remote controller, and local keypad.

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

## Live Demo (Development)

This is the development version of FishMaster.

It is mainly used to test the website, sensor data, and communication between the ESP32 and web system.

<div align="center">

(❁´◡`❁)

<sub>
Made with 🐟 and care by
<a href="https://www.linkedin.com/in/abdalla-nezar-elshiekh/"><b>Abdalla Elshiekh 💗</b></a>
</sub>

<br>

<sub>
ESP32 · Spring Boot · React · PostgreSQL · MQTT · HiveMQ · Railway
</sub>

</div>
