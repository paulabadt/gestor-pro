'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Category, Product } from '@/lib/types/database'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const UNITS = ['Unidad', 'Kg', 'Bolsa', 'M²', 'M³', 'Caja', 'Litro'] as const

interface ProductDialogProps {
  categories: Category[]
  product?: Product
  trigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

const emptyForm = {
  code: '',
  name: '',
  category_id: '',
  unit: 'Unidad',
  current_stock: '0',
  min_stock: '0',
  unit_price: '0',
  status: 'active' as 'active' | 'inactive',
}

export default function ProductDialog({
  categories,
  product,
  trigger,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
}: ProductDialogProps) {
  const router = useRouter()
  const supabase = createClient()

  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : internalOpen
  const setOpen = isControlled ? (setControlledOpen ?? setInternalOpen) : setInternalOpen

  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState(emptyForm)

  // Sync form when editing
  useEffect(() => {
    if (open && product) {
      setForm({
        code: product.code,
        name: product.name,
        category_id: product.category_id ?? '',
        unit: product.unit,
        current_stock: String(product.current_stock),
        min_stock: String(product.min_stock),
        unit_price: String(product.unit_price),
        status: product.status,
      })
    } else if (open && !product) {
      setForm(emptyForm)
    }
  }, [open, product])

  const set = (key: keyof typeof emptyForm) => (value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.code.trim() || !form.name.trim()) {
      toast.error('Código y nombre son requeridos')
      return
    }

    setLoading(true)
    const payload = {
      code: form.code.trim(),
      name: form.name.trim(),
      category_id: form.category_id || null,
      unit: form.unit,
      current_stock: Number(form.current_stock),
      min_stock: Number(form.min_stock),
      unit_price: Number(form.unit_price),
      status: form.status,
    }

    const { error } = product
      ? await supabase.from('products').update(payload).eq('id', product.id)
      : await supabase.from('products').insert(payload)

    setLoading(false)

    if (error) {
      toast.error('Error al guardar el producto', { description: error.message })
      return
    }

    toast.success(product ? 'Producto actualizado' : 'Producto creado correctamente')
    setOpen(false)
    router.refresh()
  }

  return (
    <>
      {trigger ? (
        <span onClick={() => setOpen(true)} className="contents">
          {trigger}
        </span>
      ) : (
        !isControlled && (
          <Button
            onClick={() => setOpen(true)}
            className="gap-1.5"
            style={{ backgroundColor: '#22c55e', borderColor: '#22c55e' }}
          >
            <Plus className="w-4 h-4" />
            Nuevo Producto
          </Button>
        )
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{product ? 'Editar Producto' : 'Nuevo Producto'}</DialogTitle>
          </DialogHeader>

          <form id="product-form" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
              {/* Code */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="code">Código *</Label>
                <Input
                  id="code"
                  placeholder="ej. MAT-001"
                  value={form.code}
                  onChange={(e) => set('code')(e.target.value)}
                  required
                />
              </div>

              {/* Name */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="name">Nombre *</Label>
                <Input
                  id="name"
                  placeholder="ej. Cemento Portland"
                  value={form.name}
                  onChange={(e) => set('name')(e.target.value)}
                  required
                />
              </div>

              {/* Category */}
              <div className="flex flex-col gap-1.5">
                <Label>Categoría</Label>
                <Select value={form.category_id} onValueChange={set('category_id')}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Seleccionar categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Unit */}
              <div className="flex flex-col gap-1.5">
                <Label>Unidad de medida</Label>
                <Select value={form.unit} onValueChange={set('unit')}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {UNITS.map((u) => (
                      <SelectItem key={u} value={u}>
                        {u}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Current Stock */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="current_stock">Stock actual</Label>
                <Input
                  id="current_stock"
                  type="number"
                  min="0"
                  step="any"
                  value={form.current_stock}
                  onChange={(e) => set('current_stock')(e.target.value)}
                />
              </div>

              {/* Min Stock */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="min_stock">Stock mínimo</Label>
                <Input
                  id="min_stock"
                  type="number"
                  min="0"
                  step="any"
                  value={form.min_stock}
                  onChange={(e) => set('min_stock')(e.target.value)}
                />
              </div>

              {/* Unit Price */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="unit_price">Precio unitario (CLP)</Label>
                <Input
                  id="unit_price"
                  type="number"
                  min="0"
                  step="any"
                  value={form.unit_price}
                  onChange={(e) => set('unit_price')(e.target.value)}
                />
              </div>

              {/* Status */}
              <div className="flex flex-col gap-1.5">
                <Label>Estado</Label>
                <Select value={form.status} onValueChange={set('status')}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Activo</SelectItem>
                    <SelectItem value="inactive">Inactivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </form>

          <DialogFooter showCloseButton>
            <Button
              type="submit"
              form="product-form"
              disabled={loading}
              style={{ backgroundColor: '#22c55e', borderColor: '#22c55e' }}
            >
              {loading ? 'Guardando…' : product ? 'Guardar cambios' : 'Crear producto'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

// Standalone edit trigger for use in table rows
export function EditProductButton({ product, categories }: { product: Product; categories: Category[] }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button variant="ghost" size="icon-sm" onClick={() => setOpen(true)} title="Editar">
        <Pencil className="w-3.5 h-3.5" />
      </Button>
      <ProductDialog
        product={product}
        categories={categories}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  )
}

export function DeleteProductButton({ product }: { product: Product }) {
  const router = useRouter()
  const supabase = createClient()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    setLoading(true)
    const { error } = await supabase.from('products').delete().eq('id', product.id)
    setLoading(false)
    if (error) {
      toast.error('Error al eliminar el producto', { description: error.message })
      return
    }
    toast.success('Producto eliminado correctamente')
    setOpen(false)
    router.refresh()
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => setOpen(true)}
        title="Eliminar"
        className="text-red-500 hover:text-red-600 hover:bg-red-50"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </Button>
      <ConfirmDialog
        isOpen={open}
        title="Eliminar producto"
        message="¿Estás seguro de eliminar este producto? Esta acción no se puede deshacer."
        onConfirm={handleDelete}
        onCancel={() => setOpen(false)}
        confirmLabel={loading ? 'Eliminando…' : 'Eliminar'}
      />
    </>
  )
}
