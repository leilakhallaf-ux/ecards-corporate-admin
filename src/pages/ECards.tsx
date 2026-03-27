import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ECard } from '../lib/types'
import { Edit2, Trash2, Search, AlertCircle, Plus, Video, Link2, ChevronUp, ChevronDown } from 'lucide-react'

type SortColumn = 'advertiser_name' | 'topic' | 'views' | 'likes' | 'score_avg' | 'is_published'
type SortDirection = 'asc' | 'desc'

export default function ECards() {
  const [ecards, setEcards] = useState<ECard[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterPublished, setFilterPublished] = useState<string>('all')
  const [sortColumn, setSortColumn] = useState<SortColumn | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [filterAnnonceur, setFilterAnnonceur] = useState<string>('all')
  const [filterSujet, setFilterSujet] = useState<string>('all')
  const [filterStatut, setFilterStatut] = useState<string>('all')
  const [filterType, setFilterType] = useState<string>('all')

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

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  const uniqueAnnonceurs = useMemo(() => {
    const values = ecards.map(c => c.advertiser_name).filter(Boolean) as string[]
    return [...new Set(values)].sort()
  }, [ecards])

  const uniqueSujets = useMemo(() => {
    const values = ecards.map(c => c.topic).filter(Boolean) as string[]
    return [...new Set(values)].sort()
  }, [ecards])

  const filteredEcards = useMemo(() => {
    let result = ecards.filter((card) => {
      const searchLower = searchTerm.toLowerCase()
      const matchesSearch =
        card.advertiser_name?.toLowerCase().includes(searchLower) ||
        card.topic?.toLowerCase().includes(searchLower)

      const matchesAnnonceur = filterAnnonceur === 'all' || card.advertiser_name === filterAnnonceur
      const matchesSujet = filterSujet === 'all' || card.topic === filterSujet
      const matchesStatut = filterStatut === 'all' ||
        (filterStatut === 'published' && card.is_published) ||
        (filterStatut === 'unpublished' && !card.is_published)
      const matchesType = filterType === 'all' ||
        (filterType === 'video' && !!card.video_url) ||
        (filterType === 'link' && !card.video_url)

      return matchesSearch && matchesAnnonceur && matchesSujet && matchesStatut && matchesType
    })

    if (sortColumn) {
      result = [...result].sort((a, b) => {
        let valA = a[sortColumn]
        let valB = b[sortColumn]
        if (valA == null) valA = ''
        if (valB == null) valB = ''
        if (typeof valA === 'boolean') {
          valA = valA ? 1 : 0; valB = (valB as boolean) ? 1 : 0
        }
        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortDirection === 'asc' ? valA - valB : valB - valA
        }
        const strA = String(valA).toLowerCase()
        const strB = String(valB).toLowerCase()
        if (strA < strB) return sortDirection === 'asc' ? -1 : 1
        if (strA > strB) return sortDirection === 'asc' ? 1 : -1
        return 0
      })
    }
    return result
  }, [ecards, searchTerm, filterAnnonceur, filterSujet, filterStatut, filterType, sortColumn, sortDirection])

  const SortIcon = ({ column }: { column: SortColumn }) => {
    if (sortColumn !== column) return <ChevronUp className="w-3 h-3 text-gray-400 opacity-40" />
    return sortDirection === 'asc'
      ? <ChevronUp className="w-3 h-3 text-gold-600" />
      : <ChevronDown className="w-3 h-3 text-gold-600" />
  }

  const resetFilters = () => {
    setFilterAnnonceur('all')
    setFilterSujet('all')
    setFilterStatut('all')
    setFilterType('all')
    setFilterPublished('all')
    setSortColumn(null)
    setSearchTerm('')
  }

  const hasActiveFilters = filterAnnonceur !== 'all' || filterSujet !== 'all' || filterStatut !== 'all' || filterType !== 'all' || searchTerm !== ''

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-gray-500">Chargement...</div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">E-Cards</h1>
        <Link
          to="/ecards/new"
          className="bg-gold hover:bg-gold-strong text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
          <Plus size={20} />
          Nouveau
        </Link>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-300 rounded-lg flex items-start gap-3">
          <AlertCircle size={20} className="text-red-600 mt-0.5 flex-shrink-0" />
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {/* Search and Filter */}
      <div className="mb-6 space-y-4">
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 text-gray-500" size={20} />
            <input
              type="text"
              placeholder="Rechercher par nom, millésime..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-navy-800 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:border-gold"
            />
          </div>
          <select
            value={filterPublished}
            onChange={(e) => setFilterPublished(e.target.value)}
            className="px-4 py-2 bg-navy-800 border border-gray-300 rounded-lg text-gray-900 focus:border-gold"
          >
            <option value="all">Toutes</option>
            <option value="published">Publiées</option>
            <option value="unpublished">Non publiées</option>
          </select>
        </div>

        {/* Dropdown Filters */}
        <div className="flex gap-3 flex-wrap items-center">
          <select value={filterAnnonceur} onChange={(e) => setFilterAnnonceur(e.target.value)}
            className="px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-md text-gray-700 focus:border-gold">
            <option value="all">Annonceur: Tous</option>
            {uniqueAnnonceurs.map(v => <option key={v} value={v}>{v}</option>)}
          </select>

          <select value={filterType} onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-md text-gray-700 focus:border-gold">
            <option value="all">Type: Tous</option>
            <option value="video">Vidéo</option>
            <option value="link">Lien</option>
          </select>

          <select value={filterSujet} onChange={(e) => setFilterSujet(e.target.value)}
            className="px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-md text-gray-700 focus:border-gold">
            <option value="all">Millésime: Tous</option>
            {uniqueSujets.map(v => <option key={v} value={v}>{v}</option>)}
          </select>

          <select value={filterStatut} onChange={(e) => setFilterStatut(e.target.value)}
            className="px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-md text-gray-700 focus:border-gold">
            <option value="all">Statut: Tous</option>
            <option value="published">Publiée</option>
            <option value="unpublished">Brouillon</option>
          </select>

          {hasActiveFilters && (
            <button onClick={resetFilters}
              className="px-3 py-1.5 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors">
              Réinitialiser filtres
            </button>
          )}
        </div>
      </div>

      {/* E-Cards Table */}
      <div className="bg-navy-800 rounded-lg border border-gray-200 overflow-hidden">
        {filteredEcards.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Aucune e-card trouvée
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-navy-700 border-b border-gray-300">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600 cursor-pointer hover:bg-gray-100 select-none" onClick={() => handleSort('advertiser_name')}>
                    <div className="flex items-center gap-1">
                      Annonceur <SortIcon column="advertiser_name" />
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600 cursor-pointer hover:bg-gray-100 select-none" onClick={() => handleSort('topic')}>
                    <div className="flex items-center gap-1">
                      Millésime <SortIcon column="topic" />
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600 cursor-pointer hover:bg-gray-100 select-none" onClick={() => handleSort('views')}>
                    <div className="flex items-center gap-1">
                      Vues <SortIcon column="views" />
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600 cursor-pointer hover:bg-gray-100 select-none" onClick={() => handleSort('likes')}>
                    <div className="flex items-center gap-1">
                      Likes <SortIcon column="likes" />
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600 cursor-pointer hover:bg-gray-100 select-none" onClick={() => handleSort('score_avg')}>
                    <div className="flex items-center gap-1">
                      Score <SortIcon column="score_avg" />
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600 cursor-pointer hover:bg-gray-100 select-none" onClick={() => handleSort('is_published')}>
                    <div className="flex items-center gap-1">
                      Statut <SortIcon column="is_published" />
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-600">
                {filteredEcards.map((card) => (
                  <tr key={card.id} className="hover:bg-gray-100 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {card.advertiser_name || '—'}
                    </td>
                    <td className="px-6 py-4 text-sm text-center">
                      {card.video_url ? (
                        <Video className="w-4 h-4 text-purple-400 mx-auto" />
                      ) : (
                        <Link2 className="w-4 h-4 text-blue-400 mx-auto" />
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {card.topic || '—'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {card.views || 0}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {card.likes || 0}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {card.score_avg > 0 ? card.score_avg.toFixed(1) : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className=`px-3 py-1 rounded-full text-xs font-medium ${card.is_published ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`>
                        {card.is_published ? 'Publiée' : 'Brouillon'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/ecards/${card.id}`}
                          className="p-2 hover:bg-gray-200 rounded transition-colors text-blue-600 hover:text-blue-800"
                        >
                          <Edit2 size={18} />
                        </Link>
                        <button
                          onClick={() => handleDelete(card.id)}
                          className="p-2 hover:bg-gray-200 rounded transition-colors text-red-600 hover:text-red-300"
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
