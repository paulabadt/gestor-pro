-- ============================================================
-- GestorPro — Schema completo
-- Ejecutar en el SQL Editor de Supabase
-- ============================================================

-- ─── Extensiones ────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── Limpiar tablas previas (orden inverso de dependencias) ─
DROP TABLE IF EXISTS novelties       CASCADE;
DROP TABLE IF EXISTS attendance      CASCADE;
DROP TABLE IF EXISTS stock_movements CASCADE;
DROP TABLE IF EXISTS workers         CASCADE;
DROP TABLE IF EXISTS products        CASCADE;
DROP TABLE IF EXISTS projects        CASCADE;
DROP TABLE IF EXISTS categories      CASCADE;

-- ============================================================
-- MÓDULO INVENTARIO
-- ============================================================

CREATE TABLE categories (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text        NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE products (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  code          text        NOT NULL UNIQUE,
  name          text        NOT NULL,
  category_id   uuid        REFERENCES categories(id) ON DELETE SET NULL,
  unit          text        NOT NULL DEFAULT 'Unidad',
  current_stock numeric     NOT NULL DEFAULT 0,
  min_stock     numeric     NOT NULL DEFAULT 0,
  unit_price    numeric     NOT NULL DEFAULT 0,
  status        text        NOT NULL DEFAULT 'active'
                            CHECK (status IN ('active', 'inactive')),
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_products_category  ON products(category_id);
CREATE INDEX idx_products_status    ON products(status);

CREATE TABLE stock_movements (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  uuid        NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  type        text        NOT NULL CHECK (type IN ('entry', 'exit', 'adjustment')),
  quantity    numeric     NOT NULL,
  reason      text,
  reference   text,
  user_name   text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_movements_product    ON stock_movements(product_id);
CREATE INDEX idx_movements_created_at ON stock_movements(created_at DESC);

-- ============================================================
-- MÓDULO NÓMINA
-- ============================================================

CREATE TABLE projects (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text        NOT NULL,
  location   text,
  status     text        NOT NULL DEFAULT 'active'
             CHECK (status IN ('active', 'inactive', 'completed')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE workers (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text        NOT NULL,
  id_number    text        NOT NULL UNIQUE,
  position     text        NOT NULL,
  project_id   uuid        REFERENCES projects(id) ON DELETE SET NULL,
  payment_type text        NOT NULL DEFAULT 'daily'
               CHECK (payment_type IN ('daily', 'piecework')),
  daily_rate   numeric     NOT NULL DEFAULT 0,
  phone        text,
  status       text        NOT NULL DEFAULT 'active'
               CHECK (status IN ('active', 'inactive')),
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_workers_project ON workers(project_id);
CREATE INDEX idx_workers_status  ON workers(status);

CREATE TABLE attendance (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id      uuid        NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  date           date        NOT NULL,
  status         text        NOT NULL DEFAULT 'present'
                 CHECK (status IN ('present', 'half_day', 'absent', 'sick_leave')),
  overtime_hours numeric     NOT NULL DEFAULT 0,
  created_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (worker_id, date)
);

CREATE INDEX idx_attendance_worker ON attendance(worker_id);
CREATE INDEX idx_attendance_date   ON attendance(date);

CREATE TABLE novelties (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id   uuid        NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  type        text        NOT NULL CHECK (type IN ('bonus', 'advance', 'discount', 'fine')),
  amount      numeric     NOT NULL,
  description text,
  date        date        NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_novelties_worker ON novelties(worker_id);
CREATE INDEX idx_novelties_date   ON novelties(date);

-- ============================================================
-- SEED DATA
-- ============================================================

-- ─── Categorías ─────────────────────────────────────────────
INSERT INTO categories (name) VALUES
  ('Materiales de Construcción'),
  ('Herramientas'),
  ('Equipos'),
  ('Ferretería'),
  ('Acabados');

-- ─── Productos ──────────────────────────────────────────────
INSERT INTO products (code, name, category_id, unit, current_stock, min_stock, unit_price, status)
SELECT
  p.code, p.name,
  (SELECT id FROM categories WHERE name = p.cat LIMIT 1),
  p.unit, p.current_stock::numeric, p.min_stock::numeric,
  p.unit_price::numeric, 'active'
FROM (VALUES
  ('MAT-001', 'Cemento Portland 50 kg',      'Materiales de Construcción', 'Bolsa',   45,  20, 32000),
  ('MAT-002', 'Arena de río (m³)',            'Materiales de Construcción', 'M³',      12,   5, 85000),
  ('MAT-003', 'Gravilla triturada (m³)',      'Materiales de Construcción', 'M³',       8,   5, 92000),
  ('MAT-004', 'Bloque de concreto 20×20×40', 'Materiales de Construcción', 'Unidad', 380, 100,  1800),
  ('MAT-005', 'Acero corrugado 1/2"',         'Materiales de Construcción', 'Unidad',  60,  30, 24500),
  ('MAT-006', 'Ladrillo de arcilla',          'Materiales de Construcción', 'Unidad', 950, 200,   750),
  ('ACB-001', 'Pintura vinilo blanco (gl)',   'Acabados', 'Litro', 18, 10, 38000),
  ('ACB-002', 'Estuco en polvo (25 kg)',      'Acabados', 'Bolsa',  6, 10, 18500),
  ('ACB-003', 'Cerámica 33×33 cm',           'Acabados', 'M²',    24, 15, 22000),
  ('HRR-001', 'Puntilla 2½ (kg)',            'Ferretería', 'Kg',   8,  5,  6500),
  ('HRR-002', 'Alambre negro calibre 18',    'Ferretería', 'Kg',   4,  5,  4800),
  ('HRR-003', 'Tornillo drywall 6×1¼ (c/100)','Ferretería','Caja',12,  6,  3200),
  ('HTA-001', 'Pica de punta y paleta',      'Herramientas', 'Unidad', 6, 3, 45000),
  ('HTA-002', 'Pala cuadrada',               'Herramientas', 'Unidad', 5, 3, 38000),
  ('HTA-003', 'Paleta de albañil',           'Herramientas', 'Unidad', 8, 4, 22000),
  ('EQP-001', 'Mezcladora de concreto 1 saco','Equipos', 'Unidad', 2, 1, 850000)
) AS p(code, name, cat, unit, current_stock, min_stock, unit_price);

-- ─── Proyectos ───────────────────────────────────────────────
INSERT INTO projects (name, location, status) VALUES
  ('Residencial Los Robles',       'Medellín, Antioquia',    'active'),
  ('Centro Comercial Plaza Norte', 'Bogotá, Cundinamarca',   'active'),
  ('Urbanización El Prado',        'Cali, Valle del Cauca',  'completed');

-- ─── Trabajadores ────────────────────────────────────────────
INSERT INTO workers (name, id_number, position, project_id, payment_type, daily_rate, phone, status)
SELECT
  w.name, w.id_number, w.position,
  (SELECT id FROM projects WHERE name = w.project LIMIT 1),
  w.payment_type, w.daily_rate::numeric, w.phone, 'active'
FROM (VALUES
  ('Carlos Andrés López',    '1023456789', 'Maestro de Obra',       'Residencial Los Robles',       'daily',     95000, '3001234567'),
  ('Juan Diego Martínez',    '1098765432', 'Oficial de Mampostería','Residencial Los Robles',       'daily',     72000, '3109876543'),
  ('Luis Eduardo Gómez',     '1045678901', 'Obrero General',        'Residencial Los Robles',       'daily',     55000, '3157890123'),
  ('Pedro Antonio Herrera',  '1067890123', 'Ayudante',              'Residencial Los Robles',       'daily',     50000, '3204567890'),
  ('Andrés Felipe Jiménez',  '1034567890', 'Electricista',          'Centro Comercial Plaza Norte', 'daily',     85000, '3113456789'),
  ('William Ospina Vargas',  '1056789012', 'Plomero',               'Centro Comercial Plaza Norte', 'daily',     80000, '3012345678'),
  ('Diego Armando Ríos',     '1089012345', 'Operador de Equipos',   'Centro Comercial Plaza Norte', 'daily',     90000, '3198765432'),
  ('Mauricio Trujillo Salas','1012345678', 'Obrero General',        'Centro Comercial Plaza Norte', 'piecework', 58000, '3151234567')
) AS w(name, id_number, position, project, payment_type, daily_rate, phone);

-- ─── Movimientos de stock ────────────────────────────────────
INSERT INTO stock_movements (product_id, type, quantity, reason, reference, user_name, created_at)
SELECT
  (SELECT id FROM products WHERE code = m.code LIMIT 1),
  m.type, m.qty::numeric, m.reason, m.reference, m.user_name,
  (now() - (m.days_ago || ' days')::interval)
FROM (VALUES
  ('MAT-001','entry',  60, 'Compra inicial de material',         'FAC-2025-001', 'Carlos López',   14),
  ('MAT-001','exit',   15, 'Uso en obra — cimientos bloque A',   'OBR-001',      'Carlos López',   10),
  ('MAT-002','entry',  15, 'Compra a proveedor Arenas del Valle','FAC-2025-002', 'Carlos López',   14),
  ('MAT-002','exit',    3, 'Preparación de mezcla sector B',     'OBR-001',      'Juan Martínez',   8),
  ('MAT-004','entry', 500, 'Pedido bloques bloque B',            'FAC-2025-003', 'Carlos López',   12),
  ('MAT-004','exit',  120, 'Construcción muro perimetral',       'OBR-002',      'Juan Martínez',   7),
  ('MAT-005','entry',  80, 'Acero para columnas y vigas',        'FAC-2025-004', 'Carlos López',   11),
  ('MAT-005','exit',   20, 'Columnas bloque A nivel 1',          'OBR-003',      'Luis Gómez',      5),
  ('ACB-002','exit',    4, 'Acabado interior apartamento 101',   'OBR-004',      'Pedro Herrera',   3),
  ('HRR-002','entry',  10, 'Compra ferretería general',         'FAC-2025-005', 'Carlos López',    9),
  ('HRR-002','exit',    6, 'Amarre de acero estructural',        'OBR-003',      'Luis Gómez',      4),
  ('HTA-001','entry',   8, 'Dotación inicial de herramientas',  'FAC-2025-006', 'Carlos López',   13),
  ('HTA-001','exit',    2, 'Préstamo obra Plaza Norte',          'OBR-005',      'Andrés Jiménez',  2)
) AS m(code, type, qty, reason, reference, user_name, days_ago);

-- ─── Asistencia (semana actual) ──────────────────────────────
-- Trabajadores de "Residencial Los Robles" — últimos 5 días hábiles
INSERT INTO attendance (worker_id, date, status, overtime_hours)
SELECT
  w.id,
  (current_date - (d.offset_days || ' days')::interval)::date,
  a.status,
  a.ot::numeric
FROM workers w
CROSS JOIN (VALUES (4),(3),(2),(1),(0)) AS d(offset_days)
CROSS JOIN LATERAL (
  SELECT
    CASE
      WHEN w.name = 'Carlos Andrés López'   AND d.offset_days = 1 THEN 'present'
      WHEN w.name = 'Carlos Andrés López'                          THEN 'present'
      WHEN w.name = 'Juan Diego Martínez'   AND d.offset_days = 3 THEN 'absent'
      WHEN w.name = 'Juan Diego Martínez'                          THEN 'present'
      WHEN w.name = 'Luis Eduardo Gómez'    AND d.offset_days = 2 THEN 'half_day'
      WHEN w.name = 'Luis Eduardo Gómez'                           THEN 'present'
      WHEN w.name = 'Pedro Antonio Herrera' AND d.offset_days = 4 THEN 'sick_leave'
      WHEN w.name = 'Pedro Antonio Herrera'                        THEN 'present'
      ELSE 'present'
    END AS status,
    CASE
      WHEN w.name = 'Carlos Andrés López'   AND d.offset_days = 1 THEN 2
      WHEN w.name = 'Andrés Felipe Jiménez' AND d.offset_days = 0 THEN 3
      WHEN w.name = 'Diego Armando Ríos'    AND d.offset_days = 0 THEN 2
      ELSE 0
    END AS ot
) AS a
WHERE w.status = 'active'
ON CONFLICT (worker_id, date) DO NOTHING;

-- ─── Novedades ───────────────────────────────────────────────
INSERT INTO novelties (worker_id, type, amount, description, date)
SELECT
  (SELECT id FROM workers WHERE name = n.worker_name LIMIT 1),
  n.type, n.amount::numeric, n.description,
  (current_date - (n.days_ago || ' days')::interval)::date
FROM (VALUES
  ('Carlos Andrés López',    'bonus',    50000, 'Bono por cumplimiento de cronograma',    7),
  ('Juan Diego Martínez',    'advance',  80000, 'Anticipo quincena',                      3),
  ('Luis Eduardo Gómez',     'advance',  50000, 'Anticipo quincena',                      3),
  ('Andrés Felipe Jiménez',  'bonus',    75000, 'Bono rendimiento eléctrico plaza norte', 5),
  ('William Ospina Vargas',  'discount', 20000, 'Descuento por herramienta perdida',      6),
  ('Diego Armando Ríos',     'bonus',    60000, 'Bono productividad operación equipos',   4),
  ('Pedro Antonio Herrera',  'advance',  40000, 'Anticipo por emergencia familiar',       2)
) AS n(worker_name, type, amount, description, days_ago)
WHERE EXISTS (SELECT 1 FROM workers WHERE name = n.worker_name);
