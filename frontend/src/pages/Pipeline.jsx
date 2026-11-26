import { useEffect, useState } from 'react'
import { ArrowRight, RefreshCw, AlertCircle, TrendingUp } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'

const stages = [
  { key: 'NEW', label: 'New', color: 'bg-slate-400' },
  { key: 'CONTACTED', label: 'Contacted', color: 'bg-blue-500' },
  { key: 'QUALIFIED', label: 'Qualified', color: 'bg-violet-500' },
  { key: 'PROPOSAL_SENT', label: 'Proposal Sent', color: 'bg-amber-500' },
  { key: 'WON', label: 'Won', color: 'bg-emerald-500' },
  { key: 'LOST', label: 'Lost', color: 'bg-red-500' },
]

const currency = (value) =>
  value == null
    ? '—'
    : new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
      }).format(value)

export default function Pipeline() {
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const loadLeads = async () => {
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
          'Unable to load pipeline. Please try again.',
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadLeads()
  }, [])

  const getStageLeads = (stage) =>
    leads.filter((lead) => lead.status === stage)

  const activeLeads = leads.filter(
    (lead) => !['WON', 'LOST'].includes(lead.status),
  )

  const totalValue = activeLeads.reduce(
    (sum, lead) => sum + Number(lead.dealValue || 0),
    0,
  )

  return (
    <div className="mx-auto max-w-7xl space-y-7">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-medium text-blue-600">Sales Operations</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            Sales Pipeline
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Track opportunities across every stage of your sales journey.
          </p>
        </div>

        <button
          onClick={loadLeads}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">
              Active Opportunities
            </p>
            <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600">
              <TrendingUp size={19} />
            </div>
          </div>
          <p className="mt-4 text-3xl font-bold text-slate-900">
            {activeLeads.length}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Leads currently in progress
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">
              Active Deal Value
            </p>
            <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-600">
              <TrendingUp size={19} />
            </div>
          </div>
          <p className="mt-4 text-3xl font-bold text-slate-900">
            {currency(totalValue)}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Combined value of active opportunities
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white p-16 text-sm text-slate-500">
          <RefreshCw size={18} className="animate-spin" />
          Loading sales pipeline...
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-100 bg-white p-10 text-center">
          <AlertCircle className="mx-auto text-red-500" size={28} />
          <p className="mt-3 text-sm text-red-600">{error}</p>
          <button
            onClick={loadLeads}
            className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
          >
            Try Again
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
          {stages.map((stage) => {
            const stageLeads = getStageLeads(stage.key)

            return (
              <div
                key={stage.key}
                className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
              >
                <div className="border-b border-slate-100 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${stage.color}`} />
                      <h2 className="text-sm font-bold text-slate-800">
                        {stage.label}
                      </h2>
                    </div>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                      {stageLeads.length}
                    </span>
                  </div>
                </div>

                <div className="max-h-[520px] min-h-40 space-y-3 overflow-y-auto bg-slate-50/60 p-3">
                  {stageLeads.length === 0 ? (
                    <p className="py-8 text-center text-xs text-slate-400">
                      No leads in this stage
                    </p>
                  ) : (
                    stageLeads.map((lead) => (
                      <button
                        key={lead.id}
                        onClick={() => navigate(`/leads/${lead.id}`)}
                        className="w-full rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-sm font-semibold text-slate-900">
                            {lead.name}
                          </h3>
                          <ArrowRight
                            size={15}
                            className="shrink-0 text-slate-400"
                          />
                        </div>

                        <p className="mt-1 truncate text-xs text-slate-500">
                          {lead.company || 'No company'}
                        </p>

                        <div className="mt-4 flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold text-slate-700">
                            {currency(lead.dealValue)}
                          </span>
                          <span className="rounded-md bg-slate-100 px-2 py-1 text-[10px] font-medium text-slate-500">
                            {lead.priority || 'Normal'}
                          </span>
                        </div>

                        <p className="mt-3 truncate text-[11px] text-slate-400">
                          {lead.ownerName || lead.assignedToName || 'Lead owner'}
                        </p>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
