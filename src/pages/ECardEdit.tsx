import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ECard, ECardVariant, VARIANT_TYPES } from '../lib/types'
import { AlertCircle, Save, ChevronLeft, X, Plus, Upload, Loader2, Film, Play, Maximize2, ChevronUp, ChevronDown, GitBranch, ExternalLink } from 'lucide-react'

const LANGUAGES = [
  { value: 'fr', label: 'FranÃ§ais' },
  { value: 'en', label: 'English' },
  { value: 'de', label: 'Deutsch' },
  { value: 'es', label: 'EspaÃ±ol' },
  { value: 'it', label: 'Italiano' },
  { value: 'pt', label: 'PortuguÃªs' },
  { value: 'nl', label: 'Nederlands' },
  { value: 'ja', label: 'æ¥æ¬èª' },
  { value: 'zh', label: 'ä¸­æ' },
]

const CARD_TYPES = [
  { value: 'voeux', label: 'Voeux' },
  { value: 'invitation', label: 'Invitation' },
  { value: 'remerciement', label: 'Remerciement' },
  { value: 'anniversaire', label: 'Anniversaire' },
  { value: 'evenement', label: 'ÃvÃ©nement' },
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
  video_url: '',
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
  const [uploadingVideo, setUploadingVideo] = useState(false)
  const [showVideoLightbox, setShowVideoLightbox] = useState(false)
  const [variants, setVariants] = useState<ECardVariant[]>([])
  const [newVariants, setNewVariants] = useState<Array<{ label: string; url: string; variant_type: string; language: string; custom_label: string }>>([])
  const [loadingVariants, setLoadingVariants] = useState(false)
  const [deletingVariantId, setDeletingVariantId] = useState<string | null>(null)
  const thumbnailInputRef = useRef<HTMLInputElement>(null)
  const logoInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!isNew) {
      fetchCard()
      fetchVariants()
    }
  }, [id])

  const fetchVariants = async () => {
    if (!id || isNew) return
    setLoadingVariants(true)
    try {
      const { data, error: fetchError } = await supabase
        .from('e_card_variants')
        .select('*')
        .eq('ecard_id', id)
        .order('sort_order', { ascending: true })
      if (fetchError) throw fetchError
      setVariants(data || [])
    } catch (err) {
      console.error('Error fetching variants:', err)
    } finally {
      setLoadingVariants(false)
    }
  }

  const handleAddNewVariant = () => {
    setNewVariants([...newVariants, { label: '', url: '', variant_type: 'anglaise', language: 'EN', custom_label: '' }])
  }

  const handleNewVariantChange = (index: number, field: string, value: string) => {
    const updated = [...newVariants]
    updated[index] = { ...updated[index], [field]: value }
    // Auto-set label based on type
    if (field === 'variant_type') {
      const typeLabel = VARIANT_TYPES.find(t => t.value === value)?.label || ''
      if (value !== 'autre') {
        updated[index].label = typeLabel
        updated[index].custom_label = ''
      } else {
        updated[index].label = ''
      }
      // Auto-set language
      if (value === 'anglaise') {
        updated[index].language = 'EN'
      } else {
        updated[index].language = 'FR'
      }
    }
    if (field === 'custom_label') {
      updated[index].label = value
    }
    setNewVariants(updated)
  }

  const handleRemoveNewVariant = (index: number) => {
    setNewVariants(newVariants.filter((_, i) => i !== index))
  }

  const handleDeleteVariant = async (variantId: string) => {
    if (!confirm('Supprimer cette variante ?')) return
    setDeletingVariantId(variantId)
    try {
      const { error: deleteError } = await supabase
        .from('e_card_variants')
        .delete()
        .eq('id', variantId)
      if (deleteError) throw deleteError
      setVariants(variants.filter(v => v.id !== variantId))
    } catch (err) {
      console.error('Error deleting variant:', err)
      setError('Erreur lors de la suppression de la variante')
    } finally {
      setDeletingVariantId(null)
    }
  }

  const fetchCard = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('e_cards')
        .select('*')
        .eq('id', id)
        .single()

      if (fetchError) throw fetchError
      setCard(data)

      // Parse extra credits - support both array (new) and object (legacy) formats
      if (data?.credits) {
        if (Array.isArray(data.credits)) {
          // New format: ordered array of {role, name}
          setExtraCredits(data.credits)
        } else if (typeof data.credits === 'object') {
          // Legacy format: {role: name} object (unordered)
          const entries = Object.entries(data.credits).map(([role, name]) => ({
            role,
            name: name as string,
          }))
          setExtraCredits(entries)
        }
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

  const handleMoveCredit = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= extraCredits.length) return
    const updated = [...extraCredits]
    const temp = updated[index]
    updated[index] = updated[newIndex]
    updated[newIndex] = temp
    setExtraCredits(updated)
  }

  const handleFileUpload = async (
    file: File,
    bucket: 'thumbnails' | 'logos' | 'videos',
    field: 'thumbnail_url' | 'advertiser_logo_url' | 'video_url'
  ) => {
    const setUploading =
      bucket === 'thumbnails'
        ? setUploadingThumbnail
        : bucket === 'logos'
          ? setUploadingLogo
          : setUploadingVideo

    setUploading(true)
    setError(null)

    try {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'png'
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) throw uploadError

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
    if (!card?.vintage) return 'Le millÃ©sime est requis'
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

      // Build credits array from extra credits (preserves order)
      const creditsArr = extraCredits
        .filter(({ role, name }) => role.trim() && name.trim())
        .map(({ role, name }) => ({ role: role.trim(), name: name.trim() }))

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
        credits: creditsArr.length > 0 ? creditsArr : null,
        description: card.description || null,
        is_published: card.is_published || false,
        is_featured: card.is_featured || false,
        video_url: card.video_url || null,
        updated_at: new Date().toISOString(),
      }

      if (isNew) {
        const { data: insertedData, error: insertError } = await supabase
          .from('e_cards')
          .insert({ ...cardData, created_at: new Date().toISOString() })
          .select()
        if (insertError) throw insertError

        // Save new variants for newly created card
        if (insertedData && insertedData[0] && newVariants.length > 0) {
          const masterId = insertedData[0].id
          const variantsToInsert = newVariants
            .filter(v => v.label.trim() && v.url.trim())
            .map((v, i) => ({
              ecard_id: masterId,
              label: v.label.trim(),
              url: v.url.trim(),
              variant_type: v.variant_type,
              language: v.language || 'FR',
              sort_order: i,
            }))
          if (variantsToInsert.length > 0) {
            const { error: variantError } = await supabase
              .from('e_card_variants')
              .insert(variantsToInsert)
            if (variantError) console.error('Error inserting variants:', variantError)
          }
        }
      } else {
        const { error: updateError } = await supabase
          .from('e_cards')
          .update(cardData)
          .eq('id', id)

        if (updateError) throw updateError

        // Save new variants for existing card
        if (newVariants.length > 0) {
          const variantsToInsert = newVariants
            .filter(v => v.label.trim() && v.url.trim())
            .map((v, i) => ({
              ecard_id: id,
              label: v.label.trim(),
              url: v.url.trim(),
              variant_type: v.variant_type,
              language: v.language || 'FR',
              sort_order: variants.length + i,
            }))
          if (variantsToInsert.length > 0) {
            const { error: variantError } = await supabase
              .from('e_card_variants')
              .insert(variantsToInsert)
            if (variantError) console.error('Error inserting variants:', variantError)
          }
        }
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
        <p className="text-red-600">E-card non trouvÃ©e</p>
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
        {isNew ? 'Nouvelle E-Card' : 'Ãditer E-Card'}
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
            <label className={labelClass}>Secteur d'activitÃ© (optionnel)</label>
            <input
              type="text"
              value={card.business_sector || ''}
              onChange={(e) => handleInputChange('business_sector', e.target.value)}
              placeholder="Secteur d'activitÃ© (optionnel)"
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

        {/* Video upload & preview */}
        <div className="mt-5">
          <label className={labelClass}>VidÃ©o (optionnel)</label>
          <input
            ref={videoInputRef}
            type="file"
            accept="video/mp4,video/webm,video/ogg"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleFileUpload(file, 'videos', 'video_url')
              e.target.value = ''
            }}
          />
          <div className="flex items-start gap-3">
            <button
              type="button"
              onClick={() =>
                card.video_url
                  ? setShowVideoLightbox(true)
                  : videoInputRef.current?.click()
              }
              disabled={uploadingVideo}
              className="w-24 h-16 bg-gray-900 border border-gray-300 rounded-lg flex items-center justify-center text-gray-400 flex-shrink-0 hover:border-gold cursor-pointer transition-colors disabled:opacity-50 relative overflow-hidden group"
              title={
                card.video_url ? 'Cliquer pour prÃ©visualiser' : 'Cliquer pour uploader'
              }
            >
              {uploadingVideo ? (
                <Loader2 size={24} className="animate-spin text-gold" />
              ) : card.video_url ? (
                <>
                  <video
                    src={card.video_url}
                    className="w-full h-full object-cover"
                    muted
                    preload="metadata"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Play size={20} className="text-white" fill="white" />
                  </div>
                  <div className="absolute top-0.5 right-0.5 bg-gold text-white text-[8px] font-bold px-1 rounded">
                    MP4
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center gap-0.5">
                  <Film size={20} />
                  <span className="text-[9px]">VidÃ©o</span>
                </div>
              )}
            </button>
            <div className="flex-1">
              <div className="flex gap-2">
                <input
                  type="url"
                  value={card.video_url || ''}
                  onChange={(e) => handleInputChange('video_url', e.target.value)}
                  placeholder="URL vidÃ©o ...ou uploader un fichier"
                  className={`flex-1 ${inputClass}`}
                />
                {card.video_url && (
                  <button
                    type="button"
                    onClick={() => setShowVideoLightbox(true)}
                    className="px-3 py-2 bg-gray-900 text-gold border border-gold rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-1.5 text-sm font-medium"
                    title="PrÃ©visualiser la vidÃ©o"
                  >
                    <Play size={14} fill="currentColor" />
                    Voir
                  </button>
                )}
                {!card.video_url && (
                  <button
                    type="button"
                    onClick={() => videoInputRef.current?.click()}
                    disabled={uploadingVideo}
                    className="px-3 py-2 bg-gold text-white rounded-lg hover:bg-gold-strong transition-colors flex items-center gap-1.5 text-sm disabled:opacity-50"
                  >
                    <Upload size={14} />
                    Upload
                  </button>
                )}
              </div>
              {card.video_url && (
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-[11px] text-gray-400 truncate">
                    {decodeURIComponent(card.video_url.split('/').pop() || '')}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleInputChange('video_url', '')}
                    className="text-red-400 hover:text-red-600 transition-colors"
                    title="Supprimer la vidÃ©o"
                  >
                    <X size={12} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Video Lightbox */}
      {showVideoLightbox && card.video_url && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-8"
          onClick={() => setShowVideoLightbox(false)}
        >
          <div
            className="relative max-w-4xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowVideoLightbox(false)}
              className="absolute -top-10 right-0 text-white hover:text-gold transition-colors flex items-center gap-2 text-sm"
            >
              Fermer <X size={20} />
            </button>
            <video
              controls
              autoPlay
              className="w-full rounded-lg shadow-2xl"
              src={card.video_url}
            >
              Votre navigateur ne supporte pas la lecture vidÃ©o.
            </video>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-gray-400 text-xs">
                {decodeURIComponent(card.video_url.split('/').pop() || '')}
              </span>
              <a
                href={card.video_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gold text-xs hover:underline flex items-center gap-1"
              >
                <Maximize2 size={12} />
                Ouvrir dans un nouvel onglet
              </a>
            </div>
          </div>
        </div>
      )}

            {/* ===== SECTION: Statistiques (read-only) ===== */}
      {!isNew && card && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6 shadow-sm">
          <h2 className={sectionTitleClass}>Statistiques</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-gray-900">{card.views ?? 0}</p>
              <p className="text-sm text-gray-500 mt-1">Vues</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-gray-900">{card.likes ?? 0}</p>
              <p className="text-sm text-gray-500 mt-1">Likes</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-gold">
                {card.score_avg && card.score_avg > 0 ? Number(card.score_avg).toFixed(1) : '-'}
              </p>
              <p className="text-sm text-gray-500 mt-1">Score moyen</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-gray-900">{card.score_count ?? 0}</p>
              <p className="text-sm text-gray-500 mt-1">Nb de votes</p>
            </div>
          </div>
        </div>
      )}
      {/* ===== SECTION: E-Card ===== */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6 shadow-sm">
        <h2 className={sectionTitleClass}>E-Card</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className={labelClass}>MillÃ©sime *</label>
            <input
              type="number"
              value={card.vintage || ''}
              onChange={(e) =>
                handleInputChange('vintage', parseInt(e.target.value) || null)
              }
              placeholder="MillÃ©sime * (ex: 2023)"
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
            <label className={labelClass}>ThÃ¨me (optionnel)</label>
            <input
              type="text"
              value={card.topic || ''}
              onChange={(e) => handleInputChange('topic', e.target.value)}
              placeholder="ThÃ¨me (optionnel)"
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
            <label className={labelClass}>Message-clÃ©</label>
            <input
              type="text"
              value={card.key_message || ''}
              onChange={(e) => handleInputChange('key_message', e.target.value)}
              placeholder="Message-clÃ©"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>TonalitÃ©</label>
            <input
              type="text"
              value={card.tone || ''}
              onChange={(e) => handleInputChange('tone', e.target.value)}
              placeholder="TonalitÃ©"
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
            <label className={labelClass}>En qualitÃ© de (optionnel)</label>
            <input
              type="text"
              value={card.submitted_capacity || ''}
              onChange={(e) => handleInputChange('submitted_capacity', e.target.value)}
              placeholder="En qualitÃ© de (optionnel)"
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

        {/* Extra credits with move up/down buttons */}
        <div className="mt-5">
          <label className="block text-sm text-gray-500 mb-2">
            CrÃ©dits supplÃ©mentaires (optionnel)
          </label>
          {extraCredits.map((credit, index) => (
            <div key={index} className="flex gap-2 mb-2 items-center">
              <div className="flex flex-col">
                <button
                  type="button"
                  onClick={() => handleMoveCredit(index, 'up')}
                  disabled={index === 0}
                  className="p-0.5 text-gray-400 hover:text-gold disabled:opacity-30 transition-colors"
                  title="Monter"
                >
                  <ChevronUp size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => handleMoveCredit(index, 'down')}
                  disabled={index === extraCredits.length - 1}
                  className="p-0.5 text-gray-400 hover:text-gold disabled:opacity-30 transition-colors"
                  title="Descendre"
                >
                  <ChevronDown size={16} />
                </button>
              </div>
              <input
                type="text"
                value={credit.role}
                onChange={(e) => handleCreditChange(index, 'role', e.target.value)}
                placeholder="RÃ´le"
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
            <Plus size={16} /> Ajouter un crÃ©dit
          </button>
        </div>
      </div>

      {/* ===== SECTION: Variantes ===== */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <GitBranch size={20} className="text-gold" />
          <h2 className={sectionTitleClass + ' !mb-0'}>Variantes</h2>
          <span className="text-xs bg-gold/20 text-gold-strong px-2 py-0.5 rounded-full font-medium ml-2">
            {variants.length + newVariants.length}
          </span>
        </div>

        {/* Existing variants */}
        {loadingVariants ? (
          <div className="text-gray-400 text-sm py-4">Chargement des variantes...</div>
        ) : variants.length > 0 ? (
          <div className="space-y-2 mb-4">
            {variants.map((v) => (
              <div key={v.id} className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
                <span className="text-xs font-semibold text-white bg-gold px-2 py-0.5 rounded uppercase">
                  {VARIANT_TYPES.find(t => t.value === v.variant_type)?.label || v.variant_type}
                </span>
                <span className="text-sm text-gray-700 font-medium flex-1 truncate" title={v.label}>
                  {v.label}
                </span>
                {v.url && (
                  <a
                    href={v.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:text-blue-700 transition-colors"
                    title="Ouvrir le lien"
                  >
                    <ExternalLink size={16} />
                  </a>
                )}
                <span className="text-xs text-gray-400">{v.language}</span>
                <button
                  onClick={() => handleDeleteVariant(v.id)}
                  disabled={deletingVariantId === v.id}
                  className="p-1 text-red-400 hover:text-red-600 transition-colors disabled:opacity-50"
                  title="Supprimer"
                >
                  {deletingVariantId === v.id ? <Loader2 size={16} className="animate-spin" /> : <X size={16} />}
                </button>
              </div>
            ))}
          </div>
        ) : !isNew ? (
          <p className="text-gray-400 text-sm mb-4">Aucune variante pour cette e-card.</p>
        ) : null}

        {/* New variants being added */}
        {newVariants.map((nv, index) => (
          <div key={`new-${index}`} className="border border-dashed border-gold/50 bg-gold/5 rounded-lg p-4 mb-3">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-gold">Nouvelle variante</span>
              <button
                onClick={() => handleRemoveNewVariant(index)}
                className="text-red-400 hover:text-red-600 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Type de variante *</label>
                <select
                  value={nv.variant_type}
                  onChange={(e) => handleNewVariantChange(index, 'variant_type', e.target.value)}
                  className={selectClass}
                >
                  {VARIANT_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              {nv.variant_type === 'autre' && (
                <div>
                  <label className={labelClass}>Nom personnalisÃ© *</label>
                  <input
                    type="text"
                    value={nv.custom_label}
                    onChange={(e) => handleNewVariantChange(index, 'custom_label', e.target.value)}
                    placeholder="Ex: Version NoÃ«l, Version interne..."
                    className={inputClass}
                  />
                </div>
              )}
              <div className={nv.variant_type === 'autre' ? 'md:col-span-2' : ''}>
                <label className={labelClass}>URL de la variante *</label>
                <input
                  type="url"
                  value={nv.url}
                  onChange={(e) => handleNewVariantChange(index, 'url', e.target.value)}
                  placeholder="https://..."
                  className={inputClass}
                />
              </div>
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={handleAddNewVariant}
          className="text-gold hover:text-gold-strong text-sm flex items-center gap-1 mt-1 transition-colors"
        >
          <Plus size={16} /> Ajouter une variante
        </button>
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
            <span className="text-sm text-gray-600">PubliÃ©e</span>
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
          {saving ? 'Enregistrement...' : isNew ? 'CrÃ©er' : 'Enregistrer'}
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
