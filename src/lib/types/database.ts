export interface Category {
  id: string
  name: string
  created_at: string
}

export interface Product {
  id: string
  code: string
  name: string
  category_id: string | null
  unit: string
  current_stock: number
  min_stock: number
  unit_price: number
  status: 'active' | 'inactive'
  created_at: string
}

export interface StockMovement {
  id: string
  product_id: string
  type: 'entry' | 'exit' | 'adjustment'
  quantity: number
  reason: string | null
  reference: string | null
  user_name: string | null
  created_at: string
}

export interface Project {
  id: string
  name: string
  location: string | null
  status: 'active' | 'inactive' | 'completed'
  created_at: string
}

export interface Worker {
  id: string
  name: string
  id_number: string
  position: string
  project_id: string | null
  payment_type: 'daily' | 'piecework'
  daily_rate: number
  phone: string | null
  status: 'active' | 'inactive'
  created_at: string
}

export interface Attendance {
  id: string
  worker_id: string
  date: string
  status: 'present' | 'half_day' | 'absent' | 'sick_leave'
  overtime_hours: number
  created_at: string
}

export interface Novelty {
  id: string
  worker_id: string
  type: 'bonus' | 'advance' | 'discount' | 'fine'
  amount: number
  description: string | null
  date: string
  created_at: string
}
