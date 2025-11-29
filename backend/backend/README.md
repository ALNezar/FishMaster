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

Project Structure (key paths)
* pom.xml — Maven configuration and dependencies
* src/main/java/com/fishmaster/backend
  * BackendApplication.java — application entry point
  * controllers/
    * AuthController.java — /auth endpoints (signup, login, verify, resend)
    * HomeController.java — serves index page at /
    * MessageController.java — TODO: document endpoints
    * UserControllers.java — TODO: document endpoints
  * config/ — Security/JWT/auth beans and filters
  * model/ — JPA entities (User, Message)
  * repositories/ — Spring Data repositories (UserRepo)
  * service/ — domain services (AuthenticationService, JwtService, EmailService, UserService)
* src/main/resources
  * application.yaml — application configuration (DO NOT COMMIT SECRETS)
  * templates/index.html — Thymeleaf view
  * db/migration/V1_initial_migration.sql — initial Flyway migration (currently not applied)
* src/test/java/com/fishmaster/backend/BackendApplicationTests.java — basic context load test

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

API Endpoints (summary)
* GET / — returns index view (Thymeleaf)
* POST /auth/signup — create a user
* POST /auth/login — authenticate user and receive JWT
* POST /auth/verify — verify user email with code
* POST /auth/resend — resend verification code
* TODO: Document endpoints in MessageController and UserControllers (paths, request/response models, auth requirements)

Authentication
* After successful login, a JWT is issued. Include it in subsequent requests:
  * Authorization: Bearer <token>
* Token expiration time is configured via SECURITY_JWT_EXPIRATION_TIME (milliseconds)

Testing
* Run tests:
  * Windows: .\mvnw.cmd test
  * Linux/macOS: ./mvnw test
* Current tests: context-load test at src/test/java/com/fishmaster/backend/BackendApplicationTests.java
* TODO: Add unit/integration tests for controllers, services, and security filters

Common Maven Commands (scripts)
* .\mvnw.cmd clean           — clean target directory
* .\mvnw.cmd test            — run tests
* .\mvnw.cmd spring-boot:run — run the app
* .\mvnw.cmd package         — build shaded JAR via Spring Boot plugin

Local Development Tips
* Use dev-specific properties via application-local.yaml and set SPRING_PROFILES_ACTIVE=local
* Keep secrets out of VCS; prefer environment variables or a secrets manager

License
* TODO: Add a LICENSE file and specify the project license in this README

Contributing
* TODO: Add contribution guidelines and code of conduct

Changelog / Versioning
* TODO: Document release process and versioning scheme

Security
* If you discover a security issue, please avoid opening a public issue. TODO: Add a private contact method.
