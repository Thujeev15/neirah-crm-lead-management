# CRM Lead Management – Role / Permission Matrix

## 1. Roles

The system has two roles:

- MANAGER
- SALES_REP

## 2. Permission Matrix

| Feature / Action | Manager | Sales Representative |
|---|---|---|
| Login | Yes | Yes |
| Create Sales Rep accounts (no public sign-up) | Yes | No |
| Reset a Sales Rep password (ends their sessions) | Yes | No |
| List sales representatives | Yes | No |
| View all leads | Yes | No |
| View assigned leads | Yes | Yes |
| Create leads | Yes | Yes |
| Edit assigned leads | Yes | Yes |
| Edit leads owned by others | Yes | No |
| Assign leads | Yes | No |
| Reassign leads | Yes | No |
| Change lead status | Yes | Yes (assigned leads only) |
| Record notes and activities | Yes | Yes (assigned leads only) |
| Create follow-ups (always assigned to the lead owner) | Yes | Yes (assigned leads only) |
| Complete follow-ups | Yes | Yes (assigned leads only) |
| View dashboard and reports | Yes (all leads) | Yes (own leads only) |
| View activity timeline | Yes | Yes (assigned leads only) |
| View audit history | Yes | Yes (assigned leads only) |
| Convert Won leads to customers | Yes | Yes (assigned leads only) |
| View customer records and profiles | Yes (all customers) | Yes (customers from assigned leads only, via the API) |
| Reassign a customer's account owner (reassigns the originating lead) | Yes | No |

### Manager-only screens in the frontend

The **User management** (`/users`) and **Customers** (`/customers`) pages are shown to Managers only;
Sales Reps who open them are redirected to the Overview. This is a convenience only: the permissions
above are enforced by the backend whatever the client does.

## 3. Business Authorization Rules

1. Only authenticated users can access protected endpoints.
2. Managers can view and manage all leads.
3. Sales Representatives can view and modify only their assigned leads.
4. Only Managers can assign or reassign leads.
5. Every status change must create an audit log.
6. Every ownership change must create an audit log.
7. Unauthorized access must return HTTP 403 Forbidden.
8. Unauthenticated requests must return HTTP 401 Unauthorized.

## 4. Security Rules

- Passwords must be stored as secure hashes.
- JWT tokens must be used for authentication.
- Authorization must be checked on the backend.
- Frontend role restrictions alone are not sufficient.
- Sensitive configuration must not be committed to Git.