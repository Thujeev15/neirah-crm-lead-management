import { useState } from 'react'
import { KeyRound, Loader2, TriangleAlert } from 'lucide-react'
import api from '../../api/axios'
import { Dialog } from '../ui/Overlay'
import { Avatar, Button, PasswordField } from './UserBits'
import { apiErrorMessage } from './teamData'

// Uses the existing manager-only endpoint: PUT /users/reset-password/{email} { newPassword }.
// The backend requires at least 8 characters, resets Sales Rep accounts only, and signs the
// user out everywhere. The password lives only in this component's state and is never shown again.
export default function ResetPasswordDialog({ user, onClose, onSuccess }) {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [show, setShow] = useState(false)
  const [errors, setErrors] = useState({})
  const [submitError, setSubmitError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const validate = () => {
    const next = {}
    if (password.length < 8) next.password = 'Use at least 8 characters.'
    if (!confirm) next.confirm = 'Re-enter the new password.'
    else if (confirm !== password) next.confirm = 'Passwords don’t match.'
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
      await api.put(`/users/reset-password/${encodeURIComponent(user.email)}`, { newPassword: password })
      setPassword('')
      setConfirm('')
      onSuccess(user)
    } catch (err) {
      console.error('Password reset failed:', err.response?.data || err)
      setSubmitError(apiErrorMessage(err, 'The password could not be reset. Try again.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog
      title="Reset password"
      description="Set a new password for this team member."
      icon={KeyRound}
      tone="danger"
      onClose={onClose}
      busy={submitting}
      footer={
        <>
          <Button type="button" onClick={onClose} disabled={submitting}>Cancel</Button>
          <Button type="submit" form="reset-password-form" variant="primary" disabled={submitting}>
            {submitting && <Loader2 size={15} className="animate-spin motion-reduce:animate-none" aria-hidden="true" />}
            {submitting ? 'Resetting…' : 'Reset password'}
          </Button>
        </>
      }
    >
      <div className="mb-5 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3">
        <Avatar name={user.fullName} id={user.id} />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-900">{user.fullName}</p>
          <p className="truncate text-xs text-slate-500">{user.email}</p>
        </div>
      </div>

      <form id="reset-password-form" onSubmit={handleSubmit} noValidate className="space-y-4">
        <PasswordField
          id="new-password"
          label="New password"
          value={password}
          onChange={(e) => { setPassword(e.target.value); if (errors.password) setErrors((p) => ({ ...p, password: '' })) }}
          error={errors.password}
          hint="At least 8 characters."
          show={show}
          onToggle={() => setShow(!show)}
          autoFocus
        />
        <PasswordField
          id="confirm-password"
          label="Confirm new password"
          value={confirm}
          onChange={(e) => { setConfirm(e.target.value); if (errors.confirm) setErrors((p) => ({ ...p, confirm: '' })) }}
          error={errors.confirm}
          show={show}
        />

        <div className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
          <TriangleAlert size={16} className="mt-0.5 shrink-0 text-amber-600" aria-hidden="true" />
          <p className="text-xs leading-5 text-amber-800">
            {user.fullName.split(' ')[0]} will be signed out on every device straight away. Share the new password
            through a secure channel; Neirah won’t show it again.
          </p>
        </div>

        {submitError && (
          <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{submitError}</p>
        )}
      </form>
    </Dialog>
  )
}
