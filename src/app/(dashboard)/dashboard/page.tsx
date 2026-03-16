import { createClient } from '@/lib/supabase/server'
import {
  Package,
  AlertTriangle,
  HardHat,
  FolderOpen,
  ArrowDownCircle,
  ArrowUpCircle,
  SlidersHorizontal,
} from 'lucide-react'
import type { Product, StockMovement } from '@/lib/types/database'
import { formatCurrency } from '@/lib/utils'

function formatDate(dateStr: string) {
  return new Intl.DateTimeFormat('es-CL', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(dateStr))
}

const movementTypeLabel: Record<StockMovement['type'], string> = {
  entry: 'Entrada',
  exit: 'Salida',
  adjustment: 'Ajuste',
}

function MovementIcon({ type }: { type: StockMovement['type'] }) {
  if (type === 'entry') return <ArrowDownCircle className="w-4 h-4 text-green-500" />
  if (type === 'exit') return <ArrowUpCircle className="w-4 h-4 text-red-500" />
  return <SlidersHorizontal className="w-4 h-4 text-blue-500" />
}

const movementTypeBadge: Record<StockMovement['type'], string> = {
  entry: 'bg-green-100 text-green-700',
  exit: 'bg-red-100 text-red-700',
  adjustment: 'bg-blue-100 text-blue-700',
}

interface MetricCardProps {
  title: string
  value: number | string
  icon: React.ReactNode
  accent: 'green' | 'red' | 'blue' | 'indigo'
}

function MetricCard({ title, value, icon, accent }: MetricCardProps) {
  const colors = {
    green: { icon: 'bg-green-500', text: 'text-green-600' },
    red: { icon: 'bg-red-500', text: 'text-red-600' },
    blue: { icon: 'bg-blue-500', text: 'text-blue-600' },
    indigo: { icon: 'bg-indigo-500', text: 'text-indigo-600' },
  }[accent]

  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
      <div className={`flex items-center justify-center w-12 h-12 rounded-xl ${colors.icon} shrink-0`}>
        <div className="text-white">{icon}</div>
      </div>
      <div>
        <p className="text-sm text-gray-500 font-medium">{title}</p>
        <p className={`text-2xl font-bold ${colors.text}`}>{value}</p>
      </div>
    </div>
  )
}

export default async function DashboardPage() {
  const supabase = await createClient()

  const [
    { count: totalProducts },
    { data: allActiveProducts },
    { count: activeWorkers },
    { count: activeProjects },
    { data: recentMovements },
  ] = await Promise.all([
    supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active'),

    supabase
      .from('products')
      .select('id, code, name, current_stock, min_stock, unit, unit_price')
      .eq('status', 'active'),

    supabase
      .from('workers')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active'),

    supabase
      .from('projects')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active'),

    supabase
      .from('stock_movements')
      .select('id, type, quantity, reason, reference, user_name, created_at, product_id')
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  type ProductRow = { id: string; code: string; name: string; current_stock: number; min_stock: number; unit: string; unit_price: number }
  const lowStockProducts = (allActiveProducts ?? []).filter(
    (p) => p.current_stock <= p.min_stock
  ) as ProductRow[]

  // Fetch product names for recent movements
  const productIds = [...new Set((recentMovements ?? []).map((m) => m.product_id))]
  const { data: movementProducts } = productIds.length
    ? await supabase.from('products').select('id, name').in('id', productIds)
    : { data: [] }

  const productMap = Object.fromEntries((movementProducts ?? []).map((p) => [p.id, p.name]))

  return (
    <div className="space-y-6">
      {/* Metric cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard
          title="Total Productos"
          value={totalProducts ?? 0}
          icon={<Package className="w-6 h-6" />}
          accent="green"
        />
        <MetricCard
          title="Alertas Stock Bajo"
          value={lowStockProducts.length}
          icon={<AlertTriangle className="w-6 h-6" />}
          accent="red"
        />
        <MetricCard
          title="Trabajadores Activos"
          value={activeWorkers ?? 0}
          icon={<HardHat className="w-6 h-6" />}
          accent="blue"
        />
        <MetricCard
          title="Proyectos Activos"
          value={activeProjects ?? 0}
          icon={<FolderOpen className="w-6 h-6" />}
          accent="indigo"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Recent movements table */}
        <div className="xl:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-800">Últimos Movimientos de Stock</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-sm">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Tipo</th>
                  <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Producto</th>
                  <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Cantidad</th>
                  <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Usuario</th>
                  <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {(recentMovements ?? []).length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-gray-400">
                      No hay movimientos registrados
                    </td>
                  </tr>
                ) : (
                  (recentMovements ?? []).map((movement) => (
                    <tr key={movement.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${movementTypeBadge[movement.type as StockMovement['type']]}`}
                        >
                          <MovementIcon type={movement.type as StockMovement['type']} />
                          {movementTypeLabel[movement.type as StockMovement['type']]}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-gray-700 font-medium">
                        {productMap[movement.product_id] ?? '—'}
                      </td>
                      <td className="px-5 py-3 text-gray-700">{movement.quantity}</td>
                      <td className="px-5 py-3 text-gray-500">{movement.user_name ?? '—'}</td>
                      <td className="px-5 py-3 text-gray-500">{formatDate(movement.created_at)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low stock list */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-800">Stock Bajo Mínimo</h2>
            {lowStockProducts.length > 0 && (
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-red-100 text-red-600 text-xs font-bold">
                {lowStockProducts.length}
              </span>
            )}
          </div>
          <div className="divide-y divide-gray-50 max-h-80 overflow-y-auto">
            {lowStockProducts.length === 0 ? (
              <p className="px-5 py-8 text-center text-gray-400 text-sm">
                Todos los productos tienen stock suficiente
              </p>
            ) : (
              lowStockProducts.map((product) => (
                <div key={product.id} className="px-5 py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{product.name}</p>
                    <p className="text-xs text-gray-400">
                      {product.current_stock} / {product.min_stock} {product.unit}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="inline-block px-2 py-0.5 rounded-full bg-red-100 text-red-600 text-xs font-semibold">
                      Bajo
                    </span>
                    <p className="text-xs text-gray-400 mt-0.5">{formatCurrency(product.unit_price)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
