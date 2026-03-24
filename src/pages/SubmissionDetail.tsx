import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ECardSubmission } from '../lib/types'
import { AlertCircle, Save, ChevronLeft } from 'lucide-react'

export default function SubmissionDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [submission, setSubmission] = useState<Partial<ECardSubmission> | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchSubmission()
  }, [id])

  const fetchSubmission = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('ecard_submissions')
        .select('*')
        .eq('id', id)
        .single()

      if (fetchError) throw fetchError
      setSubmission(data)
    } catch (err) {
      console.error('Error fetching submission:', err)
      setError('Erreur lors du chargement de la soumission')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setSubmission((prev) => (prev ? { ...prev, [field]: value } : null))
  }

  const handleSave = async () => {
    if (!submission || !id) return

    try {
      setSaving(true)
      setError(null)

      const { error: updateError } = await supabase
        .from('ecard_submissions')
        .update({
          status: submission.status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)

      if (updateError) throw updateError

      navigate('/submissions')
    } catch (err) {
      console.error('Error saving submission:', err)
      setError('Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-gray-500">Chargement...</div>
      </div>
    )
  }

  if (!submission) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Soumission non trouvée</p>
      </div>
    )
  }

  return (
    <div>
      <button
        onClick={() => navigate('/submissions')}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6 transition-colors"
      >
        <ChevronLeft size={20} />
        Retour
      </button>

      <h1 className="text-3xl font-bold text-gray-900 mb-8">Détail de la soumission</h1>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-300 rounded-lg flex items-start gap-3">
          <AlertCircle size={20} className="text-red-600 mt-0.5 flex-shrink-0" />
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      <div className="bg-navy-800 rounded-lg border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">
              Nom de l'annonceur
            </label>
            <input
              type="text"
              value={submission.advertiser_name || ''}
              disabled
              className="w-full px-4 py-2 bg-navy-700 border border-gray-300 rounded-lg text-gray-500 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">
              Secteur d'activité
            </label>
            <input
              type="text"
              value={submission.business_sector || ''}
              disabled
              className="w-full px-4 py-2 bg-navy-700 border border-gray-300 rounded-lg text-gray-500 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">
              Type de carte
            </label>
            <input
              type="text"
              value={submission.card_type || ''}
              disabled
              className="w-full px-4 py-2 bg-navy-700 border border-gray-300 rounded-lg text-gray-500 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">
              Langue
            </label>
            <input
              type="text"
              value={submission.language || ''}
              disabled
              className="w-full px-4 py-2 bg-navy-700 border border-gray-300 rounded-lg text-gray-500 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">
              Soumissionnaire
            </label>
            <input
              type="text"
              value={submission.submitted_by || ''}
              disabled
              className="w-full px-4 py-2 bg-navy-700 border border-gray-300 rounded-lg text-gray-500 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">
              Capacité
            </label>
            <input
              type="text"
              value={submission.submitted_capacity || ''}
              disabled
              className="w-full px-4 py-2 bg-navy-700 border border-gray-300 rounded-lg text-gray-500 cursor-not-allowed"
            />
          </div>
        </div>

        {/* Agency (optional) */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-600 mb-2">
            Agence
          </label>
          <input
            type="text"
            value={submission.agency || ''}
            disabled
            className="w-full px-4 py-2 bg-navy-700 border border-gray-300 rounded-lg text-gray-500 cursor-not-allowed"
          />
        </div>

        {/* Description */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-600 mb-2">
            Description
          </label>
          <textarea
            value={submission.description || ''}
            disabled
            rows={4}
            className="w-full px-4 py-2 bg-navy-700 border border-gray-300 rounded-lg text-gray-500 cursor-not-allowed"
          />
        </div>

        {/* Status */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-600 mb-2">
            Statut
          </label>
          <select
            value={submission.status || 'new'}
            onChange={(e) => handleInputChange('status', e.target.value)}
            className="w-full px-4 py-2 bg-navy-700 border border-gray-300 rounded-lg text-gray-900 focus:border-gold"
          >
            <option value="new">Nouveau</option>
            <option value="pending">En attente</option>
            <option value="approved">Approuvée</option>
            <option value="rejected">Rejetée</option>
          </select>
        </div>

        {/* Save Button */}
        <div className="flex gap-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-gold hover:bg-gold-strong disabled:bg-gray-300 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Save size={20} />
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
          <button
            onClick={() => navigate('/submissions')}
            className="bg-gray-200 hover:bg-gray-300 text-gray-900 px-6 py-2 rounded-lg transition-colors"
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  )
}
