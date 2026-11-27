import { useState } from 'react'
import { X, UserPlus, AlertCircle } from 'lucide-react'
import api from '../../api/axios'

const SOURCES = [
  ['WEBSITE', 'Website'],
  ['REFERRAL', 'Referral'],
  ['CALL', 'Phone Call'],
  ['CAMPAIGN', 'Marketing Campaign'],
  ['SOCIAL_MEDIA', 'Social Media'],
  ['OTHER', 'Other'],
]

const initialForm = {
  name: '',
  company: '',
  email: '',
  phone: '',
  source: 'WEBSITE',
  priority: 'MEDIUM',
}

const toPayload = (form) => ({
  ...form,
  name: form.name.trim(),
  company: form.company.trim() || null,
  email: form.email.trim() || null,
  phone: form.phone.trim() || null,
})

// When `lead` is supplied the form edits that lead (PUT); otherwise it creates one.
export default function LeadForm({ lead, onClose, onCreated, onSaved }) {
  const isEdit = Boolean(lead)
  const [form, setForm] = useState(
    isEdit
      ? {
          name: lead.name || '',
          company: lead.company || '',
          email: lead.email || '',
          phone: lead.phone || '',
          source: lead.source || 'OTHER',
          priority: lead.priority || 'MEDIUM',
        }
      : initialForm,
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [duplicateWarning, setDuplicateWarning] = useState(null)
  // Edit mode: the server returned a duplicate warning for a changed email/phone.
  const [editDuplicateMessage, setEditDuplicateMessage] = useState('')

  const updateField = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    setDuplicateWarning(null)
    setEditDuplicateMessage('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    setDuplicateWarning(null)

    if (isEdit) {
      await saveEdit(false)
      return
    }

    try {
      const duplicateResponse = await api.post('/leads/check-duplicates', toPayload(form))

      const duplicateData = duplicateResponse.data
      const hasDuplicates = Array.isArray(duplicateData)
        ? duplicateData.length > 0
        : Boolean(
            duplicateData?.hasDuplicates ||
            duplicateData?.duplicateFound ||
            duplicateData?.duplicates?.length
          )

      if (hasDuplicates) {
        setDuplicateWarning(duplicateData)
        setLoading(false)
        return
      }

      await api.post('/leads', toPayload(form))

      onCreated()
    } catch (err) {
      const responseData = err.response?.data
      setError(
        responseData?.message ||
        responseData?.error ||
        'Unable to create lead. Please check the details and try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  // Saves an edit. If the changed email/phone matches another lead the server answers 409
  // with a duplicate warning; the user can then confirm and save anyway.
  const saveEdit = async (confirmDuplicate) => {
    setLoading(true)
    setError('')
    setEditDuplicateMessage('')

    try {
      await api.put(`/leads/${lead.id}`, { ...toPayload(form), confirmDuplicate })
      onSaved?.()
    } catch (err) {
      const message = err.response?.data?.message || ''
      if (err.response?.status === 409 && message.startsWith('Another lead')) {
        setEditDuplicateMessage(message)
      } else {
        setError(message || 'Unable to update lead. Please check the details and try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const createWithConfirmation = async () => {
    setLoading(true)
    setError('')

    try {
      await api.post('/leads', { ...toPayload(form), confirmDuplicate: true })

      onCreated()
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Unable to create lead. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  const inputClass =
    'w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <UserPlus size={19} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {isEdit ? 'Edit Lead' : 'Create New Lead'}
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">
                {isEdit
                  ? 'Update contact details, source and priority.'
                  : 'Add a new sales opportunity to your workspace.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close form"
          >
            <X size={19} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2">
              <span className="text-xs font-semibold text-slate-700">Lead Name *</span>
              <input
                required
                name="name"
                value={form.name}
                onChange={updateField}
                placeholder="Enter full name"
                className={inputClass}
              />
            </label>

            <label className="space-y-2">
              <span className="text-xs font-semibold text-slate-700">Company</span>
              <input
                name="company"
                value={form.company}
                onChange={updateField}
                placeholder="Company name"
                className={inputClass}
              />
            </label>

            <label className="space-y-2">
              <span className="text-xs font-semibold text-slate-700">Email</span>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={updateField}
                placeholder="name@company.com"
                className={inputClass}
              />
            </label>

            <label className="space-y-2">
              <span className="text-xs font-semibold text-slate-700">Phone</span>
              <input
                name="phone"
                value={form.phone}
                onChange={updateField}
                placeholder="Phone number"
                className={inputClass}
              />
            </label>

            <label className="space-y-2">
              <span className="text-xs font-semibold text-slate-700">Lead Source</span>
              <select
                name="source"
                value={form.source}
                onChange={updateField}
                className={inputClass}
              >
                {SOURCES.map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
                {!SOURCES.some(([value]) => value === form.source) && (
                  <option value={form.source}>{form.source}</option>
                )}
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-xs font-semibold text-slate-700">Priority</span>
              <select
                name="priority"
                value={form.priority}
                onChange={updateField}
                className={inputClass}
              >
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </label>
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle size={17} className="mt-0.5 shrink-0" />
              {error}
            </div>
          )}

          {editDuplicateMessage && (
            <div className="space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-start gap-2 text-sm font-semibold text-amber-800">
                <AlertCircle size={17} className="mt-0.5 shrink-0" />
                {editDuplicateMessage}
              </div>
              <button
                type="button"
                disabled={loading}
                onClick={() => saveEdit(true)}
                className="rounded-lg bg-amber-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-amber-700 disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Anyway'}
              </button>
            </div>
          )}

          {duplicateWarning && (
            <div className="space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-start gap-2 text-sm font-semibold text-amber-800">
                <AlertCircle size={17} className="mt-0.5 shrink-0" />
                A possible duplicate lead was found.
              </div>
              <p className="text-xs text-amber-700">
                Email and phone are compared after normalising (case, spaces and symbols are ignored).
                Review the existing record before continuing. You can still create this lead if it is intentional.
              </p>
              {duplicateWarning.matches?.length > 0 ? (
                <ul className="space-y-1.5">
                  {duplicateWarning.matches.map((match) => (
                    <li key={match.id} className="rounded-lg bg-white/70 px-3 py-2 text-xs text-amber-900">
                      <span className="font-semibold">{match.name}</span>
                      {match.company ? ` · ${match.company}` : ''}
                      {match.email ? ` · ${match.email}` : ''}
                      {match.phone ? ` · ${match.phone}` : ''}
                      {` · ${String(match.status).replaceAll('_', ' ')}`}
                      {match.ownerName ? ` · Owner: ${match.ownerName}` : ''}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs italic text-amber-700">
                  The matching lead belongs to another representative, so its details are hidden.
                </p>
              )}
              <button
                type="button"
                disabled={loading}
                onClick={createWithConfirmation}
                className="rounded-lg bg-amber-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-amber-700 disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Anyway'}
              </button>
            </div>
          )}

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? (isEdit ? 'Saving...' : 'Checking...') : isEdit ? 'Save Changes' : 'Save Lead'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
