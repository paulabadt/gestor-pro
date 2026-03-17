import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import MovementForm from '@/components/inventory/MovementForm'
import MovementDetailButton from '@/components/inventory/MovementDetailButton'
import type { MovementDetail } from '@/components/inventory/MovementDetailButton'

function formatDate(dateStr: string) {
  return new Intl.DateTimeFormat('es-CL', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateStr))
}

type MovementType = 'entry' | 'exit' | 'adjustment'

const typeLabel: Record<MovementType, string> = {
  entry: 'Entrada',
  exit: 'Salida',
  adjustment: 'Ajuste',
}

const typeBadge: Record<MovementType, string> = {
  entry: 'bg-green-100 text-green-700',
  exit: 'bg-red-100 text-red-700',
  adjustment: 'bg-yellow-100 text-yellow-700',
}

export default async function MovementsPage() {
  const supabase = await createClient()

  const [{ data: movements }, { data: products }] = await Promise.all([
    supabase
      .from('stock_movements')
      .select('*, products(name, code, unit)')
      .order('created_at', { ascending: false }),
    supabase
      .from('products')
      .select('id, name, code, current_stock, unit')
      .eq('status', 'active')
      .order('name'),
  ])

  const rows = movements ?? []
  const productOptions = (products ?? []) as {
    id: string
    name: string
    code: string
    current_stock: number
    unit: string
  }[]

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Movimientos de Stock</h2>
          <p className="text-sm text-gray-500">
            {rows.length} {rows.length === 1 ? 'movimiento registrado' : 'movimientos registrados'}
          </p>
        </div>
        <MovementForm products={productOptions} />
      </div>

      {/* Table card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-sm">
            <thead>
              <tr className="bg-gray-50 text-left border-b border-gray-100">
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Fecha</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Producto</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Tipo</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Cantidad</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Motivo</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Referencia</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Responsable</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-gray-400">
                    No hay movimientos registrados. Registra el primero.
                  </td>
                </tr>
              ) : (
                rows.map((movement) => {
                  const type = movement.type as MovementType
                  const product = movement.products as { name: string; code: string; unit: string } | null
                  return (
                    <tr key={movement.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap text-xs">
                        {formatDate(movement.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-800">{product?.name ?? '—'}</div>
                        <div className="text-xs font-mono text-gray-400">{product?.code}</div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={`${typeBadge[type]} border-0`}>
                          {typeLabel[type]}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-800">
                        {movement.quantity}
                        <span className="text-xs text-gray-400 ml-1">{product?.unit}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 hidden md:table-cell max-w-48 truncate">
                        {movement.reason ?? <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-3 text-gray-500 hidden lg:table-cell">
                        {movement.reference ?? <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">
                        {movement.user_name ?? <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end">
                          <MovementDetailButton movement={movement as MovementDetail} />
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
