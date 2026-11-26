import { useState } from 'react'
import { X, UserPlus, AlertCircle } from 'lucide-react'
import api from '../../api/axios'

const initialForm = {
  name: '',
  company: '',
  email: '',
  phone: '',
  source: 'WEBSITE',
  priority: 'MEDIUM',
}

export default function LeadForm({ onClose, onCreated }) {
  const [form, setForm] = useState(initialForm)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [duplicateWarning, setDuplicateWarning] = useState(null)

  const updateField = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    setDuplicateWarning(null)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    setDuplicateWarning(null)

    try {
      const duplicateResponse = await api.post('/leads/check-duplicates', {
        ...form,
        name: form.name.trim(),
        company: form.company.trim(),
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
      })

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

      await api.post('/leads', {
        ...form,
        name: form.name.trim(),
        company: form.company.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
      })

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

  const createWithConfirmation = async () => {
    setLoading(true)
    setError('')

    try {
      await api.post('/leads', {
        ...form,
        name: form.name.trim(),
        company: form.company.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        confirmDuplicate: true,
      })

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
              <h2 className="text-lg font-bold text-slate-900">Create New Lead</h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Add a new sales opportunity to your workspace.
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
                <option value="WEBSITE">Website</option>
                <option value="REFERRAL">Referral</option>
                <option value="SOCIAL_MEDIA">Social Media</option>
                <option value="ADVERTISEMENT">Advertisement</option>
                <option value="OTHER">Other</option>
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

          {duplicateWarning && (
            <div className="space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-start gap-2 text-sm font-semibold text-amber-800">
                <AlertCircle size={17} className="mt-0.5 shrink-0" />
                A possible duplicate lead was found.
              </div>
              <p className="text-xs text-amber-700">
                Please review the existing record before continuing. You can still create this lead if it is intentional.
              </p>
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
              {loading ? 'Checking...' : 'Save Lead'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
