
import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'

export default function DashboardLayout() {
  const [menuOpen, setMenuOpen] = useState(false)

  const closeMenu = () => setMenuOpen(false)

  return (
    <div className="flex min-h-screen bg-[#F6F8FC]">
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            className="absolute inset-0 bg-slate-900/40"
            onClick={closeMenu}
            aria-label="Close navigation menu"
          />
          <div className="absolute inset-y-0 left-0">
            <Sidebar
              mobile
              onClose={closeMenu}
              onNavigate={closeMenu}
            />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onMenuClick={() => setMenuOpen(true)} />
        <main className="flex-1 overflow-x-hidden p-5 sm:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
