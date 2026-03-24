import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ECard } from '../lib/types'
import { Edit2, Trash2, Search, AlertCircle, Plus } from 'lucide-react'

export default function ECards() {
  const [ecards, setEcards] = useState<ECard[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterPublished, setFilterPublished] = useState<string>('all')

  useEffect(() => {
    fetchECards()
  }, [filterPublished])

  const fetchECards = async () => {
    try {
      setLoading(true)
      let query = supabase.from('e_cards').select('*')

      if (filterPublished === 'published') {
        query = query.eq('is_published', true)
      } else if (filterPublished === 'unpublished') {
        query = query.eq('is_published', false)
      }

      const { data, error: fetchError } = await query.order('created_at', { ascending: false })

      if (fetchError) throw fetchError
      setEcards(data || [])
    } catch (err) {
      console.error('Error fetching e-cards:', err)
      setError('Erreur lors du chargement des e-cards')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette e-card ?')) return

    try {
      const { error: deleteError } = await supabase.from('e_cards').delete().eq('id', id)
      if (deleteError) throw deleteError
      setEcards(ecards.filter((card) => card.id !== id))
    } catch (err) {
      console.error('Error deleting e-card:', err)
      setError('Erreur lors de la suppression')
    }
  }

  const filteredEcards = ecards.filter((card) => {
    const searchLower = searchTerm.toLowerCase()
    return (
      card.advertiser_name?.toLowerCase().includes(searchLower) ||
      card.business_sector?.toLowerCase().includes(searchLower) ||
      card.topic?.toLowerCase().includes(searchLower)
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
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-white">E-Cards</h1>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
          <Plus size={20} />
          Nouveau
        </button>
      </div>

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
            placeholder="Rechercher par nom, secteur, sujet..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-navy-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:border-blue-500"
          />
        </div>

        <div className="flex gap-4">
          <select
            value={filterPublished}
            onChange={(e) => setFilterPublished(e.target.value)}
            className="px-4 py-2 bg-navy-800 border border-gray-600 rounded-lg text-white focus:border-blue-500"
          >
            <option value="all">Toutes</option>
            <option value="published">Publiées</option>
            <option value="unpublished">Non publiées</option>
          </select>
        </div>
      </div>

      {/* E-Cards Table */}
      <div className="bg-navy-800 rounded-lg border border-gray-700 overflow-hidden">
        {filteredEcards.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            Aucune e-card trouvée
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
                    Sujet
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">
                    Vues
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">
                    Likes
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-600">
                {filteredEcards.map((card) => (
                  <tr key={card.id} className="hover:bg-navy-700 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-300">
                      {card.advertiser_name || '—'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-300">
                      {card.business_sector || '—'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-300">
                      {card.topic || '—'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-300">
                      {card.views}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-300">
                      {card.likes}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          card.is_published
                            ? 'bg-green-900/30 text-green-400'
                            : 'bg-gray-700/30 text-gray-400'
                        }`}
                      >
                        {card.is_published ? 'Publiée' : 'Brouillon'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/ecards/${card.id}`}
                          className="p-2 hover:bg-navy-600 rounded transition-colors text-blue-400 hover:text-blue-300"
                        >
                          <Edit2 size={18} />
                        </Link>
                        <button
                          onClick={() => handleDelete(card.id)}
                          className="p-2 hover:bg-navy-600 rounded transition-colors text-red-400 hover:text-red-300"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
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
