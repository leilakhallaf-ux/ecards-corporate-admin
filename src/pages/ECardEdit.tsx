import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ECard } from '../lib/types'
import { AlertCircle, Save, ChevronLeft, X, Plus, Upload, Loader2 } from 'lucide-react'

const LANGUAGES = [
  { value: 'fr', label: 'Français' },
  { value: 'en', label: 'English' },
  { value: 'de', label: 'Deutsch' },
  { value: 'es', label: 'Español' },
  { value: 'it', label: 'Italiano' },
  { value: 'pt', label: 'Português' },
  { value: 'nl', label: 'Nederlands' },
  { value: 'ja', label: '日本語' },
  { value: 'zh', label: '中文' },
]

const CARD_TYPES = [
  { value: 'voeux', label: 'Voeux' },
  { value: 'invitation', label: 'Invitation' },
  { value: 'remerciement', label: 'Remerciement' },
  { value: 'anniversaire', label: 'Anniversaire' },
  { value: 'evenement', label: 'Événement' },
  { value: 'promotion', label: 'Promotion' },
  { value: 'autre', label: 'Autre' },
]

const emptyCard: Partial<ECard> = {
  advertiser_name: '',
  url: '',
  business_sector: '',
  thumbnail_url: '',
  advertiser_logo_url: '',
  vintage: new Date().getFullYear(),
  language: 'fr',
  card_type: '',
  version: '',
  topic: '',
  technology: '',
  distributor: '',
  tags: [],
  campaign_aim: '',
  target_audience: '',
  key_message: '',
  tone: '',
  submitted_by: '',
  submitted_capacity: '',
  agency: '',
  credits: null,
  description: '',
  is_published: false,
  is_featured: false,
}

