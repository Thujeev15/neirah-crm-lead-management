import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlarmClock,
  ArrowRightLeft,
  ArrowUpRight,
  BadgeCheck,
  Building2,
  CalendarCheck,
  CircleCheck,
  Clock3,
  GitCommitHorizontal,
  Loader2,
  Mail,
  Phone,
  StickyNote,
  UserRoundCog,
  Users,
} from 'lucide-react'
import api from '../../api/axios'
import { Drawer } from '../ui/Overlay'
import { Avatar, Button, Skeleton } from '../users/UserBits'
import { apiErrorMessage, formatDateTime, formatMoney } from '../users/teamData'
import { formatDate, loadCustomerHistory, sourceLabel } from './customerData'

const ACTIVITY_ICONS = { NOTE: StickyNote, CALL: Phone, MEETING: Users }
const pretty = (value) => (value ? value.replaceAll('_', ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase()) : '—')

function Section({ title, count, action, children }) {
  return (
    <section className="mt-8 first:mt-0">
      <div className="mb-2.5 flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
          {title}
          {count != null && <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">{count}</span>}
        </h3>
        {action}
      </div>
      {children}
    </section>
  )
}

function Row({ label, children }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <dt className="shrink-0 text-sm text-slate-500">{label}</dt>
      <dd className="min-w-0 text-right text-sm font-medium text-slate-900">{children}</dd>
    </div>
  )
}

function TimelineItem({ item, leadName }) {
  let Icon = GitCommitHorizontal
  let title
  let body = null
  if (item.kind === 'activity') {
    Icon = ACTIVITY_ICONS[item.type] || StickyNote
    title = pretty(item.type)
    body = item.text
  } else if (item.type === 'STATUS_CHANGED') {
    title = `Stage: ${pretty(item.from)} → ${pretty(item.to)}`
  } else if (item.type === 'OWNER_CHANGED') {
    Icon = ArrowRightLeft
    title = `Owner: ${item.from || 'Unassigned'} → ${item.to || 'Unassigned'}`
  } else if (item.type === 'CONVERTED') {
    Icon = BadgeCheck
    title = 'Converted to customer'
    body = item.to || null
  } else {
    title = pretty(item.type)
  }

  return (
    <li className="relative flex gap-3 pb-5 last:pb-0">
      <span className="absolute left-[13px] top-7 bottom-0 w-px bg-slate-200 last:hidden" aria-hidden="true" />
      <span className={`relative flex h-7 w-7 shrink-0 items-center justify-center rounded-full ring-4 ring-white ${item.kind === 'activity' ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>
        <Icon size={13} aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1 pt-0.5">
        <p className="text-sm font-medium text-slate-900">{title}</p>
        {body && <p className="mt-0.5 whitespace-pre-line break-words text-sm text-slate-600">{body}</p>}
        <p className="mt-1 text-xs text-slate-500">
          {item.actor || 'System'} · {formatDateTime(item.at)}{leadName ? ` · ${leadName}` : ''}
        </p>
      </div>
    </li>
  )
}

function FollowUpStatus({ item }) {
  if (item.completed) return <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700"><CircleCheck size={12} aria-hidden="true" /> Done</span>
  if (item.overdue) return <span className="inline-flex items-center gap-1 text-[11px] font-medium text-red-700"><AlarmClock size={12} aria-hidden="true" /> Overdue</span>
  return <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600"><Clock3 size={12} aria-hidden="true" /> Upcoming</span>
}

// Logs a note, call or meeting with the existing POST /leads/{id}/activities endpoint.
function LogInteraction({ customer, onLogged, onCancel }) {
  const [type, setType] = useState('NOTE')
  const [text, setText] = useState('')
  const [leadId, setLeadId] = useState(customer.sourceLeadId)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const submit = async (event) => {
    event.preventDefault()
    if (!text.trim()) { setError('Write a short description.'); return }
    setSaving(true)
    setError('')
    try {
      await api.post(`/leads/${leadId}/activities`, { type, description: text.trim() })
      setText('')
      onLogged()
    } catch (err) {
      console.error('Logging interaction failed:', err.response?.data || err)
      setError(err.response?.data?.fieldErrors?.description || apiErrorMessage(err, 'The interaction could not be saved.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} noValidate className="mb-5 rounded-xl border border-slate-200 bg-slate-50/60 p-3">
      <div className="flex flex-wrap gap-2">
        <div role="radiogroup" aria-label="Interaction type" className="inline-flex rounded-lg bg-white p-0.5 ring-1 ring-slate-200">
          {['NOTE', 'CALL', 'MEETING'].map((value) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={type === value}
              onClick={() => setType(value)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${type === value ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'}`}
            >
              {pretty(value)}
            </button>
          ))}
        </div>
        {customer.deals.length > 1 && (
          <select
            value={leadId}
            onChange={(e) => setLeadId(Number(e.target.value))}
            aria-label="Deal to log against"
            className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-700"
          >
            {customer.deals.map((deal) => <option key={deal.id} value={deal.id}>Lead #{deal.id} · {deal.name}</option>)}
          </select>
        )}
      </div>
      <label htmlFor="interaction-text" className="sr-only">Description</label>
      <textarea
        id="interaction-text"
        value={text}
        onChange={(e) => { setText(e.target.value); setError('') }}
        maxLength={2000}
        rows={3}
        autoFocus
        placeholder={type === 'CALL' ? 'What was discussed on the call?' : type === 'MEETING' ? 'Meeting summary and next steps' : 'Add a note about this customer'}
        className="mt-2 w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
      />
      <div className="mt-2 flex items-center justify-between gap-3">
        <p className={`text-xs ${error ? 'font-medium text-red-600' : 'text-slate-400'}`} role={error ? 'alert' : undefined}>
          {error || `${text.length}/2000`}
        </p>
        <div className="flex gap-2">
          <Button type="button" variant="ghost" className="h-8 px-2.5 text-xs" onClick={onCancel} disabled={saving}>Cancel</Button>
          <Button type="submit" variant="primary" className="h-8 px-3 text-xs" disabled={saving}>
            {saving && <Loader2 size={13} className="animate-spin motion-reduce:animate-none" aria-hidden="true" />}
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </div>
    </form>
  )
}

