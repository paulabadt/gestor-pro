'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Plus, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
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
import ConfirmDialog from '@/components/ui/ConfirmDialog'

const TYPE_OPTIONS = [
  { value: 'bonus', label: 'Bono' },
  { value: 'advance', label: 'Adelanto' },
  { value: 'discount', label: 'Descuento' },
  { value: 'fine', label: 'Multa' },
] as const

interface NoveltyDialogProps {
  workers: { id: string; name: string }[]
}

const emptyForm = {
  worker_id: '',
  type: 'bonus' as 'bonus' | 'advance' | 'discount' | 'fine',
  amount: '',
  description: '',
  date: '',
}

export default function NoveltyDialog({ workers }: NoveltyDialogProps) {
  const router = useRouter()
  const supabase = createClient()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState(emptyForm)

  useEffect(() => {
    if (open) {
      setForm({
        ...emptyForm,
        date: new Date().toISOString().split('T')[0],
      })
    }
  }, [open])

  const set = (key: keyof typeof emptyForm) => (value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.worker_id || !form.amount) {
      toast.error('Trabajador y monto son requeridos')
      return
    }

    setLoading(true)
    const { error } = await supabase.from('novelties').insert({
      worker_id: form.worker_id,
      type: form.type,
      amount: Number(form.amount),
      description: form.description.trim() || null,
      date: form.date,
    })
    setLoading(false)

    if (error) {
      toast.error('Error al guardar la novedad', { description: error.message })
      return
    }

    toast.success('Novedad registrada correctamente')
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
        Nueva Novedad
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Nueva Novedad</DialogTitle>
          </DialogHeader>

          <form id="novelty-form" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <Label>Trabajador *</Label>
                <Select value={form.worker_id} onValueChange={set('worker_id')}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Seleccionar trabajador" />
                  </SelectTrigger>
                  <SelectContent>
                    {workers.map((w) => (
                      <SelectItem key={w.id} value={w.id}>
                        {w.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>Tipo *</Label>
                <Select value={form.type} onValueChange={set('type')}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TYPE_OPTIONS.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="n-amount">Monto (CLP) *</Label>
                <Input
                  id="n-amount"
                  type="number"
                  min="0"
                  step="any"
                  placeholder="0"
                  value={form.amount}
                  onChange={(e) => set('amount')(e.target.value)}
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <Label htmlFor="n-desc">Descripción</Label>
                <Input
                  id="n-desc"
                  placeholder="ej. Bono por productividad"
                  value={form.description}
                  onChange={(e) => set('description')(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="n-date">Fecha *</Label>
                <Input
                  id="n-date"
                  type="date"
                  value={form.date}
                  onChange={(e) => set('date')(e.target.value)}
                  required
                />
              </div>
            </div>
          </form>

          <DialogFooter showCloseButton>
            <Button
              type="submit"
              form="novelty-form"
              disabled={loading}
              style={{ backgroundColor: '#22c55e', borderColor: '#22c55e' }}
            >
              {loading ? 'Guardando…' : 'Registrar novedad'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export function DeleteNoveltyButton({ noveltyId }: { noveltyId: string }) {
  const router = useRouter()
  const supabase = createClient()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    setLoading(true)
    const { error } = await supabase.from('novelties').delete().eq('id', noveltyId)
    setLoading(false)
    if (error) {
      toast.error('Error al eliminar la novedad', { description: error.message })
      return
    }
    toast.success('Novedad eliminada correctamente')
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
        title="Eliminar novedad"
        message="¿Estás seguro de eliminar esta novedad? Esta acción no se puede deshacer."
        onConfirm={handleDelete}
        onCancel={() => setOpen(false)}
        confirmLabel={loading ? 'Eliminando…' : 'Eliminar'}
      />
    </>
  )
}
