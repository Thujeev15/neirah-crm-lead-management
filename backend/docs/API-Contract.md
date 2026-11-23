# CRM Lead Management – API Contract

**Base URL:** `http://localhost:8080/api/v1`

**Authentication:** JWT Bearer Token

Protected endpoints require:

`Authorization: Bearer <token>`

## 1. Authentication APIs

| Method | Endpoint | Description | Access |
|---|---|---|---|
| POST | `/auth/register` | Register a user | Public (development/seed use) |
| POST | `/auth/login` | Login and receive JWT | Public |
| GET | `/auth/me` | Get current user details | Authenticated |

## 2. Lead Management APIs

| Method | Endpoint | Description | Access |
|---|---|---|---|
| POST | `/leads` | Create a lead | Manager, Sales Rep |
| GET | `/leads` | List leads with pagination and filters | Role-based |
| GET | `/leads/{id}` | Get lead details | Manager, assigned Rep |
| PUT | `/leads/{id}` | Update lead details | Manager, assigned Rep |
| GET | `/leads/duplicates` | Check duplicate email or phone | Authenticated |

### Lead List Filters

- `search`: Search by name, email or company
- `status`: Filter by pipeline status
- `priority`: Filter by priority
- `ownerId`: Filter by assigned representative
- `page`: Page number
- `size`: Page size
- `sort`: Sort field and direction

## 3. Lead Assignment APIs

| Method | Endpoint | Description | Access |
|---|---|---|---|
| PATCH | `/leads/{id}/assign` | Assign or reassign a lead | Manager only |

Every ownership change must create an audit event.

## 4. Pipeline APIs

| Method | Endpoint | Description | Access |
|---|---|---|---|
| PATCH | `/leads/{id}/status` | Change lead pipeline status | Manager, assigned Rep |

Valid statuses:

- NEW
- CONTACTED
- QUALIFIED
- PROPOSAL_SENT
- WON
- LOST

Business validations:

- WON requires a positive deal value.
- LOST requires a non-empty loss reason.
- Invalid transitions must be rejected.
- Every successful status change must create an audit event.

## 5. Follow-up APIs

| Method | Endpoint | Description | Access |
|---|---|---|---|
| POST | `/follow-ups` | Create a follow-up | Manager, assigned Rep |
| GET | `/follow-ups` | List follow-ups | Role-based |
| GET | `/follow-ups/upcoming` | Get upcoming follow-ups | Role-based |
| GET | `/follow-ups/overdue` | Get overdue follow-ups | Role-based |
| PATCH | `/follow-ups/{id}/complete` | Complete a follow-up | Manager, assigned Rep |

Overdue follow-ups are determined using due date/time and completion status.

## 6. Activity APIs

| Method | Endpoint | Description | Access |
|---|---|---|---|
| POST | `/leads/{id}/activities` | Add a note, call or meeting | Manager, assigned Rep |
| GET | `/leads/{id}/activities` | Get activity timeline | Manager, assigned Rep |

Activity records include actor and creation timestamp.

## 7. Audit APIs

| Method | Endpoint | Description | Access |
|---|---|---|---|
| GET | `/leads/{id}/audit-logs` | View lead audit history | Manager, assigned Rep |

Audit records must not be editable or deletable through the API.

## 8. Dashboard APIs

| Method | Endpoint | Description | Access |
|---|---|---|---|
| GET | `/dashboard/summary` | Pipeline counts and conversion rate | Manager only |
| GET | `/dashboard/overdue-follow-ups` | Overdue follow-up summary | Manager only |
| GET | `/dashboard/leads-by-owner` | Lead counts by representative | Manager only |

## 9. Customer Conversion API

| Method | Endpoint | Description | Access |
|---|---|---|---|
| POST | `/leads/{id}/convert` | Convert a Won lead into a customer | Manager, assigned Rep |

Conversion must be transactional and idempotent. Repeated requests must not create duplicate customers.

## 10. Standard HTTP Responses

| Status | Meaning |
|---|---|
| 200 | Successful request |
| 201 | Resource created |
| 400 | Validation or invalid business rule |
| 401 | Authentication required |
| 403 | Insufficient permissions |
| 404 | Resource not found |
| 409 | Duplicate or concurrent update conflict |
| 500 | Unexpected server error |

## 11. Common Error Response

```json
{
  "timestamp": "2026-11-24T10:30:00",
  "status": 400,
  "error": "Bad Request",
  "message": "A positive deal value is required before marking a lead as WON",
  "path": "/api/v1/leads/1/status"
}
```

## 12. Implementation Note

This document defines the planned API contract. Endpoints will be implemented and tested in the backend development stages. Endpoint availability is not implied until implementation is complete.