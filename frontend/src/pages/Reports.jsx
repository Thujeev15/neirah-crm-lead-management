import { useEffect, useMemo, useState } from 'react'
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts'
import {
  BarChart3,
  TrendingUp,
  Trophy,
  Target,
  Users,
  RefreshCw,
  AlertCircle,
} from 'lucide-react'
import api from '../api/axios'

const stages = [
  { key: 'NEW', label: 'New', color: '#94A3B8' },
  { key: 'CONTACTED', label: 'Contacted', color: '#60A5FA' },
  { key: 'QUALIFIED', label: 'Qualified', color: '#818CF8' },
  { key: 'PROPOSAL_SENT', label: 'Proposal', color: '#A78BFA' },
  { key: 'WON', label: 'Won', color: '#34D399' },
  { key: 'LOST', label: 'Lost', color: '#F87171' },
]

const currency = (value) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value || 0)

function MetricCard({ label, value, note, icon: Icon, color }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <div className={`rounded-xl p-2.5 ${color}`}>
          <Icon size={19} />
        </div>
      </div>
      <p className="mt-4 text-3xl font-bold text-slate-900">{value}</p>
      <p className="mt-1 text-xs text-slate-400">{note}</p>
    </div>
  )
}

export default function Reports() {
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadReports = async () => {
    try {
      setLoading(true)
      setError('')

      const response = await api.get('/leads')
      const data = response.data

      setLeads(
        Array.isArray(data)
          ? data
          : data.leads || data.content || [],
      )
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Unable to load reports. Please try again.',
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadReports()
  }, [])

  const analytics = useMemo(() => {
    const won = leads.filter((lead) => lead.status === 'WON')
    const lost = leads.filter((lead) => lead.status === 'LOST')
    const active = leads.filter(
      (lead) => !['WON', 'LOST'].includes(lead.status),
    )

    const totalDealValue = leads.reduce(
      (sum, lead) => sum + Number(lead.dealValue || 0),
      0,
    )

    const wonValue = won.reduce(
      (sum, lead) => sum + Number(lead.dealValue || 0),
      0,
    )

    return {
      total: leads.length,
      won: won.length,
      lost: lost.length,
      active: active.length,
      conversion: leads.length
        ? Math.round((won.length / leads.length) * 100)
        : 0,
      totalDealValue,
      wonValue,
    }
  }, [leads])

  const stageData = stages.map((stage) => ({
    name: stage.label,
    value: leads.filter((lead) => lead.status === stage.key).length,
    color: stage.color,
  }))

  const ownerData = Object.entries(
    leads.reduce((result, lead) => {
      const owner = lead.ownerName || 'Unassigned'
      result[owner] = (result[owner] || 0) + 1
      return result
    }, {}),
  )
    .map(([name, count]) => ({ name, leads: count }))
    .sort((a, b) => b.leads - a.leads)

  return (
    <div className="mx-auto max-w-7xl space-y-7">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-medium text-blue-600">
            Business Intelligence
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            Reports & Analytics
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Understand your sales performance and lead distribution.
          </p>
        </div>

        <button
          onClick={loadReports}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Refresh Reports
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle size={19} />
          {error}
          <button onClick={loadReports} className="ml-auto font-bold underline">
            Retry
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Total Leads"
          value={loading ? '—' : analytics.total}
          note="Leads accessible to your account"
          icon={Users}
          color="bg-blue-50 text-blue-600"
        />
        <MetricCard
          label="Deals Won"
          value={loading ? '—' : analytics.won}
          note="Successfully closed opportunities"
          icon={Trophy}
          color="bg-emerald-50 text-emerald-600"
        />
        <MetricCard
          label="Conversion Rate"
          value={loading ? '—' : `${analytics.conversion}%`}
          note="Won leads divided by total leads"
          icon={TrendingUp}
          color="bg-violet-50 text-violet-600"
        />
        <MetricCard
          label="Active Opportunities"
          value={loading ? '—' : analytics.active}
          note="Leads still in progress"
          icon={Target}
          color="bg-amber-50 text-amber-600"
        />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="font-bold text-slate-900">Lead Distribution</h2>
          <p className="mt-1 text-sm text-slate-400">
            Breakdown of leads across pipeline stages
          </p>

          <div className="mt-5 h-[280px]">
            {loading ? (
              <div className="flex h-full items-center justify-center text-sm text-slate-400">
                Loading chart...
              </div>
            ) : leads.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-slate-400">
                No lead data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stageData.filter((item) => item.value > 0)}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={105}
                    paddingAngle={3}
                  >
                    {stageData
                      .filter((item) => item.value > 0)
                      .map((item) => (
                        <Cell key={item.name} fill={item.color} />
                      ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="flex flex-wrap justify-center gap-x-4 gap-y-2">
            {stageData.map((item) => (
              <div key={item.name} className="flex items-center gap-1.5">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-xs text-slate-500">
                  {item.name}: {loading ? '—' : item.value}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="font-bold text-slate-900">
            Sales Representative Performance
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Number of leads assigned to each owner
          </p>

          <div className="mt-5 h-[300px]">
            {loading ? (
              <div className="flex h-full items-center justify-center text-sm text-slate-400">
                Loading chart...
              </div>
            ) : ownerData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-slate-400">
                No representative data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={ownerData}
                  layout="vertical"
                  margin={{ top: 5, right: 15, left: 10, bottom: 5 }}
                >
                  <CartesianGrid stroke="#F1F5F9" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={100}
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip />
                  <Bar
                    dataKey="leads"
                    name="Leads"
                    fill="#3B82F6"
                    radius={[0, 6, 6, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-600">
              <Trophy size={20} />
            </div>
            <div>
              <h2 className="font-bold text-slate-900">Closed Deals</h2>
              <p className="text-xs text-slate-400">
                Won and lost opportunities
              </p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4">
            <div className="rounded-xl bg-emerald-50 p-4">
              <p className="text-xs font-medium text-emerald-700">Won</p>
              <p className="mt-2 text-3xl font-bold text-emerald-800">
                {loading ? '—' : analytics.won}
              </p>
            </div>
            <div className="rounded-xl bg-red-50 p-4">
              <p className="text-xs font-medium text-red-700">Lost</p>
              <p className="mt-2 text-3xl font-bold text-red-800">
                {loading ? '—' : analytics.lost}
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600">
              <BarChart3 size={20} />
            </div>
            <div>
              <h2 className="font-bold text-slate-900">Deal Value Summary</h2>
              <p className="text-xs text-slate-400">
                Values based on recorded deal amounts
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-5">
            <div>
              <p className="text-xs text-slate-500">Total recorded deal value</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">
                {loading ? '—' : currency(analytics.totalDealValue)}
              </p>
            </div>
            <div className="border-t border-slate-100 pt-4">
              <p className="text-xs text-slate-500">Value of won deals</p>
              <p className="mt-1 text-2xl font-bold text-emerald-600">
                {loading ? '—' : currency(analytics.wonValue)}
              </p>
            </div>
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="font-bold text-slate-900">Pipeline Stage Summary</h2>
        <p className="mt-1 text-sm text-slate-400">
          Detailed count and percentage by stage
        </p>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[500px] text-left">
            <thead>
              <tr className="border-b border-slate-100 text-xs text-slate-400">
                <th className="py-3 font-semibold">Stage</th>
                <th className="py-3 font-semibold">Lead Count</th>
                <th className="py-3 font-semibold">Share</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stageData.map((stage) => (
                <tr key={stage.name}>
                  <td className="py-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: stage.color }}
                      />
                      {stage.name}
                    </div>
                  </td>
                  <td className="py-3 text-sm font-semibold text-slate-800">
                    {loading ? '—' : stage.value}
                  </td>
                  <td className="py-3 text-sm text-slate-500">
                    {loading
                      ? '—'
                      : `${analytics.total ? Math.round((stage.value / analytics.total) * 100) : 0}%`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
