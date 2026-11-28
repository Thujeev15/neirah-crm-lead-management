import {
  BadgeCheck,
  BarChart3,
  CalendarCheck,
  GitBranch,
  LayoutDashboard,
  LogOut,
  UserCog,
  Users,
  X,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import NeirahLogo from '../brand/NeirahLogo'

const workspaceItems = [
  { label: 'Overview', path: '/', icon: LayoutDashboard },
  { label: 'Leads', path: '/leads', icon: Users },
  { label: 'Sales pipeline', path: '/pipeline', icon: GitBranch },
  { label: 'Follow-ups', path: '/follow-ups', icon: CalendarCheck },
  { label: 'Reports & analytics', path: '/reports', icon: BarChart3 },
]

// Shown to managers only. The backend enforces the same rule on every /users endpoint.
const adminItems = [
  { label: 'Customers', path: '/customers', icon: BadgeCheck },
  { label: 'User management', path: '/users', icon: UserCog },
]

function NavSection({ title, items, onNavigate }) {
  return (
    <div>
      <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">{title}</p>
      <nav className="space-y-0.5" aria-label={title}>
        {items.map(({ label, path, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            end={path === '/'}
            onClick={onNavigate}
            className={({ isActive }) =>
              `group relative flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors ${
                isActive ? 'bg-white/[0.08] text-white' : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-100'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && <span className="absolute inset-y-1.5 left-0 w-0.5 rounded-full bg-blue-400" aria-hidden="true" />}
                <Icon size={17} strokeWidth={1.9} className={isActive ? 'text-blue-300' : 'text-slate-500 group-hover:text-slate-300'} aria-hidden="true" />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}

export default function Sidebar({ mobile = false, onNavigate, onClose }) {
  const { user, logout } = useAuth()
  const isManager = user?.role === 'MANAGER'
  const initials = user?.fullName?.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase()

  return (
    <aside className={`flex h-full flex-col bg-[#0B1530] text-white ${mobile ? 'w-[280px] shadow-2xl' : 'sticky top-0 h-screen w-[252px] shrink-0'}`}>
      <div className="flex h-16 items-center justify-between px-5">
        <NeirahLogo tone="dark" size={30} />
        {mobile && (
          <button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white" aria-label="Close menu">
            <X size={18} />
          </button>
        )}
      </div>

      <div className="flex-1 space-y-7 overflow-y-auto px-3 pt-5">
        <NavSection title="Workspace" items={workspaceItems} onNavigate={onNavigate} />
        {isManager && <NavSection title="Administration" items={adminItems} onNavigate={onNavigate} />}
      </div>

      <div className="border-t border-white/[0.06] p-3">
        <div className="flex items-center gap-3 rounded-lg px-2 py-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-[11px] font-semibold text-white">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-medium text-white">{user?.fullName}</p>
            <p className="truncate text-[11px] text-slate-500">{isManager ? 'Manager' : 'Sales Rep'} · {user?.email}</p>
          </div>
          <button
            onClick={logout}
            className="rounded-md p-2 text-slate-500 transition hover:bg-white/5 hover:text-red-300"
            aria-label="Sign out"
            title="Sign out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  )
}
