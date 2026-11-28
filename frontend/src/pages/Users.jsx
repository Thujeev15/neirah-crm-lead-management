import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  AlarmClock,
  BriefcaseBusiness,
  ChevronLeft,
  ChevronRight,
  Eye,
  Info,
  KeyRound,
  MoreHorizontal,
  RefreshCw,
  Search,
  SearchX,
  Trophy,
  UserPlus,
  UsersRound,
  X,
} from 'lucide-react'
import api from '../api/axios'
import useToast from '../hooks/useToast'
import Toast from '../components/ui/Toast'
import AddSalesRepDialog from '../components/users/AddSalesRepDialog'
import ResetPasswordDialog from '../components/users/ResetPasswordDialog'
import UserDrawer from '../components/users/UserDrawer'
import { Avatar, Button, RoleBadge, Skeleton } from '../components/users/UserBits'
import { apiErrorMessage, asList, buildTeamRows, formatMoney, teamTotals } from '../components/users/teamData'

const PAGE_SIZE = 8

const SORTS = {
  'name-asc': { label: 'Name (A–Z)', compare: (a, b) => a.fullName.localeCompare(b.fullName) },
  'name-desc': { label: 'Name (Z–A)', compare: (a, b) => b.fullName.localeCompare(a.fullName) },
  // IDs are assigned in creation order; the API has no created date, so this is the honest proxy.
  newest: { label: 'Newest added', compare: (a, b) => b.id - a.id },
  oldest: { label: 'Oldest added', compare: (a, b) => a.id - b.id },
  open: { label: 'Most open leads', compare: (a, b) => b.open - a.open || a.fullName.localeCompare(b.fullName) },
  overdue: { label: 'Most overdue', compare: (a, b) => b.overdue - a.overdue || a.fullName.localeCompare(b.fullName) },
}

const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'overdue', label: 'Has overdue', test: (row) => row.overdue > 0 },
  { value: 'idle', label: 'No open leads', test: (row) => row.open === 0 },
]

function KpiCard({ icon: Icon, label, value, note, loading, tone = 'text-slate-500' }) {
  return (
    <div className="rounded-xl border border-slate-200/80 bg-white p-5">
      <div className="flex items-center gap-2 text-slate-500">
        <Icon size={15} className={tone} aria-hidden="true" />
        <p className="text-[13px] font-medium">{label}</p>
      </div>
      {loading ? <Skeleton className="mt-3 h-8 w-16" /> : <p className="mt-2 text-[28px] font-semibold tabular-nums tracking-tight text-slate-900">{value}</p>}
      <p className="mt-1 text-xs text-slate-500">{loading ? ' ' : note}</p>
    </div>
  )
}

