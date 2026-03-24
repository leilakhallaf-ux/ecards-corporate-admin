import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Language, TranslationWithRelations } from '../lib/types'
import { AlertCircle, Save, Plus, Trash2 } from 'lucide-react'

interface TranslationFormState {
  [keyId: string]: {
    [languageCode: string]: string
  }
}

export default function Translations() {
  const [languages, setLanguages] = useState<Language[]>([])
  const [translations, setTranslations] = useState<TranslationWithRelations[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formState, setFormState] = useState<TranslationFormState>({})
  const [newKeyName, setNewKeyName] = useState('')
  const [newKeyContext, setNewKeyContext] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)

      // Fetch languages
      const { data: langData, error: langError } = await supabase
        .from('languages')
        .select('*')
        .eq('is_active', true)
        .order('is_default', { ascending: false })

      if (langError) throw langError
      setLanguages(langData || [])

      // Fetch translations with nested structure
      const { data: transData, error: transError } = await supabase
        .from('translation_keys')
        .select('id, key, translations(text, languages(code))')

      if (transError) throw transError

      const typedTranslations = transData as unknown as TranslationWithRelations[]
      setTranslations(typedTranslations || [])

      // Initialize form state
      const initialState: TranslationFormState = {}
      typedTranslations?.forEach((item) => {
        initialState[item.id] = {}
        item.translations?.forEach((trans) => {
          initialState[item.id][trans.languages.code] = trans.text
        })
      })
      setFormState(initialState)
    } catch (err) {
      console.error('Error fetching translations:', err)
      setError('Erreur lors du chargement des traductions')
    } finally {
      setLoading(false)
    }
  }

  const handleTranslationChange = (keyId: string, languageCode: string, value: string) => {
    setFormState((prev) => ({
      ...prev,
      [keyId]: {
        ...prev[keyId],
        [languageCode]: value,
      },
    }))
  }

  const handleSaveTranslations = async () => {
    try {
      setSaving(true)
      setError(null)

      for (const [keyId, languageTranslations] of Object.entries(formState)) {
        for (const [languageCode, value] of Object.entries(languageTranslations)) {
          // Check if translation exists
          const { data: existingTranslation } = await supabase
            .from('translations')
            .select('id')
            .eq('key_id', keyId)
            .eq('language_code', languageCode)
            .single()

          if (existingTranslation) {
            // Update
            await supabase
              .from('translations')
              .update({ value })
              .eq('id', existingTranslation.id)
          } else {
            // Insert
            await supabase.from('translations').insert({
              key_id: keyId,
              language_code: languageCode,
              value,
            })
          }
        }
      }

      setError(null)
      await fetchData()
    } catch (err) {
      console.error('Error saving translations:', err)
      setError('Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  const handleAddKey = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newKeyName.trim()) return

    try {
      const { error: insertError } = await supabase.from('translation_keys').insert({
        key: newKeyName,
        context: newKeyContext || null,
      })

      if (insertError) throw insertError

      setNewKeyName('')
      setNewKeyContext('')
      await fetchData()
    } catch (err) {
      console.error('Error adding translation key:', err)
      setError('Erreur lors de l\'ajout de la clé')
    }
  }

  const handleDeleteKey = async (keyId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette clé et ses traductions ?')) return

    try {
      const { error: deleteError } = await supabase
        .from('translation_keys')
        .delete()
        .eq('id', keyId)

      if (deleteError) throw deleteError
      await fetchData()
    } catch (err) {
      console.error('Error deleting key:', err)
      setError('Erreur lors de la suppression')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-gray-400">Chargement...</div>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-8">Traductions</h1>

      {error && (
        <div className="mb-6 p-4 bg-red-900/20 border border-red-700 rounded-lg flex items-start gap-3">
          <AlertCircle size={20} className="text-red-500 mt-0.5 flex-shrink-0" />
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Add New Key Form */}
      <div className="mb-8 bg-navy-800 rounded-lg border border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Ajouter une nouvelle clé</h2>
        <form onSubmit={handleAddKey} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              placeholder="Clé de traduction"
              className="px-4 py-2 bg-navy-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:border-blue-500"
            />
            <input
              type="text"
              value={newKeyContext}
              onChange={(e) => setNewKeyContext(e.target.value)}
              placeholder="Contexte (optionnel)"
              className="px-4 py-2 bg-navy-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:border-blue-500"
            />
          </div>
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Plus size={20} />
            Ajouter clé
          </button>
        </form>
      </div>

      {/* Translations Table */}
      <div className="bg-navy-800 rounded-lg border border-gray-700 overflow-hidden mb-6">
        {translations.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            Aucune clé de traduction trouvée
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-navy-700 border-b border-gray-600">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">
                    Clé
                  </th>
                  {languages.map((lang) => (
                    <th
                      key={lang.code}
                      className="px-6 py-3 text-left text-sm font-semibold text-gray-300"
                    >
                      {lang.name}
                    </th>
                  ))}
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-600">
                {translations.map((item) => (
                  <tr key={item.id} className="hover:bg-navy-700 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-300">
                      {item.key}
                    </td>
                    {languages.map((lang) => (
                      <td key={lang.code} className="px-6 py-4 text-sm">
                        <textarea
                          value={formState[item.id]?.[lang.code] || ''}
                          onChange={(e) =>
                            handleTranslationChange(item.id, lang.code, e.target.value)
                          }
                          className="w-full px-3 py-1 bg-navy-700 border border-gray-600 rounded text-white placeholder-gray-500 focus:border-blue-500 text-sm"
                          rows={1}
                        />
                      </td>
                    ))}
                    <td className="px-6 py-4 text-sm">
                      <button
                        onClick={() => handleDeleteKey(item.id)}
                        className="p-2 hover:bg-navy-600 rounded transition-colors text-red-400 hover:text-red-300"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Save Button */}
      {translations.length > 0 && (
        <button
          onClick={handleSaveTranslations}
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Save size={20} />
          {saving ? 'Enregistrement...' : 'Enregistrer toutes les traductions'}
        </button>
      )}
    </div>
  )
}
