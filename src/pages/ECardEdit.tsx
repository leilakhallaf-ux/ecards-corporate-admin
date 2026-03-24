import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ECard } from '../lib/types'
import { AlertCircle, Save, ChevronLeft, X } from 'lucide-react'

export default function ECardEdit() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [card, setCard] = useState<Partial<ECard> | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tagInput, setTagInput] = useState('')

  useEffect(() => {
    fetchCard()
  }, [id])

  const fetchCard = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('e_cards')
        .select('*')
        .eq('id', id)
        .single()

      if (fetchError) throw fetchError
      setCard(data)
    } catch (err) {
      console.error('Error fetching card:', err)
      setError('Erreur lors du chargement de l\'e-card')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setCard((prev) => prev ? { ...prev, [field]: value } : null)
  }

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault()
      const newTags = [...(card?.tags || []), tagInput.trim()]
      handleInputChange('tags', newTags)
      setTagInput('')
    }
  }

  const handleRemoveTag = (index: number) => {
    const newTags = card?.tags?.filter((_, i) => i !== index) || []
    handleInputChange('tags', newTags)
  }

  const handleSave = async () => {
    if (!card || !id) return

    try {
      setSaving(true)
      setError(null)

      const { error: updateError } = await supabase
        .from('e_cards')
        .update({
          advertiser_name: card.advertiser_name,
          business_sector: card.business_sector,
          language: card.language,
          card_type: card.card_type,
          topic: card.topic,
          description: card.description,
          tags: card.tags,
          is_published: card.is_published,
          is_featured: card.is_featured,
          admin_score: card.admin_score,
          target_audience: card.target_audience,
          key_message: card.key_message,
          tone: card.tone,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)

      if (updateError) throw updateError

      navigate('/ecards')
    } catch (err) {
      console.error('Error saving card:', err)
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

  if (!card) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">E-card non trouvée</p>
      </div>
    )
  }

  return (
    <div>
      <button
        onClick={() => navigate('/ecards')}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6 transition-colors"
      >
        <ChevronLeft size={20} />
        Retour
      </button>

      <h1 className="text-3xl font-bold text-gray-900 mb-8">Éditer E-Card</h1>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-300 rounded-lg flex items-start gap-3">
          <AlertCircle size={20} className="text-red-600 mt-0.5 flex-shrink-0" />
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      <div className="bg-navy-800 rounded-lg border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Basic Information */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">
              Nom de l'annonceur
            </label>
            <input
              type="text"
              value={card.advertiser_name || ''}
              onChange={(e) => handleInputChange('advertiser_name', e.target.value)}
              className="w-full px-4 py-2 bg-navy-700 border border-gray-300 rounded-lg text-gray-900 focus:border-gold"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">
              Secteur d'activité
            </label>
            <input
              type="text"
              value={card.business_sector || ''}
              onChange={(e) => handleInputChange('business_sector', e.target.value)}
              className="w-full px-4 py-2 bg-navy-700 border border-gray-300 rounded-lg text-gray-900 focus:border-gold"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">
              Langue
            </label>
            <input
              type="text"
              value={card.language || ''}
              onChange={(e) => handleInputChange('language', e.target.value)}
              className="w-full px-4 py-2 bg-navy-700 border border-gray-300 rounded-lg text-gray-900 focus:border-gold"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">
              Type de carte
            </label>
            <input
              type="text"
              value={card.card_type || ''}
              onChange={(e) => handleInputChange('card_type', e.target.value)}
              className="w-full px-4 py-2 bg-navy-700 border border-gray-300 rounded-lg text-gray-900 focus:border-gold"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">
              Sujet
            </label>
            <input
              type="text"
              value={card.topic || ''}
              onChange={(e) => handleInputChange('topic', e.target.value)}
              className="w-full px-4 py-2 bg-navy-700 border border-gray-300 rounded-lg text-gray-900 focus:border-gold"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">
              Ton
            </label>
            <input
              type="text"
              value={card.tone || ''}
              onChange={(e) => handleInputChange('tone', e.target.value)}
              className="w-full px-4 py-2 bg-navy-700 border border-gray-300 rounded-lg text-gray-900 focus:border-gold"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">
              Audience cible
            </label>
            <input
              type="text"
              value={card.target_audience || ''}
              onChange={(e) => handleInputChange('target_audience', e.target.value)}
              className="w-full px-4 py-2 bg-navy-700 border border-gray-300 rounded-lg text-gray-900 focus:border-gold"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">
              Score admin (0-5)
            </label>
            <input
              type="number"
              min="0"
              max="5"
              value={card.admin_score || 0}
              onChange={(e) => handleInputChange('admin_score', parseInt(e.target.value))}
              className="w-full px-4 py-2 bg-navy-700 border border-gray-300 rounded-lg text-gray-900 focus:border-gold"
            />
          </div>
        </div>

        {/* Description */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-600 mb-2">
            Description
          </label>
          <textarea
            value={card.description || ''}
            onChange={(e) => handleInputChange('description', e.target.value)}
            rows={4}
            className="w-full px-4 py-2 bg-navy-700 border border-gray-300 rounded-lg text-gray-900 focus:border-gold"
          />
        </div>

        {/* Key Message */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-600 mb-2">
            Message clé
          </label>
          <textarea
            value={card.key_message || ''}
            onChange={(e) => handleInputChange('key_message', e.target.value)}
            rows={2}
            className="w-full px-4 py-2 bg-navy-700 border border-gray-300 rounded-lg text-gray-900 focus:border-gold"
          />
        </div>

        {/* Tags */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-600 mb-2">
            Étiquettes
          </label>
          <div className="mb-3 flex flex-wrap gap-2">
            {card.tags?.map((tag, index) => (
              <div
                key={index}
                className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-sm flex items-center gap-2"
              >
                {tag}
                <button
                  onClick={() => handleRemoveTag(index)}
                  className="hover:text-blue-600"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyPress={handleAddTag}
            placeholder="Ajouter une étiquette (appuyez sur Entrée)"
            className="w-full px-4 py-2 bg-navy-700 border border-gray-300 rounded-lg text-gray-900 focus:border-gold"
          />
        </div>

        {/* Toggles */}
        <div className="mb-6 space-y-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={card.is_published || false}
              onChange={(e) => handleInputChange('is_published', e.target.checked)}
              className="w-4 h-4 rounded bg-navy-700 border-gray-300"
            />
            <span className="text-gray-600">Publiée</span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={card.is_featured || false}
              onChange={(e) => handleInputChange('is_featured', e.target.checked)}
              className="w-4 h-4 rounded bg-navy-700 border-gray-300"
            />
            <span className="text-gray-600">En vedette</span>
          </label>
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
            onClick={() => navigate('/ecards')}
            className="bg-gray-200 hover:bg-gray-300 text-gray-900 px-6 py-2 rounded-lg transition-colors"
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  )
}
