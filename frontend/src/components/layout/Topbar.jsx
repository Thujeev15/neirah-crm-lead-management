import { CalendarDays, Menu } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { NeirahMark } from '../brand/NeirahLogo'

const SECTIONS = [
  { match: (path) => path === '/', title: 'Overview' },
  { match: (path) => path.startsWith('/leads/'), title: 'Lead details', parent: 'Leads' },
  { match: (path) => path.startsWith('/leads'), title: 'Leads' },
  { match: (path) => path.startsWith('/pipeline'), title: 'Sales pipeline' },
  { match: (path) => path.startsWith('/follow-ups'), title: 'Follow-ups' },
  { match: (path) => path.startsWith('/reports'), title: 'Reports & analytics' },
  { match: (path) => path.startsWith('/users'), title: 'User management', parent: 'Administration' },
  { match: (path) => path.startsWith('/customers'), title: 'Customers', parent: 'Administration' },
]

export default function Topbar({ onMenuClick }) {
  const { user } = useAuth()
  const { pathname } = useLocation()
  const section = SECTIONS.find((item) => item.match(pathname)) || { title: 'Workspace' }

  const today = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(new Date())

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200/80 bg-white/90 px-5 backdrop-blur sm:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <button
          onClick={onMenuClick}
          className="-ml-2 rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
          aria-label="Open navigation menu"
        >
          <Menu size={20} />
        </button>
        <NeirahMark size={26} title="Neirah CRM" className="lg:hidden" />
        <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-2 text-sm">
          <span className="hidden text-slate-400 sm:inline">{section.parent || 'Workspace'}</span>
          <span className="hidden text-slate-300 sm:inline" aria-hidden="true">/</span>
          <span className="truncate font-medium text-slate-900">{section.title}</span>
        </nav>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden items-center gap-1.5 text-xs text-slate-500 md:flex">
          <CalendarDays size={14} aria-hidden="true" />
          {today}
        </div>
        <div className="hidden h-6 w-px bg-slate-200 md:block" />
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0B1530] text-[11px] font-semibold text-white">
            {user?.fullName?.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase()}
          </div>
          <div className="hidden leading-tight sm:block">
            <p className="text-[13px] font-medium text-slate-900">{user?.fullName}</p>
            <p className="text-[11px] text-slate-500">{user?.role === 'MANAGER' ? 'Manager' : 'Sales Rep'}</p>
          </div>
        </div>
      </div>
    </header>
  )
}
