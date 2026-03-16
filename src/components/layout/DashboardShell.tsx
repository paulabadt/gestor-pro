'use client'

import { useState } from 'react'
import Sidebar from './Sidebar'
import Topbar from './Topbar'

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar — hidden on mobile unless open, always visible on lg+ */}
      <div
        className={[
          'fixed inset-y-0 left-0 z-50 lg:static lg:z-auto',
          sidebarOpen ? 'flex' : 'hidden lg:flex',
        ].join(' ')}
      >
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main column */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        <main
          className="flex-1 overflow-y-auto p-4 sm:p-6"
          style={{ backgroundColor: '#f4f6f9' }}
        >
          {children}
        </main>
      </div>
    </div>
  )
}