export default function CustomerDrawer({ customer, onClose, onReassign, onLogged }) {
  const [history, setHistory] = useState(null)
  const [error, setError] = useState('')
  const [logging, setLogging] = useState(false)
  const multiDeal = customer.deals.length > 1
  const leadNames = new Map(customer.deals.map((deal) => [deal.id, deal.name]))

  const load = useCallback(async () => {
    setError('')
    try {
      setHistory(await loadCustomerHistory(customer))
    } catch (err) {
      console.error('Customer history failed:', err.response?.data || err)
      setError(apiErrorMessage(err, 'History could not be loaded.'))
    }
  }, [customer])

  useEffect(() => { load() }, [load])

  return (
    <Drawer
      label={`${customer.name} customer profile`}
      onClose={onClose}
      header={
        <div className="flex items-center gap-4">
          <Avatar name={customer.name} id={customer.id} size="lg" />
          <div className="min-w-0">
            <p className="truncate text-base font-semibold text-slate-900">{customer.name}</p>
            <p className="truncate text-sm text-slate-500">{customer.company || 'No company'}</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200">
                <BadgeCheck size={12} aria-hidden="true" /> Customer since {formatDate(customer.convertedAt)}
              </span>
              {multiDeal && <span className="rounded-md bg-violet-50 px-2 py-0.5 text-[11px] font-medium text-violet-700 ring-1 ring-inset ring-violet-200">Repeat · {customer.deals.length} deals</span>}
            </div>
          </div>
        </div>
      }
      footer={
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <Link to={`/leads/${customer.sourceLeadId}`} className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900">
            Open originating lead <ArrowUpRight size={14} aria-hidden="true" />
          </Link>
          <Button variant="primary" onClick={() => onReassign(customer)}>
            <UserRoundCog size={15} aria-hidden="true" /> Reassign owner
          </Button>
        </div>
      }
    >
      <Section title="Contact">
        <div className="space-y-2">
          {[
            { icon: Mail, value: customer.email, href: customer.email && `mailto:${customer.email}` },
            { icon: Phone, value: customer.phone, href: customer.phone && `tel:${customer.phone.replace(/[^\d+]/g, '')}` },
            { icon: Building2, value: customer.company },
          ].map(({ icon: Icon, value, href }, i) => (
            <div key={i} className="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2.5">
              <Icon size={15} className="shrink-0 text-slate-400" aria-hidden="true" />
              {value
                ? href ? <a href={href} className="min-w-0 break-all text-sm text-slate-900 hover:text-blue-700">{value}</a> : <span className="text-sm text-slate-900">{value}</span>
                : <span className="text-sm text-slate-400">Not provided</span>}
            </div>
          ))}
        </div>
      </Section>

      <Section title="Account">
        <dl className="divide-y divide-slate-100">
          <Row label="Customer ID"><span className="font-mono text-[13px]">#{customer.id}</span></Row>
          <Row label="Account owner">{customer.ownerName || 'Unassigned'}</Row>
          <Row label="Lead source">{sourceLabel(customer.source)}</Row>
          <Row label="Lead created">{formatDate(customer.leadCreatedAt)}</Row>
          <Row label="Converted">{formatDateTime(customer.convertedAt)}</Row>
          <Row label="Won deal value">{formatMoney(customer.wonValue)}</Row>
        </dl>
      </Section>

      <Section title="Won deals" count={customer.deals.length}>
        <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
          {customer.deals.map((deal) => (
            <li key={deal.id}>
              <Link to={`/leads/${deal.id}`} className="group flex items-center gap-3 px-3 py-2.5 transition hover:bg-slate-50">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-900">
                    Lead #{deal.id} · {deal.name}
                    {deal.id === customer.sourceLeadId && <span className="ml-1.5 text-xs font-normal text-slate-500">(originating)</span>}
                  </p>
                  <p className="truncate text-xs text-slate-500">{deal.ownerName || 'Unassigned'} · {sourceLabel(deal.source)}</p>
                </div>
                <span className="text-sm font-medium tabular-nums text-slate-900">{formatMoney(deal.dealValue)}</span>
                <ArrowUpRight size={15} className="shrink-0 text-slate-300 transition group-hover:text-slate-600" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      </Section>

      {error ? (
        <div role="alert" className="mt-8 flex items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 p-3">
          <p className="text-sm text-red-700">{error}</p>
          <Button onClick={load} className="h-8 px-2.5 text-xs">Retry</Button>
        </div>
      ) : (
        <>
          <Section title="Follow-ups" count={history ? history.followUps.length : null}>
            {!history ? (
              <Skeleton className="h-14 w-full" />
            ) : history.followUps.length === 0 ? (
              <p className="rounded-lg border border-dashed border-slate-200 px-3 py-4 text-center text-sm text-slate-500">No follow-ups recorded.</p>
            ) : (
              <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
                {history.followUps.map((item) => (
                  <li key={item.id} className="flex items-center gap-3 px-3 py-2.5">
                    <CalendarCheck size={15} className="shrink-0 text-slate-400" aria-hidden="true" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-900">{item.title}</p>
                      <p className="truncate text-xs text-slate-500">{pretty(item.type)} · {item.assignedToName} · due {formatDateTime(item.dueAt)}</p>
                    </div>
                    <FollowUpStatus item={item} />
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section
            title="Activity & history"
            count={history ? history.timeline.length : null}
            action={history && !logging && (
              <Button onClick={() => setLogging(true)} className="h-8 px-2.5 text-xs"><StickyNote size={13} aria-hidden="true" /> Log interaction</Button>
            )}
          >
            {logging && (
              <LogInteraction
                customer={customer}
                onCancel={() => setLogging(false)}
                onLogged={() => { setLogging(false); load(); onLogged?.() }}
              />
            )}
            {!history ? (
              <div className="space-y-3"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div>
            ) : history.timeline.length === 0 ? (
              <p className="rounded-lg border border-dashed border-slate-200 px-3 py-4 text-center text-sm text-slate-500">No activity yet.</p>
            ) : (
              <ol>
                {history.timeline.map((item) => (
                  <TimelineItem key={item.key} item={item} leadName={multiDeal ? leadNames.get(item.leadId) : null} />
                ))}
              </ol>
            )}
          </Section>
        </>
      )}
    </Drawer>
  )
}
