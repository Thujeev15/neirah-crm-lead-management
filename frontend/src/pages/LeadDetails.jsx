
import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  User,
  CalendarDays,
  AlertCircle,
  RefreshCw,
  Activity,
  Clock,
  FileText,
  PhoneCall,
  Users,
  ArrowRightLeft,
  Plus,
  UserRoundCog,
} from 'lucide-react'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'

const statusStyles = {
  NEW: 'bg-slate-100 text-slate-700',
  CONTACTED: 'bg-blue-50 text-blue-700',
  QUALIFIED: 'bg-violet-50 text-violet-700',
  PROPOSAL_SENT: 'bg-amber-50 text-amber-700',
  WON: 'bg-emerald-50 text-emerald-700',
  LOST: 'bg-red-50 text-red-700',
}

function InfoItem({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3">
      <div className="rounded-lg bg-slate-100 p-2 text-slate-500">
        <Icon size={16} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-slate-400">{label}</p>
        <p className="mt-1 break-words text-sm font-semibold text-slate-800">
          {value || '—'}
        </p>
      </div>
    </div>
  )
}

function TimelineIcon({ type }) {
  const value = String(type || '').toUpperCase()

  if (value === 'CALL') return <PhoneCall size={16} />
  if (value === 'MEETING') return <Users size={16} />
  if (value === 'NOTE') return <FileText size={16} />

  return <ArrowRightLeft size={16} />
}

function formatDate(value) {
  if (!value) return 'Date unavailable'

  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? 'Date unavailable'
    : date.toLocaleString()
}

