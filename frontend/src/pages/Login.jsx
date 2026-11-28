import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertCircle,
  ArrowRight,
  BellRing,
  Eye,
  EyeOff,
  GitBranch,
  KeyRound,
  Loader2,
  LockKeyhole,
  Mail,
  ShieldCheck,
  UserCheck,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import NeirahLogo from '../components/brand/NeirahLogo'

// Neutral palette for this page. The only colour outside it is the Neirah logo itself
// (kept unchanged) and red for error states.
//   warm white #F5F5F2 · white #FFFFFF · charcoal #202124 · soft gray #E5E5E5
//   text secondary #5F6368 · muted #8A8A85 · hairline #ECECE8 · surface #FAFAF8

const benefits = [
  { icon: GitBranch, title: 'Pipeline clarity', text: 'Every lead, stage and owner in one view.' },
  { icon: BellRing, title: 'Follow-ups on time', text: 'Overdue work surfaces before deals go cold.' },
  { icon: ShieldCheck, title: 'Role-based access', text: 'Reps see their leads. Managers see all.' },
]

// Illustration of the product's pipeline board. Decorative only (aria-hidden): not live data.
// Stage dots darken as a lead moves forward, so progress reads without colour.
const previewColumns = [
  { stage: 'New', count: 12, dot: 'bg-[#D6D6D1]', card: { name: 'Lotus Retail', owner: 'RP', value: '42k' } },
  { stage: 'Contacted', count: 9, dot: 'bg-[#ADADA7]', card: { name: 'Spice Route Foods', owner: 'NF', value: '65k' } },
  { stage: 'Proposal', count: 5, dot: 'bg-[#6E6E69]', card: { name: 'Northwind Hotels', owner: 'RP', value: '120k' } },
  { stage: 'Won', count: 7, dot: 'bg-[#202124]', won: true, card: { name: 'Blue Lagoon Spa', owner: 'AS', value: '310k' } },
]

// Uses the browser's own rules for type="email" and required, so validation is unchanged;
// only the way the messages are shown is new.
function getFieldError(input) {
  if (!input) return ''
  if (input.validity.valueMissing) {
    return input.id === 'email' ? 'Enter your work email.' : 'Enter your password.'
  }
  if (input.validity.typeMismatch) return 'Enter a valid email address, like name@company.com.'
  return ''
}

