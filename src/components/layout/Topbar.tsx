'use client'

import { usePathname } from 'next/navigation'
import { Bell, Menu } from 'lucide-react'

const routeTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/inventory': 'Productos',
  '/inventory/movements': 'Movimientos de Stock',
  '/payroll/liquidation': 'Liquidación de Nómina',
  '/payroll/workers': 'Trabajadores',
  '/payroll/attendance': 'Asistencia',
}

function getTitle(pathname: string): string {
  const exact = routeTitles[pathname]
  if (exact) return exact
  const match = Object.entries(routeTitles).find(([key]) => pathname.startsWith(key + '/'))
  return match ? match[1] : 'GestorPro'
}

interface TopbarProps {
  onMenuClick?: () => void
}

export default function Topbar({ onMenuClick }: TopbarProps) {
  const pathname = usePathname()
  const title = getTitle(pathname)

  return (
    <header className="flex items-center justify-between px-4 sm:px-6 h-16 bg-white border-b border-gray-200 shrink-0">
      <div className="flex items-center gap-3">
        {/* Hamburger — mobile only */}
        <button
          className="flex items-center justify-center w-9 h-9 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors lg:hidden"
          onClick={onMenuClick}
          aria-label="Abrir menú"
        >
          <Menu className="w-5 h-5" />
        </button>

        <h1 className="text-base sm:text-lg font-semibold text-gray-800">{title}</h1>
      </div>

      <div className="flex items-center gap-3">
        {/* Notification bell */}
        <button
          className="relative flex items-center justify-center w-9 h-9 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
          aria-label="Notificaciones"
        >
          <Bell className="w-5 h-5" />
          <span
            className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
            style={{ backgroundColor: '#22c55e' }}
          />
        </button>

        {/* User avatar */}
        <div
          className="flex items-center justify-center w-9 h-9 rounded-full text-sm font-bold text-white cursor-pointer"
          style={{ backgroundColor: '#1a1f2e' }}
          title="Administrador"
        >
          AD
        </div>
      </div>
    </header>
  )
}
