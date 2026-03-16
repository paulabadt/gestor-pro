'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Plus, ChevronsUpDown, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Product } from '@/lib/types/database'
import { cn } from '@/lib/utils'
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'

type MovementType = 'entry' | 'exit' | 'adjustment'

interface ProductOption {
  id: string
  name: string
  code: string
  current_stock: number
  unit: string
}

interface MovementFormProps {
  products: ProductOption[]
}

const emptyForm = {
  product_id: '',
  type: 'entry' as MovementType,
  quantity: '',
  reason: '',
  reference: '',
  user_name: '',
}

const typeLabels: Record<MovementType, string> = {
  entry: 'Entrada',
  exit: 'Salida',
  adjustment: 'Ajuste',
}

export default function MovementForm({ products }: MovementFormProps) {
  const router = useRouter()
  const supabase = createClient()

  const [open, setOpen] = useState(false)
  const [comboOpen, setComboOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const set = (key: keyof typeof emptyForm) => (value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => ({ ...prev, [key]: '' }))
  }

  const selectedProduct = products.find((p) => p.id === form.product_id)

  function validate() {
    const errs: Record<string, string> = {}
    if (!form.product_id) errs.product_id = 'Seleccione un producto'
    if (!form.quantity || Number(form.quantity) <= 0) errs.quantity = 'Cantidad debe ser mayor a 0'
    if (!form.reason.trim()) errs.reason = 'El motivo es requerido'
    if (!form.user_name.trim()) errs.user_name = 'El responsable es requerido'

    if (
      form.type === 'exit' &&
      selectedProduct &&
      Number(form.quantity) > selectedProduct.current_stock
    ) {
      errs.quantity = `Stock insuficiente (disponible: ${selectedProduct.current_stock} ${selectedProduct.unit})`
    }

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    const qty = Number(form.quantity)

    // 1. Insert movement record
    const { error: movErr } = await supabase.from('stock_movements').insert({
      product_id: form.product_id,
      type: form.type,
      quantity: qty,
      reason: form.reason.trim(),
      reference: form.reference.trim() || null,
      user_name: form.user_name.trim(),
    })

    if (movErr) {
      setLoading(false)
      toast.error('Error al registrar movimiento', { description: movErr.message })
      return
    }

    // 2. Update product stock
    let newStock: number
    if (form.type === 'entry') {
      newStock = (selectedProduct?.current_stock ?? 0) + qty
    } else if (form.type === 'exit') {
      newStock = (selectedProduct?.current_stock ?? 0) - qty
    } else {
      // adjustment: quantity is the new absolute value
      newStock = qty
    }

    const { error: stockErr } = await supabase
      .from('products')
      .update({ current_stock: newStock })
      .eq('id', form.product_id)

    setLoading(false)

    if (stockErr) {
      toast.error('Movimiento creado pero error al actualizar stock', { description: stockErr.message })
    } else {
      toast.success('Movimiento registrado correctamente')
    }

    setForm(emptyForm)
    setOpen(false)
    router.refresh()
  }

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="gap-1.5"
        style={{ backgroundColor: '#22c55e', borderColor: '#22c55e' }}
      >
        <Plus className="w-4 h-4" />
        Registrar Movimiento
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Registrar Movimiento de Stock</DialogTitle>
          </DialogHeader>

          <form id="movement-form" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-4 py-2">
              {/* Product searchable select */}
              <div className="flex flex-col gap-1.5">
                <Label>Producto *</Label>
                <Popover open={comboOpen} onOpenChange={setComboOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={comboOpen}
                      className={cn(
                        'w-full justify-between font-normal',
                        !form.product_id && 'text-muted-foreground'
                      )}
                    >
                      {selectedProduct
                        ? `${selectedProduct.code} — ${selectedProduct.name}`
                        : 'Buscar producto…'}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Buscar por nombre o código…" />
                      <CommandList>
                        <CommandEmpty>No se encontraron productos.</CommandEmpty>
                        <CommandGroup>
                          {products.map((p) => (
                            <CommandItem
                              key={p.id}
                              value={`${p.code} ${p.name}`}
                              onSelect={() => {
                                set('product_id')(p.id)
                                setComboOpen(false)
                              }}
                              data-checked={form.product_id === p.id}
                            >
                              <Check
                                className={cn(
                                  'mr-2 h-4 w-4',
                                  form.product_id === p.id ? 'opacity-100' : 'opacity-0'
                                )}
                              />
                              <span className="font-mono text-xs text-muted-foreground mr-2">
                                {p.code}
                              </span>
                              {p.name}
                              <span className="ml-auto text-xs text-muted-foreground">
                                {p.current_stock} {p.unit}
                              </span>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                {errors.product_id && (
                  <p className="text-xs text-destructive">{errors.product_id}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Type */}
                <div className="flex flex-col gap-1.5">
                  <Label>Tipo *</Label>
                  <Select value={form.type} onValueChange={set('type')}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(typeLabels) as MovementType[]).map((t) => (
                        <SelectItem key={t} value={t}>
                          {typeLabels[t]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Quantity */}
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="quantity">
                    {form.type === 'adjustment' ? 'Nuevo stock' : 'Cantidad'} *
                  </Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="0"
                    step="any"
                    placeholder="0"
                    value={form.quantity}
                    onChange={(e) => set('quantity')(e.target.value)}
                    aria-invalid={!!errors.quantity}
                  />
                  {errors.quantity && (
                    <p className="text-xs text-destructive">{errors.quantity}</p>
                  )}
                </div>
              </div>

              {/* Stock available hint */}
              {selectedProduct && form.type === 'exit' && (
                <p className="text-xs text-muted-foreground -mt-2">
                  Stock disponible: <strong>{selectedProduct.current_stock} {selectedProduct.unit}</strong>
                </p>
              )}

              {/* Reason */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="reason">Motivo *</Label>
                <Input
                  id="reason"
                  placeholder="ej. Compra a proveedor, Uso en obra…"
                  value={form.reason}
                  onChange={(e) => set('reason')(e.target.value)}
                  aria-invalid={!!errors.reason}
                />
                {errors.reason && (
                  <p className="text-xs text-destructive">{errors.reason}</p>
                )}
              </div>

              {/* Reference */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="reference">Referencia (opcional)</Label>
                <Input
                  id="reference"
                  placeholder="ej. Factura #001, Orden de compra…"
                  value={form.reference}
                  onChange={(e) => set('reference')(e.target.value)}
                />
              </div>

              {/* Responsible */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="user_name">Responsable *</Label>
                <Input
                  id="user_name"
                  placeholder="Nombre del responsable"
                  value={form.user_name}
                  onChange={(e) => set('user_name')(e.target.value)}
                  aria-invalid={!!errors.user_name}
                />
                {errors.user_name && (
                  <p className="text-xs text-destructive">{errors.user_name}</p>
                )}
              </div>
            </div>
          </form>

          <DialogFooter showCloseButton>
            <Button
              type="submit"
              form="movement-form"
              disabled={loading}
              style={{ backgroundColor: '#22c55e', borderColor: '#22c55e' }}
            >
              {loading ? 'Registrando…' : 'Registrar movimiento'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
