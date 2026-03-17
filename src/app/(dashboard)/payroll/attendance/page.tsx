'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { Save, Users, UserCheck, UserX, Trash2 } from 'lucide-react'
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

type AttendanceStatus = 'present' | 'half_day' | 'absent' | 'sick_leave'

const STATUS_LABELS: Record<AttendanceStatus, string> = {
  present: 'Presente',
  half_day: 'Medio día',
  absent: 'Ausente',
  sick_leave: 'Incapacidad',
}

const STATUS_COLORS: Record<AttendanceStatus, string> = {
  present: 'text-green-600',
  half_day: 'text-amber-600',
  absent: 'text-red-600',
  sick_leave: 'text-blue-600',
}

interface AttendanceRow {
  worker_id: string
  worker_name: string
  position: string
  status: AttendanceStatus
  overtime_hours: number
  existingId: string | null
}

interface Project {
  id: string
  name: string
}

function todayStr() {
  return new Date().toISOString().split('T')[0]
}

export default function AttendancePage() {
  const supabase = createClient()

  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<string>('')
  const [selectedDate, setSelectedDate] = useState<string>(todayStr())
  const [rows, setRows] = useState<AttendanceRow[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Load projects
  useEffect(() => {
    supabase
      .from('projects')
      .select('id, name')
      .eq('status', 'active')
      .order('name')
      .then(({ data }) => {
        const proj = (data ?? []) as Project[]
        setProjects(proj)
        if (proj.length > 0) setSelectedProject(proj[0].id)
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadAttendance = useCallback(async () => {
    if (!selectedProject || !selectedDate) return
    setLoading(true)

    // Fetch active workers for the project
    const { data: workers } = await supabase
      .from('workers')
      .select('id, name, position')
      .eq('project_id', selectedProject)
      .eq('status', 'active')
      .order('name')

    // Fetch existing attendance for the date
    const workerIds = (workers ?? []).map((w: { id: string }) => w.id)
    const { data: existing } = workerIds.length
      ? await supabase
          .from('attendance')
          .select('id, worker_id, status, overtime_hours')
          .eq('date', selectedDate)
          .in('worker_id', workerIds)
      : { data: [] }

    const existingMap = Object.fromEntries(
      (existing ?? []).map((a: { id: string; worker_id: string; status: string; overtime_hours: number }) => [
        a.worker_id,
        { id: a.id, status: a.status as AttendanceStatus, overtime_hours: a.overtime_hours },
      ])
    )

    const newRows: AttendanceRow[] = (workers ?? []).map(
      (w: { id: string; name: string; position: string }) => ({
        worker_id: w.id,
        worker_name: w.name,
        position: w.position,
        status: existingMap[w.id]?.status ?? 'present',
        overtime_hours: existingMap[w.id]?.overtime_hours ?? 0,
        existingId: existingMap[w.id]?.id ?? null,
      })
    )

    setRows(newRows)
    setLoading(false)
  }, [selectedProject, selectedDate, supabase])

  useEffect(() => {
    loadAttendance()
  }, [loadAttendance])

  function updateRow(workerId: string, field: 'status' | 'overtime_hours', value: string | number) {
    setRows((prev) =>
      prev.map((r) => (r.worker_id === workerId ? { ...r, [field]: value } : r))
    )
  }

  async function handleClear(workerId: string, existingId: string | null) {
    if (!existingId) return
    setDeletingId(workerId)
    const { error } = await supabase.from('attendance').delete().eq('id', existingId)
    setDeletingId(null)
    if (error) {
      toast.error('Error al limpiar el registro', { description: error.message })
      return
    }
    setRows((prev) =>
      prev.map((r) =>
        r.worker_id === workerId
          ? { ...r, status: 'present', overtime_hours: 0, existingId: null }
          : r
      )
    )
    toast.success('Registro de asistencia eliminado')
  }

  async function handleSave() {
    if (rows.length === 0) return
    setSaving(true)

    const records = rows.map((r) => ({
      worker_id: r.worker_id,
      date: selectedDate,
      status: r.status,
      overtime_hours: r.overtime_hours,
    }))

    const { error } = await supabase
      .from('attendance')
      .upsert(records, { onConflict: 'worker_id,date' })

    setSaving(false)

    if (error) {
      toast.error('Error al guardar asistencia', { description: error.message })
    } else {
      toast.success(`Asistencia guardada para ${selectedDate}`)
      loadAttendance()
    }
  }

  const presentCount = rows.filter((r) => r.status === 'present').length
  const halfCount = rows.filter((r) => r.status === 'half_day').length
  const absentCount = rows.filter((r) => r.status === 'absent' || r.status === 'sick_leave').length

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Registro de Asistencia</h2>
          <p className="text-sm text-gray-500">Marque la asistencia diaria por trabajador</p>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving || rows.length === 0}
          className="gap-1.5 self-start sm:self-auto"
          style={{ backgroundColor: '#22c55e', borderColor: '#22c55e' }}
        >
          <Save className="w-4 h-4" />
          {saving ? 'Guardando…' : 'Guardar asistencia'}
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex flex-col gap-1.5 flex-1">
            <Label>Fecha</Label>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="max-w-xs"
            />
          </div>
          <div className="flex flex-col gap-1.5 flex-1">
            <Label>Proyecto</Label>
            <Select value={selectedProject} onValueChange={setSelectedProject}>
              <SelectTrigger className="max-w-xs w-full">
                <SelectValue placeholder="Seleccionar proyecto" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Summary pills */}
      {rows.length > 0 && (
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-100 shadow-sm px-4 py-2">
            <Users className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">{rows.length} total</span>
          </div>
          <div className="flex items-center gap-2 bg-green-50 rounded-lg border border-green-100 px-4 py-2">
            <UserCheck className="w-4 h-4 text-green-500" />
            <span className="text-sm font-medium text-green-700">{presentCount + halfCount} presentes</span>
          </div>
          <div className="flex items-center gap-2 bg-red-50 rounded-lg border border-red-100 px-4 py-2">
            <UserX className="w-4 h-4 text-red-500" />
            <span className="text-sm font-medium text-red-700">{absentCount} ausentes</span>
          </div>
        </div>
      )}

      {/* Attendance table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-gray-400">Cargando trabajadores…</div>
        ) : rows.length === 0 ? (
          <div className="p-10 text-center text-gray-400">
            {!selectedProject
              ? 'Selecciona un proyecto para ver los trabajadores.'
              : 'No hay trabajadores activos en este proyecto.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-left">
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Trabajador</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Cargo</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Estado</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Horas extra</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {rows.map((row) => (
                  <tr key={row.worker_id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-800">{row.worker_name}</td>
                    <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">{row.position}</td>
                    <td className="px-4 py-3">
                      <Select
                        value={row.status}
                        onValueChange={(v) => updateRow(row.worker_id, 'status', v)}
                      >
                        <SelectTrigger className={`w-36 ${STATUS_COLORS[row.status]}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(Object.keys(STATUS_LABELS) as AttendanceStatus[]).map((s) => (
                            <SelectItem key={s} value={s} className={STATUS_COLORS[s]}>
                              {STATUS_LABELS[s]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <Input
                          type="number"
                          min="0"
                          max="12"
                          step="0.5"
                          value={row.overtime_hours}
                          onChange={(e) =>
                            updateRow(row.worker_id, 'overtime_hours', Number(e.target.value))
                          }
                          className="w-20 text-center"
                        />
                        <span className="text-xs text-gray-400">h</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        title="Limpiar registro"
                        disabled={!row.existingId || deletingId === row.worker_id}
                        onClick={() => handleClear(row.worker_id, row.existingId)}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50 disabled:opacity-30"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
