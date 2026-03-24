import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { DashboardStats } from '../lib/types'
import { BarChart3, Heart, Eye, Mail, AlertCircle } from 'lucide-react'

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalECards: 0,
    totalViews: 0,
    totalLikes: 0,
    newMessages: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch e-cards stats
        const { data: ecardsData, error: ecardsError } = await supabase
          .from('e_cards')
          .select('views, likes')

        if (ecardsError) throw ecardsError

        const totalECards = ecardsData?.length || 0
        const totalViews = ecardsData?.reduce((sum, card) => sum + (card.views || 0), 0) || 0
        const totalLikes = ecardsData?.reduce((sum, card) => sum + (card.likes || 0), 0) || 0

        // Fetch new messages count
        const { data: messagesData, error: messagesError } = await supabase
          .from('contact_messages')
          .select('id')
          .eq('status', 'new')

        if (messagesError) throw messagesError

        const newMessages = messagesData?.length || 0

        setStats({
          totalECards,
          totalViews,
          totalLikes,
          newMessages,
        })
      } catch (err) {
        console.error('Error fetching stats:', err)
        setError('Erreur lors du chargement des statistiques')
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-gray-500">Chargement...</div>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Tableau de bord</h1>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-300 rounded-lg flex items-start gap-3">
          <AlertCircle size={20} className="text-red-600 mt-0.5 flex-shrink-0" />
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total E-Cards */}
        <div className="bg-navy-800 rounded-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">E-Cards totales</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalECards}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <BarChart3 size={24} className="text-blue-500" />
            </div>
          </div>
        </div>

        {/* Total Views */}
        <div className="bg-navy-800 rounded-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Vues totales</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalViews}</p>
            </div>
            <div className="p-3 bg-green-600/20 rounded-lg">
              <Eye size={24} className="text-green-500" />
            </div>
          </div>
        </div>

        {/* Total Likes */}
        <div className="bg-navy-800 rounded-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Likes totaux</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalLikes}</p>
            </div>
            <div className="p-3 bg-pink-600/20 rounded-lg">
              <Heart size={24} className="text-pink-500" />
            </div>
          </div>
        </div>

        {/* New Messages */}
        <div className="bg-navy-800 rounded-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Messages non lus</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.newMessages}</p>
            </div>
            <div className="p-3 bg-yellow-600/20 rounded-lg">
              <Mail size={24} className="text-yellow-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Summary */}
      <div className="mt-8 bg-navy-800 rounded-lg p-6 border border-gray-200">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Résumé</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-600">
          <div>
            <p className="text-sm">
              Vous avez actuellement <span className="font-semibold text-gray-900">{stats.totalECards}</span> e-cards en ligne.
            </p>
          </div>
          <div>
            <p className="text-sm">
              Elles ont généré un total de <span className="font-semibold text-gray-900">{stats.totalViews}</span> vues.
            </p>
          </div>
          <div>
            <p className="text-sm">
              Les utilisateurs ont donné <span className="font-semibold text-gray-900">{stats.totalLikes}</span> likes.
            </p>
          </div>
          <div>
            <p className="text-sm">
              Vous avez <span className="font-semibold text-gray-900">{stats.newMessages}</span> message(s) non lu(s).
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
