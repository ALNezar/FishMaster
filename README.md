<div align="center">

  <img src="https://github.com/user-attachments/assets/48d73cbd-8878-49fd-a7e6-4adea17c9ac6" alt="FishMaster Logo" width="260"/>

  <h1>🐟 FISHMASTER</h1>
  <h3>Smart Aquarium Monitoring & Control System using ESP32</h3>

  <p>
    <strong>FishMaster</strong> is a smart aquarium system built with <strong>ESP32</strong>, <strong>Spring Boot</strong>, and <strong>React</strong>.
  </p>

  <p>
    <img src="https://img.shields.io/badge/ESP32-Microcontroller-blue?logo=espressif&logoColor=white" />
    <img src="https://img.shields.io/badge/Spring%20Boot-Backend-brightgreen?logo=springboot&logoColor=white" />
    <img src="https://img.shields.io/badge/React-Frontend-61DAFB?logo=react&logoColor=white" />
    <img src="https://img.shields.io/badge/IoT-Project-orange?logo=icloud&logoColor=white" />
  </p>

</div>

---

### 💧 Overview
FishMaster is a smart aquarium system that helps monitor and control your fish tank automatically. The system works in two ways: a local embedded system and a web-based system. The embedded system uses an ESP32 microcontroller with sensors to check important water conditions like pH levels and temperature. All the readings are shown on an LCD screen attached to the aquarium, and it can automatically feed your fish on schedule. This local system works completely on its own without needing internet, making it reliable even when the network goes down.

The web system adds more features by connecting to the internet. The ESP32 sends sensor data to a server backend, and users can check their aquarium from anywhere using a mobile or web app. The web interface shows detailed graphs and historical data to track how the aquarium is doing over time. If the internet connection fails or has security issues, the system automatically falls back to the embedded mode with the LCD screen, so the fish are always taken care of.


This dual-system design makes FishMaster both convenient for remote monitoring and dependable for everyday aquarium care.


---

<div align="center">
  <sub>Made with 🐟 by <strong>Abdalla Nezar</strong> | Powered by ESP32 · Spring Boot · React</sub>
</div>
