import { useState } from 'react'
import { Loader2, UserPlus } from 'lucide-react'
import api from '../../api/axios'
import { Dialog } from '../ui/Overlay'
import { Button, PasswordField, TextField } from './UserBits'
import { apiErrorMessage } from './teamData'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+$/

// Uses the existing manager-only endpoint: POST /users/sales-reps { fullName, email, password }.
// Client checks mirror the backend's RegisterRequest rules; the server still validates everything.
export default function AddSalesRepDialog({ onClose, onCreated }) {
  const [form, setForm] = useState({ fullName: '', email: '', password: '' })
  const [show, setShow] = useState(false)
  const [errors, setErrors] = useState({})
  const [submitError, setSubmitError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const update = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }))
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }))
  }

  const validate = () => {
    const next = {}
    const name = form.fullName.trim()
    const email = form.email.trim()
    if (!name) next.fullName = 'Full name is required.'
    else if (name.length > 100) next.fullName = 'Full name cannot exceed 100 characters.'
    if (!email) next.email = 'Email is required.'
    else if (!EMAIL_PATTERN.test(email)) next.email = 'Enter a valid email address.'
    else if (email.length > 150) next.email = 'Email cannot exceed 150 characters.'
    if (form.password.length < 8) next.password = 'Use at least 8 characters.'
    return next
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitError('')
    const next = validate()
    setErrors(next)
    if (Object.keys(next).length) return

    setSubmitting(true)
    try {
      const { data } = await api.post('/users/sales-reps', {
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        password: form.password,
      })
      onCreated(data)
    } catch (err) {
      console.error('Create sales rep failed:', err.response?.data || err)
      const fieldErrors = err.response?.data?.fieldErrors
      if (fieldErrors) setErrors(fieldErrors)
      if (err.response?.status === 409) setErrors((prev) => ({ ...prev, email: 'An account with this email already exists.' }))
      else setSubmitError(apiErrorMessage(err, 'The account could not be created. Try again.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog
      title="Add sales rep"
      description="Create a Sales Rep account. They sign in with this email and the temporary password you set."
      icon={UserPlus}
      onClose={onClose}
      busy={submitting}
      footer={
        <>
          <Button type="button" onClick={onClose} disabled={submitting}>Cancel</Button>
          <Button type="submit" form="add-rep-form" variant="primary" disabled={submitting}>
            {submitting && <Loader2 size={15} className="animate-spin motion-reduce:animate-none" aria-hidden="true" />}
            {submitting ? 'Creating…' : 'Create account'}
          </Button>
        </>
      }
    >
      <form id="add-rep-form" onSubmit={handleSubmit} noValidate className="space-y-4">
        <TextField id="rep-name" label="Full name" value={form.fullName} onChange={update('fullName')} error={errors.fullName} autoComplete="off" placeholder="e.g. Kavindi Rajapaksa" data-autofocus="" />
        <TextField id="rep-email" label="Work email" type="email" value={form.email} onChange={update('email')} error={errors.email} autoComplete="off" placeholder="name@company.com" />
        <PasswordField
          id="rep-password"
          label="Temporary password"
          value={form.password}
          onChange={update('password')}
          error={errors.password}
          hint="At least 8 characters. Share it securely; you can reset it later from this page."
          show={show}
          onToggle={() => setShow(!show)}
        />
        {submitError && (
          <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{submitError}</p>
        )}
      </form>
    </Dialog>
  )
}
