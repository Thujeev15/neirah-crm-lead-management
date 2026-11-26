import { useCallback, useEffect, useState } from 'react'
import {
  Search,
  RefreshCw,
  Plus,
  Users,
  Building2,
  Mail,
  Phone,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
} from 'lucide-react'
import api from '../api/axios'
import LeadForm from '../components/leads/LeadForm'
import { useNavigate } from 'react-router-dom'

const statusOptions = [
  'NEW',
  'CONTACTED',
  'QUALIFIED',
  'PROPOSAL_SENT',
  'WON',
  'LOST',
]

const priorityOptions = ['HIGH', 'MEDIUM', 'LOW']

function StatusBadge({ status }) {
  const styles = {
    NEW: 'bg-slate-100 text-slate-600',
    CONTACTED: 'bg-blue-50 text-blue-700',
    QUALIFIED: 'bg-violet-50 text-violet-700',
    PROPOSAL_SENT: 'bg-amber-50 text-amber-700',
    WON: 'bg-emerald-50 text-emerald-700',
    LOST: 'bg-red-50 text-red-600',
  }

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${styles[status] || styles.NEW}`}>
      {(status || 'NEW').replaceAll('_', ' ')}
    </span>
  )
}

function PriorityLabel({ priority }) {
  const styles = {
    HIGH: 'text-red-600',
    MEDIUM: 'text-amber-600',
    LOW: 'text-slate-500',
  }

  return (
    <span className={`text-xs font-bold ${styles[priority] || styles.LOW}`}>
      {priority || '—'}
    </span>
  )
}

export default function Leads() {
  const navigate = useNavigate()
  const [leads, setLeads] = useState([])
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [priority, setPriority] = useState('')
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCreate, setShowCreate] = useState(false)

  const loadLeads = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const params = {
        page,
        size: 10,
      }

      if (search.trim()) params.search = search.trim()
      if (status) params.status = status
      if (priority) params.priority = priority

      const response = await api.get('/leads/search', { params })
      const data = response.data
      setLeads(Array.isArray(data) ? data : data.leads || data.content || [])
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Unable to load leads. Please try again.',
      )
    } finally {
      setLoading(false)
    }
  }, [page, search, status, priority])

  useEffect(() => {
    loadLeads()
  }, [loadLeads])

  const resetFilters = () => {
    setSearch('')
    setStatus('')
    setPriority('')
    setPage(0)
  }

  return (
    <div className="mx-auto max-w-[1400px] space-y-7">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">
            Sales workspace
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Leads Management
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Manage, track and organize your sales opportunities.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
        >
          <Plus size={17} />
          Add New Lead
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Users size={19} />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Loaded leads</p>
              <p className="mt-1 text-xl font-bold text-slate-900">{leads.length}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
              <Building2 size={19} />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Companies represented</p>
              <p className="mt-1 text-xl font-bold text-slate-900">
                {new Set(leads.map((lead) => lead.company).filter(Boolean)).size}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <Plus size={19} />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Current page</p>
              <p className="mt-1 text-xl font-bold text-slate-900">{page + 1}</p>
            </div>
          </div>
        </div>
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-5 sm:p-6">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
            <div>
              <h2 className="text-base font-bold text-slate-900">All Leads</h2>
              <p className="mt-1 text-xs text-slate-500">
                Search and filter your lead records.
              </p>
            </div>

            <button
              onClick={loadLeads}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              <RefreshCw size={14} />
              Refresh
            </button>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <div className="relative md:col-span-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value)
                  setPage(0)
                }}
                placeholder="Search name, company, email..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white"
              />
            </div>

            <select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value)
                setPage(0)
              }}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-600 outline-none focus:border-blue-400"
            >
              <option value="">All statuses</option>
              {statusOptions.map((item) => (
                <option key={item} value={item}>
                  {item.replaceAll('_', ' ')}
                </option>
              ))}
            </select>

            <select
              value={priority}
              onChange={(event) => {
                setPriority(event.target.value)
                setPage(0)
              }}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-600 outline-none focus:border-blue-400"
            >
              <option value="">All priorities</option>
              {priorityOptions.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </div>

          <button
            onClick={resetFilters}
            className="mt-3 text-xs font-semibold text-blue-600 hover:text-blue-700"
          >
            Clear all filters
          </button>
        </div>

        {error && (
          <div className="m-5 flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle size={17} />
            {error}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left">
            <thead className="bg-slate-50">
              <tr className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <th className="px-6 py-4">Lead</th>
                <th className="px-6 py-4">Contact</th>
                <th className="px-6 py-4">Owner</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Priority</th>
                <th className="px-6 py-4">Created</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-16 text-center text-sm text-slate-400">
                    Loading leads...
                  </td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-16 text-center text-sm text-slate-400">
                    No leads found. Try changing your search or filters.
                  </td>
                </tr>
              ) : (
                leads.map((lead) => (
                  <tr key={lead.id} onClick={() => navigate(`/leads/${lead.id}`)} className="cursor-pointer transition hover:bg-blue-50/60">
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-slate-800">{lead.name}</p>
                      <p className="mt-1 text-xs text-slate-500">{lead.company || 'No company'}</p>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-xs text-slate-600">
                        <Mail size={13} className="text-slate-400" />
                        {lead.email || '—'}
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                        <Phone size={13} className="text-slate-400" />
                        {lead.phone || '—'}
                      </div>
                    </td>

                    <td className="px-6 py-4 text-xs font-medium text-slate-600">
                      {lead.ownerName || 'Unassigned'}
                    </td>

                    <td className="px-6 py-4">
                      <StatusBadge status={lead.status} />
                    </td>

                    <td className="px-6 py-4">
                      <PriorityLabel priority={lead.priority} />
                    </td>

                    <td className="px-6 py-4 text-xs text-slate-500">
                      {lead.createdAt ? new Date(lead.createdAt).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4">
          <p className="text-xs text-slate-500">Page {page + 1}</p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((current) => Math.max(0, current - 1))}
              disabled={page === 0 || loading}
              className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
              aria-label="Previous page"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setPage((current) => current + 1)}
              disabled={leads.length < 10 || loading}
              className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
              aria-label="Next page"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </section>

      {showCreate && (
        <LeadForm
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false)
            setPage(0)
            loadLeads()
          }}
        />
      )}
    </div>
  )
}
