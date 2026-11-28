import { initials } from './teamData'

const AVATAR_TONES = [
  'bg-blue-50 text-blue-700 ring-blue-100',
  'bg-indigo-50 text-indigo-700 ring-indigo-100',
  'bg-sky-50 text-sky-700 ring-sky-100',
  'bg-slate-100 text-slate-700 ring-slate-200',
]

export function Avatar({ name, id = 0, size = 'md' }) {
  const sizes = { sm: 'h-8 w-8 text-[11px]', md: 'h-9 w-9 text-xs', lg: 'h-12 w-12 text-sm' }
  return (
    <div className={`flex shrink-0 items-center justify-center rounded-full font-semibold ring-1 ${sizes[size]} ${AVATAR_TONES[id % AVATAR_TONES.length]}`}>
      {initials(name)}
    </div>
  )
}

export function RoleBadge({ role = 'SALES_REP' }) {
  const isManager = role === 'MANAGER'
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${
      isManager ? 'bg-violet-50 text-violet-700 ring-violet-200' : 'bg-slate-50 text-slate-700 ring-slate-200'
    }`}>
      <span className={`h-1.5 w-1.5 rounded-full ${isManager ? 'bg-violet-500' : 'bg-blue-500'}`} />
      {isManager ? 'Manager' : 'Sales Rep'}
    </span>
  )
}

const STAGE_STYLES = {
  NEW: 'bg-slate-50 text-slate-600 ring-slate-200',
  CONTACTED: 'bg-blue-50 text-blue-700 ring-blue-200',
  QUALIFIED: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
  PROPOSAL_SENT: 'bg-violet-50 text-violet-700 ring-violet-200',
  WON: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  LOST: 'bg-red-50 text-red-700 ring-red-200',
}

export function StageBadge({ status }) {
  return (
    <span className={`inline-flex shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-medium ring-1 ring-inset ${STAGE_STYLES[status] || STAGE_STYLES.NEW}`}>
      {status?.replaceAll('_', ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase())}
    </span>
  )
}

export function Skeleton({ className = '' }) {
  return <div className={`animate-pulse rounded-md bg-slate-100 motion-reduce:animate-none ${className}`} />
}

export function PasswordField({ id, label, value, onChange, error, hint, show, onToggle, autoFocus, autoComplete = 'new-password' }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-700">{label}</label>
      <div className="relative">
        <input
          id={id}
          type={show ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          data-autofocus={autoFocus ? '' : undefined}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
          className={`h-10 w-full rounded-lg border bg-white pl-3 pr-16 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 ${
            error ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-500/10' : 'border-slate-200 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10'
          }`}
        />
        {onToggle && (
          <button
            type="button"
            onClick={onToggle}
            aria-pressed={show}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-800"
          >
            {show ? 'Hide' : 'Show'}
          </button>
        )}
      </div>
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-xs font-medium text-red-600">{error}</p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-slate-500">{hint}</p>
      ) : null}
    </div>
  )
}

export function TextField({ id, label, error, ...props }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-700">{label}</label>
      <input
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`h-10 w-full rounded-lg border bg-white px-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 ${
          error ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-500/10' : 'border-slate-200 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10'
        }`}
        {...props}
      />
      {error && <p id={`${id}-error`} className="mt-1.5 text-xs font-medium text-red-600">{error}</p>}
    </div>
  )
}

export function Button({ variant = 'secondary', className = '', children, ...props }) {
  const styles = {
    primary: 'bg-blue-600 text-white shadow-sm hover:bg-blue-700 active:bg-blue-800 disabled:bg-blue-600/60',
    secondary: 'border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50 active:bg-slate-100 disabled:opacity-50',
    ghost: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50',
  }
  return (
    <button
      className={`inline-flex h-9 items-center justify-center gap-2 rounded-lg px-3.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-600/20 disabled:cursor-not-allowed ${styles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
