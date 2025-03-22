// File: app/page.js
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSupabase } from '@/lib/supabase-provider'

export default function Login() {
  const { supabase } = useSupabase()
  const router = useRouter()
  const [nim, setNim] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Validasi NIM
  const validateNim = (value) => {
    // NIM harus 9 digit
    return /^\d{9}$/.test(value)
  }

  // Mendapatkan email dari NIM
  const getEmail = (nim) => {
    return `${nim}@student.universitaspertamina.ac.id`
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setError(null)

    if (!validateNim(nim)) {
      setError('NIM harus terdiri dari 9 digit angka')
      return
    }

    setLoading(true)
    
    try {
      const email = getEmail(nim)
      
      // Cek apakah program studi diperbolehkan untuk voting
      const programStudi = nim.substring(0, 4)
      const { data: allowedProdi, error: prodiError } = await supabase
        .from('allowed_programs')
        .select('*')
        .eq('code', programStudi)
        .single()
      
      if (prodiError || !allowedProdi) {
        setError('Program studi Anda tidak diperbolehkan untuk voting saat ini')
        setLoading(false)
        return
      }
      
      // Kirim magic link ke email
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/verify`,
        },
      })

      if (error) throw error
      
      // Simpan NIM ke localStorage untuk digunakan nanti
      localStorage.setItem('nim', nim)
      
      // Arahkan ke halaman verifikasi
      router.push('/verify')
    } catch (error) {
      setError(error.message || 'Login gagal, silakan coba lagi')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
        <h1 className="mb-6 text-center text-2xl font-bold text-gray-800">
          Sistem Voting Mahasiswa
        </h1>
        
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label htmlFor="nim" className="block text-sm font-medium text-gray-700">
              Nomor Induk Mahasiswa (NIM)
            </label>
            <input
              id="nim"
              type="text"
              value={nim}
              onChange={(e) => setNim(e.target.value)}
              placeholder="Masukkan 9 digit NIM"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              required
            />
            {nim && !validateNim(nim) && (
              <p className="mt-1 text-xs text-red-600">
                NIM harus terdiri dari 9 digit angka
              </p>
            )}
          </div>
          
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}
          
          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-300"
            >
              {loading ? 'Mengirim kode...' : 'Kirim Kode Verifikasi'}
            </button>
          </div>
        </form>
        
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>
            Kode verifikasi akan dikirim ke email microsoft Anda:<br />
            <span className="font-medium">{nim ? getEmail(nim) : 'NIM@student.universitaspertamina.ac.id'}</span>
          </p>
        </div>
        
        {/* <div className="mt-6">
          <a href="/admin" className="block text-center text-sm text-blue-600 hover:text-blue-800">
            Login sebagai Admin
          </a>
        </div> */}
      </div>
    </div>
  )
}