import { createClient } from '@/lib/supabase/server'
import { Phone, FolderOpen } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import WorkerDialog, { EditWorkerButton, DeleteWorkerButton } from '@/components/payroll/WorkerDialog'
import type { Worker, Project } from '@/lib/types/database'
import { formatCurrency } from '@/lib/utils'

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('')
}

const AVATAR_COLORS = [
  '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444',
  '#14b8a6', '#ec4899', '#6366f1', '#22c55e',
]

function avatarColor(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

type WorkerWithProject = Worker & { projects: { name: string } | null }

export default async function WorkersPage() {
  const supabase = await createClient()

  const [{ data: workers }, { data: projects }] = await Promise.all([
    supabase
      .from('workers')
      .select('*, projects(name)')
      .order('name'),
    supabase
      .from('projects')
      .select('*')
      .eq('status', 'active')
      .order('name'),
  ])

  const rows = (workers ?? []) as WorkerWithProject[]
  const proj = (projects ?? []) as Project[]

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Trabajadores</h2>
          <p className="text-sm text-gray-500">
            {rows.length} {rows.length === 1 ? 'trabajador registrado' : 'trabajadores registrados'}
          </p>
        </div>
        <WorkerDialog projects={proj} />
      </div>

      {/* Cards grid */}
      {rows.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-16 text-center text-gray-400">
          No hay trabajadores registrados. Agrega el primero.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {rows.map((worker) => {
            const color = avatarColor(worker.name)
            const projectName = worker.projects?.name
            return (
              <div
                key={worker.id}
                className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex flex-col gap-4 hover:shadow-md transition-shadow"
              >
                {/* Top row: avatar + name + actions */}
                <div className="flex items-start gap-3">
                  <div
                    className="flex items-center justify-center w-12 h-12 rounded-full text-white font-bold text-sm shrink-0"
                    style={{ backgroundColor: color }}
                  >
                    {getInitials(worker.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{worker.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">C.C. {worker.id_number}</p>
                  </div>
                  <div className="flex items-center gap-0.5 shrink-0">
                    <EditWorkerButton worker={worker} projects={proj} />
                    <DeleteWorkerButton worker={worker} />
                  </div>
                </div>

                {/* Badges */}
                <div className="flex flex-wrap gap-2">
                  <Badge className="bg-slate-100 text-slate-600 border-0 text-xs">
                    {worker.position}
                  </Badge>
                  {worker.payment_type === 'daily' ? (
                    <Badge className="bg-blue-100 text-blue-700 border-0 text-xs">Jornal</Badge>
                  ) : (
                    <Badge className="bg-purple-100 text-purple-700 border-0 text-xs">Destajo</Badge>
                  )}
                  {worker.status === 'active' ? (
                    <Badge className="bg-green-100 text-green-700 border-0 text-xs">Activo</Badge>
                  ) : (
                    <Badge className="bg-gray-100 text-gray-500 border-0 text-xs">Inactivo</Badge>
                  )}
                </div>

                {/* Details */}
                <div className="space-y-1.5 text-sm">
                  {projectName && (
                    <div className="flex items-center gap-2 text-gray-500">
                      <FolderOpen className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{projectName}</span>
                    </div>
                  )}
                  {worker.phone && (
                    <div className="flex items-center gap-2 text-gray-500">
                      <Phone className="w-3.5 h-3.5 shrink-0" />
                      <span>{worker.phone}</span>
                    </div>
                  )}
                </div>

                {/* Rate */}
                <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-xs text-gray-400">
                    {worker.payment_type === 'daily' ? 'Jornal diario' : 'Tarifa'}
                  </span>
                  <span className="font-semibold text-gray-800 text-sm">
                    {formatCurrency(worker.daily_rate)}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
