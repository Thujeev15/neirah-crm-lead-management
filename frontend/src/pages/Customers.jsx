import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowUpRight,
  BadgeCheck,
  Building2,
  CalendarPlus,
  ChevronLeft,
  ChevronRight,
  Eye,
  Hourglass,
  Info,
  MoreHorizontal,
  RefreshCw,
  Search,
  SearchX,
  TrendingUp,
  UserRoundCog,
  X,
} from 'lucide-react'
import useToast from '../hooks/useToast'
import Toast from '../components/ui/Toast'
import CustomerDrawer from '../components/customers/CustomerDrawer'
import ReassignDialog from '../components/customers/ReassignDialog'
import { formatDate, loadCustomers, sourceLabel } from '../components/customers/customerData'
import { Avatar, Button, Skeleton } from '../components/users/UserBits'
import { apiErrorMessage, formatMoney } from '../components/users/teamData'

const PAGE_SIZE = 10

const SORTS = {
  newest: { label: 'Newest customers', compare: (a, b) => new Date(b.convertedAt) - new Date(a.convertedAt) },
  oldest: { label: 'Oldest customers', compare: (a, b) => new Date(a.convertedAt) - new Date(b.convertedAt) },
  'name-asc': { label: 'Name (A–Z)', compare: (a, b) => a.name.localeCompare(b.name) },
  value: { label: 'Highest deal value', compare: (a, b) => b.wonValue - a.wonValue || a.name.localeCompare(b.name) },
}

const selectClass = 'h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-sm text-slate-800 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10'

function KpiCard({ icon: Icon, label, value, note, loading, tone = 'text-slate-500' }) {
  return (
    <div className="rounded-xl border border-slate-200/80 bg-white p-5">
      <div className="flex items-center gap-2 text-slate-500">
        <Icon size={15} className={tone} aria-hidden="true" />
        <p className="text-[13px] font-medium">{label}</p>
      </div>
      {loading ? <Skeleton className="mt-3 h-8 w-20" /> : <p className="mt-2 truncate text-[22px] font-semibold tabular-nums tracking-tight text-slate-900 sm:text-[28px]">{value}</p>}
      <p className="mt-1 text-xs text-slate-500">{loading ? ' ' : note}</p>
    </div>
  )
}

