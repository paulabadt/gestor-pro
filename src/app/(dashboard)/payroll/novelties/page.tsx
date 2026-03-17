import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import NoveltyDialog, { DeleteNoveltyButton } from '@/components/payroll/NoveltyDialog'
import { formatCurrency } from '@/lib/utils'
import type { Worker } from '@/lib/types/database'

type NoveltyType = 'bonus' | 'advance' | 'discount' | 'fine'

const TYPE_LABELS: Record<NoveltyType, string> = {
  bonus: 'Bono',
  advance: 'Adelanto',
  discount: 'Descuento',
  fine: 'Multa',
}

const TYPE_BADGE: Record<NoveltyType, string> = {
  bonus: 'bg-green-100 text-green-700',
  advance: 'bg-blue-100 text-blue-700',
  discount: 'bg-orange-100 text-orange-700',
  fine: 'bg-red-100 text-red-700',
}

type NoveltyWithWorker = {
  id: string
  worker_id: string
  type: NoveltyType
  amount: number
  description: string | null
  date: string
  created_at: string
  workers: { name: string } | null
}

function formatDate(dateStr: string) {
  return new Intl.DateTimeFormat('es-CL', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(dateStr + 'T00:00:00'))
}

export default async function NoveltiesPage() {
  const supabase = await createClient()

  const [{ data: novelties }, { data: workers }] = await Promise.all([
    supabase
      .from('novelties')
      .select('*, workers(name)')
      .order('date', { ascending: false }),
    supabase
      .from('workers')
      .select('id, name')
      .eq('status', 'active')
      .order('name'),
  ])

  const rows = (novelties ?? []) as NoveltyWithWorker[]
  const workerList = (workers ?? []) as Pick<Worker, 'id' | 'name'>[]

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Novedades</h2>
          <p className="text-sm text-gray-500">
            {rows.length} {rows.length === 1 ? 'novedad registrada' : 'novedades registradas'}
          </p>
        </div>
        <NoveltyDialog workers={workerList} />
      </div>

      {/* Table card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-sm">
            <thead>
              <tr className="bg-gray-50 text-left border-b border-gray-100">
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Trabajador</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Tipo</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Monto</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Descripción</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Fecha</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-gray-400">
                    No hay novedades registradas. Crea la primera.
                  </td>
                </tr>
              ) : (
                rows.map((novelty) => (
                  <tr key={novelty.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-800">
                      {novelty.workers?.name ?? <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={`${TYPE_BADGE[novelty.type]} border-0`}>
                        {TYPE_LABELS[novelty.type]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-800">
                      {formatCurrency(novelty.amount)}
                    </td>
                    <td className="px-4 py-3 text-gray-500 hidden md:table-cell max-w-48 truncate">
                      {novelty.description ?? <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">
                      {formatDate(novelty.date)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end">
                        <DeleteNoveltyButton noveltyId={novelty.id} />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
