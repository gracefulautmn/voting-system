// File: app/verify/page.js
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSupabase } from '@/lib/supabase-provider'

export default function VerifyToken() {
  const { supabase, user } = useSupabase()
  const router = useRouter()
  const [token, setToken] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [email, setEmail] = useState('')

  useEffect(() => {
    // Jika user sudah login, langsung ke halaman voting
    if (user) {
      router.push('/voting')
    }
    
    // Ambil NIM dari localStorage
    const nim = localStorage.getItem('nim')
    if (nim) {
      setEmail(`${nim}@student.universitaspertamina.ac.id`)
    } else {
      // Jika tidak ada NIM, kembali ke halaman login
      router.push('/')
    }
  }, [user, router])

  const handleVerify = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    
    try {
      // Verifikasi kode OTP
      const { error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'email',
      })

      if (error) throw error
      
      // Jika berhasil, useEffect akan menangani redirect ke halaman voting
    } catch (error) {
      setError(error.message || 'Verifikasi gagal, silakan coba lagi')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
        <h1 className="mb-6 text-center text-2xl font-bold text-gray-800">
          Verifikasi Token
        </h1>
        
        <p className="mb-6 text-center text-gray-600">
          Masukkan kode verifikasi yang telah dikirim ke email Anda:
          <br />
          <span className="font-medium">{email}</span>
        </p>
        
        <form onSubmit={handleVerify} className="space-y-6">
          <div>
            <label htmlFor="token" className="block text-sm font-medium text-gray-700">
              Kode Verifikasi
            </label>
            <input
              id="token"
              type="text"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Masukkan kode verifikasi"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              required
            />
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
              {loading ? 'Memverifikasi...' : 'Verifikasi'}
            </button>
          </div>
        </form>
        
        <div className="mt-6 text-center">
          <button
            onClick={() => router.push('/')}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Kembali ke halaman login
          </button>
        </div>
      </div>
    </div>
  )
}