function RowMenu({ customer, onView, onReassign }) {
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

  const item = 'flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50'

  return (
    <div ref={ref} className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={() => setOpen(!open)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Actions for ${customer.name}`}
        className={`rounded-md p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 ${open ? 'bg-slate-100 text-slate-700' : ''}`}
      >
        <MoreHorizontal size={17} />
      </button>
      {open && (
        <div role="menu" className="menu-enter absolute right-0 top-full z-20 mt-1 w-52 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-lg shadow-slate-900/10">
          <button role="menuitem" className={item} onClick={() => { setOpen(false); onView(customer) }}>
            <Eye size={15} className="text-slate-400" aria-hidden="true" /> View profile
          </button>
          <button role="menuitem" className={item} onClick={() => { setOpen(false); onReassign(customer) }}>
            <UserRoundCog size={15} className="text-slate-400" aria-hidden="true" /> Reassign owner
          </button>
          <Link role="menuitem" to={`/leads/${customer.sourceLeadId}`} className={item}>
            <ArrowUpRight size={15} className="text-slate-400" aria-hidden="true" /> Open originating lead
          </Link>
        </div>
      )}
    </div>
  )
}

export default function Customers() {
  const [customers, setCustomers] = useState([])
  const [unconverted, setUnconverted] = useState([])
  const [partialFailures, setPartialFailures] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [search, setSearch] = useState('')
  const [owner, setOwner] = useState('all')
  const [source, setSource] = useState('all')
  const [sort, setSort] = useState('newest')
  const [page, setPage] = useState(1)

  const [selectedId, setSelectedId] = useState(null)
  const [reassign, setReassign] = useState(null) // { customer, fromDrawer }
  const { toast, show: showToast, dismiss } = useToast()

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const result = await loadCustomers()
      setCustomers(result.customers)
      setUnconverted(result.unconverted)
      setPartialFailures(result.failed)
    } catch (err) {
      console.error('Customer loading failed:', err.response?.data || err)
      setError(apiErrorMessage(err, 'Customers could not be loaded.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const owners = useMemo(() => {
    const map = new Map()
    customers.forEach((c) => c.ownerEmail && map.set(c.ownerEmail, c.ownerName))
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1]))
  }, [customers])
  const sources = useMemo(() => [...new Set(customers.map((c) => c.source).filter(Boolean))].sort(), [customers])

  const totals = useMemo(() => {
    const value = customers.reduce((t, c) => t + c.wonValue, 0)
    const deals = customers.reduce((t, c) => t + c.deals.length, 0)
    const now = new Date()
    const thisMonth = customers.filter((c) => {
      const d = new Date(c.convertedAt)
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
    }).length
    return { count: customers.length, value, avg: deals ? value / deals : 0, thisMonth, repeat: customers.filter((c) => c.deals.length > 1).length }
  }, [customers])

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase()
    const digits = q.replace(/\D/g, '')
    return customers
      .filter((c) => !q
        || [c.name, c.email, c.company].some((v) => v?.toLowerCase().includes(q))
        || (digits.length >= 3 && c.phone?.replace(/\D/g, '').includes(digits)))
      .filter((c) => owner === 'all' || c.ownerEmail === owner)
      .filter((c) => source === 'all' || c.source === source)
      .sort(SORTS[sort].compare)
  }, [customers, search, owner, source, sort])

  const pageCount = Math.max(1, Math.ceil(visible.length / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const pageRows = visible.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
  const selected = customers.find((c) => c.id === selectedId) || null
  const filtered = search.trim() || owner !== 'all' || source !== 'all'
  const resetFilters = () => { setSearch(''); setOwner('all'); setSource('all'); setPage(1) }

  // The drawer closes while the dialog is open (one modal at a time) and reopens afterwards.
  const openReassign = (customer, fromDrawer = false) => { setSelectedId(null); setReassign({ customer, fromDrawer }) }
  const closeReassign = () => {
    if (reassign?.fromDrawer) setSelectedId(reassign.customer.id)
    setReassign(null)
  }
  const handleReassigned = (lead) => {
    const { customer, fromDrawer } = reassign
    setCustomers((prev) => prev.map((c) => (c.id !== customer.id ? c : {
      ...c,
      ownerName: lead.ownerName,
      ownerEmail: lead.ownerEmail,
      deals: c.deals.map((d) => (d.id === lead.id ? { ...d, ownerName: lead.ownerName, ownerEmail: lead.ownerEmail } : d)),
    })))
    setReassign(null)
    if (fromDrawer) setSelectedId(customer.id)
    showToast({ title: 'Account reassigned', message: `${customer.name} is now owned by ${lead.ownerName}.` })
  }

  return (
    <div className="mx-auto max-w-[1400px]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight text-slate-900">Customers</h1>
          <p className="mt-1 text-sm text-slate-500">Every account converted from a won deal, across the whole team.</p>
        </div>
        <Button onClick={load} disabled={loading} aria-label="Refresh customers" className="self-start sm:self-auto">
          <RefreshCw size={15} className={loading ? 'animate-spin motion-reduce:animate-none' : ''} aria-hidden="true" />
          <span className="hidden sm:inline">Refresh</span>
        </Button>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <KpiCard icon={BadgeCheck} label="Customers" value={totals.count} note={totals.repeat ? `${totals.repeat} with repeat deals` : 'Converted from won leads'} loading={loading} tone="text-emerald-600" />
        <KpiCard icon={TrendingUp} label="Won deal value" value={formatMoney(totals.value)} note={`${formatMoney(totals.avg)} average per deal`} loading={loading} tone="text-blue-600" />
        <KpiCard icon={CalendarPlus} label="New this month" value={totals.thisMonth} note={`Converted in ${new Intl.DateTimeFormat('en-US', { month: 'long' }).format(new Date())}`} loading={loading} tone="text-indigo-600" />
        <KpiCard
          icon={Hourglass}
          label="Awaiting conversion"
          value={unconverted.length}
          note={unconverted.length ? 'Won leads not yet converted' : 'Every won lead is converted'}
          loading={loading}
          tone={unconverted.length ? 'text-amber-600' : 'text-slate-500'}
        />
      </div>

      {!loading && unconverted.length > 0 && (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/60 p-4">
          <p className="text-sm font-medium text-amber-900">
            {unconverted.length === 1 ? '1 won lead hasn’t' : `${unconverted.length} won leads haven’t`} been converted to a customer yet
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {unconverted.map((lead) => (
              <Link key={lead.id} to={`/leads/${lead.id}`} className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-white px-2.5 py-1 text-xs font-medium text-amber-900 transition hover:border-amber-300 hover:bg-amber-50">
                {lead.name} <span className="text-amber-700/70">· {lead.ownerName}</span> <ArrowUpRight size={12} aria-hidden="true" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div role="alert" className="mt-6 flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-red-800">Couldn’t load customers</p>
            <p className="mt-0.5 text-sm text-red-700">{error}</p>
          </div>
          <Button onClick={load}>Try again</Button>
        </div>
      )}
      {!error && partialFailures > 0 && (
        <div role="alert" className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          {partialFailures} customer {partialFailures === 1 ? 'record' : 'records'} couldn’t be loaded, so the list may be incomplete.
          <Button onClick={load} className="h-8 text-xs">Retry</Button>
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
              placeholder="Search name, email, company, phone"
              aria-label="Search customers"
              className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-9 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 [&::-webkit-search-cancel-button]:hidden"
            />
            {search && (
              <button onClick={() => { setSearch(''); setPage(1) }} className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Clear search">
                <X size={15} />
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 lg:flex lg:items-center">
            <select value={owner} onChange={(e) => { setOwner(e.target.value); setPage(1) }} aria-label="Filter by account owner" className={selectClass}>
              <option value="all">All owners</option>
              {owners.map(([email, name]) => <option key={email} value={email}>{name}</option>)}
            </select>
            <select value={source} onChange={(e) => { setSource(e.target.value); setPage(1) }} aria-label="Filter by lead source" className={selectClass}>
              <option value="all">All sources</option>
              {sources.map((s) => <option key={s} value={s}>{sourceLabel(s)}</option>)}
            </select>
            <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort customers" className={selectClass}>
              {Object.entries(SORTS).map(([value, { label }]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </div>
        </div>

        {/* Desktop and tablet */}
        <table className="hidden w-full text-left md:table">
          <thead>
            <tr className="border-b border-slate-200/80 text-xs font-medium text-slate-500">
              <th className="px-4 py-2.5 font-medium">Customer</th>
              <th className="hidden px-4 py-2.5 font-medium 2xl:table-cell">ID</th>
              <th className="hidden px-4 py-2.5 font-medium lg:table-cell">Company</th>
              <th className="hidden px-4 py-2.5 font-medium min-[1400px]:table-cell">Phone</th>
              <th className="whitespace-nowrap px-4 py-2.5 font-medium">Account owner</th>
              <th className="hidden px-4 py-2.5 font-medium lg:table-cell">Source</th>
              <th className="whitespace-nowrap px-4 py-2.5 text-right font-medium">Won value</th>
              <th className="whitespace-nowrap px-4 py-2.5 font-medium">Customer since</th>
              <th className="w-12 px-4 py-2.5"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading && customers.length === 0
              ? Array.from({ length: 5 }, (_, i) => (
                <tr key={i}>
                  <td className="px-4 py-3"><div className="flex items-center gap-3"><Skeleton className="h-9 w-9 rounded-full" /><div className="space-y-1.5"><Skeleton className="h-3.5 w-32" /><Skeleton className="h-3 w-44" /></div></div></td>
                  <td className="hidden px-4 py-3 2xl:table-cell"><Skeleton className="h-3.5 w-8" /></td>
                  <td className="hidden px-4 py-3 lg:table-cell"><Skeleton className="h-3.5 w-28" /></td>
                  <td className="hidden px-4 py-3 min-[1400px]:table-cell"><Skeleton className="h-3.5 w-24" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-3.5 w-24" /></td>
                  <td className="hidden px-4 py-3 lg:table-cell"><Skeleton className="h-3.5 w-16" /></td>
                  <td className="px-4 py-3"><Skeleton className="ml-auto h-3.5 w-16" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-3.5 w-20" /></td>
                  <td className="px-4 py-3" />
                </tr>
              ))
              : pageRows.map((c) => (
                <tr key={c.id} onClick={() => setSelectedId(c.id)} className="cursor-pointer transition hover:bg-slate-50/80">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={c.name} id={c.id} />
                      <div className="min-w-0">
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelectedId(c.id) }}
                          className="flex items-center gap-1.5 truncate text-sm font-medium text-slate-900 hover:text-blue-700 focus-visible:underline focus-visible:outline-none"
                        >
                          {c.name}
                          {c.deals.length > 1 && <span className="rounded bg-violet-50 px-1 py-px text-[10px] font-medium text-violet-700 ring-1 ring-inset ring-violet-200">{c.deals.length} deals</span>}
                        </button>
                        <p className="truncate text-xs text-slate-500">{c.email || 'No email'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="hidden px-4 py-3 font-mono text-xs text-slate-500 2xl:table-cell">#{c.id}</td>
                  <td className="hidden max-w-[200px] truncate px-4 py-3 text-sm text-slate-700 lg:table-cell">{c.company || <span className="text-slate-400">—</span>}</td>
                  <td className="hidden whitespace-nowrap px-4 py-3 text-sm tabular-nums text-slate-700 min-[1400px]:table-cell">{c.phone || <span className="text-slate-400">—</span>}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-700">{c.ownerName || <span className="text-slate-400">Unassigned</span>}</td>
                  <td className="hidden whitespace-nowrap px-4 py-3 text-sm text-slate-600 lg:table-cell">{sourceLabel(c.source)}</td>
                  <td className="px-4 py-3 text-right text-sm font-medium tabular-nums text-slate-900">{formatMoney(c.wonValue)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-600">{formatDate(c.convertedAt)}</td>
                  <td className="px-4 py-3"><RowMenu customer={c} onView={(x) => setSelectedId(x.id)} onReassign={(x) => openReassign(x)} /></td>
                </tr>
              ))}
          </tbody>
        </table>

        {/* Mobile */}
        <ul className="divide-y divide-slate-100 md:hidden">
          {loading && customers.length === 0
            ? Array.from({ length: 4 }, (_, i) => (
              <li key={i} className="flex items-center gap-3 p-4"><Skeleton className="h-9 w-9 rounded-full" /><div className="flex-1 space-y-1.5"><Skeleton className="h-3.5 w-32" /><Skeleton className="h-3 w-44" /></div></li>
            ))
            : pageRows.map((c) => (
              <li key={c.id} className="flex items-start gap-3 p-4">
                <Avatar name={c.name} id={c.id} />
                <button onClick={() => setSelectedId(c.id)} className="min-w-0 flex-1 text-left">
                  <p className="truncate text-sm font-medium text-slate-900">{c.name}</p>
                  <p className="flex items-center gap-1 truncate text-xs text-slate-500"><Building2 size={11} aria-hidden="true" /> {c.company || 'No company'}</p>
                  <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
                    <span className="font-medium text-slate-900">{formatMoney(c.wonValue)}</span>
                    <span>{c.ownerName || 'Unassigned'}</span>
                    <span>{formatDate(c.convertedAt)}</span>
                  </div>
                </button>
                <RowMenu customer={c} onView={(x) => setSelectedId(x.id)} onReassign={(x) => openReassign(x)} />
              </li>
            ))}
        </ul>

        {!loading && !error && visible.length === 0 && (
          <div className="flex flex-col items-center px-6 py-14 text-center">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
              {customers.length === 0 ? <BadgeCheck size={20} aria-hidden="true" /> : <SearchX size={20} aria-hidden="true" />}
            </div>
            <p className="mt-4 text-sm font-semibold text-slate-900">{customers.length === 0 ? 'No customers yet' : 'No customers match'}</p>
            <p className="mt-1 max-w-sm text-sm text-slate-500">
              {customers.length === 0 ? 'Customers appear here when a won lead is converted.' : 'Try a different search, or clear the filters.'}
            </p>
            {customers.length > 0 && filtered && <Button className="mt-4" onClick={resetFilters}>Clear filters</Button>}
          </div>
        )}

        <div className="flex flex-col gap-3 border-t border-slate-200/80 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-start gap-2 text-xs text-slate-500">
            <Info size={14} className="mt-px shrink-0 text-slate-400" aria-hidden="true" />
            Built from converted won leads. The API has no customer status, editing or deletion.
          </p>
          {visible.length > 0 && (
            <div className="flex items-center justify-between gap-3 sm:justify-end">
              <p className="whitespace-nowrap text-xs tabular-nums text-slate-500">
                {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, visible.length)} of {visible.length}
              </p>
              <div className="flex gap-1">
                <button onClick={() => setPage(currentPage - 1)} disabled={currentPage === 1} className="rounded-md border border-slate-200 p-1.5 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40" aria-label="Previous page"><ChevronLeft size={15} /></button>
                <button onClick={() => setPage(currentPage + 1)} disabled={currentPage === pageCount} className="rounded-md border border-slate-200 p-1.5 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40" aria-label="Next page"><ChevronRight size={15} /></button>
              </div>
            </div>
          )}
        </div>
      </section>

      {selected && (
        <CustomerDrawer
          key={selected.id}
          customer={selected}
          onClose={() => setSelectedId(null)}
          onReassign={(c) => openReassign(c, true)}
          onLogged={() => showToast({ title: 'Interaction logged', message: `Added to ${selected.name}’s history.` })}
        />
      )}

      {reassign && <ReassignDialog customer={reassign.customer} onClose={closeReassign} onReassigned={handleReassigned} />}

      <Toast toast={toast} onClose={dismiss} />
    </div>
  )
}