function PipelinePreview() {
  return (
    <div aria-hidden="true" className="relative">
      <div className="overflow-hidden rounded-xl border border-[#E5E5E5] bg-white shadow-[0_1px_2px_rgba(32,33,36,0.04),0_28px_56px_-28px_rgba(32,33,36,0.22)]">
        <div className="flex items-center justify-between border-b border-[#ECECE8] px-4 py-2.5">
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[#E5E5E5]" />
              <span className="h-2 w-2 rounded-full bg-[#E5E5E5]" />
              <span className="h-2 w-2 rounded-full bg-[#E5E5E5]" />
            </div>
            <p className="text-[11px] font-medium text-[#202124]">Sales pipeline</p>
            <span className="rounded-md bg-[#F5F5F2] px-1.5 py-0.5 text-[10px] text-[#8A8A85]">This quarter</span>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2.5 bg-[#FCFCFB] p-3">
          {previewColumns.map((column) => (
            <div key={column.stage} className="min-w-0">
              <div className="mb-2 flex items-center gap-1.5 px-0.5">
                <span className={`h-1.5 w-1.5 rounded-full ${column.dot}`} />
                <span className="truncate text-[10px] font-medium text-[#5F6368]">{column.stage}</span>
                <span className="ml-auto text-[10px] tabular-nums text-[#ADADA7]">{column.count}</span>
              </div>
              <div
                className={`rounded-lg border p-2 ${
                  column.won
                    ? 'border-[#202124] bg-[#202124] shadow-[0_6px_14px_-8px_rgba(32,33,36,0.6)]'
                    : 'border-[#ECECE8] bg-white shadow-[0_1px_1px_rgba(32,33,36,0.03)]'
                }`}
              >
                <p className={`truncate text-[10.5px] font-medium ${column.won ? 'text-white' : 'text-[#202124]'}`}>{column.card.name}</p>
                <div className="mt-2 flex items-center justify-between">
                  <span className={`text-[10px] tabular-nums ${column.won ? 'text-[#BDBDB8]' : 'text-[#8A8A85]'}`}>{column.card.value}</span>
                  <span
                    className={`flex h-4 w-4 items-center justify-center rounded-full text-[7px] font-semibold ${
                      column.won ? 'bg-white/15 text-white' : 'bg-[#F0F0EC] text-[#3C3C3F]'
                    }`}
                  >
                    {column.card.owner}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Floating KPI card: the one dark surface, giving the composition an anchor. */}
      <div className="absolute -right-6 -top-8 w-[188px] rounded-xl bg-[#202124] p-3.5 shadow-[0_18px_40px_-14px_rgba(32,33,36,0.55)] xl:-right-12">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-[#A8A8A3]">Win rate</p>
          <span className="text-[10px] font-medium tabular-nums text-[#D6D6D1]">+8%</span>
        </div>
        <div className="mt-1 flex items-end justify-between gap-3">
          <p className="text-xl font-semibold tabular-nums tracking-tight text-white">62%</p>
          <svg viewBox="0 0 80 28" className="h-7 w-20" fill="none">
            <path d="M0 22 L12 19 L22 21 L34 14 L46 16 L58 9 L70 10 L80 4 V28 H0 Z" fill="#FFFFFF" fillOpacity="0.07" />
            <path d="M0 22 L12 19 L22 21 L34 14 L46 16 L58 9 L70 10 L80 4" stroke="#E5E5E5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="80" cy="4" r="2" fill="#FFFFFF" />
          </svg>
        </div>
      </div>
    </div>
  )
}

export default function Login() {
  const { login, loading } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({ email: '', password: '' })
  const [attempted, setAttempted] = useState(false)
  const emailRef = useRef(null)
  const passwordRef = useRef(null)

  const updateField = (name, value, setter, input) => {
    setter(value)
    if (error) setError('')
    // After the first submit, re-check the field as the user types so the message clears as soon as it is fixed.
    if (attempted) setFieldErrors((prev) => ({ ...prev, [name]: getFieldError(input) }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setAttempted(true)

    const nextErrors = { email: getFieldError(emailRef.current), password: getFieldError(passwordRef.current) }
    setFieldErrors(nextErrors)
    if (nextErrors.email) return emailRef.current?.focus()
    if (nextErrors.password) return passwordRef.current?.focus()

    try {
      await login(email.trim(), password)
      navigate('/', { replace: true })
    } catch (err) {
      console.error('Login error:', err.response?.data || err)
      const data = err.response?.data
      if (data?.fieldErrors) {
        setFieldErrors((prev) => ({ ...prev, ...data.fieldErrors }))
      }
      setError(
        data?.message
          || (!err.response
            ? 'Can’t reach the Neirah server. Check your connection and try again.'
            : 'Unable to sign in. Check your email and password.'),
      )
    }
  }

  const fieldShell = (hasError) =>
    `group relative flex items-center rounded-xl border bg-white transition duration-200 ${
      hasError
        ? 'border-red-300 shadow-[0_0_0_4px_rgba(220,38,38,0.07)] focus-within:border-red-500'
        : 'border-[#E5E5E5] shadow-[0_1px_2px_rgba(32,33,36,0.04)] hover:border-[#D2D2CD] focus-within:border-[#202124] focus-within:shadow-[0_0_0_4px_rgba(32,33,36,0.07)]'
    }`

  const iconClass = (hasError) =>
    `pointer-events-none absolute left-4 transition-colors duration-200 ${hasError ? 'text-red-500' : 'text-[#ADADA7] group-focus-within:text-[#202124]'}`

  // White autofill background instead of the browser's tinted default.
  const inputClass =
    'h-12 w-full rounded-xl bg-transparent pl-11 text-[15px] text-[#202124] caret-[#202124] outline-none placeholder:text-[#ADADA7] disabled:cursor-not-allowed disabled:text-[#8A8A85] [&:-webkit-autofill]:shadow-[inset_0_0_0_1000px_#fff] [&:-webkit-autofill]:[-webkit-text-fill-color:#202124]'

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#F5F5F2] text-[#202124] lg:grid lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:bg-[#FBFBFA]">
      {/* ── Brand panel (laptop and desktop) ───────────────────────────── */}
      <section className="relative hidden overflow-hidden border-r border-[#E5E5E5] bg-[#F5F5F2] lg:flex lg:min-h-screen lg:flex-col lg:gap-6 lg:px-12 lg:py-8 xl:px-16 2xl:gap-8 2xl:py-11">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: 'radial-gradient(rgba(32,33,36,0.07) 1px, transparent 1px)',
            backgroundSize: '22px 22px',
            maskImage: 'radial-gradient(ellipse 65% 55% at 72% 58%, black, transparent)',
            WebkitMaskImage: 'radial-gradient(ellipse 65% 55% at 72% 58%, black, transparent)',
          }}
        />
        {/* Soft daylight from the top-left, like light falling on paper. */}
        <div aria-hidden="true" className="pointer-events-none absolute -left-40 -top-48 h-[520px] w-[620px] rounded-full bg-white/80 blur-[100px]" />

        <div className="relative">
          <NeirahLogo tone="light" size={36} />
        </div>

        <div className="relative flex flex-1 flex-col justify-center">
          <div className="max-w-[600px]">
            <p className="mb-4 inline-flex items-center gap-2.5 text-[11px] font-medium uppercase tracking-[0.16em] text-[#8A8A85]">
              <span className="h-px w-6 bg-[#C9C9C4]" aria-hidden="true" />
              Lead &amp; sales operations
            </p>
            <h1 className="text-[32px] font-semibold leading-[1.12] tracking-[-0.025em] text-[#202124] 2xl:text-[40px]">
              Close more deals with a pipeline your whole team trusts.
            </h1>
            <p className="mt-4 max-w-[480px] text-[15px] leading-7 text-[#5F6368]">
              Capture every lead, give it a clear owner and follow it from first call to signed customer — with the
              full history always in view.
            </p>
          </div>

          <div className="mt-12 max-w-[660px] pb-2 pr-6 2xl:mt-14 [@media(max-height:760px)]:hidden">
            <PipelinePreview />
          </div>
        </div>

        <div className="relative">
          <ul className="grid grid-cols-3 gap-6 border-t border-[#E5E5E5] pt-5">
            {benefits.map(({ icon: Icon, title, text }) => (
              <li key={title}>
                <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E5E5E5] bg-white text-[#202124] shadow-[0_1px_2px_rgba(32,33,36,0.04)]">
                  <Icon size={15} strokeWidth={1.8} aria-hidden="true" />
                </span>
                <p className="mt-3 text-[13px] font-semibold text-[#202124]">{title}</p>
                <p className="mt-1 text-[12.5px] leading-5 text-[#6E6E69]">{text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── Authentication panel ───────────────────────────────────────── */}
      <section className="relative flex min-h-screen flex-col items-center justify-center px-5 py-10 sm:px-10">
        <div className="relative w-full max-w-[440px]">
          <div className="rounded-2xl border border-[#E5E5E5] bg-white shadow-[0_1px_2px_rgba(32,33,36,0.04),0_24px_48px_-28px_rgba(32,33,36,0.18)]">
            <div className="px-6 pb-8 pt-7 sm:px-10 sm:pb-10 sm:pt-9">
              {/* Logo sits on the card for tablet and mobile, where the brand panel is hidden. */}
              <div className="mb-8 lg:hidden">
                <NeirahLogo tone="light" size={34} />
              </div>

              <h2 className="text-[26px] font-semibold tracking-[-0.025em] text-[#202124]">Welcome back</h2>
              <p className="mt-1.5 text-sm leading-6 text-[#5F6368]">Sign in to Neirah CRM with your work account.</p>

              {error && (
                <div role="alert" className="mt-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50/70 px-4 py-3">
                  <AlertCircle size={18} className="mt-0.5 shrink-0 text-red-600" aria-hidden="true" />
                  <div>
                    <p className="text-sm font-semibold text-red-800">Sign-in failed</p>
                    <p className="mt-0.5 text-sm text-red-700">{error}</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate className="mt-7">
                <fieldset disabled={loading} className="space-y-5">
                  <div>
                    <label htmlFor="email" className="mb-1.5 block text-[13px] font-medium text-[#3C3C3F]">
                      Work email
                    </label>
                    <div className={fieldShell(fieldErrors.email)}>
                      <Mail className={iconClass(fieldErrors.email)} size={17} strokeWidth={1.8} aria-hidden="true" />
                      <input
                        ref={emailRef}
                        id="email"
                        type="email"
                        required
                        autoComplete="email"
                        autoFocus
                        value={email}
                        onChange={(e) => updateField('email', e.target.value, setEmail, e.target)}
                        placeholder="you@company.com"
                        aria-invalid={Boolean(fieldErrors.email)}
                        aria-describedby={fieldErrors.email ? 'email-error' : undefined}
                        className={`${inputClass} pr-4`}
                      />
                    </div>
                    {fieldErrors.email && (
                      <p id="email-error" className="mt-1.5 text-xs font-medium text-red-600">{fieldErrors.email}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="password" className="mb-1.5 block text-[13px] font-medium text-[#3C3C3F]">
                      Password
                    </label>
                    <div className={fieldShell(fieldErrors.password)}>
                      <LockKeyhole className={iconClass(fieldErrors.password)} size={17} strokeWidth={1.8} aria-hidden="true" />
                      <input
                        ref={passwordRef}
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        required
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => updateField('password', e.target.value, setPassword, e.target)}
                        placeholder="Enter your password"
                        aria-invalid={Boolean(fieldErrors.password)}
                        aria-describedby={fieldErrors.password ? 'password-error' : undefined}
                        className={`${inputClass} pr-12`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        aria-pressed={showPassword}
                        className="absolute right-1.5 flex h-9 w-9 items-center justify-center rounded-lg text-[#8A8A85] transition hover:bg-[#F5F5F2] hover:text-[#202124] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#202124]/25"
                      >
                        {showPassword ? <EyeOff size={17} strokeWidth={1.8} aria-hidden="true" /> : <Eye size={17} strokeWidth={1.8} aria-hidden="true" />}
                      </button>
                    </div>
                    {fieldErrors.password && (
                      <p id="password-error" className="mt-1.5 text-xs font-medium text-red-600">{fieldErrors.password}</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="group relative flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-[#202124] px-5 text-[15px] font-medium tracking-[-0.01em] text-white shadow-[0_1px_2px_rgba(32,33,36,0.2),inset_0_1px_0_rgba(255,255,255,0.08)] transition duration-200 hover:-translate-y-px hover:bg-[#2D2E31] hover:shadow-[0_10px_20px_-10px_rgba(32,33,36,0.55),inset_0_1px_0_rgba(255,255,255,0.08)] active:translate-y-0 active:bg-[#17181A] active:shadow-[0_1px_2px_rgba(32,33,36,0.2)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#202124]/15 disabled:cursor-not-allowed disabled:bg-[#202124]/70 disabled:hover:translate-y-0 disabled:hover:shadow-none motion-reduce:hover:translate-y-0"
                  >
                    {loading ? (
                      <>
                        <Loader2 size={18} className="animate-spin motion-reduce:animate-none" aria-hidden="true" />
                        <span>Signing in…</span>
                      </>
                    ) : (
                      <>
                        <span>Sign in</span>
                        <ArrowRight size={17} strokeWidth={1.8} className="transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true" />
                      </>
                    )}
                  </button>
                </fieldset>
              </form>

              <div className="mt-6 flex items-start gap-2.5 rounded-xl bg-[#F5F5F2] px-4 py-3">
                <KeyRound size={15} strokeWidth={1.8} className="mt-0.5 shrink-0 text-[#8A8A85]" aria-hidden="true" />
                <p className="text-[13px] leading-5 text-[#5F6368]">
                  <span className="font-medium text-[#202124]">Forgot your password?</span> Ask your sales manager to
                  reset it for you.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 rounded-b-2xl border-t border-[#ECECE8] bg-[#FAFAF8] px-5 py-3.5 text-[11px] text-[#8A8A85]">
              <span className="inline-flex items-center gap-1.5"><LockKeyhole size={13} strokeWidth={1.8} aria-hidden="true" /> Hashed passwords</span>
              <span className="inline-flex items-center gap-1.5"><ShieldCheck size={13} strokeWidth={1.8} aria-hidden="true" /> Signed sessions</span>
              <span className="inline-flex items-center gap-1.5"><UserCheck size={13} strokeWidth={1.8} aria-hidden="true" /> Role-based access</span>
            </div>
          </div>

          <p className="mt-6 text-center text-xs leading-5 text-[#8A8A85]">
            Accounts are created by your manager. There is no public sign-up.
          </p>
          <p className="mt-6 text-center text-[11px] text-[#ADADA7]">© 2026 Neirah CRM · Lead &amp; Sales Operations</p>
        </div>
      </section>
    </main>
  )
}