function RowMenu({ user, onView, onReset }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const close = (event) => { if (!ref.current?.contains(event.target)) setOpen(false) }
    const onKey = (event) => { if (event.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const choose = (action) => () => { setOpen(false); action(user) }

  return (
    <div ref={ref} className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={() => setOpen(!open)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Actions for ${user.fullName}`}
        className={`rounded-md p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 ${open ? 'bg-slate-100 text-slate-700' : ''}`}
      >
        <MoreHorizontal size={17} />
      </button>
      {open && (
        <div role="menu" className="menu-enter absolute right-0 top-full z-20 mt-1 w-48 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-lg shadow-slate-900/10">
          <button role="menuitem" onClick={choose(onView)} className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50">
            <Eye size={15} className="text-slate-400" aria-hidden="true" /> View details
          </button>
          <button role="menuitem" onClick={choose(onReset)} className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50">
            <KeyRound size={15} className="text-slate-400" aria-hidden="true" /> Reset password
          </button>
        </div>
      )}
    </div>
  )
}

function OverdueCell({ count }) {
  if (!count) return <span className="text-slate-400">0</span>
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-red-50 px-1.5 py-0.5 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-200">
      <AlarmClock size={12} aria-hidden="true" /> {count}
    </span>
  )
}

export default function Users() {
  const [reps, setReps] = useState([])
  const [leads, setLeads] = useState([])
  const [overdue, setOverdue] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [sort, setSort] = useState('name-asc')
  const [page, setPage] = useState(1)

  const [selectedId, setSelectedId] = useState(null)
  const [resetTarget, setResetTarget] = useState(null)
  const [adding, setAdding] = useState(false)
  const { toast, show: showToast, dismiss } = useToast()

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [repsResponse, leadsResponse, overdueResponse] = await Promise.all([
        api.get('/users/sales-reps'),
        api.get('/leads'),
        api.get('/follow-ups', { params: { status: 'OVERDUE' } }),
      ])
      setReps(asList(repsResponse.data))
      setLeads(asList(leadsResponse.data))
      setOverdue(asList(overdueResponse.data))
    } catch (err) {
      console.error('Team loading failed:', err.response?.data || err)
      setError(apiErrorMessage(err, 'Team data could not be loaded.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const rows = useMemo(() => buildTeamRows(reps, leads, overdue), [reps, leads, overdue])
  const totals = useMemo(() => teamTotals(rows), [rows])

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase()
    const test = FILTERS.find((f) => f.value === filter)?.test
    return rows
      .filter((row) => !query || row.fullName.toLowerCase().includes(query) || row.email.toLowerCase().includes(query))
      .filter((row) => !test || test(row))
      .sort(SORTS[sort].compare)
  }, [rows, search, filter, sort])

  const pageCount = Math.max(1, Math.ceil(visible.length / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const pageRows = visible.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
  const selected = rows.find((row) => row.id === selectedId) || null
  const hasQuery = search.trim() || filter !== 'all'

  const resetFilters = () => { setSearch(''); setFilter('all'); setPage(1) }
  const openReset = (user) => { setSelectedId(null); setResetTarget(user) }

  return (
    <div className="mx-auto max-w-[1400px]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight text-slate-900">User management</h1>
          <p className="mt-1 text-sm text-slate-500">Your sales team, their workload and account access.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={load} disabled={loading} aria-label="Refresh team data">
            <RefreshCw size={15} className={loading ? 'animate-spin motion-reduce:animate-none' : ''} aria-hidden="true" />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          <Button variant="primary" onClick={() => setAdding(true)}>
            <UserPlus size={15} aria-hidden="true" /> Add sales rep
          </Button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <KpiCard icon={UsersRound} label="Sales reps" value={totals.members} note="Accounts with the Sales Rep role" loading={loading} tone="text-blue-600" />
        <KpiCard icon={BriefcaseBusiness} label="Open leads" value={totals.open} note={totals.members ? `${(totals.open / totals.members).toFixed(1)} per rep on average` : 'No reps yet'} loading={loading} tone="text-indigo-600" />
        <KpiCard
          icon={AlarmClock}
          label="Overdue follow-ups"
          value={totals.overdue}
          note={totals.withOverdue ? `${totals.withOverdue} of ${totals.members} reps affected` : 'Everyone is on schedule'}
          loading={loading}
          tone={totals.overdue ? 'text-red-600' : 'text-slate-500'}
        />
        <KpiCard icon={Trophy} label="Team win rate" value={totals.winRate == null ? '—' : `${totals.winRate}%`} note={`${totals.won} won · ${formatMoney(totals.wonValue)} deal value`} loading={loading} tone="text-emerald-600" />
      </div>

      {error && (
        <div role="alert" className="mt-6 flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-red-800">Couldn’t load your team</p>
            <p className="mt-0.5 text-sm text-red-700">{error}</p>
          </div>
          <Button onClick={load}>Try again</Button>
        </div>
      )}

      <section className="mt-6 rounded-xl border border-slate-200/80 bg-white">
        <div className="flex flex-col gap-3 border-b border-slate-200/80 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-xs">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <input
              type="search"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              placeholder="Search by name or email"
              aria-label="Search team members by name or email"
              className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-9 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 [&::-webkit-search-cancel-button]:hidden"
            />
            {search && (
              <button onClick={() => { setSearch(''); setPage(1) }} className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Clear search">
                <X size={15} />
              </button>
            )}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div role="radiogroup" aria-label="Filter by workload" className="inline-flex rounded-lg bg-slate-100 p-0.5">
              {FILTERS.map((option) => (
                <button
                  key={option.value}
                  role="radio"
                  aria-checked={filter === option.value}
                  onClick={() => { setFilter(option.value); setPage(1) }}
                  className={`flex-1 whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition sm:flex-none ${
                    filter === option.value ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <label className="flex items-center gap-2 text-xs text-slate-500">
              <span className="shrink-0">Sort by</span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-sm text-slate-800 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 sm:w-auto"
              >
                {Object.entries(SORTS).map(([value, { label }]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
          </div>
        </div>

        {/* Desktop and tablet: table */}
        <table className="hidden w-full text-left md:table">
          <thead>
            <tr className="border-b border-slate-200/80 text-xs font-medium text-slate-500">
              <th className="px-4 py-2.5 font-medium">Team member</th>
              <th className="hidden px-4 py-2.5 font-medium xl:table-cell">ID</th>
              <th className="px-4 py-2.5 font-medium">Role</th>
              <th className="px-4 py-2.5 text-right font-medium">Open leads</th>
              <th className="px-4 py-2.5 text-right font-medium">Won</th>
              <th className="hidden px-4 py-2.5 text-right font-medium lg:table-cell">Win rate</th>
              <th className="px-4 py-2.5 text-right font-medium">Overdue</th>
              <th className="w-12 px-4 py-2.5"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && rows.length === 0
              ? Array.from({ length: 5 }, (_, i) => (
                <tr key={i}>
                  <td className="px-4 py-3"><div className="flex items-center gap-3"><Skeleton className="h-9 w-9 rounded-full" /><div className="space-y-1.5"><Skeleton className="h-3.5 w-32" /><Skeleton className="h-3 w-44" /></div></div></td>
                  <td className="hidden px-4 py-3 xl:table-cell"><Skeleton className="h-3.5 w-8" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-5 w-20" /></td>
                  {[0, 1].map((c) => <td key={c} className="px-4 py-3"><Skeleton className="ml-auto h-3.5 w-6" /></td>)}
                  <td className="hidden px-4 py-3 lg:table-cell"><Skeleton className="ml-auto h-3.5 w-8" /></td>
                  <td className="px-4 py-3"><Skeleton className="ml-auto h-3.5 w-6" /></td>
                  <td className="px-4 py-3" />
                </tr>
              ))
              : pageRows.map((row) => (
                <tr key={row.id} onClick={() => setSelectedId(row.id)} className="cursor-pointer transition hover:bg-slate-50/80">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={row.fullName} id={row.id} />
                      <div className="min-w-0">
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelectedId(row.id) }}
                          className="truncate text-sm font-medium text-slate-900 hover:text-blue-700 focus-visible:underline focus-visible:outline-none"
                        >
                          {row.fullName}
                        </button>
                        <p className="truncate text-xs text-slate-500">{row.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="hidden px-4 py-3 font-mono text-xs text-slate-500 xl:table-cell">#{row.id}</td>
                  <td className="px-4 py-3"><RoleBadge /></td>
                  <td className="px-4 py-3 text-right text-sm tabular-nums text-slate-900">{row.open}</td>
                  <td className="px-4 py-3 text-right text-sm tabular-nums text-slate-900">{row.won}</td>
                  <td className="hidden px-4 py-3 text-right text-sm tabular-nums text-slate-600 lg:table-cell">{row.winRate == null ? '—' : `${row.winRate}%`}</td>
                  <td className="px-4 py-3 text-right text-sm tabular-nums"><OverdueCell count={row.overdue} /></td>
                  <td className="px-4 py-3"><RowMenu user={row} onView={(u) => setSelectedId(u.id)} onReset={openReset} /></td>
                </tr>
              ))}
          </tbody>
        </table>

        {/* Mobile: cards */}
        <ul className="divide-y divide-slate-100 md:hidden">
          {loading && rows.length === 0
            ? Array.from({ length: 4 }, (_, i) => (
              <li key={i} className="flex items-center gap-3 p-4"><Skeleton className="h-9 w-9 rounded-full" /><div className="flex-1 space-y-1.5"><Skeleton className="h-3.5 w-32" /><Skeleton className="h-3 w-44" /></div></li>
            ))
            : pageRows.map((row) => (
              <li key={row.id} className="flex items-start gap-3 p-4">
                <Avatar name={row.fullName} id={row.id} />
                <button onClick={() => setSelectedId(row.id)} className="min-w-0 flex-1 text-left">
                  <p className="truncate text-sm font-medium text-slate-900">{row.fullName}</p>
                  <p className="truncate text-xs text-slate-500">{row.email}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-slate-500">
                    <span><span className="font-medium text-slate-900">{row.open}</span> open</span>
                    <span><span className="font-medium text-slate-900">{row.won}</span> won</span>
                    <OverdueCell count={row.overdue} />
                  </div>
                </button>
                <RowMenu user={row} onView={(u) => setSelectedId(u.id)} onReset={openReset} />
              </li>
            ))}
        </ul>

        {!loading && !error && visible.length === 0 && (
          <div className="flex flex-col items-center px-6 py-14 text-center">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
              {rows.length === 0 ? <UsersRound size={20} aria-hidden="true" /> : <SearchX size={20} aria-hidden="true" />}
            </div>
            <p className="mt-4 text-sm font-semibold text-slate-900">{rows.length === 0 ? 'No sales reps yet' : 'No team members match'}</p>
            <p className="mt-1 max-w-sm text-sm text-slate-500">
              {rows.length === 0 ? 'Add your first sales rep to start assigning leads.' : 'Try a different name or email, or clear the filters.'}
            </p>
            <div className="mt-4">
              {rows.length === 0
                ? <Button variant="primary" onClick={() => setAdding(true)}><UserPlus size={15} aria-hidden="true" /> Add sales rep</Button>
                : hasQuery && <Button onClick={resetFilters}>Clear filters</Button>}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3 border-t border-slate-200/80 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-start gap-2 text-xs text-slate-500">
            <Info size={14} className="mt-px shrink-0 text-slate-400" aria-hidden="true" />
            The API lists Sales Rep accounts only; managers, account status and sign-in history aren’t available.
          </p>
          {visible.length > 0 && (
            <div className="flex items-center justify-between gap-3 sm:justify-end">
              <p className="whitespace-nowrap text-xs tabular-nums text-slate-500">
                {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, visible.length)} of {visible.length}
              </p>
              <div className="flex gap-1">
                <button onClick={() => setPage(currentPage - 1)} disabled={currentPage === 1} className="rounded-md border border-slate-200 p-1.5 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40" aria-label="Previous page">
                  <ChevronLeft size={15} />
                </button>
                <button onClick={() => setPage(currentPage + 1)} disabled={currentPage === pageCount} className="rounded-md border border-slate-200 p-1.5 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40" aria-label="Next page">
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {selected && <UserDrawer user={selected} onClose={() => setSelectedId(null)} onResetPassword={openReset} />}

      {resetTarget && (
        <ResetPasswordDialog
          user={resetTarget}
          onClose={() => setResetTarget(null)}
          onSuccess={(user) => {
            setResetTarget(null)
            showToast({ title: 'Password reset', message: `${user.fullName} has been signed out and must use the new password.` })
          }}
        />
      )}

      {adding && (
        <AddSalesRepDialog
          onClose={() => setAdding(false)}
          onCreated={(rep) => {
            setAdding(false)
            setReps((prev) => [...prev, rep])
            setSort('newest')
            resetFilters()
            showToast({ title: 'Sales rep added', message: `${rep.fullName} can now sign in with ${rep.email}.` })
          }}
        />
      )}

      <Toast toast={toast} onClose={dismiss} />
    </div>
  )
}
