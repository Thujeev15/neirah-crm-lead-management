import { Link } from 'react-router-dom'
import { AlarmClock, ArrowUpRight, Info, KeyRound } from 'lucide-react'
import { Drawer } from '../ui/Overlay'
import { Avatar, Button, RoleBadge, StageBadge } from './UserBits'
import { formatDateTime, formatMoney } from './teamData'

function Detail({ label, children }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <dt className="text-sm text-slate-500">{label}</dt>
      <dd className="min-w-0 text-right text-sm font-medium text-slate-900">{children}</dd>
    </div>
  )
}

function Stat({ label, value, tone = 'text-slate-900' }) {
  return (
    <div className="rounded-lg border border-slate-200 px-3 py-2.5">
      <p className="text-[11px] font-medium text-slate-500">{label}</p>
      <p className={`mt-0.5 text-lg font-semibold tabular-nums ${tone}`}>{value}</p>
    </div>
  )
}

function SectionTitle({ children, count }) {
  return (
    <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
      {children}
      {count != null && <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">{count}</span>}
    </h3>
  )
}

export default function UserDrawer({ user, onClose, onResetPassword }) {
  const openLeads = [...user.openLeads].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  const overdue = [...user.overdueItems].sort((a, b) => new Date(a.dueAt) - new Date(b.dueAt))

  return (
    <Drawer
      label={`${user.fullName} details`}
      onClose={onClose}
      header={
        <div className="flex items-center gap-4">
          <Avatar name={user.fullName} id={user.id} size="lg" />
          <div className="min-w-0">
            <p className="truncate text-base font-semibold text-slate-900">{user.fullName}</p>
            <p className="truncate text-sm text-slate-500">{user.email}</p>
            <div className="mt-1.5"><RoleBadge role="SALES_REP" /></div>
          </div>
        </div>
      }
      footer={
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-500">Signs them out of every device.</p>
          <Button variant="primary" onClick={() => onResetPassword(user)}>
            <KeyRound size={15} aria-hidden="true" /> Reset password
          </Button>
        </div>
      }
    >
      <section>
        <SectionTitle>Account</SectionTitle>
        <dl className="divide-y divide-slate-100">
          <Detail label="User ID"><span className="font-mono text-[13px]">#{user.id}</span></Detail>
          <Detail label="Full name">{user.fullName}</Detail>
          <Detail label="Email"><span className="break-all">{user.email}</span></Detail>
          <Detail label="Role">Sales Rep</Detail>
        </dl>
        <div className="mt-3 flex gap-2.5 rounded-lg bg-slate-50 p-3">
          <Info size={15} className="mt-0.5 shrink-0 text-slate-400" aria-hidden="true" />
          <p className="text-xs leading-5 text-slate-500">
            Account status, sign-up date and last sign-in aren’t available from the API, so they aren’t shown.
          </p>
        </div>
      </section>

      <section className="mt-8">
        <SectionTitle>Workload</SectionTitle>
        <div className="grid grid-cols-2 gap-2.5">
          <Stat label="Open leads" value={user.open} />
          <Stat label="Overdue follow-ups" value={user.overdue} tone={user.overdue ? 'text-red-600' : 'text-slate-900'} />
          <Stat label="Deals won" value={user.won} />
          <Stat label="Win rate" value={user.winRate == null ? '—' : `${user.winRate}%`} />
        </div>
        <p className="mt-2 text-xs text-slate-500">
          {formatMoney(user.wonValue)} in won deal value · {user.lost} lost · {user.total} leads owned in total
        </p>
      </section>

      <section className="mt-8">
        <SectionTitle count={overdue.length}>Overdue follow-ups</SectionTitle>
        {overdue.length === 0 ? (
          <p className="rounded-lg border border-dashed border-slate-200 px-3 py-4 text-center text-sm text-slate-500">Nothing overdue.</p>
        ) : (
          <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
            {overdue.map((item) => (
              <li key={item.id}>
                <Link to={`/leads/${item.leadId}`} className="group flex items-center gap-3 px-3 py-2.5 transition hover:bg-slate-50">
                  <AlarmClock size={15} className="shrink-0 text-red-500" aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900">{item.title}</p>
                    <p className="truncate text-xs text-slate-500">{item.leadName} · due {formatDateTime(item.dueAt)}</p>
                  </div>
                  <ArrowUpRight size={15} className="shrink-0 text-slate-300 transition group-hover:text-slate-600" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-8">
        <SectionTitle count={openLeads.length}>Open leads</SectionTitle>
        {openLeads.length === 0 ? (
          <p className="rounded-lg border border-dashed border-slate-200 px-3 py-4 text-center text-sm text-slate-500">No open leads assigned.</p>
        ) : (
          <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
            {openLeads.map((lead) => (
              <li key={lead.id}>
                <Link to={`/leads/${lead.id}`} className="group flex items-center gap-3 px-3 py-2.5 transition hover:bg-slate-50">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900">{lead.name}</p>
                    <p className="truncate text-xs text-slate-500">{lead.company || 'No company'}</p>
                  </div>
                  <StageBadge status={lead.status} />
                  <ArrowUpRight size={15} className="shrink-0 text-slate-300 transition group-hover:text-slate-600" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </Drawer>
  )
}
