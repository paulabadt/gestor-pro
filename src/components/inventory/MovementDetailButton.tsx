'use client'

import { useState } from 'react'
import { Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'

type MovementType = 'entry' | 'exit' | 'adjustment'

const TYPE_LABELS: Record<MovementType, string> = {
  entry: 'Entrada',
  exit: 'Salida',
  adjustment: 'Ajuste',
}

const TYPE_BADGE: Record<MovementType, string> = {
  entry: 'bg-green-100 text-green-700',
  exit: 'bg-red-100 text-red-700',
  adjustment: 'bg-yellow-100 text-yellow-700',
}

function formatDate(dateStr: string) {
  return new Intl.DateTimeFormat('es-CL', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateStr))
}

export interface MovementDetail {
  id: string
  type: MovementType
  quantity: number
  reason: string | null
  reference: string | null
  user_name: string | null
  created_at: string
  products: { name: string; code: string; unit: string } | null
}

export default function MovementDetailButton({ movement }: { movement: MovementDetail }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button variant="ghost" size="icon-sm" onClick={() => setOpen(true)} title="Ver detalle">
        <Eye className="w-3.5 h-3.5" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Detalle del movimiento</DialogTitle>
          </DialogHeader>

          <div className="py-2">
            <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Fecha</p>
                <p className="text-gray-800">{formatDate(movement.created_at)}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Tipo</p>
                <Badge className={`${TYPE_BADGE[movement.type]} border-0`}>
                  {TYPE_LABELS[movement.type]}
                </Badge>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Producto</p>
                <p className="text-gray-800">{movement.products?.name ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Código</p>
                <p className="font-mono text-gray-500 text-xs">{movement.products?.code ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Cantidad</p>
                <p className="text-gray-800 font-medium">
                  {movement.quantity}
                  {movement.products?.unit && (
                    <span className="text-xs text-gray-400 ml-1">{movement.products.unit}</span>
                  )}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Responsable</p>
                <p className="text-gray-800">{movement.user_name ?? '—'}</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Motivo</p>
                <p className="text-gray-800">{movement.reason ?? '—'}</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Referencia</p>
                <p className="text-gray-800">{movement.reference ?? '—'}</p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
