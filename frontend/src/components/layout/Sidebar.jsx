
import {
  LayoutDashboard,
  Users,
  GitBranch,
  CalendarCheck,
  BarChart3,
  LogOut,
  Layers3,
  ChevronLeft,
  X,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const menuItems = [
  { label: 'Overview', path: '/', icon: LayoutDashboard },
  { label: 'Leads', path: '/leads', icon: Users },
  { label: 'Pipeline', path: '/pipeline', icon: GitBranch },
  { label: 'Follow-ups', path: '/follow-ups', icon: CalendarCheck },
  { label: 'Reports', path: '/reports', icon: BarChart3 },
]

export default function Sidebar({ mobile = false, onNavigate, onClose }) {
  const { user, logout } = useAuth()

  return (
    <aside className={`flex h-full flex-col border-r border-slate-200 bg-white ${
      mobile ? 'w-[280px] shadow-xl' : 'h-screen w-[260px] shrink-0'
    }`}>
      <div className="flex h-[76px] items-center justify-between border-b border-slate-100 px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
            <Layers3 size={21} />
          </div>
          <div>
            <p className="text-[17px] font-bold tracking-tight text-slate-900">neirah</p>
            <p className="text-[10px] font-semibold uppercase tracking-[2px] text-slate-400">Sales workspace</p>
          </div>
        </div>

        {mobile ? (
          <button onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label="Close menu">
            <X size={20} />
          </button>
        ) : (
          <ChevronLeft size={17} className="text-slate-400" />
        )}
      </div>

      <div className="px-4 pt-7">
        <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[1.6px] text-slate-400">
          Workspace
        </p>

        <nav className="space-y-1">
          {menuItems.map(({ label, path, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              end={path === '/'}
              onClick={onNavigate}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-3 text-[13px] font-semibold transition ${
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`
              }
            >
              <Icon size={18} strokeWidth={2} />
              {label}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="mt-auto p-4">
        <div className="mb-3 flex items-center gap-3 rounded-xl bg-slate-50 p-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
            {user?.fullName?.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-bold text-slate-800">{user?.fullName}</p>
            <p className="truncate text-[10px] text-slate-400">{user?.role?.replace('_', ' ')}</p>
          </div>
        </div>

        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-xs font-semibold text-slate-500 transition hover:bg-red-50 hover:text-red-600"
        >
          <LogOut size={17} />
          Sign out
        </button>
      </div>
    </aside>
  )
}
