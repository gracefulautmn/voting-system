// File: app/voting/page.js
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useSupabase } from '@/lib/supabase-provider'

export default function Voting() {
  const { supabase, user } = useSupabase()
  const router = useRouter()
  const [candidates, setCandidates] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedCandidate, setSelectedCandidate] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [hasVoted, setHasVoted] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    // Jika user belum login, redirect ke halaman login
    if (!user) {
      router.push('/')
      return
    }

    // Ambil data kandidat dan cek apakah mahasiswa sudah voting
    const fetchData = async () => {
      try {
        // Ambil data kandidat
        const { data: candidatesData, error: candidatesError } = await supabase
          .from('candidates')
          .select('*')
          .order('id')

        if (candidatesError) throw candidatesError
        setCandidates(candidatesData || [])

        // Cek apakah user sudah voting
        const { data: voteData, error: voteError } = await supabase
          .from('votes')
          .select('*')
          .eq('user_id', user.id)
          .single()

        if (voteData) {
          setHasVoted(true)
          // Jika sudah voting, set selected candidate
          const { data: selectedCandidateData } = await supabase
            .from('candidates')
            .select('*')
            .eq('id', voteData.candidate_id)
            .single()
          
          if (selectedCandidateData) {
            setSelectedCandidate(selectedCandidateData.id)
          }
        }
      } catch (error) {
        console.error(error)
        setError('Gagal memuat data. Silakan coba lagi.')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [supabase, user, router])

  const handleVote = async () => {
    if (!selectedCandidate || hasVoted) return

    setSubmitting(true)
    try {
      // Simpan data vote
      const { error } = await supabase.from('votes').insert({
        user_id: user.id,
        candidate_id: selectedCandidate,
        nim: localStorage.getItem('nim'),
        program_code: localStorage.getItem('nim')?.substring(0, 4) || null
      })

      if (error) throw error

      setHasVoted(true)
      setSuccessMessage('Terima kasih! Suara Anda telah berhasil dicatat.')
    } catch (error) {
      console.error(error)
      setError('Gagal menyimpan suara. Silakan coba lagi.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    localStorage.removeItem('nim')
    router.push('/')
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-blue-500 mx-auto"></div>
          <p>Memuat data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">Sistem Voting Mahasiswa</h1>
          <button
            onClick={handleLogout}
            className="rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300"
          >
            Logout
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {successMessage && (
          <div className="mb-6 rounded-md bg-green-50 p-4">
            <p className="text-sm text-green-700">{successMessage}</p>
          </div>
        )}

        {hasVoted ? (
          <div className="mb-6 rounded-md bg-blue-50 p-4">
            <p className="text-blue-700">
              Anda telah memberikan suara. Terima kasih atas partisipasi Anda!
            </p>
          </div>
        ) : (
          <p className="mb-6 text-gray-600">
            Silakan pilih salah satu kandidat berikut dan klik tombol "Kirim Suara" untuk memberikan suara Anda.
          </p>
        )}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {candidates.map((candidate) => (
            <div
              key={candidate.id}
              className={`cursor-pointer rounded-lg border-2 p-6 transition-colors ${
                selectedCandidate === candidate.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white hover:border-blue-300'
              }`}
              onClick={() => !hasVoted && setSelectedCandidate(candidate.id)}
            >
              <div className="mb-4 aspect-video relative overflow-hidden rounded-md">
                {candidate.image_url ? (
                  <img
                    src={candidate.image_url}
                    alt={`Kandidat ${candidate.id}`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gray-200">
                    <span className="text-gray-500">Tidak ada gambar</span>
                  </div>
                )}
              </div>

              <h2 className="mb-1 text-xl font-bold">{candidate.name}</h2>
              <p className="mb-4 text-gray-600">{candidate.vice_name}</p>

              <div className="mb-4">
                <h3 className="mb-1 font-medium">Visi:</h3>
                <p className="text-sm text-gray-600">{candidate.vision}</p>
              </div>

              <div>
                <h3 className="mb-1 font-medium">Misi:</h3>
                <p className="text-sm text-gray-600">{candidate.mission}</p>
              </div>
            </div>
          ))}
        </div>

        {!hasVoted && (
          <div className="mt-8 flex justify-center">
            <button
              onClick={handleVote}
              disabled={!selectedCandidate || submitting}
              className="rounded-md bg-blue-600 px-6 py-3 text-white hover:bg-blue-700 disabled:bg-blue-300"
            >
              {submitting ? 'Memproses...' : 'Kirim Suara'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}