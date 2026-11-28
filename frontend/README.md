# Neirah CRM – Frontend

React 19 + Vite + Tailwind CSS single-page app for the Neirah CRM.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build to dist/
```

The API base URL is set in `src/api/axios.js` (`http://localhost:8080/api/v1`).
The JWT is kept in `localStorage`, and any `401` response logs the user out automatically.

| Route | Page |
|---|---|
| `/login` | Login |
| `/` | Dashboard: stage counts, overdue follow-ups, conversion and win rate; managers also see Team performance |
| `/leads` | Lead list with search, filters, pagination and create (with duplicate warning) |
| `/leads/:id` | Lead details: edit, assign (manager), stage change, conversion, follow-ups, timeline |
| `/pipeline` | Leads grouped by pipeline stage |
| `/follow-ups` | Follow-up schedule: upcoming, overdue, completed; create and complete |
| `/reports` | Charts by stage, owner and source |
| `/users` | **Manager only.** User management: sales team with workload, rep details, add sales rep, reset password |
| `/customers` | **Manager only.** Customers across the team, customer profile, reassign owner, log interaction |

Manager-only routes redirect Sales Reps to `/`. This is a convenience only: the backend enforces every permission.

See the [root README](../README.md) for full setup, demo accounts and design notes.
