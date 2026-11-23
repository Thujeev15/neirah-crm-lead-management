# CRM Lead Management – Role / Permission Matrix

## 1. Roles

The system has two roles:

- MANAGER
- SALES_REP

## 2. Permission Matrix

| Feature / Action | Manager | Sales Representative |
|---|---|---|
| Login | Yes | Yes |
| View all leads | Yes | No |
| View assigned leads | Yes | Yes |
| Create leads | Yes | Yes |
| Edit assigned leads | Yes | Yes |
| Edit leads owned by others | Yes | No |
| Assign leads | Yes | No |
| Reassign leads | Yes | No |
| Change lead status | Yes | Yes (assigned leads only) |
| Record notes and activities | Yes | Yes (assigned leads only) |
| Create follow-ups | Yes | Yes (assigned leads only) |
| Complete follow-ups | Yes | Yes (assigned leads only) |
| View dashboard and reports | Yes | No |
| View activity timeline | Yes | Yes (assigned leads only) |
| View audit history | Yes | Yes (assigned leads only) |
| Convert Won leads to customers | Yes | Yes (assigned leads only) |

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