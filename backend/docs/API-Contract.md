# CRM Lead Management – API Contract

**Base URL:** `http://localhost:8080/api/v1`

**Authentication:** JWT Bearer Token

Protected endpoints require:

`Authorization: Bearer <token>`

## 1. Authentication APIs

| Method | Endpoint | Description | Access |
|---|---|---|---|
| POST | `/auth/login` | Login and receive a JWT plus user id, name, email and role | Public |

There is no public registration. Sales rep accounts are created by managers (see section 10).
Each JWT carries a token version, and a password reset increments it, so the user's existing tokens stop working.

## 2. Lead Management APIs

| Method | Endpoint | Description | Access |
|---|---|---|---|
| POST | `/leads/check-duplicates` | Warn about normalised email/phone matches before creating | Authenticated |
| POST | `/leads` | Create a lead. Returns 409 if a duplicate exists and `confirmDuplicate` is not `true` | Manager, Sales Rep |
| GET | `/leads` | List all visible leads (unpaginated; used by dashboard/pipeline views) | Role-based |
| GET | `/leads/search` | Paginated search and filter | Role-based |
| GET | `/leads/{id}` | Get lead details | Manager, assigned Rep |
| PUT | `/leads/{id}` | Update lead details. If a **changed** email/phone matches another lead, returns 409 unless `confirmDuplicate: true` | Manager, assigned Rep |

### `/leads/search` Query Parameters

- `search`: matches name, company, email or phone (case-insensitive, partial)
- `status`: pipeline status
- `priority`: `HIGH`, `MEDIUM` or `LOW`
- `ownerEmail`: assigned representative (Manager only; ignored for Sales Reps, who always see only their own leads)
- `page`: page number, starting at 0 (default 0)
- `size`: page size, 1–100 (default 10)

Results are ordered newest first (`createdAt` descending, `id` as tie-breaker), so pages never overlap.
A search term with 3 or more digits also matches normalised phone numbers, so `0771000003` finds `077-100-0003`.

The response is `{ leads, currentPage, totalItems, totalPages }`.

### Duplicate Handling

- Email is normalised by trimming and lower-casing; phone by keeping digits only.
- A blank or missing email/phone is stored as `NULL` and never matches anything,
  so leads without contact details are never flagged as duplicates of each other.
- A match on either email or phone triggers the warning. Sales Reps are told a match exists
  but only see the details of matches they own.

## 3. Lead Assignment APIs

| Method | Endpoint | Description | Access |
|---|---|---|---|
| PUT | `/leads/{id}/assign` | Assign or reassign a lead. Body: `{ "ownerEmail": "rep@..." }` | Manager only |

Leads can only be assigned to Sales Reps. Every ownership change creates an `OWNER_CHANGED` audit event.
Reassignment changes the owner and moves the lead's **open** follow-ups to the new owner.
Completed follow-ups keep their original assignee as history. Notes and audit history stay linked to the lead.

## 4. Pipeline APIs

| Method | Endpoint | Description | Access |
|---|---|---|---|
| PUT | `/leads/{id}/status` | Change pipeline status. Body: `{ status, dealValue?, lossReason? }` | Manager, assigned Rep |

Allowed transitions:

```
NEW → CONTACTED → QUALIFIED → PROPOSAL_SENT → WON
 │        │           │             │
 └────────┴───────────┴─────────────┴──→ LOST   (any open stage, reason required)
```

Business validations:

- WON requires a deal value greater than zero.
- LOST requires a non-empty loss reason.
- WON and LOST are final; any other transition is rejected with 400.
- Every successful status change creates a `STATUS_CHANGED` audit event.

## 5. Follow-up APIs

| Method | Endpoint | Description | Access |
|---|---|---|---|
| POST | `/leads/{id}/follow-ups` | Create a call, meeting or task with a due date/time. Always assigned to the lead owner | Manager, assigned Rep |
| GET | `/leads/{id}/follow-ups` | Follow-ups for one lead | Manager, assigned Rep |
| PUT | `/leads/{id}/follow-ups/{followUpId}/complete` | Mark complete (calling it again does nothing) | Manager, assigned Rep |
| GET | `/follow-ups?status=ALL\|UPCOMING\|OVERDUE\|COMPLETED` | Schedule across all visible leads | Manager (all), Rep (own leads) |

Overdue = `completedAt IS NULL AND dueAt < now`. It is calculated on every request, never stored as a label.

- `assignedToId` is optional. If it is supplied and is not the lead owner, the request is rejected with 400:
  visibility and completion follow lead ownership, so to hand work over you reassign the lead.
- Creating a follow-up on a Won or Lost lead is rejected with 400 (`Follow-ups cannot be scheduled on Won or Lost leads`).
  Existing open follow-ups on a closed lead can still be completed.
- A due date in the past is accepted. The follow-up is reported as overdue until it is completed.

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
| GET | `/dashboard/summary` | Counts by stage, active/won/lost totals, customers, won deal value, overdue and upcoming follow-ups, leads by owner, conversion rate, win rate | Manager (all leads), Rep (own leads only) |

The overdue-follow-up and leads-by-owner figures are returned inside `/dashboard/summary`
rather than as separate endpoints. Conversion rate = Won ÷ all visible leads × 100.
Win rate = Won ÷ (Won + Lost) × 100.

## 9. Customer Conversion API

| Method | Endpoint | Description | Access |
|---|---|---|---|
| POST | `/leads/{id}/convert` | Convert a Won lead into a customer. A repeat call returns the existing customer with `alreadyConverted: true` | Manager, assigned Rep |
| GET | `/leads/{id}/customer` | The customer this lead converted into: either a customer created from it, or an existing customer it was linked to by email (`linkedToExistingCustomer: true`). 404 if not converted | Manager, assigned Rep |

Conversion is transactional and idempotent:

- The same lead converted again returns the existing customer (`alreadyConverted: true`).
- A Won lead whose normalised email already belongs to a customer is **linked** to that customer
  (`linkedToExistingCustomer: true`, `sourceLeadId` = the lead the customer was first created from).
  No second customer is created. A unique index on `customers.email_normalized` enforces this.
- Each conversion writes a `CONVERTED` audit event to the lead's timeline.

## 10. User Management APIs

| Method | Endpoint | Description | Access |
|---|---|---|---|
| POST | `/users/sales-reps` | Create a sales rep. Body: `{ fullName, email, password }` (password at least 8 characters) | Manager only |
| GET | `/users/sales-reps` | List sales representatives | Manager only |
| PUT | `/users/reset-password/{email}` | Reset a sales rep's password. Body: `{ newPassword }`. Ends their existing sessions | Manager only |

## 11. Standard HTTP Responses

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

## 12. Common Error Response

```json
{
  "timestamp": "2026-11-24T10:30:00",
  "status": 400,
  "error": "Bad Request",
  "message": "A positive deal value is required before marking a lead as WON",
  "path": "/api/v1/leads/1/status"
}
```

Validation failures (400) also include a `fieldErrors` object, for example
`"fieldErrors": { "name": "Lead name is required", "priority": "Priority is required" }`.
Every error response, including 401/403 from the security filter, uses this format.

## 13. Implementation Note

All endpoints in this document are implemented. The live, generated specification is at
`http://localhost:8080/swagger-ui.html` (UI) and `http://localhost:8080/v3/api-docs` (JSON).
A snapshot export is committed at `backend/docs/openapi.json`, and a Postman collection is at the repository root.