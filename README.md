# Neirah CRM – Lead Management & Automated Follow-up System

A role-based CRM module for capturing leads, assigning ownership, tracking the sales pipeline,
scheduling follow-ups and converting won leads into customers without losing history.

Built with **Spring Boot 4 (Java 21) · React 19 + Vite · MySQL · JWT**.

---

## Contents

1. [Features](#features)
2. [Project structure](#project-structure)
3. [Prerequisites](#prerequisites)
4. [Environment variables](#environment-variables)
5. [Setup and run](#setup-and-run)
6. [Demo accounts and seed data](#demo-accounts-and-seed-data)
7. [Running the tests](#running-the-tests)
8. [API documentation](#api-documentation)
9. [Design documents](#design-documents)
10. [Assumptions and design decisions](#assumptions-and-design-decisions)
11. [Known limitations](#known-limitations)
12. [Demo walkthrough](#demo-walkthrough)

---

## Features

| Area | What is implemented |
|---|---|
| Authentication | JWT login, BCrypt password hashing, 401 on missing or expired tokens (the frontend then logs out automatically). No public sign-up: managers create sales rep accounts. A password reset ends the user's existing sessions |
| Roles | **Manager** sees and manages every lead. **Sales Rep** sees and updates only the leads they own |
| Lead records | Create, edit, list, search (including phone digits), filter (status, priority, owner) and paginate newest first |
| Assignment | Manager-only assign/reassign. Every change is written to an audit log. Notes and history are kept, and open follow-ups move to the new owner |
| Pipeline | `NEW → CONTACTED → QUALIFIED → PROPOSAL_SENT → WON`, and any open stage → `LOST`, with transitions validated on the server |
| Follow-ups | Dated calls, meetings and tasks; mark complete; upcoming, overdue and completed views |
| Activity timeline | Notes, calls and meetings merged with owner changes, status changes and conversions, each showing who did it and when |
| Duplicate detection | Email and phone are normalised before comparing. The user is warned and must confirm before a duplicate is created |
| Conversion | Won lead → customer. Transactional and idempotent: a repeat request returns the existing customer, and a Won lead whose email matches an existing customer is linked to that customer instead of creating a duplicate |
| Dashboard | Counts by stage, overdue follow-ups, leads by owner, conversion rate, win rate and won deal value |
| Reliability | Optimistic locking (`@Version`) on leads, a row lock during conversion, one error format for every API error, and application logging |

## Project structure

```
CRM-Project/
├── backend/                         Spring Boot REST API
│   ├── src/main/java/com/neirah/backend/
│   │   ├── config/                  Security (JWT filter chain, CORS) and OpenAPI config
│   │   ├── controller/              REST controllers
│   │   ├── dto/                     Request/response records with validation
│   │   ├── entity/                  JPA entities and enums
│   │   ├── exception/               Global exception handler and ApiError format
│   │   ├── repository/              Spring Data repositories and queries
│   │   ├── security/                JWT service and authentication filter
│   │   ├── service/                 Business rules
│   │   └── util/                    Contact normalisation (email/phone)
│   ├── src/main/resources/db/migration/
│   │   ├── V1__initial_schema.sql   Tables, foreign keys, indexes
│   │   ├── V2__seed_demo_data.sql   Synthetic demo data
│   │   └── V3__customer_matching_and_session_versioning.sql   Customer matching, conversion audit, session versioning
│   ├── src/test/                    Unit and integration tests
│   └── docs/                        ER diagram, API contract, permissions, OpenAPI export, test evidence
├── frontend/                        React + Vite + Tailwind single-page app
│   └── src/{pages,components,context,api}
└── CRM-Project.postman_collection.json
```

## Prerequisites

| Tool | Version used |
|---|---|
| Java (JDK) | 21 |
| Maven | 3.9+ |
| MySQL | 8.0+ (tested on 9.5) |
| Node.js / npm | Node 20+ |

## Environment variables

Secrets are read from environment variables and are never committed.
`backend/.env.example` lists them; the values below are examples only.

| Variable | Required | Example | Purpose |
|---|---|---|---|
| `DB_PASSWORD` | Yes | `your_mysql_password` | Password for the MySQL `root` user (see `application.properties`) |
| `JWT_SECRET` | Yes | `a-long-random-string-of-at-least-32-characters` | HMAC key used to sign JWTs. Must be at least 32 bytes |

```bash
export DB_PASSWORD='your_mysql_password'
export JWT_SECRET='replace-with-a-long-random-secret-at-least-32-chars'
```

The database URL and username are in `backend/src/main/resources/application.properties`
(`jdbc:mysql://localhost:3306/crm_db`, user `root`).

## Setup and run

### 1. Create the database

```sql
CREATE DATABASE crm_db;
```

You only need to create the empty database. On first start, **Flyway** creates every table (`V1`)
and loads the demo data (`V2`), then applies the schema changes in `V3`. Hibernate then runs with `ddl-auto=validate`, which checks that the
schema matches the entities but never changes it.

### 2. Start the backend

```bash
cd backend
mvn spring-boot:run
```

The API runs at **http://localhost:8080**. You should see
`Successfully applied 3 migrations to schema crm_db` in the log.

### 3. Start the frontend (in a second terminal)

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173**. The backend allows requests from ports 5173 and 5174 (CORS).

## Demo accounts and seed data

All seeded data is synthetic. Every account uses the password **`Demo@1234`**.

| Role | Email | Name |
|---|---|---|
| Manager | `manager@neirah.demo` | Maya Manager |
| Sales Rep | `ravi@neirah.demo` | Ravi Perera |
| Sales Rep | `nisha@neirah.demo` | Nisha Fernando |
| Sales Rep | `arun@neirah.demo` | Arun Silva |

The seed data (`V2__seed_demo_data.sql`) contains:

- **11 leads** across every stage: 3 New, 2 Contacted, 1 Qualified, 2 Proposal Sent, 2 Won, 1 Lost.
- **1 lead already converted** (Ruwan Dissanayake) and **1 Won lead ready to convert** (Sachini Abeysekara, owned by Arun).
- **3 overdue**, **4 upcoming** and **2 completed** follow-ups. One completed follow-up was finished after its due date, which shows that completed items are never counted as overdue.
- Audit history for every stage change and reassignment, including a lead reassigned from Nisha to Arun that keeps Nisha's earlier notes.
- One lead with no email and one with no phone, to show how missing values are handled.

Dates are relative to the time the migration runs, so overdue and upcoming items stay correct whenever you set up the project.

> **Existing database:** if `crm_db` already had tables created by Hibernate, Flyway treats the
> current schema as version 1 (`baseline-on-migrate`) and applies `V2` and `V3` on top. Seed users are added
> with `INSERT IGNORE`, so existing accounts are not touched. `V3` adds a unique index on customer email, so it
> fails if your old data has two customers with the same email. For a clean demo, drop and recreate `crm_db`.

## Running the tests

```bash
cd backend
mvn test
```

**44 tests, all passing.** They run against an in-memory H2 database, so no MySQL or environment
variables are needed. The suite includes:

- **Unit tests** (Mockito) for lead rules, duplicate detection, assignment, audit events, follow-up overdue logic and conversion.
- **Integration tests** (MockMvc) that go through the real JWT security filter chain, controllers, services and database. They cover 401/403 handling, ownership checks, idempotent conversion, duplicate warnings, validation errors and role-scoped dashboards.

See **[backend/docs/Test-Evidence.md](backend/docs/Test-Evidence.md)** for the latest run output and a table mapping each test to a business rule.

## API documentation

| Resource | Location |
|---|---|
| Swagger UI (live) | http://localhost:8080/swagger-ui.html. Click **Authorize** and paste the JWT from `/auth/login` |
| OpenAPI JSON (live) | http://localhost:8080/v3/api-docs |
| OpenAPI export (snapshot) | [backend/docs/openapi.json](backend/docs/openapi.json) |
| API contract | [backend/docs/API-Contract.md](backend/docs/API-Contract.md) |
| Postman collection | [CRM-Project.postman_collection.json](CRM-Project.postman_collection.json). Run **Login** first; the token is saved automatically |

Every error response has the same shape:

```json
{
  "timestamp": "2026-11-27T17:18:31",
  "status": 400,
  "error": "Bad Request",
  "message": "Validation failed",
  "path": "/api/v1/leads",
  "fieldErrors": { "name": "Lead name is required" }
}
```

Status codes: `400` validation or business-rule violation · `401` not authenticated · `403` not permitted ·
`404` not found · `409` duplicate or concurrent-update conflict.

## Design documents

- ER diagram: [backend/docs/ER-Diagram.md](backend/docs/ER-Diagram.md) (Mermaid; GitHub renders it automatically)
- Role and permission matrix: [backend/docs/Role-Permission-Matrix.md](backend/docs/Role-Permission-Matrix.md)
- API contract: [backend/docs/API-Contract.md](backend/docs/API-Contract.md)

## Assumptions and design decisions

**Roles and access**
- **There is no public sign-up.** Only a manager can create a sales rep account (`POST /api/v1/users/sales-reps`). Manager accounts come from seed data. With open registration, any stranger could create an account and use the duplicate check to find out whether a person is one of Neirah's leads.
- Resetting a password ends that user's existing sessions immediately. Each token carries a version number, which the reset increments, so older tokens are rejected.
- A new lead is owned by the user who created it. Managers can then reassign it, but only to Sales Reps.
- Sales Reps see dashboard and report figures for their own leads only; managers see everything.
- Every check is enforced in the service layer on the server. Hiding buttons in the UI is only a convenience.

**Pipeline**
- Allowed transitions: `NEW→CONTACTED→QUALIFIED→PROPOSAL_SENT→WON`, and **any open stage → LOST**. Won can only be reached from Proposal Sent, and forward stages cannot be skipped. Spam or unresponsive leads can be closed early, so they don't stay "active" forever and distort the dashboard.
- **Won and Lost are final.** Reopening a closed lead is out of scope.
- Marking a lead Won stores the deal value and clears any loss reason. Marking it Lost does the opposite.

**Duplicate detection**
- **Email** is trimmed and lower-cased. **Phone** keeps digits only, so `+94 (77) 123-4567` matches `94771234567`.
- **Missing values:** a blank email or phone is stored as `NULL` and never counts as a match. Two leads with no phone number are therefore not duplicates.
- A match on either field triggers a warning. The user can still create the lead by confirming (`confirmDuplicate: true`), because two contacts can legitimately share a company phone line.
- When editing a lead, the duplicate check only runs if the email or phone **actually changes**. In that case the user sees the same warning and can choose to save anyway. A lead that was deliberately created as a duplicate can still be edited.
- If the matching lead belongs to another rep, the Sales Rep is told a match exists but cannot see its details.

**Audit and history**
- Audit events (owner and status changes) can only be inserted. The columns are mapped `updatable=false`, and the API has no update or delete endpoints for them.
- Reassignment changes `leads.owner_id` and moves **open** follow-ups to the new owner. Completed follow-ups keep their original assignee as history. Activities and audit rows reference the lead, not the owner, so nothing is lost.
- Conversions are recorded on the timeline as `CONVERTED` events.

**Follow-ups**
- Overdue means `completedAt IS NULL AND dueAt < now`. It is worked out on every request and never stored.
- **A follow-up always belongs to the lead owner.** Who can see and complete a follow-up depends on lead ownership (business rule 3), so assigning one to another rep would create a task they could neither see nor complete. The server rejects that with 400. To hand work over, reassign the lead.
- Completing a follow-up twice has no further effect.
- **Closed leads:** new follow-ups cannot be scheduled on Won or Lost leads, because those stages are final. The server rejects the request with 400. Follow-ups that were already open when the lead closed can still be marked complete, so reps can finish outstanding work.
- **Past due dates are allowed.** A rep may need to log a call they missed or record a task after the fact. Such a follow-up is reported as overdue immediately, until it is completed.

**Conversion and concurrency**
- Conversion runs in one transaction that locks the lead row (`SELECT … FOR UPDATE`), so two simultaneous requests for the same lead cannot create two customers.
- A repeated conversion request returns the existing customer with `alreadyConverted: true` instead of an error.
- **One customer per person:** if a Won lead's normalised email already belongs to a customer, the lead is linked to that customer (`linkedToExistingCustomer: true`) instead of creating a duplicate. Several Won leads (for example repeat deals) can point to the same customer through `leads.customer_id`. A unique index on `customers.email_normalized` enforces this even under concurrency.
- Customers are matched on **email only**, not phone, because phone lines can be shared by different people (the same reason duplicate leads only trigger a warning). Leads without an email always create a new customer.
- Leads use optimistic locking (`@Version`). If two saves of the same lead collide, the second gets a 409 conflict instead of silently overwriting the first.

**Dashboard**
- **Conversion rate** = Won ÷ all visible leads × 100: how many enquiries become deals.
- **Win rate** = Won ÷ (Won + Lost) × 100: how many closed opportunities are won.
- Both are calculated on the server, so the Dashboard and Reports always show the same numbers.
- The Pipeline page shows **won deal value**. A deal value is recorded when a lead is marked Won, so open leads have no value to add up.

## Known limitations

- No email, SMS or WhatsApp notifications and no background reminder jobs. The PDF lists these as optional.
- No admin screen for managing users. Managers create sales reps and reset their passwords through the API (Swagger or Postman).
- Won and Lost leads cannot be reopened.
- Deal values are only recorded when a lead is Won; there is no estimated value for open opportunities.
- The client does not send the lead version with updates, so optimistic locking only catches saves that collide on the server. It does not detect a user editing from a stale page.
- `GET /leads` is not paginated; it feeds the dashboard and pipeline views. The paginated endpoint for large lists is `GET /leads/search`.
- JWTs last 24 hours. A password reset ends existing sessions, but there is no refresh token and no per-device logout.
- Times use the server's local time zone.
- Only the backend has automated tests; the frontend was checked manually.

