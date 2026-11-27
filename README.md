# Neirah CRM – Lead Management & Automated Follow-up System

A role-based CRM application built using Spring Boot, React, and MySQL.

## Features
- JWT authentication and role-based access
- Manager and Sales Rep roles
- Lead creation, viewing, updating, searching, and filtering
- Lead assignment and reassignment
- Duplicate lead detection
- Sales pipeline management
- Follow-up scheduling and completion
- Activity timeline and audit history
- Won lead conversion into customers
- Manager dashboard and reports

## Technology Stack
- Java 21
- Spring Boot
- Spring Security and JWT
- Spring Data JPA
- MySQL
- Flyway
- Maven
- React and Vite
- Tailwind CSS
- Axios
- JUnit 5 and Mockito

## Prerequisites
- Java 21
- Maven
- MySQL
- Node.js and npm

## Database Setup
Create the database:

    CREATE DATABASE crm_db;

Set environment variables:

    export DB_PASSWORD='your_mysql_password'
    export JWT_SECRET='your_long_random_secret'

## Backend Setup

    cd backend
    mvn clean install
    mvn spring-boot:run

Backend URL: http://localhost:8080

## Frontend Setup

Open another Terminal from the project root:

    cd frontend
    npm install
    npm run dev

Open the frontend URL printed in the terminal.

## API Documentation
- Swagger UI: http://localhost:8080/swagger-ui.html
- OpenAPI JSON: http://localhost:8080/v3/api-docs
- API Contract: backend/docs/API-Contract.md

## Database Design
- ER Diagram: backend/docs/ER-Diagram.md
- Role and Permission Matrix: backend/docs/Role-Permission-Matrix.md

## Automated Tests

    cd backend
    mvn test

## Demo Workflow
1. Log in as Manager.
2. Create and assign leads.
3. Log in as a Sales Rep.
4. Update assigned leads and record activities.
5. Schedule and complete follow-ups.
6. Update pipeline stages.
7. Convert a Won lead into a customer.
8. Review dashboard reports as Manager.

## Security
- Passwords are stored using BCrypt hashing.
- Protected API endpoints use JWT authentication.
- Authorization is enforced on the backend.
- Never commit passwords, tokens, or production secrets.

## Known Limitations
- Email and WhatsApp automation are not included.
- External notification integrations are not included.

## GitHub Repository
https://github.com/Thujeev15/neirah-crm-lead-management
