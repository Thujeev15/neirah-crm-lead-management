import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Eye, EyeOff, Layers3, LockKeyhole, Mail, ShieldCheck } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { login, loading } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    try {
      await login(email.trim(), password)
      navigate('/', { replace: true })
    } catch (err) {
      console.error('Login error:', err.response?.data || err)
      setError(err.response?.data?.message || 'Unable to sign in. Check your email and password.')
    }
  }

  return (
    <main className="min-h-screen bg-white lg:grid lg:grid-cols-2">
      <section className="relative hidden min-h-screen overflow-hidden bg-[#101C3A] p-12 text-white lg:flex lg:flex-col lg:justify-between xl:p-16">
        <div className="absolute -right-32 top-24 h-96 w-96 rounded-full border border-white/10" />
        <div className="absolute -right-16 top-40 h-64 w-64 rounded-full border border-white/10" />
        <div className="absolute -bottom-40 -left-20 h-96 w-96 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="relative flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500 shadow-lg shadow-blue-500/30"><Layers3 size={23} /></div>
          <span className="text-2xl font-bold tracking-tight">Neirah<span className="text-blue-400">.</span></span>
        </div>
        <div className="relative max-w-xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-300/20 bg-blue-400/10 px-4 py-2 text-sm text-blue-200"><ShieldCheck size={16} /> Intelligent lead management</div>
          <h1 className="text-5xl font-semibold leading-[1.15] tracking-tight xl:text-6xl">Turn every lead into a <span className="text-blue-400">lasting relationship.</span></h1>
          <p className="mt-7 max-w-lg text-lg leading-8 text-slate-300">One workspace to manage your pipeline, empower your sales team and build stronger customer relationships.</p>
          <div className="mt-12 grid grid-cols-2 gap-4">
            <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-5"><p className="text-2xl font-semibold">360°</p><p className="mt-1 text-sm text-slate-400">Lead visibility</p></div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-5"><p className="text-2xl font-semibold">One</p><p className="mt-1 text-sm text-slate-400">Connected workspace</p></div>
          </div>
        </div>
        <p className="relative text-sm text-slate-400">© 2026 Neirah CRM. Lead & Sales Operations.</p>
      </section>

      <section className="flex min-h-screen items-center justify-center px-6 py-12 sm:px-12">
        <div className="w-full max-w-md">
          <div className="mb-12 flex items-center gap-3 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white"><Layers3 size={22} /></div>
            <span className="text-2xl font-bold tracking-tight text-slate-900">Neirah<span className="text-blue-600">.</span></span>
          </div>
          <div className="mb-9">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">Your workspace awaits</p>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Welcome back</h2>
            <p className="mt-3 text-sm leading-6 text-slate-500">Sign in to access your Neirah CRM workspace.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-semibold text-slate-700">Work email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input id="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" className="h-13 w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-11 pr-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10" />
              </div>
            </div>
            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-semibold text-slate-700">Password</label>
              <div className="relative">
                <LockKeyhole className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input id="password" type={showPassword ? 'text' : 'password'} required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" className="h-13 w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-11 pr-12 text-sm outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
              </div>
            </div>
            {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
            <button type="submit" disabled={loading} className="flex h-13 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-60">
              {loading ? 'Signing in...' : 'Sign in to workspace'} {!loading && <ArrowRight size={18} />}
            </button>
          </form>

          <div className="mt-8 flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4">
            <ShieldCheck className="mt-0.5 shrink-0 text-emerald-600" size={19} />
            <p className="text-xs leading-5 text-slate-500">Your workspace is protected with secure authentication and role-based access controls.</p>
          </div>
          <p className="mt-10 text-center text-xs text-slate-400">© 2026 Neirah CRM · Lead & Sales Operations</p>
        </div>
      </section>
    </main>
  )
}
