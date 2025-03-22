// File: app/admin/dashboard/page.js
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSupabase } from '@/lib/supabase-provider'

export default function AdminDashboard() {
  const { supabase, user } = useSupabase()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('results')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [results, setResults] = useState([])
  const [candidates, setCandidates] = useState([])
  const [allowedPrograms, setAllowedPrograms] = useState([])
  const [programCodes, setProgramCodes] = useState([
    { code: '1052', name: 'Ilmu Komputer' },
    { code: '1032', name: 'Ekonomi' },
    // Tambahkan program studi lainnya
  ])
  const [totalVotes, setTotalVotes] = useState(0)

  useEffect(() => {
    // Periksa apakah user login dan adalah admin
    const checkAdmin = async () => {
      if (!user) {
        router.push('/admin')
        return
      }

      try {
        const { data: adminData, error: adminError } = await supabase
          .from('admins')
          .select('*')
          .eq('user_id', user.id)
          .single()
        
        if (adminError || !adminData) {
          await supabase.auth.signOut()
          router.push('/admin')
          return
        }

        // Load data
        await fetchData()
      } catch (error) {
        console.error(error)
        router.push('/admin')
      }
    }

    checkAdmin()
  }, [supabase, user, router])

  const fetchData = async () => {
    setLoading(true)
    try {
      // Ambil data kandidat
      const { data: candidatesData, error: candidatesError } = await supabase
        .from('candidates')
        .select('*')
        .order('id')

      if (candidatesError) throw candidatesError
      setCandidates(candidatesData || [])

      // Ambil data program studi yang diizinkan
      const { data: programsData, error: programsError } = await supabase
        .from('allowed_programs')
        .select('*')
        .order('code')

      if (programsError) throw programsError
      setAllowedPrograms(programsData || [])

      // Ambil data hasil voting
      const { data: votesData, error: votesError } = await supabase
        .from('votes')
        .select('candidate_id')

      if (votesError) throw votesError
      
      // Hitung jumlah suara per kandidat
      if (candidatesData && votesData) {
        const voteCounts = candidatesData.map(candidate => {
          const voteCount = votesData.filter(vote => vote.candidate_id === candidate.id).length
          return {
            ...candidate,
            votes: voteCount
          }
        }).sort((a, b) => b.votes - a.votes) // Sort by votes in descending order

        setResults(voteCounts)
        setTotalVotes(votesData.length)
      }
    } catch (error) {
      console.error(error)
      setError('Gagal memuat data. Silakan coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/admin')
  }

  const toggleProgramAccess = async (code) => {
    try {
      // Cek apakah program sudah ada dalam database
      const { data: existingProgram } = await supabase
        .from('allowed_programs')
        .select('*')
        .eq('code', code)
        .single()

      if (existingProgram) {
        // Hapus akses jika sudah ada
        await supabase
          .from('allowed_programs')
          .delete()
          .eq('code', code)
      } else {
        // Tambahkan akses jika belum ada
        const programName = programCodes.find(p => p.code === code)?.name || 'Unknown'
        await supabase
          .from('allowed_programs')
          .insert({
            code,
            name: programName
          })
      }

      // Reload data
      await fetchData()
    } catch (error) {
      console.error(error)
      setError('Gagal memperbarui akses program studi.')
    }
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
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white shadow">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <h1 className="text-xl font-bold">Dashboard Admin</h1>
            <button
              onClick={handleLogout}
              className="rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {error && (
          // File: app/admin/dashboard/page.js (lanjutan)
          <div className="mb-6 rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex">
            <button
              onClick={() => setActiveTab('results')}
              className={`mr-8 py-4 text-sm font-medium ${
                activeTab === 'results'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:border-b-2 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              Hasil Voting
            </button>
            <button
              onClick={() => setActiveTab('candidates')}
              className={`mr-8 py-4 text-sm font-medium ${
                activeTab === 'candidates'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:border-b-2 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              Kelola Kandidat
            </button>
            <button
              onClick={() => setActiveTab('programs')}
              className={`py-4 text-sm font-medium ${
                activeTab === 'programs'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:border-b-2 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              Kelola Program Studi
            </button>
          </nav>
        </div>

        {/* Results Tab */}
        {activeTab === 'results' && (
          <div>
            <div className="mb-6 rounded-lg bg-white p-6 shadow">
              <h2 className="mb-4 text-lg font-medium">Hasil Realtime</h2>
              <p className="mb-4 text-gray-600">Total suara: {totalVotes}</p>

              {results.map((candidate) => {
                const percentage = totalVotes > 0 ? (candidate.votes / totalVotes) * 100 : 0
                return (
                  <div key={candidate.id} className="mb-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">{candidate.name}</span>
                      <span>{candidate.votes} suara ({percentage.toFixed(1)}%)</span>
                    </div>
                    <div className="h-4 w-full overflow-hidden rounded-full bg-gray-200">
                      <div
                        className="h-4 rounded-full bg-blue-500"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                )
              })}
            </div>
            
            <div className="overflow-hidden rounded-lg bg-white shadow">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Kandidat
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Ketua
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Wakil
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Jumlah Suara
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Persentase
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {results.map((candidate) => (
                    <tr key={candidate.id}>
                      <td className="whitespace-nowrap px-6 py-4">
                        Pasangan {candidate.id}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        {candidate.name}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        {candidate.vice_name}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        {candidate.votes}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        {totalVotes > 0 ? ((candidate.votes / totalVotes) * 100).toFixed(1) : 0}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Candidates Tab */}
        {activeTab === 'candidates' && (
          <CandidatesManager 
            candidates={candidates} 
            supabase={supabase} 
            refresh={fetchData}
          />
        )}

        {/* Programs Tab */}
        {activeTab === 'programs' && (
          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="mb-4 text-lg font-medium">Kelola Akses Program Studi</h2>
            <p className="mb-4 text-gray-600">
              Pilih program studi yang diperbolehkan untuk mengikuti voting:
            </p>

            <div className="overflow-hidden rounded-lg border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Kode
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Program Studi
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {programCodes.map((program) => {
                    const isAllowed = allowedPrograms.some(p => p.code === program.code)
                    return (
                      <tr key={program.code}>
                        <td className="whitespace-nowrap px-6 py-4">
                          {program.code}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          {program.name}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                            isAllowed 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {isAllowed ? 'Diizinkan' : 'Tidak Diizinkan'}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                          <button
                            onClick={() => toggleProgramAccess(program.code)}
                            className={`rounded px-3 py-1 text-xs font-medium ${
                              isAllowed
                                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                : 'bg-green-100 text-green-700 hover:bg-green-200'
                            }`}
                          >
                            {isAllowed ? 'Cabut Akses' : 'Berikan Akses'}
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Component untuk mengelola kandidat
function CandidatesManager({ candidates, supabase, refresh }) {
  const [selectedCandidate, setSelectedCandidate] = useState(null)
  const [isAdding, setIsAdding] = useState(false)
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    vice_name: '',
    vision: '',
    mission: '',
    image_url: ''
  })
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  const handleImageUpload = async (file) => {
    if (!file) return null;
  
    // Validasi tipe file
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      setError('Format file tidak didukung. Harap unggah file JPG atau PNG.');
      return null;
    }
  
    setUploading(true);
    try {
      // Bersihkan nama file
      const cleanFileName = (fileName) => {
        return fileName.replace(/[^a-zA-Z0-9._-]/g, '');
      };
  
      const fileName = `${Date.now()}_${cleanFileName(file.name)}`;
  
      // Unggah file ke Supabase Storage
      const { data, error } = await supabase.storage
        .from('candidate.images') // Pastikan nama bucket benar
        .upload(fileName, file);
  
      if (error) throw error;
  
      // Dapatkan URL publik file yang diunggah
      const { data: urlData } = supabase.storage
        .from('candidate.images')
        .getPublicUrl(data.path);
  
      setUploading(false);
      return urlData.publicUrl; // Kembalikan URL gambar
    } catch (error) {
      setUploading(false);
      console.error('Error uploading image:', error); // Log error ke console
      setError('Gagal mengunggah gambar. Silakan coba lagi.');
      return null;
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const imageUrl = await handleImageUpload(file);
      if (imageUrl) {
        setFormData((prev) => ({ ...prev, image_url: imageUrl }));
      }
    }
  };

  const handleEdit = (candidate) => {
    setSelectedCandidate(candidate.id)
    setFormData({
      name: candidate.name,
      vice_name: candidate.vice_name,
      vision: candidate.vision,
      mission: candidate.mission,
      image_url: candidate.image_url || ''
    })
    setIsAdding(false)
  }

  const handleAdd = () => {
    setSelectedCandidate(null)
    setFormData({
      name: '',
      vice_name: '',
      vision: '',
      mission: '',
      image_url: ''
    })
    setIsAdding(true)
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    try {
      if (isAdding) {
        // Tambah kandidat baru
        const { error } = await supabase
          .from('candidates')
          .insert(formData)
        
        if (error) throw error
        setSuccess('Kandidat berhasil ditambahkan')
      } else {
        // Update kandidat yang ada
        const { error } = await supabase
          .from('candidates')
          .update(formData)
          .eq('id', selectedCandidate)
        
        if (error) throw error
        setSuccess('Kandidat berhasil diperbarui')
      }

      // Reset form dan refresh data
      setSelectedCandidate(null)
      setIsAdding(false)
      setFormData({
        name: '',
        vice_name: '',
        vision: '',
        mission: '',
        image_url: ''
      })
      refresh()
    } catch (error) {
      console.error(error)
      setError(error.message || 'Terjadi kesalahan, silakan coba lagi')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus kandidat ini?')) return

    try {
      const { error } = await supabase
        .from('candidates')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      
      setSuccess('Kandidat berhasil dihapus')
      refresh()
    } catch (error) {
      console.error(error)
      setError(error.message || 'Gagal menghapus kandidat')
    }
  }

  return (
    <div>
      <div className="mb-6 flex justify-between">
        <h2 className="text-lg font-medium">Kelola Kandidat</h2>
        <button
          onClick={handleAdd}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Tambah Kandidat
        </button>
      </div>

      {error && (
        <div className="mb-6 rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-6 rounded-md bg-green-50 p-4">
          <p className="text-sm text-green-700">{success}</p>
        </div>
      )}

      {(isAdding || selectedCandidate) && (
        <div className="mb-6 rounded-lg bg-white p-6 shadow">
          <h3 className="mb-4 text-lg font-medium">
            {isAdding ? 'Tambah Kandidat Baru' : 'Edit Kandidat'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Nama Ketua
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label htmlFor="vice_name" className="block text-sm font-medium text-gray-700">
                Nama Wakil
              </label>
              <input
                type="text"
                id="vice_name"
                name="vice_name"
                value={formData.vice_name}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label htmlFor="vision" className="block text-sm font-medium text-gray-700">
                Visi
              </label>
              <textarea
                id="vision"
                name="vision"
                rows="3"
                value={formData.vision}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                required
              ></textarea>
            </div>
            <div>
              <label htmlFor="mission" className="block text-sm font-medium text-gray-700">
                Misi
              </label>
              <textarea
                id="mission"
                name="mission"
                rows="4"
                value={formData.mission}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                required
              ></textarea>
            </div>
            <div>
              <label htmlFor="image" className="block text-sm font-medium text-gray-700">
                Gambar Kandidat
              </label>
              <input
                type="file"
                id="image"
                name="image"
                onChange={handleFileChange}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                accept="image/*"
              />
              {uploading && <p className="mt-1 text-sm text-gray-500">Mengunggah gambar...</p>}
              {formData.image_url && (
                <div className="mt-2">
                  <img
                    src={formData.image_url}
                    alt="Preview"
                    className="h-20 w-20 rounded-md object-cover"
                  />
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                {isAdding ? 'Tambah' : 'Simpan'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedCandidate(null)
                  setIsAdding(false)
                }}
                className="rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300"
              >
                Batal
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="overflow-hidden rounded-lg bg-white shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                ID
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Ketua
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Wakil
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {candidates.length === 0 ? (
              <tr>
                <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                  Belum ada kandidat. Silakan tambahkan kandidat baru.
                </td>
              </tr>
            ) : (
              candidates.map((candidate) => (
                <tr key={candidate.id}>
                  <td className="whitespace-nowrap px-6 py-4">
                    {candidate.id}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    {candidate.name}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    {candidate.vice_name}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                    <button
                      onClick={() => handleEdit(candidate)}
                      className="mr-2 rounded bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700 hover:bg-blue-200"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(candidate.id)}
                      className="rounded bg-red-100 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-200"
                    >
                      Hapus
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}