'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Plus, Pencil } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Worker, Project } from '@/lib/types/database'
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

const POSITIONS = [
  'Obrero General',
  'Oficial de Mampostería',
  'Maestro de Obra',
  'Electricista',
  'Plomero',
  'Ayudante',
  'Operador de Equipos',
] as const

const emptyForm = {
  name: '',
  id_number: '',
  position: POSITIONS[0] as string,
  project_id: '',
  payment_type: 'daily' as 'daily' | 'piecework',
  daily_rate: '',
  phone: '',
  status: 'active' as 'active' | 'inactive',
}

interface WorkerDialogProps {
  projects: Project[]
  worker?: Worker
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export default function WorkerDialog({
  projects,
  worker,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
}: WorkerDialogProps) {
  const router = useRouter()
  const supabase = createClient()

  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : internalOpen
  const setOpen = isControlled ? (setControlledOpen ?? setInternalOpen) : setInternalOpen

  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState(emptyForm)

  useEffect(() => {
    if (open && worker) {
      setForm({
        name: worker.name,
        id_number: worker.id_number,
        position: worker.position,
        project_id: worker.project_id ?? '',
        payment_type: worker.payment_type,
        daily_rate: String(worker.daily_rate),
        phone: worker.phone ?? '',
        status: worker.status,
      })
    } else if (open && !worker) {
      setForm(emptyForm)
    }
  }, [open, worker])

  const set = (key: keyof typeof emptyForm) => (value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim() || !form.id_number.trim()) {
      toast.error('Nombre y cédula son requeridos')
      return
    }

    setLoading(true)
    const payload = {
      name: form.name.trim(),
      id_number: form.id_number.trim(),
      position: form.position,
      project_id: form.project_id || null,
      payment_type: form.payment_type,
      daily_rate: Number(form.daily_rate) || 0,
      phone: form.phone.trim() || null,
      status: form.status,
    }

    const { error } = worker
      ? await supabase.from('workers').update(payload).eq('id', worker.id)
      : await supabase.from('workers').insert(payload)

    setLoading(false)

    if (error) {
      toast.error('Error al guardar el trabajador', { description: error.message })
      return
    }

    toast.success(worker ? 'Trabajador actualizado' : 'Trabajador registrado correctamente')
    setOpen(false)
    router.refresh()
  }

  return (
    <>
      {!isControlled && (
        <Button
          onClick={() => setOpen(true)}
          className="gap-1.5"
          style={{ backgroundColor: '#22c55e', borderColor: '#22c55e' }}
        >
          <Plus className="w-4 h-4" />
          Nuevo Trabajador
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{worker ? 'Editar Trabajador' : 'Nuevo Trabajador'}</DialogTitle>
          </DialogHeader>

          <form id="worker-form" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="w-name">Nombre completo *</Label>
                <Input
                  id="w-name"
                  placeholder="ej. Carlos Andrés López"
                  value={form.name}
                  onChange={(e) => set('name')(e.target.value)}
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="w-id">Cédula *</Label>
                <Input
                  id="w-id"
                  placeholder="ej. 1234567890"
                  value={form.id_number}
                  onChange={(e) => set('id_number')(e.target.value)}
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>Cargo</Label>
                <Select value={form.position} onValueChange={set('position')}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {POSITIONS.map((p) => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>Proyecto asignado</Label>
                <Select value={form.project_id} onValueChange={set('project_id')}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Sin asignar" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label>Tipo de pago</Label>
                <Select value={form.payment_type} onValueChange={set('payment_type')}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Jornal (diario)</SelectItem>
                    <SelectItem value="piecework">Destajo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="w-rate">
                  {form.payment_type === 'daily' ? 'Jornal diario (CLP)' : 'Tarifa por destajo (CLP)'}
                </Label>
                <Input
                  id="w-rate"
                  type="number"
                  min="0"
                  step="any"
                  placeholder="0"
                  value={form.daily_rate}
                  onChange={(e) => set('daily_rate')(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="w-phone">Teléfono</Label>
                <Input
                  id="w-phone"
                  placeholder="ej. 3001234567"
                  value={form.phone}
                  onChange={(e) => set('phone')(e.target.value)}
                />
              </div>

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
              form="worker-form"
              disabled={loading}
              style={{ backgroundColor: '#22c55e', borderColor: '#22c55e' }}
            >
              {loading ? 'Guardando…' : worker ? 'Guardar cambios' : 'Registrar trabajador'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export function EditWorkerButton({
  worker,
  projects,
}: {
  worker: Worker
  projects: Project[]
}) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button variant="ghost" size="icon-sm" onClick={() => setOpen(true)} title="Editar">
        <Pencil className="w-3.5 h-3.5" />
      </Button>
      <WorkerDialog worker={worker} projects={projects} open={open} onOpenChange={setOpen} />
    </>
  )
}
