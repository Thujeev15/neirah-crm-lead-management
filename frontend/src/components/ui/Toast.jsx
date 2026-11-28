import { CircleAlert, CircleCheck, X } from 'lucide-react'

export default function Toast({ toast, onClose }) {
  if (!toast) return null
  const isError = toast.tone === 'error'
  const Icon = isError ? CircleAlert : CircleCheck

  return (
    <div className="pointer-events-none fixed inset-x-4 bottom-4 z-[70] flex justify-center sm:inset-x-auto sm:right-6 sm:bottom-6">
      <div
        key={toast.id}
        role={isError ? 'alert' : 'status'}
        className="toast-enter pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-lg shadow-slate-900/10"
      >
        <Icon size={18} className={`mt-0.5 shrink-0 ${isError ? 'text-red-600' : 'text-emerald-600'}`} aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-900">{toast.title}</p>
          {toast.message && <p className="mt-0.5 text-sm text-slate-500">{toast.message}</p>}
        </div>
        <button onClick={onClose} className="-m-1 rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600" aria-label="Dismiss notification">
          <X size={16} />
        </button>
      </div>
    </div>
  )
}
