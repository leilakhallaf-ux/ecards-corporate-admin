import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { ContactMessage } from '../lib/types'
import { AlertCircle, Search, Trash2 } from 'lucide-react'

export default function Messages() {
  const [messages, setMessages] = useState<ContactMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null)
  const [updatingStatus, setUpdatingStatus] = useState(false)

  useEffect(() => {
    fetchMessages()
  }, [filterStatus])

  const fetchMessages = async () => {
    try {
      setLoading(true)
      let query = supabase.from('contact_messages').select('*')

      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus)
      }

      const { data, error: fetchError } = await query.order('created_at', { ascending: false })

      if (fetchError) throw fetchError
      setMessages(data || [])
    } catch (err) {
      console.error('Error fetching messages:', err)
      setError('Erreur lors du chargement des messages')
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsRead = async (messageId: string) => {
    try {
      setUpdatingStatus(true)
      const { error: updateError } = await supabase
        .from('contact_messages')
        .update({ status: 'read' })
        .eq('id', messageId)

      if (updateError) throw updateError
      await fetchMessages()
    } catch (err) {
      console.error('Error updating message:', err)
      setError('Erreur lors de la mise à jour')
    } finally {
      setUpdatingStatus(false)
    }
  }

  const handleMarkAsReplied = async (messageId: string) => {
    try {
      setUpdatingStatus(true)
      const { error: updateError } = await supabase
        .from('contact_messages')
        .update({ status: 'replied' })
        .eq('id', messageId)

      if (updateError) throw updateError
      await fetchMessages()
    } catch (err) {
      console.error('Error updating message:', err)
      setError('Erreur lors de la mise à jour')
    } finally {
      setUpdatingStatus(false)
    }
  }

  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce message ?')) return

    try {
      const { error: deleteError } = await supabase
        .from('contact_messages')
        .delete()
        .eq('id', messageId)

      if (deleteError) throw deleteError
      setMessages(messages.filter((msg) => msg.id !== messageId))
      setSelectedMessage(null)
    } catch (err) {
      console.error('Error deleting message:', err)
      setError('Erreur lors de la suppression')
    }
  }

  const filteredMessages = messages.filter((message) => {
    const searchLower = searchTerm.toLowerCase()
    return (
      message.name?.toLowerCase().includes(searchLower) ||
      message.email?.toLowerCase().includes(searchLower) ||
      message.subject?.toLowerCase().includes(searchLower) ||
      message.message?.toLowerCase().includes(searchLower)
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
      <h1 className="text-3xl font-bold text-white mb-8">Messages de contact</h1>

      {error && (
        <div className="mb-6 p-4 bg-red-900/20 border border-red-700 rounded-lg flex items-start gap-3">
          <AlertCircle size={20} className="text-red-500 mt-0.5 flex-shrink-0" />
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Messages List */}
        <div className="lg:col-span-1">
          {/* Search and Filter */}
          <div className="mb-6 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 text-gray-500" size={20} />
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-navy-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:border-blue-500"
              />
            </div>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-2 bg-navy-800 border border-gray-600 rounded-lg text-white focus:border-blue-500"
            >
              <option value="all">Tous les messages</option>
              <option value="new">Non lus</option>
              <option value="read">Lus</option>
              <option value="replied">Répondu</option>
            </select>
          </div>

          {/* Messages List */}
          <div className="bg-navy-800 rounded-lg border border-gray-700 overflow-hidden">
            {filteredMessages.length === 0 ? (
              <div className="p-6 text-center text-gray-400 text-sm">
                Aucun message trouvé
              </div>
            ) : (
              <div className="divide-y divide-gray-600 max-h-96 overflow-y-auto">
                {filteredMessages.map((message) => (
                  <button
                    key={message.id}
                    onClick={() => setSelectedMessage(message)}
                    className={`w-full text-left p-4 transition-colors hover:bg-navy-700 ${
                      selectedMessage?.id === message.id ? 'bg-blue-600/20' : ''
                    } ${message.status === 'new' ? 'bg-blue-900/20' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-white truncate">{message.name}</p>
                        <p className="text-sm text-gray-400 truncate">{message.subject}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(message.created_at).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        <span
                          className={`text-xs px-2 py-1 rounded-full font-medium ${
                            message.status === 'new'
                              ? 'bg-blue-600/30 text-blue-400'
                              : message.status === 'replied'
                              ? 'bg-green-600/30 text-green-400'
                              : 'bg-gray-600/30 text-gray-400'
                          }`}
                        >
                          {message.status === 'new'
                            ? 'Non lu'
                            : message.status === 'replied'
                            ? 'Répondu'
                            : 'Lu'}
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Message Detail */}
        <div className="lg:col-span-2">
          {selectedMessage ? (
            <div className="bg-navy-800 rounded-lg border border-gray-700 p-6">
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-white">{selectedMessage.subject}</h2>
                  <span
                    className={`text-sm px-3 py-1 rounded-full font-medium ${
                      selectedMessage.status === 'new'
                        ? 'bg-blue-600/30 text-blue-400'
                        : selectedMessage.status === 'replied'
                        ? 'bg-green-600/30 text-green-400'
                        : 'bg-gray-600/30 text-gray-400'
                    }`}
                  >
                    {selectedMessage.status === 'new'
                      ? 'Non lu'
                      : selectedMessage.status === 'replied'
                      ? 'Répondu'
                      : 'Lu'}
                  </span>
                </div>

                <div className="space-y-2 text-sm">
                  <p>
                    <span className="text-gray-400">De:</span>
                    <span className="text-white ml-2">{selectedMessage.name}</span>
                  </p>
                  <p>
                    <span className="text-gray-400">Email:</span>
                    <a
                      href={`mailto:${selectedMessage.email}`}
                      className="text-blue-400 hover:text-blue-300 ml-2"
                    >
                      {selectedMessage.email}
                    </a>
                  </p>
                  <p>
                    <span className="text-gray-400">Date:</span>
                    <span className="text-white ml-2">
                      {new Date(selectedMessage.created_at).toLocaleDateString('fr-FR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </p>
                </div>
              </div>

              {/* Message Content */}
              <div className="mb-6 p-4 bg-navy-700 rounded-lg border border-gray-600">
                <p className="text-gray-300 whitespace-pre-wrap">{selectedMessage.message}</p>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-3">
                {selectedMessage.status === 'new' && (
                  <button
                    onClick={() => handleMarkAsRead(selectedMessage.id)}
                    disabled={updatingStatus}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                  >
                    Marquer comme lu
                  </button>
                )}

                {selectedMessage.status !== 'replied' && (
                  <button
                    onClick={() => handleMarkAsReplied(selectedMessage.id)}
                    disabled={updatingStatus}
                    className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                  >
                    Marquer comme répondu
                  </button>
                )}

                <button
                  onClick={() => handleDeleteMessage(selectedMessage.id)}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-2"
                >
                  <Trash2 size={16} />
                  Supprimer
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-navy-800 rounded-lg border border-gray-700 p-6 flex items-center justify-center min-h-96 text-gray-400">
              Sélectionnez un message pour voir les détails
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
