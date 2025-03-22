// File: app/layout.js
import { Inter } from 'next/font/google'
import './globals.css'
import { SupabaseProvider } from '@/lib/supabase-provider'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Sistem Voting Mahasiswa',
  description: 'Sistem voting mahasiswa berbasis web menggunakan Next.js dan Supabase',
}

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <head>
        <link
          href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" // Ganti dengan versi terbaru jika perlu
          rel="stylesheet"
        />
      </head>
      <body className={inter.className}>
        <SupabaseProvider>
          {children}
        </SupabaseProvider>
      </body>
    </html>
  )
}