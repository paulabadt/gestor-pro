import type { Metadata } from 'next'
import { Plus_Jakarta_Sans, Geist_Mono } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/sonner'

const plusJakarta = Plus_Jakarta_Sans({
  variable: '--font-jakarta',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'GestorPro — Sistema de Gestión Empresarial',
  description: 'Plataforma de control de inventario y nómina para empresas',
  metadataBase: new URL('https://gestorpro.paulabad.tech'),
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/apple-touch-icon.svg',
  },
  openGraph: {
    title: 'GestorPro — Sistema de Gestión Empresarial',
    description: 'Control de inventario, nómina y operación desde cualquier dispositivo',
    url: 'https://gestorpro.paulabad.tech',
    siteName: 'GestorPro',
    locale: 'es_CO',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'GestorPro',
    description: 'Control de inventario y nómina para empresas',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es">
      <body className={`${plusJakarta.variable} ${geistMono.variable} antialiased`}>
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  )
}
