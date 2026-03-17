import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import ProductDialog, { EditProductButton, DeleteProductButton } from '@/components/inventory/ProductDialog'
import type { Product, Category } from '@/lib/types/database'
import { formatCurrency } from '@/lib/utils'

type ProductWithCategory = Product & { categories: { name: string } | null }

export default async function InventoryPage() {
  const supabase = await createClient()

  const [{ data: products }, { data: categories }] = await Promise.all([
    supabase
      .from('products')
      .select('*, categories(name)')
      .order('created_at', { ascending: false }),
    supabase.from('categories').select('*').order('name'),
  ])

  const rows = (products ?? []) as ProductWithCategory[]
  const cats = (categories ?? []) as Category[]

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Productos</h2>
          <p className="text-sm text-gray-500">
            {rows.length} {rows.length === 1 ? 'producto registrado' : 'productos registrados'}
          </p>
        </div>
        <ProductDialog categories={cats} />
      </div>

      {/* Table card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-sm">
            <thead>
              <tr className="bg-gray-50 text-left border-b border-gray-100">
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Código</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Nombre</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Categoría</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Unidad</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Stock actual</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Stock mín.</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Precio unit.</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Estado</th>
                <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-gray-400">
                    No hay productos registrados. Crea el primero.
                  </td>
                </tr>
              ) : (
                rows.map((product) => {
                  const isLowStock = product.current_stock <= product.min_stock
                  return (
                    <tr key={product.id} className="hover:bg-gray-50/60 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">{product.code}</td>
                      <td className="px-4 py-3 font-medium text-gray-800">{product.name}</td>
                      <td className="px-4 py-3 text-gray-500 hidden md:table-cell">
                        {product.categories?.name ?? <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">{product.unit}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-800">{product.current_stock}</span>
                          {isLowStock && (
                            <Badge className="bg-red-100 text-red-600 border-0 text-[10px] h-4">
                              Stock bajo
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-500 hidden lg:table-cell">{product.min_stock}</td>
                      <td className="px-4 py-3 text-gray-700 hidden lg:table-cell">{formatCurrency(product.unit_price)}</td>
                      <td className="px-4 py-3">
                        {product.status === 'active' ? (
                          <Badge className="bg-green-100 text-green-700 border-0">Activo</Badge>
                        ) : (
                          <Badge className="bg-gray-100 text-gray-500 border-0">Inactivo</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <EditProductButton product={product} categories={cats} />
                          <DeleteProductButton product={product} />
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
