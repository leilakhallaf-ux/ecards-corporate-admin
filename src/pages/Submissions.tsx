import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ECardSubmission } from '../lib/types'
import { Eye, AlertCircle, Search } from 'lucide-react'

export default function Submissions() {
  const [submissions, setSubmissions] = useState<ECardSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  useEffect(() => {
    fetchSubmissions()
  }, [filterStatus])

  const fetchSubmissions = async () => {
    try {
      setLoading(true)
      let query = supabase.from('ecard_submissions').select('*')

      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus)
      }

      const { data, error: fetchError } = await query.order('created_at', { ascending: false })

      if (fetchError) throw fetchError
      setSubmissions(data || [])
    } catch (err) {
      console.error('Error fetching submissions:', err)
      setError('Erreur lors du chargement des soumissions')
    } finally {
      setLoading(false)
    }
  }

  const filteredSubmissions = submissions.filter((submission) => {
    const searchLower = searchTerm.toLowerCase()
    return (
      submission.advertiser_name?.toLowerCase().includes(searchLower) ||
      submission.business_sector?.toLowerCase().includes(searchLower) ||
      submission.submitted_by?.toLowerCase().includes(searchLower)
    )
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-gray-400">Chargement...</div>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-8">Soumissions d'E-Cards</h1>

      {error && (
        <div className="mb-6 p-4 bg-red-900/20 border border-red-700 rounded-lg flex items-start gap-3">
          <AlertCircle size={20} className="text-red-500 mt-0.5 flex-shrink-0" />
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Search and Filter */}
      <div className="mb-6 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 text-gray-500" size={20} />
          <input
            type="text"
            placeholder="Rechercher par annonceur, secteur, soumissionnaire..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-navy-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:border-blue-500"
          />
        </div>

        <div className="flex gap-4">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 bg-navy-800 border border-gray-600 rounded-lg text-white focus:border-blue-500"
          >
            <option value="all">Tous les statuts</option>
            <option value="new">Nouveau</option>
            <option value="pending">En attente</option>
            <option value="approved">Approuvée</option>
            <option value="rejected">Rejetée</option>
          </select>
        </div>
      </div>

      {/* Submissions Table */}
      <div className="bg-navy-800 rounded-lg border border-gray-700 overflow-hidden">
        {filteredSubmissions.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            Aucune soumission trouvée
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-navy-700 border-b border-gray-600">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">
                    Annonceur
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">
                    Secteur
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">
                    Soumissionnaire
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">
                    Capacité
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-600">
                {filteredSubmissions.map((submission) => (
                  <tr key={submission.id} className="hover:bg-navy-700 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-300">
                      {submission.advertiser_name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-300">
                      {submission.business_sector}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-300">
                      {submission.submitted_by}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-300">
                      {submission.submitted_capacity}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          submission.status === 'approved'
                            ? 'bg-green-900/30 text-green-400'
                            : submission.status === 'rejected'
                            ? 'bg-red-900/30 text-red-400'
                            : submission.status === 'pending'
                            ? 'bg-yellow-900/30 text-yellow-400'
                            : 'bg-blue-900/30 text-blue-400'
                        }`}
                      >
                        {submission.status === 'approved'
                          ? 'Approuvée'
                          : submission.status === 'rejected'
                          ? 'Rejetée'
                          : submission.status === 'pending'
                          ? 'En attente'
                          : 'Nouveau'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-300">
                      {new Date(submission.created_at).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <Link
                        to={`/submissions/${submission.id}`}
                        className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        <Eye size={18} />
                        Voir
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
