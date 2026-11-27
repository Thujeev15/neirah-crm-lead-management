import { useEffect, useMemo, useState } from 'react'
import {
  Users,

  Trophy,
  TrendingUp,
  ArrowUpRight,
  ArrowRight,
  Clock3,
  Target,
  RefreshCw,
  AlarmClock,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'

const stages = [
  { key: 'NEW', label: 'New', color: '#94A3B8' },
  { key: 'CONTACTED', label: 'Contacted', color: '#60A5FA' },
  { key: 'QUALIFIED', label: 'Qualified', color: '#818CF8' },
  { key: 'PROPOSAL_SENT', label: 'Proposal', color: '#A78BFA' },
  { key: 'WON', label: 'Won', color: '#34D399' },
  { key: 'LOST', label: 'Lost', color: '#F87171' },
]

function MetricCard({ label, value, note, icon: Icon, iconClass }) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-200/30">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-slate-500">{label}</p>
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconClass}`}>
          <Icon size={19} />
        </div>
      </div>
      <p className="mt-4 text-3xl font-bold tracking-tight text-slate-900">{value}</p>
      <p className="mt-2 text-[11px] text-slate-400">{note}</p>
    </div>
  )
}

function StatusBadge({ status }) {
  const styles = {
    NEW: 'bg-slate-100 text-slate-600',
    CONTACTED: 'bg-blue-50 text-blue-700',
    QUALIFIED: 'bg-indigo-50 text-indigo-700',
    PROPOSAL_SENT: 'bg-violet-50 text-violet-700',
    WON: 'bg-emerald-50 text-emerald-700',
    LOST: 'bg-red-50 text-red-600',
  }

  return (
    <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${styles[status] || 'bg-slate-100 text-slate-600'}`}>
      {status?.replaceAll('_', ' ')}
    </span>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const isManager = user?.role === 'MANAGER'
  const [leads, setLeads] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadLeads = async () => {
    setLoading(true)
    setError('')

    try {
      // Metrics are computed server-side; the lead list feeds the "recent leads" table.
      const [summaryResponse, leadsResponse] = await Promise.all([
        api.get('/dashboard/summary'),
        api.get('/leads'),
      ])
      setSummary(summaryResponse.data)
      setLeads(Array.isArray(leadsResponse.data) ? leadsResponse.data : [])
    } catch (err) {
      console.error('Dashboard lead loading failed:', err.response?.data || err)
      setError('Unable to load dashboard data. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadLeads()
  }, [])

  const stats = useMemo(() => ({
    total: summary?.totalLeads ?? 0,
    active: summary?.activeLeads ?? 0,
    won: summary?.wonLeads ?? 0,
    conversion: summary?.conversionRate ?? 0,
    winRate: summary?.winRate ?? 0,
    overdue: summary?.overdueFollowUps ?? 0,
    upcoming: summary?.upcomingFollowUps ?? 0,
    customers: summary?.customers ?? 0,
  }), [summary])

  const stageCount = (key) => summary?.countsByStage?.[key] ?? 0

  const chartData = stages.map((stage) => ({
    name: stage.label,
    leads: stageCount(stage.key),
    fill: stage.color,
  }))

  const leadsByOwner = summary?.leadsByOwner ?? []
  const maxOwnerLeads = Math.max(1, ...leadsByOwner.map((row) => row.leads))

  const recentLeads = [...leads]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 6)

  return (
    <div className="mx-auto max-w-[1500px] space-y-7">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[1.8px] text-blue-600">
            Sales overview
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-[28px]">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Here’s what’s happening with your leads today.
          </p>
        </div>

        <button
          onClick={loadLeads}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:opacity-50 sm:self-auto"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh data
        </button>
      </div>

      {error && (
        <div className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
          <button onClick={loadLeads} className="font-bold underline">Retry</button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <MetricCard
          label="Total leads"
          value={loading ? '—' : stats.total}
          note="Leads accessible to your account"
          icon={Users}
          iconClass="bg-blue-50 text-blue-600"
        />
        <MetricCard
          label="Active opportunities"
          value={loading ? '—' : stats.active}
          note="Leads currently in progress"
          icon={Target}
          iconClass="bg-violet-50 text-violet-600"
        />
        <MetricCard
          label="Deals won"
          value={loading ? '—' : stats.won}
          note={`${stats.customers} converted to customers`}
          icon={Trophy}
          iconClass="bg-emerald-50 text-emerald-600"
        />
        <MetricCard
          label="Conversion rate"
          value={loading ? '—' : `${stats.conversion}%`}
          note={`Won ÷ all leads · win rate ${stats.winRate}% (won ÷ closed)`}
          icon={TrendingUp}
          iconClass="bg-amber-50 text-amber-600"
        />
        <Link to="/follow-ups" className="block transition hover:-translate-y-0.5">
          <MetricCard
            label="Overdue follow-ups"
            value={loading ? '—' : stats.overdue}
            note={`${stats.upcoming} upcoming · past due and not completed`}
            icon={AlarmClock}
            iconClass={stats.overdue > 0 ? 'bg-red-50 text-red-600' : 'bg-slate-50 text-slate-500'}
          />
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.55fr_1fr]">
        <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-200/30 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Pipeline overview</h2>
              <p className="mt-1 text-xs text-slate-400">Lead distribution by stage</p>
            </div>
            <span className="rounded-lg bg-slate-50 px-2.5 py-1.5 text-[10px] font-semibold text-slate-500">
              All stages
            </span>
          </div>

          <div className="mt-6 h-[260px]">
            {loading ? (
              <div className="flex h-full items-center justify-center text-sm text-slate-400">
                Loading pipeline...
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 5, left: -22, bottom: 0 }}>
                  <CartesianGrid stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: '#F8FAFC' }} />
                  <Bar dataKey="leads" radius={[6, 6, 0, 0]} maxBarSize={38}>
                    {chartData.map((item) => (
                      <Cell key={item.name} fill={item.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-200/30 sm:p-6">
          <h2 className="text-sm font-bold text-slate-900">Pipeline breakdown</h2>
          <p className="mt-1 text-xs text-slate-400">Current lead count by stage</p>

          <div className="mt-6 space-y-5">
            {stages.map((stage) => {
              const count = stageCount(stage.key)
              const percentage = stats.total ? (count / stats.total) * 100 : 0

              return (
                <div key={stage.key}>
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: stage.color }} />
                      <span className="text-xs font-medium text-slate-600">{stage.label}</span>
                    </div>
                    <span className="text-xs font-bold text-slate-800">{loading ? '—' : count}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${percentage}%`, backgroundColor: stage.color }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      </div>

      {isManager && (
        <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm shadow-slate-200/30 sm:p-6">
          <h2 className="text-sm font-bold text-slate-900">Leads by owner</h2>
          <p className="mt-1 text-xs text-slate-400">Current workload per sales representative</p>

          <div className="mt-5 space-y-4">
            {loading ? (
              <p className="text-xs text-slate-400">Loading owners...</p>
            ) : leadsByOwner.length === 0 ? (
              <p className="text-xs text-slate-400">No leads assigned yet.</p>
            ) : leadsByOwner.map((row) => (
              <div key={row.ownerEmail || 'unassigned'}>
                <div className="mb-1.5 flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-700">
                    {row.ownerName}
                    {row.ownerEmail && <span className="ml-1 text-slate-400">({row.ownerEmail})</span>}
                  </span>
                  <span className="font-bold text-slate-800">{row.leads}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-blue-500"
                    style={{ width: `${(row.leads / maxOwnerLeads) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm shadow-slate-200/30">
        <div className="flex flex-col justify-between gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:px-6">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Recent leads</h2>
            <p className="mt-1 text-xs text-slate-400">Latest leads added to your workspace</p>
          </div>
          <Link to="/leads" className="inline-flex items-center gap-2 text-xs font-bold text-blue-600 hover:text-blue-700">
            View all leads <ArrowRight size={14} />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[650px] text-left">
            <thead>
              <tr className="bg-slate-50/70 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <th className="px-6 py-3">Lead</th>
                <th className="px-6 py-3">Company</th>
                <th className="px-6 py-3">Owner</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Priority</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan="5" className="px-6 py-10 text-center text-xs text-slate-400">Loading leads...</td></tr>
              ) : recentLeads.length === 0 ? (
                <tr><td colSpan="5" className="px-6 py-10 text-center text-xs text-slate-400">No leads found yet.</td></tr>
              ) : recentLeads.map((lead) => (
                <tr key={lead.id} className="transition hover:bg-slate-50/70">
                  <td className="px-6 py-4">
                    <p className="text-xs font-bold text-slate-800">{lead.name}</p>
                    <p className="mt-1 text-[10px] text-slate-400">{lead.email}</p>
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-600">{lead.company || '—'}</td>
                  <td className="px-6 py-4 text-xs text-slate-600">{lead.ownerName || 'Unassigned'}</td>
                  <td className="px-6 py-4"><StatusBadge status={lead.status} /></td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] font-bold ${lead.priority === 'HIGH' ? 'text-red-600' : lead.priority === 'MEDIUM' ? 'text-amber-600' : 'text-slate-500'}`}>
                      {lead.priority}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="flex items-center gap-3 rounded-2xl border border-blue-100 bg-blue-50/70 p-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-blue-600">
          <Clock3 size={17} />
        </div>
        <div>
          <p className="text-xs font-bold text-slate-800">Stay on top of every opportunity</p>
          <p className="mt-1 text-[11px] text-slate-500">
            Your lead data is securely loaded based on your account permissions.
          </p>
        </div>
        <ArrowUpRight size={17} className="ml-auto shrink-0 text-blue-500" />
      </div>
    </div>
  )
}
