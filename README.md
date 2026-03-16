# GestorPro — Sistema de Inventario y Nómina

Aplicación web profesional para la gestión de inventario de materiales y nómina de trabajadores de construcción. Desarrollada para clientes colombianos con precios en COP.

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| Framework | Next.js 16 (App Router) |
| Lenguaje | TypeScript |
| Estilos | Tailwind CSS v4 |
| Componentes UI | shadcn/ui (Nova preset) |
| Base de datos | Supabase (PostgreSQL) |
| Fuente | Plus Jakarta Sans |
| Iconos | Lucide React |
| Notificaciones | Sonner |

## Módulos

### Inventario
- **Productos** — CRUD completo con categorías, unidades de medida, precios COP y alertas de stock mínimo
- **Movimientos** — Registro de entradas, salidas y ajustes con actualización automática del stock

### Nómina
- **Trabajadores** — Registro con cargo, proyecto asignado, tipo de pago (jornal/destajo) y tarifa diaria
- **Asistencia** — Registro diario por proyecto: Presente / Medio día / Ausente / Incapacidad + horas extra
- **Liquidación** — Cálculo automático por período con base en asistencia y novedades; comprobante de pago imprimible

## Requisitos previos

- Node.js 18.17 o superior
- Cuenta en [Supabase](https://supabase.com) (gratuita)
- Cuenta en [Vercel](https://vercel.com) para el despliegue (opcional)

---

## Instalación local

### 1. Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/demo-inventario.git
cd demo-inventario
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Copia el archivo de ejemplo y llena los valores:

```bash
cp .env.example .env.local
```

Edita `.env.local` con tus credenciales de Supabase:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...
```

### 4. Configurar la base de datos en Supabase

Sigue los pasos de la sección **Supabase Setup** más abajo.

### 5. Ejecutar en modo desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en el navegador.

---

## Supabase Setup

### Crear proyecto

1. Ve a [supabase.com](https://supabase.com) → **New Project**
2. Elige nombre, contraseña de base de datos y región (recomendado: **South America (São Paulo)**)
3. Espera que el proyecto se inicialice (~2 minutos)

### Obtener credenciales

1. Ve a **Project Settings → API**
2. Copia la **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
3. Copia la **anon / public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Ejecutar el schema SQL

1. En el panel de Supabase, ve a **SQL Editor → New query**
2. Copia y pega todo el contenido de `src/lib/supabase/schema.sql`
3. Haz clic en **Run** (▶)

El script crea las 7 tablas con sus índices e inserta datos de demo:
- 5 categorías + 16 productos de construcción
- 3 proyectos (2 activos, 1 completado)
- 8 trabajadores con asistencia de la semana actual
- Novedades (bonos, anticipos, descuentos)
- Historial de movimientos de stock

### Row Level Security (RLS) — opcional para producción

Para un entorno productivo, activa RLS en cada tabla y crea policies según los roles de usuario. Para el demo, puede dejarse desactivado.

---

## Despliegue en Vercel

### Opción A — Desde la CLI de Vercel

```bash
npm install -g vercel
vercel
```

Sigue las instrucciones interactivas. Vercel detecta automáticamente Next.js.

### Opción B — Desde el panel web

1. Ve a [vercel.com/new](https://vercel.com/new)
2. Importa el repositorio de GitHub
3. En **Environment Variables** agrega:

| Variable | Valor |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL de tu proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave anon de Supabase |

4. Haz clic en **Deploy**

El build tarda aproximadamente 1-2 minutos. Una vez desplegado recibirás una URL pública tipo `https://demo-inventario.vercel.app`.

### Reconectar Supabase con el dominio de producción

1. En Supabase → **Authentication → URL Configuration**
2. Agrega tu URL de Vercel a **Allowed Redirect URLs**

---

## Scripts disponibles

```bash
npm run dev      # Servidor de desarrollo con hot-reload
npm run build    # Build de producción
npm run start    # Servidor de producción (requiere build previo)
npm run lint     # Linter ESLint
```

## Estructura del proyecto

```
src/
├── app/
│   ├── (dashboard)/
│   │   ├── dashboard/page.tsx          # Dashboard con métricas
│   │   ├── inventory/
│   │   │   ├── page.tsx                # Listado de productos
│   │   │   └── movements/page.tsx      # Movimientos de stock
│   │   └── payroll/
│   │       ├── workers/page.tsx        # Trabajadores
│   │       ├── attendance/page.tsx     # Registro de asistencia
│   │       └── liquidation/page.tsx    # Liquidación de nómina
│   ├── layout.tsx                      # Layout raíz (fuente, toaster)
│   └── globals.css                     # Variables Tailwind v4
├── components/
│   ├── inventory/
│   │   ├── ProductDialog.tsx           # Formulario crear/editar producto
│   │   └── MovementForm.tsx            # Formulario registrar movimiento
│   ├── payroll/
│   │   ├── WorkerDialog.tsx            # Formulario crear/editar trabajador
│   │   └── Payslip.tsx                 # Comprobante de pago imprimible
│   └── layout/
│       ├── DashboardShell.tsx          # Shell con drawer móvil
│       ├── Sidebar.tsx                 # Navegación lateral
│       └── Topbar.tsx                  # Barra superior
└── lib/
    ├── supabase/
    │   ├── client.ts                   # Cliente navegador
    │   ├── server.ts                   # Cliente servidor (cookies)
    │   └── schema.sql                  # Schema completo + seed data
    └── types/database.ts               # Interfaces TypeScript
```

## Licencia

MIT