export default function LeadDetails() {
  const { id } = useParams()
  const { user } = useAuth()

  const isManager = user?.role === 'MANAGER'

  const [lead, setLead] = useState(null)
  const [timeline, setTimeline] = useState([])
  const [loading, setLoading] = useState(true)
  const [timelineLoading, setTimelineLoading] = useState(true)
  const [error, setError] = useState('')
  const [timelineError, setTimelineError] = useState('')

  const [activityType, setActivityType] = useState('NOTE')
  const [description, setDescription] = useState('')
  const [savingActivity, setSavingActivity] = useState(false)
  const [activityError, setActivityError] = useState('')

  const [selectedStatus, setSelectedStatus] = useState('')
  const [dealValue, setDealValue] = useState('')
  const [lossReason, setLossReason] = useState('')
  const [savingStatus, setSavingStatus] = useState(false)
  const [statusError, setStatusError] = useState('')
  const [statusSuccess, setStatusSuccess] = useState('')

  // Manager assignment state
  const [salesReps, setSalesReps] = useState([])
  const [selectedOwner, setSelectedOwner] = useState('')
  const [loadingReps, setLoadingReps] = useState(false)
  const [savingAssignment, setSavingAssignment] = useState(false)
  const [assignmentError, setAssignmentError] = useState('')
  const [assignmentSuccess, setAssignmentSuccess] = useState('')

  const loadLead = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const response = await api.get(`/leads/${id}`)
      setLead(response.data)
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Unable to load lead details. Please try again.',
      )
    } finally {
      setLoading(false)
    }
  }, [id])

  const loadTimeline = useCallback(async () => {
    setTimelineLoading(true)
    setTimelineError('')

    try {
      const [activitiesResponse, auditResponse] = await Promise.all([
        api.get(`/leads/${id}/activities`),
        api.get(`/leads/${id}/audit-logs`),
      ])

      const activities = (Array.isArray(activitiesResponse.data)
        ? activitiesResponse.data
        : []
      ).map((item) => ({
        id: `activity-${item.id}`,
        kind: 'ACTIVITY',
        type: item.type,
        title: String(item.type || 'Activity').replaceAll('_', ' '),
        description: item.description,
        actorName: item.actorName,
        timestamp: item.createdAt,
      }))

      const auditEvents = (Array.isArray(auditResponse.data)
        ? auditResponse.data
        : []
      ).map((item) => ({
        id: `audit-${item.id}`,
        kind: 'AUDIT',
        type: item.eventType,
        title: String(item.eventType || 'Record update').replaceAll('_', ' '),
        description: [
          item.oldValue ? `From: ${item.oldValue}` : '',
          item.newValue ? `To: ${item.newValue}` : '',
        ].filter(Boolean).join(' → '),
        actorName: item.actorName,
        timestamp: item.occurredAt,
      }))

      const combined = [...activities, ...auditEvents].sort(
        (a, b) =>
          new Date(b.timestamp || 0).getTime() -
          new Date(a.timestamp || 0).getTime(),
      )

      setTimeline(combined)
    } catch (err) {
      setTimelineError(
        err.response?.data?.message ||
        'Unable to load activity history.',
      )
    } finally {
      setTimelineLoading(false)
    }
  }, [id])

  // Load available sales representatives for managers
  const loadSalesReps = useCallback(async () => {
    if (!isManager) return

    setLoadingReps(true)
    setAssignmentError('')

    try {
      const response = await api.get('/users/sales-reps')
      setSalesReps(Array.isArray(response.data) ? response.data : [])
    } catch (err) {
      setAssignmentError(
        err.response?.data?.message ||
        'Unable to load sales representatives.',
      )
    } finally {
      setLoadingReps(false)
    }
  }, [isManager])

  useEffect(() => {
    loadLead()
    loadTimeline()
  }, [loadLead, loadTimeline])

  useEffect(() => {
    if (isManager) {
      loadSalesReps()
    }
  }, [isManager, loadSalesReps])

  useEffect(() => {
    if (lead && salesReps.length > 0) {
      const currentOwner = salesReps.find(
        (rep) => rep.fullName === lead.ownerName,
      )
      setSelectedOwner(currentOwner?.email || '')
    }
  }, [lead, salesReps])

  const handleAssignment = async (event) => {
    event.preventDefault()
    setAssignmentError('')
    setAssignmentSuccess('')

    if (!selectedOwner) {
      setAssignmentError('Please select a sales representative.')
      return
    }

    setSavingAssignment(true)

    try {
      await api.put(`/leads/${id}/assign`, {
        ownerEmail: selectedOwner,
      })

      setAssignmentSuccess('Lead reassigned successfully.')

      await Promise.all([loadLead(), loadTimeline()])
    } catch (err) {
      setAssignmentError(
        err.response?.data?.message ||
        'Unable to reassign lead. Please try again.',
      )
    } finally {
      setSavingAssignment(false)
    }
  }

  const handleStatusUpdate = async (event) => {
    event.preventDefault()
    setStatusError('')
    setStatusSuccess('')

    if (!selectedStatus) {
      setStatusError('Please select a stage.')
      return
    }

    if (selectedStatus === 'WON' && (!dealValue || Number(dealValue) <= 0)) {
      setStatusError('Won requires a positive deal value.')
      return
    }

    if (selectedStatus === 'LOST' && !lossReason.trim()) {
      setStatusError('Lost requires a loss reason.')
      return
    }

    setSavingStatus(true)

    try {
      await api.put(`/leads/${id}/status`, {
        status: selectedStatus,
        dealValue: selectedStatus === 'WON' ? Number(dealValue) : null,
        lossReason: selectedStatus === 'LOST' ? lossReason.trim() : null,
      })

      setStatusSuccess('Lead stage updated successfully.')
      setSelectedStatus('')
      setDealValue('')
      setLossReason('')
      await Promise.all([loadLead(), loadTimeline()])
    } catch (err) {
      setStatusError(
        err.response?.data?.message ||
        'Unable to update lead stage. Check the allowed stage transition.',
      )
    } finally {
      setSavingStatus(false)
    }
  }

  const handleAddActivity = async (event) => {
    event.preventDefault()

    if (!description.trim()) {
      setActivityError('Please enter an activity description.')
      return
    }

    setSavingActivity(true)
    setActivityError('')

    try {
      await api.post(`/leads/${id}/activities`, {
        type: activityType,
        description: description.trim(),
      })

      setDescription('')
      await loadTimeline()
    } catch (err) {
      setActivityError(
        err.response?.data?.message ||
        'Unable to save activity. Please try again.',
      )
    } finally {
      setSavingActivity(false)
    }
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500">
        Loading lead details...
      </div>
    )
  }

  if (error || !lead) {
    return (
      <div className="rounded-2xl border border-red-100 bg-white p-8">
        <div className="flex items-center gap-2 text-sm text-red-600">
          <AlertCircle size={18} />
          {error || 'Lead not found.'}
        </div>
        <button
          onClick={loadLead}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          <RefreshCw size={15} />
          Try again
        </button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-[1200px] space-y-6">
      <Link
        to="/leads"
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-blue-600"
      >
        <ArrowLeft size={16} />
        Back to Leads
      </Link>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">
              Lead profile
            </p>
            <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
              {lead.name}
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              {lead.company || 'No company provided'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span
              className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                statusStyles[lead.status] || statusStyles.NEW
              }`}
            >
              {(lead.status || 'NEW').replaceAll('_', ' ')}
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600">
              {lead.priority || 'MEDIUM'} PRIORITY
            </span>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-base font-bold text-slate-900">
          Lead Information
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Contact details and ownership information.
        </p>

        <div className="mt-7 grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
          <InfoItem icon={Mail} label="Email address" value={lead.email} />
          <InfoItem icon={Phone} label="Phone number" value={lead.phone} />
          <InfoItem icon={Building2} label="Company" value={lead.company} />
          <InfoItem icon={User} label="Lead owner" value={lead.ownerName} />
          <InfoItem
            icon={CalendarDays}
            label="Created date"
            value={formatDate(lead.createdAt)}
          />
          <InfoItem icon={User} label="Lead source" value={lead.source} />
        </div>
      </section>

      {/* Manager-only lead assignment */}
      {isManager && (
        <section className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
              <UserRoundCog size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Assign / Reassign Lead
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Change the sales representative responsible for this lead.
              </p>
            </div>
          </div>

          <form onSubmit={handleAssignment} className="mt-6 space-y-4">
            <div>
              <label className="mb-2 block text-xs font-semibold text-slate-600">
                Select sales representative
              </label>

              <select
                value={selectedOwner}
                onChange={(event) => {
                  setSelectedOwner(event.target.value)
                  setAssignmentError('')
                  setAssignmentSuccess('')
                }}
                disabled={loadingReps || savingAssignment}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-blue-400 disabled:bg-slate-50"
              >
                <option value="">
                  {loadingReps ? 'Loading sales representatives...' : 'Select a sales representative'}
                </option>

                {salesReps.map((rep) => (
                  <option key={rep.id} value={rep.email}>
                    {rep.fullName} ({rep.email})
                  </option>
                ))}
              </select>
            </div>

            {assignmentError && (
              <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                {assignmentError}
              </p>
            )}

            {assignmentSuccess && (
              <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">
                {assignmentSuccess}
              </p>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={
                  savingAssignment ||
                  loadingReps ||
                  !selectedOwner ||
                  salesReps.length === 0
                }
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <UserRoundCog size={16} />
                {savingAssignment ? 'Assigning...' : 'Assign Lead'}
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-base font-bold text-slate-900">Change Lead Stage</h2>
        <p className="mt-1 text-xs text-slate-500">
          Update the sales pipeline stage according to the allowed transitions.
        </p>

        <form onSubmit={handleStatusUpdate} className="mt-5 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs font-semibold text-slate-600">
                Current stage
              </label>
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-semibold text-slate-700">
                {(lead.status || 'NEW').replaceAll('_', ' ')}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold text-slate-600">
                New stage
              </label>
              <select
                value={selectedStatus}
                onChange={(event) => setSelectedStatus(event.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-blue-400"
              >
                <option value="">Select a stage</option>
                {['CONTACTED', 'QUALIFIED', 'PROPOSAL_SENT', 'WON', 'LOST'].map((status) => (
                  <option key={status} value={status}>
                    {status.replaceAll('_', ' ')}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {selectedStatus === 'WON' && (
            <div>
              <label className="mb-2 block text-xs font-semibold text-slate-600">
                Deal value *
              </label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={dealValue}
                onChange={(event) => setDealValue(event.target.value)}
                placeholder="Enter positive deal value"
                className="w-full rounded-lg border border-slate-200 px-3 py-3 text-sm outline-none focus:border-blue-400"
              />
            </div>
          )}

          {selectedStatus === 'LOST' && (
            <div>
              <label className="mb-2 block text-xs font-semibold text-slate-600">
                Loss reason *
              </label>
              <textarea
                rows={3}
                value={lossReason}
                onChange={(event) => setLossReason(event.target.value)}
                placeholder="Explain why this lead was lost"
                className="w-full rounded-lg border border-slate-200 px-3 py-3 text-sm outline-none focus:border-blue-400"
              />
            </div>
          )}

          {statusError && (
            <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {statusError}
            </p>
          )}

          {statusSuccess && (
            <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">
              {statusSuccess}
            </p>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={savingStatus || !selectedStatus}
              className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {savingStatus ? 'Updating...' : 'Update Stage'}
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2">
              <Activity size={19} className="text-blue-600" />
              <h2 className="text-base font-bold text-slate-900">
                Activity Timeline
              </h2>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Notes, calls, meetings and lead history in one place.
            </p>
          </div>

          <button
            onClick={loadTimeline}
            disabled={timelineLoading}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw size={14} />
            Refresh history
          </button>
        </div>

        <form
          onSubmit={handleAddActivity}
          className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4"
        >
          <h3 className="text-sm font-bold text-slate-800">
            Add an activity
          </h3>

          <div className="mt-3 grid gap-3 sm:grid-cols-[160px_1fr]">
            <select
              value={activityType}
              onChange={(event) => setActivityType(event.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-blue-400"
            >
              <option value="NOTE">Note</option>
              <option value="CALL">Call</option>
              <option value="MEETING">Meeting</option>
            </select>

            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={3}
              maxLength={2000}
              placeholder="Describe this activity..."
              className="w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-blue-400"
            />
          </div>

          {activityError && (
            <p className="mt-2 text-xs font-medium text-red-600">
              {activityError}
            </p>
          )}

          <div className="mt-3 flex justify-end">
            <button
              type="submit"
              disabled={savingActivity}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              <Plus size={15} />
              {savingActivity ? 'Saving...' : 'Add activity'}
            </button>
          </div>
        </form>

        <div className="mt-7">
          {timelineLoading ? (
            <p className="py-8 text-center text-sm text-slate-400">
              Loading activity history...
            </p>
          ) : timelineError ? (
            <div className="rounded-lg border border-red-100 bg-red-50 p-4 text-sm text-red-700">
              {timelineError}
            </div>
          ) : timeline.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 py-10 text-center">
              <Clock size={25} className="mx-auto text-slate-300" />
              <p className="mt-3 text-sm font-semibold text-slate-600">
                No activity recorded yet
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Add a note, call or meeting to start this timeline.
              </p>
            </div>
          ) : (
            <div className="relative space-y-0">
              {timeline.map((item, index) => (
                <div key={item.id} className="relative flex gap-4 pb-7">
                  {index !== timeline.length - 1 && (
                    <div className="absolute bottom-0 left-[17px] top-9 w-px bg-slate-200" />
                  )}

                  <div
                    className={`relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                      item.kind === 'AUDIT'
                        ? 'bg-violet-100 text-violet-700'
                        : 'bg-blue-50 text-blue-700'
                    }`}
                  >
                    <TimelineIcon type={item.type} />
                  </div>

                  <div className="min-w-0 flex-1 rounded-xl border border-slate-100 bg-white p-4">
                    <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-bold text-slate-800">
                            {item.title}
                          </h3>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${
                              item.kind === 'AUDIT'
                                ? 'bg-violet-50 text-violet-700'
                                : 'bg-blue-50 text-blue-700'
                            }`}
                          >
                            {item.kind === 'AUDIT' ? 'RECORD HISTORY' : 'ACTIVITY'}
                          </span>
                        </div>

                        {item.description && (
                          <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-600">
                            {item.description}
                          </p>
                        )}
                      </div>

                      <span className="shrink-0 text-[11px] text-slate-400">
                        {formatDate(item.timestamp)}
                      </span>
                    </div>

                    <p className="mt-3 text-xs font-medium text-slate-500">
                      By {item.actorName || 'Unknown user'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
