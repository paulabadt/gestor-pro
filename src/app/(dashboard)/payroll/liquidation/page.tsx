'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Calculator, FileText } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import Payslip, { type PayslipData } from '@/components/payroll/Payslip'
import { formatCurrency } from '@/lib/utils'

function getWeekBounds() {
  const now = new Date()
  const day = now.getDay() // 0=Sun
  const monday = new Date(now)
  monday.setDate(now.getDate() - ((day + 6) % 7))
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  return {
    start: monday.toISOString().split('T')[0],
    end: sunday.toISOString().split('T')[0],
  }
}

interface Project {
  id: string
  name: string
}

interface PayrollRow {
  worker_id: string
  worker_name: string
  id_number: string
  position: string
  project_name: string
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

export default function LiquidationPage() {
  const supabase = createClient()
  const { start: defaultStart, end: defaultEnd } = getWeekBounds()

  const [projects, setProjects] = useState<Project[]>([])
  const [projectFilter, setProjectFilter] = useState<string>('all')
  const [startDate, setStartDate] = useState(defaultStart)
  const [endDate, setEndDate] = useState(defaultEnd)
  const [results, setResults] = useState<PayrollRow[]>([])
  const [calculating, setCalculating] = useState(false)
  const [calculated, setCalculated] = useState(false)

  const [payslipOpen, setPayslipOpen] = useState(false)
  const [payslipData, setPayslipData] = useState<PayslipData | null>(null)

  useEffect(() => {
    supabase
      .from('projects')
      .select('id, name')
      .eq('status', 'active')
      .order('name')
      .then(({ data }) => setProjects((data ?? []) as Project[]))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function calculate() {
    if (!startDate || !endDate) {
      toast.error('Selecciona el período de liquidación')
      return
    }
    if (new Date(endDate) < new Date(startDate)) {
      toast.error('La fecha fin debe ser posterior a la fecha inicio')
      return
    }

    setCalculating(true)
    setCalculated(false)

    // Fetch workers
    let workersQuery = supabase
      .from('workers')
      .select('id, name, id_number, position, daily_rate, project_id, projects(name)')
      .eq('status', 'active')

    if (projectFilter !== 'all') {
      workersQuery = workersQuery.eq('project_id', projectFilter)
    }

    const { data: workers, error: workerErr } = await workersQuery.order('name')

    if (workerErr || !workers?.length) {
      setCalculating(false)
      setResults([])
      setCalculated(true)
      if (workerErr) toast.error('Error al obtener trabajadores')
      return
    }

    const workerIds = workers.map((w: { id: string }) => w.id)

    // Fetch attendance for the period
    const { data: attendance } = await supabase
      .from('attendance')
      .select('worker_id, status, overtime_hours')
      .gte('date', startDate)
      .lte('date', endDate)
      .in('worker_id', workerIds)

    // Fetch novelties for the period
    const { data: novelties } = await supabase
      .from('novelties')
      .select('worker_id, type, amount')
      .gte('date', startDate)
      .lte('date', endDate)
      .in('worker_id', workerIds)

    // Build maps
    type AttRow = { worker_id: string; status: string; overtime_hours: number }
    type NovRow = { worker_id: string; type: string; amount: number }

    const attMap: Record<string, AttRow[]> = {}
    for (const a of (attendance ?? []) as AttRow[]) {
      if (!attMap[a.worker_id]) attMap[a.worker_id] = []
      attMap[a.worker_id].push(a)
    }

    const novMap: Record<string, NovRow[]> = {}
    for (const n of (novelties ?? []) as NovRow[]) {
      if (!novMap[n.worker_id]) novMap[n.worker_id] = []
      novMap[n.worker_id].push(n)
    }

    type WorkerRow = {
      id: string
      name: string
      id_number: string
      position: string
      daily_rate: number
      project_id: string | null
      projects: { name: string } | { name: string }[] | null
    }

    const rows: PayrollRow[] = (workers as unknown as WorkerRow[]).map((w) => {
      const projectName = Array.isArray(w.projects)
        ? (w.projects[0]?.name ?? '—')
        : (w.projects?.name ?? '—')
      const wAtt = attMap[w.id] ?? []
      const wNov = novMap[w.id] ?? []

      const days_present = wAtt.filter((a) => a.status === 'present').length
      const half_days = wAtt.filter((a) => a.status === 'half_day').length
      const overtime_hours = wAtt.reduce((sum, a) => sum + (a.overtime_hours ?? 0), 0)

      const base_pay = days_present * w.daily_rate
      const half_days_pay = half_days * (w.daily_rate / 2)
      const overtime_pay = overtime_hours * ((w.daily_rate / 8) * 1.25)
      const bonuses = wNov
        .filter((n) => n.type === 'bonus')
        .reduce((sum, n) => sum + n.amount, 0)
      const deductions = wNov
        .filter((n) => ['advance', 'discount', 'fine'].includes(n.type))
        .reduce((sum, n) => sum + n.amount, 0)

      const total = base_pay + half_days_pay + overtime_pay + bonuses - deductions

      return {
        worker_id: w.id,
        worker_name: w.name,
        id_number: w.id_number,
        position: w.position,
        project_name: projectName,
        daily_rate: w.daily_rate,
        days_present,
        half_days,
        overtime_hours,
        base_pay,
        half_days_pay,
        overtime_pay,
        bonuses,
        deductions,
        total,
      }
    })

    setResults(rows)
    setCalculating(false)
    setCalculated(true)
  }

  function openPayslip(row: PayrollRow) {
    setPayslipData({
      worker_name: row.worker_name,
      id_number: row.id_number,
      position: row.position,
      project_name: row.project_name,
      period_start: startDate,
      period_end: endDate,
      daily_rate: row.daily_rate,
      days_present: row.days_present,
      half_days: row.half_days,
      overtime_hours: row.overtime_hours,
      base_pay: row.base_pay,
      half_days_pay: row.half_days_pay,
      overtime_pay: row.overtime_pay,
      bonuses: row.bonuses,
      deductions: row.deductions,
      total: row.total,
    })
    setPayslipOpen(true)
  }

  const grandTotal = results.reduce((sum, r) => sum + r.total, 0)

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-800">Liquidación de Nómina</h2>
        <p className="text-sm text-gray-500">Calcula el pago del período seleccionado</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-end flex-wrap">
          <div className="flex flex-col gap-1.5">
            <Label>Fecha inicio</Label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-44"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Fecha fin</Label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-44"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Proyecto</Label>
            <Select value={projectFilter} onValueChange={setProjectFilter}>
              <SelectTrigger className="w-52">
                <SelectValue placeholder="Todos los proyectos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los proyectos</SelectItem>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={calculate}
            disabled={calculating}
            className="gap-1.5 h-8 self-end"
            style={{ backgroundColor: '#22c55e', borderColor: '#22c55e' }}
          >
            <Calculator className="w-4 h-4" />
            {calculating ? 'Calculando…' : 'Calcular'}
          </Button>
        </div>
      </div>

      {/* Results */}
      {!calculated ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-16 text-center text-gray-400">
          Selecciona el período y haz clic en <strong>Calcular</strong> para ver la liquidación.
        </div>
      ) : results.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-16 text-center text-gray-400">
          No se encontraron trabajadores activos para los filtros seleccionados.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Summary bar */}
          <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <p className="text-sm text-gray-600">
              <strong>{results.length}</strong> trabajador{results.length !== 1 ? 'es' : ''} ·{' '}
              del <strong>{startDate}</strong> al <strong>{endDate}</strong>
            </p>
            <p className="text-sm font-semibold text-gray-800">
              Total nómina:{' '}
              <span style={{ color: '#16a34a' }}>{formatCurrency(grandTotal)}</span>
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-sm">
              <thead>
                <tr className="text-left border-b border-gray-100">
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Trabajador</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Proyecto</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">Días</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide text-right hidden sm:table-cell">H. Extra</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide text-right hidden lg:table-cell">Bonos</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide text-right hidden lg:table-cell">Descuentos</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">Total</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {results.map((row) => (
                  <tr key={row.worker_id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800">{row.worker_name}</p>
                      <p className="text-xs text-gray-400">{row.position}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{row.project_name}</td>
                    <td className="px-4 py-3 text-right text-gray-700">
                      <span>{row.days_present}</span>
                      {row.half_days > 0 && (
                        <span className="text-xs text-amber-600 ml-1">+{row.half_days}½</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-700 hidden sm:table-cell">
                      {row.overtime_hours > 0 ? `${row.overtime_hours}h` : '—'}
                    </td>
                    <td className="px-4 py-3 text-right text-green-600 hidden lg:table-cell">
                      {row.bonuses > 0 ? formatCurrency(row.bonuses) : '—'}
                    </td>
                    <td className="px-4 py-3 text-right text-red-500 hidden lg:table-cell">
                      {row.deductions > 0 ? formatCurrency(row.deductions) : '—'}
                    </td>
                    <td className="px-4 py-3 text-right font-bold" style={{ color: '#16a34a' }}>
                      {formatCurrency(row.total)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openPayslip(row)}
                        className="gap-1 text-xs h-7"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Comprobante</span>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-200 bg-gray-50">
                  <td colSpan={6} className="px-4 py-3 font-semibold text-gray-700 hidden lg:table-cell">
                    TOTAL NÓMINA
                  </td>
                  <td colSpan={4} className="px-4 py-3 font-semibold text-gray-700 lg:hidden">
                    TOTAL NÓMINA
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-base" style={{ color: '#16a34a' }}>
                    {formatCurrency(grandTotal)}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      <Payslip data={payslipData} open={payslipOpen} onOpenChange={setPayslipOpen} />
    </div>
  )
}
