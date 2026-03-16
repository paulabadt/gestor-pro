'use client'

import { useRef } from 'react'
import { Printer, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { formatCurrency } from '@/lib/utils'

function fmtDate(d: string) {
  return new Intl.DateTimeFormat('es-CL', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(d + 'T12:00:00'))
}

export interface PayslipData {
  worker_name: string
  id_number: string
  position: string
  project_name: string
  period_start: string
  period_end: string
  daily_rate: number
  days_present: number
  half_days: number
  overtime_hours: number
  base_pay: number
  half_days_pay: number
  overtime_pay: number
  bonuses: number
  deductions: number
  total: number
}

interface PayslipProps {
  data: PayslipData | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function Payslip({ data, open, onOpenChange }: PayslipProps) {
  const contentRef = useRef<HTMLDivElement>(null)

  function handlePrint() {
    if (!contentRef.current) return
    const html = contentRef.current.innerHTML
    const win = window.open('', '_blank', 'width=800,height=700')
    if (!win) return
    win.document.write(`
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8" />
        <title>Comprobante de Pago — GestorPro</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: Arial, sans-serif; font-size: 13px; color: #111; padding: 32px; }
          .header { text-align: center; margin-bottom: 24px; border-bottom: 2px solid #22c55e; padding-bottom: 16px; }
          .header h1 { font-size: 18px; color: #1a1f2e; }
          .header p { color: #6b7280; font-size: 12px; margin-top: 4px; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 24px; margin-bottom: 20px; }
          .info-item label { font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; }
          .info-item p { font-weight: 600; margin-top: 2px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
          thead tr { background: #f9fafb; }
          th { padding: 8px 12px; text-align: left; font-size: 11px; text-transform: uppercase; color: #6b7280; border-bottom: 1px solid #e5e7eb; }
          td { padding: 8px 12px; border-bottom: 1px solid #f3f4f6; }
          td:last-child { text-align: right; }
          th:last-child { text-align: right; }
          .deduction { color: #ef4444; }
          .total-row td { font-size: 15px; font-weight: 700; border-top: 2px solid #e5e7eb; border-bottom: none; padding-top: 12px; }
          .total-amount { color: #16a34a; }
          .footer { margin-top: 40px; display: grid; grid-template-columns: 1fr 1fr; gap: 40px; }
          .sig-line { border-top: 1px solid #111; padding-top: 6px; font-size: 11px; color: #6b7280; text-align: center; }
          @media print { body { padding: 16px; } }
        </style>
      </head>
      <body>${html}</body>
      </html>
    `)
    win.document.close()
    win.focus()
    win.print()
  }

  if (!data) return null

  const rows = [
    {
      concept: `Salario base (${data.days_present} día${data.days_present !== 1 ? 's' : ''} × ${formatCurrency(data.daily_rate)})`,
      detail: `${data.days_present} días`,
      value: data.base_pay,
      negative: false,
    },
    ...(data.half_days > 0
      ? [{
          concept: `Medio día (${data.half_days} × ${formatCurrency(data.daily_rate / 2)})`,
          detail: `${data.half_days} medio${data.half_days !== 1 ? 's' : ''}`,
          value: data.half_days_pay,
          negative: false,
        }]
      : []),
    ...(data.overtime_hours > 0
      ? [{
          concept: `Horas extra (${data.overtime_hours}h × ${formatCurrency((data.daily_rate / 8) * 1.25)})`,
          detail: `${data.overtime_hours} h`,
          value: data.overtime_pay,
          negative: false,
        }]
      : []),
    ...(data.bonuses > 0
      ? [{ concept: 'Bonificaciones', detail: '', value: data.bonuses, negative: false }]
      : []),
    ...(data.deductions > 0
      ? [{ concept: 'Descuentos / Anticipos', detail: '', value: data.deductions, negative: true }]
      : []),
  ]

  const payslipHTML = (
    <div ref={contentRef}>
      <div className="header">
        <h1>GestorPro — Sistema de Nómina</h1>
        <p>Comprobante de Pago</p>
      </div>

      <div className="info-grid">
        <div className="info-item">
          <label>Trabajador</label>
          <p>{data.worker_name}</p>
        </div>
        <div className="info-item">
          <label>Cédula</label>
          <p>{data.id_number}</p>
        </div>
        <div className="info-item">
          <label>Cargo</label>
          <p>{data.position}</p>
        </div>
        <div className="info-item">
          <label>Proyecto</label>
          <p>{data.project_name}</p>
        </div>
        <div className="info-item">
          <label>Período</label>
          <p>{fmtDate(data.period_start)} — {fmtDate(data.period_end)}</p>
        </div>
        <div className="info-item">
          <label>Tarifa diaria</label>
          <p>{formatCurrency(data.daily_rate)}</p>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Concepto</th>
            <th>Detalle</th>
            <th style={{ textAlign: 'right' }}>Valor</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              <td>{r.concept}</td>
              <td style={{ color: '#6b7280', fontSize: '12px' }}>{r.detail}</td>
              <td
                style={{
                  textAlign: 'right',
                  color: r.negative ? '#ef4444' : undefined,
                  fontWeight: 500,
                }}
              >
                {r.negative ? '−' : ''}{formatCurrency(r.value)}
              </td>
            </tr>
          ))}
          <tr className="total-row">
            <td colSpan={2} style={{ fontWeight: 700 }}>TOTAL A PAGAR</td>
            <td style={{ textAlign: 'right', color: '#16a34a', fontWeight: 700 }}>
              {formatCurrency(data.total)}
            </td>
          </tr>
        </tbody>
      </table>

      <div className="footer">
        <div className="sig-line">Firma del trabajador</div>
        <div className="sig-line">Firma del responsable</div>
      </div>
    </div>
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Comprobante de Pago</DialogTitle>
        </DialogHeader>

        {/* Preview */}
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-5 text-sm font-[Arial,sans-serif] max-h-[60vh] overflow-y-auto">
          {/* Header */}
          <div className="text-center border-b-2 pb-4 mb-5" style={{ borderColor: '#22c55e' }}>
            <p className="text-base font-bold text-gray-900">GestorPro — Sistema de Nómina</p>
            <p className="text-xs text-gray-500 mt-1">Comprobante de Pago</p>
          </div>

          {/* Worker info grid */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-3 mb-5">
            {[
              ['Trabajador', data.worker_name],
              ['Cédula', data.id_number],
              ['Cargo', data.position],
              ['Proyecto', data.project_name],
              ['Período', `${fmtDate(data.period_start)} — ${fmtDate(data.period_end)}`],
              ['Tarifa diaria', formatCurrency(data.daily_rate)],
            ].map(([label, val]) => (
              <div key={label}>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">{label}</p>
                <p className="font-semibold text-gray-800 mt-0.5">{val}</p>
              </div>
            ))}
          </div>

          {/* Breakdown table */}
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-100">
                <th className="text-left px-3 py-2 text-gray-500 uppercase text-[10px] tracking-wide">Concepto</th>
                <th className="text-left px-3 py-2 text-gray-500 uppercase text-[10px] tracking-wide">Detalle</th>
                <th className="text-right px-3 py-2 text-gray-500 uppercase text-[10px] tracking-wide">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((r, i) => (
                <tr key={i}>
                  <td className="px-3 py-2 text-gray-700">{r.concept}</td>
                  <td className="px-3 py-2 text-gray-400">{r.detail}</td>
                  <td className={`px-3 py-2 text-right font-medium ${r.negative ? 'text-red-500' : 'text-gray-800'}`}>
                    {r.negative ? '−' : ''}{formatCurrency(r.value)}
                  </td>
                </tr>
              ))}
              <tr className="border-t-2 border-gray-300">
                <td colSpan={2} className="px-3 pt-3 pb-2 font-bold text-gray-900 text-sm">
                  TOTAL A PAGAR
                </td>
                <td className="px-3 pt-3 pb-2 text-right font-bold text-sm" style={{ color: '#16a34a' }}>
                  {formatCurrency(data.total)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Hidden print content */}
        <div style={{ display: 'none' }}>
          <div ref={contentRef}>
            <div className="header">
              <h1>GestorPro — Sistema de Nómina</h1>
              <p>Comprobante de Pago</p>
            </div>
            <div className="info-grid">
              <div className="info-item"><label>Trabajador</label><p>{data.worker_name}</p></div>
              <div className="info-item"><label>Cédula</label><p>{data.id_number}</p></div>
              <div className="info-item"><label>Cargo</label><p>{data.position}</p></div>
              <div className="info-item"><label>Proyecto</label><p>{data.project_name}</p></div>
              <div className="info-item"><label>Período</label><p>{fmtDate(data.period_start)} — {fmtDate(data.period_end)}</p></div>
              <div className="info-item"><label>Tarifa diaria</label><p>{formatCurrency(data.daily_rate)}</p></div>
            </div>
            <table>
              <thead>
                <tr><th>Concepto</th><th>Detalle</th><th>Valor</th></tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i}>
                    <td>{r.concept}</td>
                    <td>{r.detail}</td>
                    <td className={r.negative ? 'deduction' : ''}>{r.negative ? '−' : ''}{formatCurrency(r.value)}</td>
                  </tr>
                ))}
                <tr className="total-row">
                  <td colSpan={2}>TOTAL A PAGAR</td>
                  <td className="total-amount">{formatCurrency(data.total)}</td>
                </tr>
              </tbody>
            </table>
            <div className="footer">
              <div className="sig-line">Firma del trabajador</div>
              <div className="sig-line">Firma del responsable</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="-mx-4 -mb-4 flex justify-between items-center rounded-b-xl border-t bg-muted/50 p-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="gap-1.5">
            <X className="w-4 h-4" />
            Cerrar
          </Button>
          <Button
            onClick={handlePrint}
            className="gap-1.5"
            style={{ backgroundColor: '#22c55e', borderColor: '#22c55e' }}
          >
            <Printer className="w-4 h-4" />
            Imprimir comprobante
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
