<div align="center">

<img width="700" height="300" alt="Fish logo" src="https://github.com/user-attachments/assets/4a4d854f-14e6-48f2-ba60-82d6c91dfe55" />

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
FishMaster Backend

Overview
* This repository contains the FishMaster backend service built with Spring Boot. It provides user authentication (signup, login, email verification, JWT issuance) and serves a simple index page via Thymeleaf. PostgreSQL is used for persistence. Email is sent using Spring Mail. JWT tokens are generated with JJWT.

Tech Stack
* Language: Java 21
* Framework: Spring Boot 3.5.x (Web, Security, Data JPA, Thymeleaf)
* Database: PostgreSQL
* Migrations: Flyway (present; currently disabled by configuration)
* Auth: Spring Security + JWT (JJWT)
* Mail: Spring Boot Starter Mail (SMTP)
* Utilities: Lombok
* Build/Package Manager: Maven (with Maven Wrapper mvnw/mvnw.cmd)

Entry Point
* Main application class: com.fishmaster.backend.BackendApplication

Requirements
* Java 21 (JDK)
* Maven (not required if using the Maven Wrapper provided in the repo)
* PostgreSQL (local or remote instance)
* SMTP credentials for sending verification emails

P

Configuration and Environment Variables
Important: Secrets are currently present in src/main/resources/application.yaml. For security, move all secrets to environment variables or an externalized configuration source before deployment.

These Spring properties can be provided via environment variables (examples shown with environment variable form in parentheses):
* spring.datasource.url (SPRING_DATASOURCE_URL)
* spring.datasource.username (SPRING_DATASOURCE_USERNAME)
* spring.datasource.password (SPRING_DATASOURCE_PASSWORD)
* spring.jpa.hibernate.ddl-auto (SPRING_JPA_HIBERNATE_DDL_AUTO)
* spring.jpa.show-sql (SPRING_JPA_SHOW_SQL)
* spring.mail.host (SPRING_MAIL_HOST)
* spring.mail.port (SPRING_MAIL_PORT)
* spring.mail.username (SPRING_MAIL_USERNAME)
* spring.mail.password (SPRING_MAIL_PASSWORD)
* spring.mail.properties.mail.smtp.auth (SPRING_MAIL_PROPERTIES_MAIL_SMTP_AUTH)
* spring.mail.properties.mail.smtp.starttls.enable (SPRING_MAIL_PROPERTIES_MAIL_SMTP_STARTTLS_ENABLE)
* spring.flyway.enabled (SPRING_FLYWAY_ENABLED)
* security.jwt.secret-key (SECURITY_JWT_SECRET_KEY)
* security.jwt.expiration-time (SECURITY_JWT_EXPIRATION_TIME)

Minimum required values before first run:
* SPRING_DATASOURCE_URL=jdbc:postgresql://<host>:<port>/<db>
* SPRING_DATASOURCE_USERNAME=<db_user>
* SPRING_DATASOURCE_PASSWORD=<db_password>
* SECURITY_JWT_SECRET_KEY=<base64-encoded-secret>
* SPRING_MAIL_* variables if email verification is required in your flow

Notes
* The configured Flyway is disabled by default (spring.flyway.enabled=false). To run the migration script in db/migration, enable it and ensure the datasource is configured.
* JPA ddl-auto is set to update in application.yaml; you may prefer validate for production.

Setup
1) Clone the repository
2) Configure environment variables (see above). On Windows (PowerShell), you can set for the current session:
   * $env:SPRING_DATASOURCE_URL = "jdbc:postgresql://localhost:5432/fishmaster"
   * $env:SPRING_DATASOURCE_USERNAME = "postgres"
   * $env:SPRING_DATASOURCE_PASSWORD = "<your_password>"
   * $env:SECURITY_JWT_SECRET_KEY = "<Base64Secret>"
   * Optional: mail settings ($env:SPRING_MAIL_HOST, etc.)
3) Ensure PostgreSQL is running and the database exists (create database fishmaster;)

Running the Application
* Using Maven Wrapper (recommended):
  * Windows: .\mvnw.cmd spring-boot:run
  * Linux/macOS: ./mvnw spring-boot:run

* Packaging a runnable JAR:
  * Windows: .\mvnw.cmd -DskipTests package
  * Linux/macOS: ./mvnw -DskipTests package
  * Run: java -jar target/backend-0.0.1-SNAPSHOT.jar

Database Migrations (Flyway)
* Enable Flyway by setting SPRING_FLYWAY_ENABLED=true
* Ensure the datasource is set; on startup, scripts in src/main/resources/db/migration will be applied
* TODO: Add more migration scripts and document versioning policy

