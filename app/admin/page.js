// File: app/admin/page.js
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSupabase } from '@/lib/supabase-provider'

export default function AdminLogin() {
  const { supabase } = useSupabase()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleLogin = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      // Periksa apakah user adalah admin
      if (data?.user) {
        const { data: adminData, error: adminError } = await supabase
          .from('admins')
          .select('*')
          .eq('user_id', data.user.id)
          .single()
        
        if (adminError || !adminData) {
          await supabase.auth.signOut()
          throw new Error('Akun Anda tidak memiliki akses admin')
        }
        
        // Redirect ke dashboard admin
        router.push('/admin/dashboard')
      }
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
          Login Admin
        </h1>
        
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email admin"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              required
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
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
              {loading ? 'Memproses...' : 'Login'}
            </button>
          </div>
        </form>
        
        <div className="mt-6">
          <a href="/" className="block text-center text-sm text-blue-600 hover:text-blue-800">
            Kembali ke login mahasiswa
          </a>
        </div>
      </div>
    </div>
  )
}