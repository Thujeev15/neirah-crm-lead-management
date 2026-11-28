import { useEffect, useState } from 'react'
import { ArrowRight, Loader2, UserRoundCog } from 'lucide-react'
import api from '../../api/axios'
import { Dialog } from '../ui/Overlay'
import { Avatar, Button } from '../users/UserBits'
import { apiErrorMessage, asList } from '../users/teamData'

// Customers have no owner column of their own: the backend scopes them by the owner of the lead
// they were created from. Reassigning the account therefore uses the existing manager-only
// PUT /leads/{id}/assign on that lead. The backend writes an OWNER_CHANGED audit event and moves
// the lead's open follow-ups to the new owner.
export default function ReassignDialog({ customer, onClose, onReassigned }) {
  const [reps, setReps] = useState([])
  const [loadingReps, setLoadingReps] = useState(true)
  const [selected, setSelected] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let active = true
    api.get('/users/sales-reps')
      .then(({ data }) => active && setReps(asList(data)))
      .catch((err) => active && setError(apiErrorMessage(err, 'Sales reps could not be loaded.')))
      .finally(() => active && setLoadingReps(false))
    return () => { active = false }
  }, [])

  const options = reps.filter((rep) => rep.email.toLowerCase() !== (customer.ownerEmail || '').toLowerCase())
  const target = reps.find((rep) => rep.email === selected)

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!target) {
      setError('Choose the sales rep who should own this account.')
      return
    }
    setError('')
    setSubmitting(true)
    try {
      const { data } = await api.put(`/leads/${customer.sourceLeadId}/assign`, { ownerEmail: target.email })
      onReassigned(data)
    } catch (err) {
      console.error('Customer reassignment failed:', err.response?.data || err)
      setError(apiErrorMessage(err, 'The account could not be reassigned. Try again.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog
      title="Reassign account owner"
      description={`Choose who owns ${customer.name}'s account.`}
      icon={UserRoundCog}
      tone="danger"
      onClose={onClose}
      busy={submitting}
      footer={
        <>
          <Button type="button" onClick={onClose} disabled={submitting}>Cancel</Button>
          <Button type="submit" form="reassign-form" variant="primary" disabled={submitting || !target}>
            {submitting && <Loader2 size={15} className="animate-spin motion-reduce:animate-none" aria-hidden="true" />}
            {submitting ? 'Reassigning…' : 'Reassign owner'}
          </Button>
        </>
      }
    >
      <form id="reassign-form" onSubmit={handleSubmit} noValidate className="space-y-4">
        <div>
          <label htmlFor="new-owner" className="mb-1.5 block text-sm font-medium text-slate-700">New owner</label>
          <select
            id="new-owner"
            value={selected}
            onChange={(e) => { setSelected(e.target.value); setError('') }}
            disabled={loadingReps || submitting}
            data-autofocus=""
            className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 disabled:bg-slate-50"
          >
            <option value="">{loadingReps ? 'Loading sales reps…' : 'Select a sales rep'}</option>
            {options.map((rep) => <option key={rep.id} value={rep.email}>{rep.fullName} · {rep.email}</option>)}
          </select>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3">
          <div className="flex min-w-0 flex-1 items-center gap-2.5">
            <Avatar name={customer.ownerName || '?'} id={1} size="sm" />
            <div className="min-w-0">
              <p className="text-[11px] text-slate-500">Current</p>
              <p className="truncate text-sm font-medium text-slate-900">{customer.ownerName || 'Unassigned'}</p>
            </div>
          </div>
          <ArrowRight size={16} className="shrink-0 text-slate-400" aria-hidden="true" />
          <div className="flex min-w-0 flex-1 items-center gap-2.5">
            {target ? <Avatar name={target.fullName} id={target.id} size="sm" /> : <div className="h-8 w-8 shrink-0 rounded-full border border-dashed border-slate-300" />}
            <div className="min-w-0">
              <p className="text-[11px] text-slate-500">New</p>
              <p className="truncate text-sm font-medium text-slate-900">{target ? target.fullName : '—'}</p>
            </div>
          </div>
        </div>

        <p className="text-xs leading-5 text-slate-500">
          This reassigns lead #{customer.sourceLeadId}, which the customer was created from. The change is recorded in
          its history, open follow-ups move to the new owner, and notes stay where they are.
          {customer.deals.length > 1 && ' Other deals linked to this customer keep their own owners.'}
        </p>

        {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      </form>
    </Dialog>
  )
}
