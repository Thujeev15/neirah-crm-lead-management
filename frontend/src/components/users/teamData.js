// Builds per-rep workload figures from data the existing APIs already return.
// GET /users/sales-reps only provides id, fullName and email, so everything else here is
// derived from the manager's lead list and overdue follow-ups. Nothing is estimated or invented.

export const OPEN_STAGES = new Set(['NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL_SENT'])

const key = (email) => (email || '').trim().toLowerCase()

export function asList(data) {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.content)) return data.content
  return []
}

export function buildTeamRows(reps, leads, overdueFollowUps = []) {
  const rows = new Map(
    reps.map((rep) => [
      key(rep.email),
      { ...rep, total: 0, open: 0, won: 0, lost: 0, wonValue: 0, overdue: 0, openLeads: [], overdueItems: [] },
    ]),
  )
  const leadById = new Map(leads.map((lead) => [lead.id, lead]))

  for (const lead of leads) {
    const row = rows.get(key(lead.ownerEmail))
    if (!row) continue
    row.total += 1
    if (OPEN_STAGES.has(lead.status)) {
      row.open += 1
      row.openLeads.push(lead)
    } else if (lead.status === 'WON') {
      row.won += 1
      row.wonValue += Number(lead.dealValue) || 0
    } else if (lead.status === 'LOST') {
      row.lost += 1
    }
  }

  // Follow-ups always belong to the lead owner, so the lead tells us whose overdue item it is.
  for (const item of overdueFollowUps) {
    const row = rows.get(key(leadById.get(item.leadId)?.ownerEmail))
    if (!row) continue
    row.overdue += 1
    row.overdueItems.push(item)
  }

  return [...rows.values()].map((row) => {
    const closed = row.won + row.lost
    return { ...row, winRate: closed ? Math.round((row.won / closed) * 100) : null }
  })
}

export function teamTotals(rows) {
  const sum = (field) => rows.reduce((total, row) => total + row[field], 0)
  const won = sum('won')
  const lost = sum('lost')
  return {
    members: rows.length,
    open: sum('open'),
    won,
    overdue: sum('overdue'),
    wonValue: sum('wonValue'),
    winRate: won + lost ? Math.round((won / (won + lost)) * 100) : null,
    withOverdue: rows.filter((row) => row.overdue > 0).length,
  }
}

export function initials(name = '') {
  return name.split(' ').filter(Boolean).map((part) => part[0]).slice(0, 2).join('').toUpperCase()
}

export function formatMoney(value) {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value || 0)
}

export function formatDateTime(value) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(value))
}

export function apiErrorMessage(err, fallback) {
  if (!err?.response) return 'Can’t reach the Neirah server. Check your connection and try again.'
  if (err.response.status === 403) return 'You don’t have permission to do this.'
  return err.response.data?.message || fallback
}
