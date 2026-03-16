'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Package,
  ArrowLeftRight,
  HardHat,
  CalendarCheck,
  Banknote,
  Leaf,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navSections = [
  {
    label: 'GENERAL',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ],
  },
  {
    label: 'INVENTARIO',
    items: [
      { href: '/inventory', label: 'Productos', icon: Package },
      { href: '/inventory/movements', label: 'Movimientos', icon: ArrowLeftRight },
    ],
  },
  {
    label: 'NÓMINA',
    items: [
      { href: '/payroll/workers', label: 'Trabajadores', icon: HardHat },
      { href: '/payroll/attendance', label: 'Asistencia', icon: CalendarCheck },
      { href: '/payroll/liquidation', label: 'Liquidación', icon: Banknote },
    ],
  },
]

interface SidebarProps {
  onClose?: () => void
}

export default function Sidebar({ onClose }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside
      className="flex flex-col w-64 h-full min-h-screen shrink-0"
      style={{ backgroundColor: '#1a1f2e' }}
    >
      {/* Brand */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-white/10">
        <div
          className="flex items-center justify-center w-9 h-9 rounded-lg shrink-0"
          style={{ backgroundColor: '#22c55e' }}
        >
          <Leaf className="w-5 h-5 text-white" />
        </div>
        <span className="text-white font-bold text-lg tracking-tight">GestorPro</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto">
        {navSections.map((section) => (
          <div key={section.label}>
            <p
              className="px-3 mb-2 text-xs font-semibold tracking-widest"
              style={{ color: '#6b7a99' }}
            >
              {section.label}
            </p>
            <ul className="space-y-0.5">
              {section.items.map(({ href, label, icon: Icon }) => {
                const isActive = pathname === href || pathname.startsWith(href + '/')
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      onClick={onClose}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                        isActive
                          ? 'text-white'
                          : 'text-slate-400 hover:text-white hover:bg-white/5'
                      )}
                      style={isActive ? { backgroundColor: '#22c55e20', color: '#22c55e' } : {}}
                    >
                      <Icon
                        className="w-4 h-4 shrink-0"
                        style={isActive ? { color: '#22c55e' } : {}}
                      />
                      {label}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* User chip */}
      <div className="px-4 py-4 border-t border-white/10">
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/5">
          <div
            className="flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold text-white shrink-0"
            style={{ backgroundColor: '#22c55e' }}
          >
            AD
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate">Administrador</p>
            <p className="text-xs truncate" style={{ color: '#6b7a99' }}>
              admin@gestorpro.co
            </p>
          </div>
        </div>
      </div>
    </aside>
  )
}