export default function ECardEdit() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isNew = id === 'new'
  const [card, setCard] = useState<Partial<ECard> | null>(isNew ? { ...emptyCard } : null)
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tagInput, setTagInput] = useState('')
  const [extraCredits, setExtraCredits] = useState<Array<{ role: string; name: string }>>([])
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const thumbnailInputRef = useRef<HTMLInputElement>(null)
  const logoInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!isNew) {
      fetchCard()
    }
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
      // Parse extra credits from credits JSON
      if (data?.credits && typeof data.credits === 'object') {
        const entries = Object.entries(data.credits).map(([role, name]) => ({
          role,
          name: name as string,
        }))
        setExtraCredits(entries)
      }
    } catch (err) {
      console.error('Error fetching card:', err)
      setError("Erreur lors du chargement de l'e-card")
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setCard((prev) => (prev ? { ...prev, [field]: value } : null))
  }

  const handleAddTag = () => {
    if (tagInput.trim()) {
      const newTags = [...(card?.tags || []), tagInput.trim()]
      handleInputChange('tags', newTags)
      setTagInput('')
    }
  }

  const handleTagKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddTag()
    }
  }

  const handleRemoveTag = (index: number) => {
    const newTags = card?.tags?.filter((_, i) => i !== index) || []
    handleInputChange('tags', newTags)
  }

  const handleAddCredit = () => {
    setExtraCredits([...extraCredits, { role: '', name: '' }])
  }

  const handleCreditChange = (index: number, field: 'role' | 'name', value: string) => {
    const updated = [...extraCredits]
    updated[index][field] = value
    setExtraCredits(updated)
  }

  const handleRemoveCredit = (index: number) => {
    setExtraCredits(extraCredits.filter((_, i) => i !== index))
  }

  const handleFileUpload = async (
    file: File,
    bucket: 'thumbnails' | 'logos',
    field: 'thumbnail_url' | 'advertiser_logo_url'
  ) => {
    const setUploading = bucket === 'thumbnails' ? setUploadingThumbnail : setUploadingLogo
    setUploading(true)
    setError(null)

    try {
      // Generate unique filename
      const ext = file.name.split('.').pop()?.toLowerCase() || 'png'
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) throw uploadError

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from(bucket).getPublicUrl(fileName)

      handleInputChange(field, publicUrl)
    } catch (err: any) {
      console.error('Upload failed:', err)
      setError(`Erreur upload : ${err.message || 'Erreur inconnue'}`)
    } finally {
      setUploading(false)
    }
  }

  const validate = (): string | null => {
    if (!card?.advertiser_name?.trim()) return "L'annonceur est requis"
    if (!card?.vintage) return 'Le millésime est requis'
    if (!card?.card_type?.trim()) return 'Le type de carte est requis'
    if (!card?.language?.trim()) return 'La langue est requise'
    if (!card?.submitted_by?.trim()) return '"Soumise par" est requis'
    if (!card?.tags || card.tags.length === 0) return 'Au moins 1 tag est requis'
    return null
  }

  const handleSave = async () => {
    if (!card) return

    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }

    try {
      setSaving(true)
      setError(null)

      // Build credits object from extra credits
      const creditsObj: Record<string, string> = {}
      extraCredits.forEach(({ role, name }) => {
        if (role.trim() && name.trim()) {
          creditsObj[role.trim()] = name.trim()
        }
      })

      const cardData = {
        advertiser_name: card.advertiser_name,
        url: card.url || null,
        business_sector: card.business_sector || null,
        thumbnail_url: card.thumbnail_url || null,
        advertiser_logo_url: card.advertiser_logo_url || null,
        vintage: card.vintage,
        language: card.language,
        card_type: card.card_type,
        version: card.version || null,
        topic: card.topic || null,
        technology: card.technology || null,
        distributor: card.distributor || null,
        tags: card.tags,
        campaign_aim: card.campaign_aim || null,
        target_audience: card.target_audience || null,
        key_message: card.key_message || null,
        tone: card.tone || null,
        submitted_by: card.submitted_by,
        submitted_capacity: card.submitted_capacity || null,
        agency: card.agency || null,
        credits: Object.keys(creditsObj).length > 0 ? creditsObj : null,
        description: card.description || null,
        is_published: card.is_published || false,
        is_featured: card.is_featured || false,
        updated_at: new Date().toISOString(),
      }

      if (isNew) {
        const { error: insertError } = await supabase
          .from('e_cards')
          .insert({ ...cardData, created_at: new Date().toISOString() })

        if (insertError) throw insertError
      } else {
        const { error: updateError } = await supabase
          .from('e_cards')
          .update(cardData)
          .eq('id', id)

        if (updateError) throw updateError
      }

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

  const inputClass =
    'w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:border-gold focus:ring-1 focus:ring-gold outline-none transition-colors'
  const selectClass =
    'w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 focus:border-gold focus:ring-1 focus:ring-gold outline-none transition-colors'
  const labelClass = 'block text-sm font-medium text-gray-600 mb-1.5'
  const sectionTitleClass = 'text-lg font-semibold text-gold mb-4'

  return (
    <div>
      <button
        onClick={() => navigate('/ecards')}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4 transition-colors"
      >
        <ChevronLeft size={20} />
        Retour
      </button>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        {isNew ? 'Nouvelle E-Card' : 'Éditer E-Card'}
      </h1>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-300 rounded-lg flex items-start gap-3">
          <AlertCircle size={20} className="text-red-600 mt-0.5 flex-shrink-0" />
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {/* ===== SECTION: Annonceur ===== */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6 shadow-sm">
        <h2 className={sectionTitleClass}>Annonceur</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className={labelClass}>Annonceur *</label>
            <input
              type="text"
              value={card.advertiser_name || ''}
              onChange={(e) => handleInputChange('advertiser_name', e.target.value)}
              placeholder="Annonceur *"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Lien e-card *</label>
            <input
              type="url"
              value={card.url || ''}
              onChange={(e) => handleInputChange('url', e.target.value)}
              placeholder="Lien e-card * (https://...)"
              className={inputClass}
            />
          </div>
          <div className="md:col-span-1">
            <label className={labelClass}>Secteur d'activité (optionnel)</label>
            <input
              type="text"
              value={card.business_sector || ''}
              onChange={(e) => handleInputChange('business_sector', e.target.value)}
              placeholder="Secteur d'activité (optionnel)"
              className={inputClass}
            />
          </div>
        </div>

        {/* Thumbnail & Logo */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
          <div>
            <label className={labelClass}>Thumbnail *</label>
            <input
              ref={thumbnailInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleFileUpload(file, 'thumbnails', 'thumbnail_url')
                e.target.value = ''
              }}
            />
            <div className="flex items-start gap-3">
              <button
                type="button"
                onClick={() => thumbnailInputRef.current?.click()}
                disabled={uploadingThumbnail}
                className="w-16 h-16 bg-gray-100 border border-gray-300 rounded-lg flex items-center justify-center text-gray-400 flex-shrink-0 hover:bg-gray-200 hover:border-gold cursor-pointer transition-colors disabled:opacity-50"
              >
                {uploadingThumbnail ? (
                  <Loader2 size={24} className="animate-spin text-gold" />
                ) : card.thumbnail_url ? (
                  <img
                    src={card.thumbnail_url}
                    alt="Thumbnail"
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <Upload size={24} />
                )}
              </button>
              <div className="flex-1">
                <input
                  type="url"
                  value={card.thumbnail_url || ''}
                  onChange={(e) => handleInputChange('thumbnail_url', e.target.value)}
                  placeholder="...ou coller une URL"
                  className={inputClass}
                />
              </div>
            </div>
          </div>
          <div>
            <label className={labelClass}>Logo annonceur</label>
            <input
              ref={logoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleFileUpload(file, 'logos', 'advertiser_logo_url')
                e.target.value = ''
              }}
            />
            <div className="flex items-start gap-3">
              <button
                type="button"
                onClick={() => logoInputRef.current?.click()}
                disabled={uploadingLogo}
                className="w-16 h-16 bg-gray-100 border border-gray-300 rounded-lg flex items-center justify-center text-gray-400 flex-shrink-0 hover:bg-gray-200 hover:border-gold cursor-pointer transition-colors disabled:opacity-50"
              >
                {uploadingLogo ? (
                  <Loader2 size={24} className="animate-spin text-gold" />
                ) : card.advertiser_logo_url ? (
                  <img
                    src={card.advertiser_logo_url}
                    alt="Logo"
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <Upload size={24} />
                )}
              </button>
              <div className="flex-1">
                <input
                  type="url"
                  value={card.advertiser_logo_url || ''}
                  onChange={(e) => handleInputChange('advertiser_logo_url', e.target.value)}
                  placeholder="...ou coller une URL"
                  className={inputClass}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== SECTION: E-Card ===== */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6 shadow-sm">
        <h2 className={sectionTitleClass}>E-Card</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className={labelClass}>Millésime *</label>
            <input
              type="number"
              value={card.vintage || ''}
              onChange={(e) => handleInputChange('vintage', parseInt(e.target.value) || null)}
              placeholder="Millésime * (ex: 2023)"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Langue *</label>
            <select
              value={card.language || ''}
              onChange={(e) => handleInputChange('language', e.target.value)}
              className={selectClass}
            >
              <option value="">Langue *</option>
              {LANGUAGES.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Type de carte *</label>
            <select
              value={card.card_type || ''}
              onChange={(e) => handleInputChange('card_type', e.target.value)}
              className={selectClass}
            >
              <option value="">Type de carte *</option>
              {CARD_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Version (optionnel)</label>
            <input
              type="text"
              value={card.version || ''}
              onChange={(e) => handleInputChange('version', e.target.value)}
              placeholder="Version (optionnel)"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Thème (optionnel)</label>
            <input
              type="text"
              value={card.topic || ''}
              onChange={(e) => handleInputChange('topic', e.target.value)}
              placeholder="Thème (optionnel)"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Technologie (optionnel)</label>
            <input
              type="text"
              value={card.technology || ''}
              onChange={(e) => handleInputChange('technology', e.target.value)}
              placeholder="Technologie (optionnel)"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Diffuseur (optionnel)</label>
            <input
              type="text"
              value={card.distributor || ''}
              onChange={(e) => handleInputChange('distributor', e.target.value)}
              placeholder="Diffuseur (optionnel)"
              className={inputClass}
            />
          </div>
        </div>

        {/* Tags */}
        <div className="mt-5">
          <label className={labelClass}>Tags * (au moins 1)</label>
          <div className="mb-2 flex flex-wrap gap-2">
            {card.tags?.map((tag, index) => (
              <div
                key={index}
                className="bg-gold/20 text-gold-strong px-3 py-1 rounded-full text-sm flex items-center gap-1.5"
              >
                {tag}
                <button onClick={() => handleRemoveTag(index)} className="hover:text-red-600">
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={handleTagKeyPress}
              placeholder="Ajouter un tag..."
              className={`flex-1 ${inputClass}`}
            />
            <button
              type="button"
              onClick={handleAddTag}
              className="bg-gold hover:bg-gold-strong text-white px-3 py-2 rounded-lg transition-colors"
            >
              <Plus size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* ===== SECTION: Campagne (optionnel) ===== */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6 shadow-sm">
        <h2 className={sectionTitleClass}>Campagne (optionnel)</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className={labelClass}>Objectif campagne</label>
            <input
              type="text"
              value={card.campaign_aim || ''}
              onChange={(e) => handleInputChange('campaign_aim', e.target.value)}
              placeholder="Objectif campagne"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Public cible</label>
            <input
              type="text"
              value={card.target_audience || ''}
              onChange={(e) => handleInputChange('target_audience', e.target.value)}
              placeholder="Public cible"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Message-clé</label>
            <input
              type="text"
              value={card.key_message || ''}
              onChange={(e) => handleInputChange('key_message', e.target.value)}
              placeholder="Message-clé"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Tonalité</label>
            <input
              type="text"
              value={card.tone || ''}
              onChange={(e) => handleInputChange('tone', e.target.value)}
              placeholder="Tonalité"
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {/* ===== SECTION: Credits ===== */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6 shadow-sm">
        <h2 className={sectionTitleClass}>Credits</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className={labelClass}>Soumise par *</label>
            <input
              type="text"
              value={card.submitted_by || ''}
              onChange={(e) => handleInputChange('submitted_by', e.target.value)}
              placeholder="Soumise par *"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>En qualité de (optionnel)</label>
            <input
              type="text"
              value={card.submitted_capacity || ''}
              onChange={(e) => handleInputChange('submitted_capacity', e.target.value)}
              placeholder="En qualité de (optionnel)"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Agence (optionnel)</label>
            <input
              type="text"
              value={card.agency || ''}
              onChange={(e) => handleInputChange('agency', e.target.value)}
              placeholder="Agence (optionnel)"
              className={inputClass}
            />
          </div>
        </div>

        {/* Extra credits */}
        <div className="mt-5">
          <label className="block text-sm text-gray-500 mb-2">
            Crédits supplémentaires (optionnel)
          </label>
          {extraCredits.map((credit, index) => (
            <div key={index} className="flex gap-2 mb-2">
              <input
                type="text"
                value={credit.role}
                onChange={(e) => handleCreditChange(index, 'role', e.target.value)}
                placeholder="Rôle"
                className={`flex-1 ${inputClass}`}
              />
              <input
                type="text"
                value={credit.name}
                onChange={(e) => handleCreditChange(index, 'name', e.target.value)}
                placeholder="Nom"
                className={`flex-1 ${inputClass}`}
              />
              <button
                onClick={() => handleRemoveCredit(index)}
                className="p-2 text-red-500 hover:text-red-700 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={handleAddCredit}
            className="text-gold hover:text-gold-strong text-sm flex items-center gap-1 mt-1 transition-colors"
          >
            <Plus size={16} />
            Ajouter un crédit
          </button>
        </div>
      </div>

      {/* ===== SECTION: Description & Statut ===== */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6 shadow-sm">
        <h2 className={sectionTitleClass}>Description & Statut</h2>
        <div className="mb-5">
          <label className={labelClass}>Description</label>
          <textarea
            value={card.description || ''}
            onChange={(e) => handleInputChange('description', e.target.value)}
            rows={5}
            placeholder="Description..."
            className={inputClass}
          />
        </div>

        {/* Toggles */}
        <div className="flex gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={card.is_published || false}
              onChange={(e) => handleInputChange('is_published', e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-gold focus:ring-gold"
            />
            <span className="text-sm text-gray-600">Publiée</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={card.is_featured || false}
              onChange={(e) => handleInputChange('is_featured', e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-gold focus:ring-gold"
            />
            <span className="text-sm text-gray-600">En vedette</span>
          </label>
        </div>
      </div>

      {/* ===== Save Button ===== */}
      <div className="flex gap-4 mb-8">
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-gold hover:bg-gold-strong disabled:bg-gray-300 text-white px-8 py-2.5 rounded-lg flex items-center gap-2 transition-colors font-medium"
        >
          <Save size={20} />
          {saving ? 'Enregistrement...' : isNew ? 'Créer' : 'Enregistrer'}
        </button>
        <button
          onClick={() => navigate('/ecards')}
          className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-2.5 rounded-lg transition-colors"
        >
          Annuler
        </button>
      </div>
    </div>
  )
}
