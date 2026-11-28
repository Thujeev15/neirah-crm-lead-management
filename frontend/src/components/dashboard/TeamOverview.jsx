import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlarmClock, ArrowRight } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import api from '../../api/axios'
import { Avatar, Skeleton } from '../users/UserBits'
import { apiErrorMessage, asList, buildTeamRows, teamTotals } from '../users/teamData'

// Manager-only team section for the Overview page. Rep list comes from GET /users/sales-reps;
// every figure is derived from the leads the Overview already loaded plus overdue follow-ups.
export default function TeamOverview({ leads, leadsLoading }) {
  const [reps, setReps] = useState([])
  const [overdue, setOverdue] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    Promise.all([api.get('/users/sales-reps'), api.get('/follow-ups', { params: { status: 'OVERDUE' } })])
      .then(([repsResponse, overdueResponse]) => {
        if (!active) return
        setReps(asList(repsResponse.data))
        setOverdue(asList(overdueResponse.data))
      })
      .catch((err) => active && setError(apiErrorMessage(err, 'Team data could not be loaded.')))
      .finally(() => active && setLoading(false))
    return () => { active = false }
  }, [])

  const rows = useMemo(() => buildTeamRows(reps, leads, overdue), [reps, leads, overdue])
  const totals = useMemo(() => teamTotals(rows), [rows])
  const chartData = [...rows]
    .sort((a, b) => b.total - a.total)
    .map((row) => ({ name: row.fullName.split(' ')[0], fullName: row.fullName, Open: row.open, Won: row.won, Lost: row.lost }))
  const newest = [...rows].sort((a, b) => b.id - a.id).slice(0, 3)
  const attention = [...rows].filter((row) => row.overdue > 0).sort((a, b) => b.overdue - a.overdue).slice(0, 3)
  const busy = loading || leadsLoading

  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white shadow-sm shadow-slate-200/30">
      <div className="flex flex-col gap-2 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <h2 className="text-sm font-bold text-slate-900">Team performance</h2>
          <p className="mt-1 text-xs text-slate-400">Lead outcomes per sales rep · {busy ? '…' : `${totals.members} reps`}</p>
        </div>
        <Link to="/users" className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700">
          Manage team <ArrowRight size={14} aria-hidden="true" />
        </Link>
      </div>

      {error ? (
        <p role="alert" className="px-6 py-8 text-center text-sm text-red-600">{error}</p>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-[1.6fr_1fr]">
          <div className="p-5 sm:p-6">
            {busy ? (
              <Skeleton className="h-[240px] w-full" />
            ) : chartData.length === 0 ? (
              <p className="flex h-[240px] items-center justify-center text-sm text-slate-400">No sales reps yet.</p>
            ) : (
              <div style={{ height: Math.max(200, chartData.length * 44 + 60) }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 12, left: 0, bottom: 0 }} barCategoryGap={10}>
                    <CartesianGrid stroke="#F1F5F9" horizontal={false} />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" width={64} tick={{ fontSize: 11, fill: '#475569' }} axisLine={false} tickLine={false} />
                    <Tooltip
                      cursor={{ fill: '#F8FAFC' }}
                      labelFormatter={(_, payload) => payload?.[0]?.payload?.fullName}
                      contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 12 }}
                    />
                    <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 11, color: '#64748B', paddingTop: 8 }} />
                    <Bar dataKey="Open" stackId="a" fill="#3B82F6" maxBarSize={18} />
                    <Bar dataKey="Won" stackId="a" fill="#10B981" maxBarSize={18} />
                    <Bar dataKey="Lost" stackId="a" fill="#CBD5E1" radius={[0, 4, 4, 0]} maxBarSize={18} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="space-y-6 border-t border-slate-100 p-5 sm:p-6 xl:border-l xl:border-t-0">
            <div>
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Needs attention</h3>
              {busy ? (
                <Skeleton className="mt-3 h-10 w-full" />
              ) : attention.length === 0 ? (
                <p className="mt-2 text-sm text-slate-500">No overdue follow-ups across the team.</p>
              ) : (
                <ul className="mt-2 space-y-1">
                  {attention.map((row) => (
                    <li key={row.id} className="flex items-center gap-3 py-1.5">
                      <Avatar name={row.fullName} id={row.id} size="sm" />
                      <p className="min-w-0 flex-1 truncate text-sm text-slate-800">{row.fullName}</p>
                      <span className="inline-flex items-center gap-1 rounded-md bg-red-50 px-1.5 py-0.5 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-200">
                        <AlarmClock size={12} aria-hidden="true" /> {row.overdue} overdue
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Recently added reps</h3>
              {busy ? (
                <Skeleton className="mt-3 h-10 w-full" />
              ) : newest.length === 0 ? (
                <p className="mt-2 text-sm text-slate-500">No sales reps yet.</p>
              ) : (
                <ul className="mt-2 space-y-1">
                  {newest.map((row) => (
                    <li key={row.id} className="flex items-center gap-3 py-1.5">
                      <Avatar name={row.fullName} id={row.id} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm text-slate-800">{row.fullName}</p>
                        <p className="truncate text-xs text-slate-500">{row.email}</p>
                      </div>
                      <span className="text-xs tabular-nums text-slate-500">{row.open} open</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
