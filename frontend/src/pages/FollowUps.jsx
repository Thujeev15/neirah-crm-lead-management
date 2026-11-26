import { useEffect, useState } from 'react'
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  AlertCircle,
  RefreshCw,
  ListTodo,
  Plus,
  X,
  UserRound,
} from 'lucide-react'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'

const formatDate = (value) => {
  if (!value) return 'No due date'

  return new Date(value).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

const initialForm = {
  leadId: '',
  type: 'CALL',
  title: '',
  description: '',
  dueAt: '',
  assignedToId: '',
}

export default function FollowUps() {
  const { user } = useAuth()
  const isManager = user?.role === 'MANAGER'

  const [followUps, setFollowUps] = useState([])
  const [leads, setLeads] = useState([])
  const [salesReps, setSalesReps] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [formError, setFormError] = useState('')
  const [filter, setFilter] = useState('ALL')
  const [completingId, setCompletingId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(initialForm)

  const loadFollowUps = async () => {
    try {
      setLoading(true)
      setError('')

      const leadsResponse = await api.get('/leads')
      const leadList = Array.isArray(leadsResponse.data)
        ? leadsResponse.data
        : leadsResponse.data.leads || leadsResponse.data.content || []

      setLeads(leadList)

      const results = await Promise.all(
        leadList.map(async (lead) => {
          try {
            const response = await api.get(`/leads/${lead.id}/follow-ups`)

            return (Array.isArray(response.data) ? response.data : []).map(
              (item) => ({
                ...item,
                leadId: lead.id,
                leadName: lead.name,
              }),
            )
          } catch (err) {
            if (err.response?.status === 403 || err.response?.status === 404) {
              return []
            }
            throw err
          }
        }),
      )

      setFollowUps(results.flat())
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Unable to load follow-ups. Please try again.',
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadFollowUps()
  }, [])

  useEffect(() => {
    if (!isManager) return

    const loadSalesReps = async () => {
      try {
        const response = await api.get('/users/sales-reps')
        setSalesReps(Array.isArray(response.data) ? response.data : [])
      } catch {
        setFormError('Unable to load sales representatives.')
      }
    }

    loadSalesReps()
  }, [isManager])

  const handleComplete = async (item) => {
    try {
      setCompletingId(item.id)
      setError('')

      await api.put(
        `/leads/${item.leadId}/follow-ups/${item.id}/complete`,
      )

      await loadFollowUps()
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Unable to complete this follow-up.',
      )
    } finally {
      setCompletingId(null)
    }
  }

  const handleCreate = async (event) => {
    event.preventDefault()
    setFormError('')

    if (!form.leadId || !form.title.trim() || !form.dueAt) {
      setFormError('Please select a lead and enter a title and due date.')
      return
    }

    try {
      setSaving(true)

      const payload = {
        type: form.type,
        title: form.title.trim(),
        description: form.description.trim() || null,
        dueAt: form.dueAt,
      }

      if (isManager && form.assignedToId) {
        payload.assignedToId = Number(form.assignedToId)
      }

      await api.post(`/leads/${form.leadId}/follow-ups`, payload)

      setForm(initialForm)
      setShowForm(false)
      await loadFollowUps()
    } catch (err) {
      setFormError(
        err.response?.data?.message ||
          'Unable to create follow-up. Please check the details.',
      )
    } finally {
      setSaving(false)
    }
  }

  const filteredFollowUps = followUps.filter((item) => {
    if (filter === 'ALL') return true
    if (filter === 'COMPLETED') return Boolean(item.completedAt)
    if (filter === 'OVERDUE') return !item.completedAt && item.overdue
    if (filter === 'UPCOMING') return !item.completedAt && !item.overdue
    return true
  })

  const overdueCount = followUps.filter(
    (item) => !item.completedAt && item.overdue,
  ).length

  const completedCount = followUps.filter(
    (item) => item.completedAt,
  ).length

  const upcomingCount = followUps.filter(
    (item) => !item.completedAt && !item.overdue,
  ).length

  const stats = [
    { label: 'Total Follow-ups', value: followUps.length, icon: ListTodo, color: 'blue' },
    { label: 'Upcoming', value: upcomingCount, icon: CalendarDays, color: 'violet' },
    { label: 'Overdue', value: overdueCount, icon: AlertCircle, color: 'red' },
    { label: 'Completed', value: completedCount, icon: CheckCircle2, color: 'emerald' },
  ]

  return (
    <div className="mx-auto max-w-7xl space-y-7">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-medium text-blue-600">Sales Operations</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            Follow-up Management
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Track calls, meetings and tasks across your leads.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={loadFollowUps}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <RefreshCw size={16} />
            Refresh
          </button>

          <button
            onClick={() => {
              setFormError('')
              setShowForm(true)
            }}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            <Plus size={17} />
            New Follow-up
          </button>
        </div>
      </div>

      {showForm && (
        <div className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Create Follow-up
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Schedule a call, meeting or task for a lead.
              </p>
            </div>
            <button
              onClick={() => {
                setShowForm(false)
                setFormError('')
              }}
              className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              aria-label="Close form"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleCreate} className="space-y-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Select Lead *
                </label>
                <select
                  value={form.leadId}
                  onChange={(e) =>
                    setForm({ ...form, leadId: e.target.value })
                  }
                  required
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">Choose a lead</option>
                  {leads.map((lead) => (
                    <option key={lead.id} value={lead.id}>
                      {lead.name} {lead.company ? `— ${lead.company}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Activity Type *
                </label>
                <select
                  value={form.type}
                  onChange={(e) =>
                    setForm({ ...form, type: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="CALL">Call</option>
                  <option value="MEETING">Meeting</option>
                  <option value="TASK">Task</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Follow-up Title *
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) =>
                    setForm({ ...form, title: e.target.value })
                  }
                  maxLength={150}
                  required
                  placeholder="e.g. Discuss pricing with client"
                  className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Due Date & Time *
                </label>
                <input
                  type="datetime-local"
                  value={form.dueAt}
                  onChange={(e) =>
                    setForm({ ...form, dueAt: e.target.value })
                  }
                  required
                  className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {isManager && (
                <div className="md:col-span-2">
                  <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <UserRound size={15} />
                    Assign to Sales Representative
                  </label>
                  <select
                    value={form.assignedToId}
                    onChange={(e) =>
                      setForm({ ...form, assignedToId: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="">Default lead owner</option>
                    {salesReps.map((rep) => (
                      <option key={rep.id} value={rep.id}>
                        {rep.fullName} ({rep.email})
                      </option>
                    ))}
                  </select>
                  <p className="mt-1.5 text-xs text-slate-400">
                    Leave blank to assign this follow-up to the lead owner.
                  </p>
                </div>
              )}

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  maxLength={1000}
                  rows={3}
                  placeholder="Add notes or details for this follow-up..."
                  className="w-full resize-y rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>

            {formError && (
              <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
                {formError}
              </p>
            )}

            <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || leads.length === 0}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving && <RefreshCw size={15} className="animate-spin" />}
                {saving ? 'Creating...' : 'Create Follow-up'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          const colors = {
            blue: 'bg-blue-50 text-blue-600',
            violet: 'bg-violet-50 text-violet-600',
            red: 'bg-red-50 text-red-600',
            emerald: 'bg-emerald-50 text-emerald-600',
          }

          return (
            <div
              key={stat.label}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                <div className={`rounded-xl p-2.5 ${colors[stat.color]}`}>
                  <Icon size={19} />
                </div>
              </div>
              <p className="mt-4 text-3xl font-bold text-slate-900">{stat.value}</p>
            </div>
          )
        })}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-semibold text-slate-900">Follow-up Schedule</h2>
            <p className="mt-1 text-sm text-slate-500">
              Review and manage your scheduled activities.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {['ALL', 'UPCOMING', 'OVERDUE', 'COMPLETED'].map((item) => (
              <button
                key={item}
                onClick={() => setFilter(item)}
                className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
                  filter === item
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-3 p-12 text-sm text-slate-500">
            <RefreshCw size={18} className="animate-spin" />
            Loading follow-ups...
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <AlertCircle className="mx-auto text-red-500" size={28} />
            <p className="mt-3 text-sm text-red-600">{error}</p>
            <button
              onClick={loadFollowUps}
              className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
            >
              Try Again
            </button>
          </div>
        ) : filteredFollowUps.length === 0 ? (
          <div className="p-12 text-center">
            <CalendarDays size={32} className="mx-auto text-slate-300" />
            <p className="mt-3 font-semibold text-slate-700">No follow-ups found</p>
            <p className="mt-1 text-sm text-slate-500">
              Follow-ups matching this filter will appear here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredFollowUps.map((item) => {
              const isCompleted = Boolean(item.completedAt)
              const isOverdue = !isCompleted && item.overdue

              return (
                <div
                  key={`${item.leadId}-${item.id}`}
                  className="flex flex-col justify-between gap-4 p-5 transition hover:bg-slate-50/70 lg:flex-row lg:items-center"
                >
                  <div className="flex min-w-0 gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      {item.type === 'CALL' ? (
                        <Clock size={20} />
                      ) : item.type === 'MEETING' ? (
                        <CalendarDays size={20} />
                      ) : (
                        <ListTodo size={20} />
                      )}
                    </div>

                    <div className="min-w-0">
                      <h3 className="font-semibold text-slate-900">{item.title}</h3>
                      <p className="mt-1 text-sm text-slate-500">
                        {item.type} · {item.leadName || `Lead #${item.leadId}`}
                      </p>

                      {item.description && (
                        <p className="mt-2 text-sm text-slate-500">
                          {item.description}
                        </p>
                      )}

                      <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
                        <CalendarDays size={13} />
                        Due {formatDate(item.dueAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-4 lg:justify-end">
                    <span
                      className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                        isCompleted
                          ? 'bg-emerald-50 text-emerald-700'
                          : isOverdue
                            ? 'bg-red-50 text-red-700'
                            : 'bg-blue-50 text-blue-700'
                      }`}
                    >
                      {isCompleted ? 'Completed' : isOverdue ? 'Overdue' : 'Upcoming'}
                    </span>

                    {!isCompleted && (
                      <button
                        onClick={() => handleComplete(item)}
                        disabled={completingId === item.id}
                        className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
                      >
                        {completingId === item.id ? 'Updating...' : 'Mark Complete'}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
