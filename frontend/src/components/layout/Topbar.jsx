
import { Bell, Search, Menu, CalendarDays } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export default function Topbar({ onMenuClick }) {
  const { user } = useAuth()

  const today = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(new Date())

  return (
    <header className="flex h-[76px] items-center justify-between border-b border-slate-200 bg-white px-5 sm:px-8">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
          aria-label="Open navigation menu"
        >
          <Menu size={20} />
        </button>

        <div>
          <p className="text-sm font-bold text-slate-900">Workspace</p>
          <p className="mt-0.5 text-[11px] text-slate-400">
            Manage your sales activities
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-5">
        <div className="hidden items-center gap-2 text-xs font-medium text-slate-500 sm:flex">
          <CalendarDays size={15} />
          {today}
        </div>

        <button className="relative rounded-xl border border-slate-200 p-2.5 text-slate-500 transition hover:bg-slate-50">
          <Bell size={18} />
          <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-blue-600 ring-2 ring-white" />
        </button>

        <div className="hidden h-8 w-px bg-slate-200 sm:block" />

        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
            {user?.fullName?.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase()}
          </div>
          <div className="hidden sm:block">
            <p className="text-xs font-bold text-slate-800">{user?.fullName}</p>
            <p className="text-[10px] text-slate-400">{user?.role?.replace('_', ' ')}</p>
          </div>
        </div>
      </div>
    </header>
  )
}
