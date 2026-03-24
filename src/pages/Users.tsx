import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { AdminUser } from '../lib/types'
import { Trash2, AlertCircle, Plus, Mail } from 'lucide-react'

export default function Users() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newEmail, setNewEmail] = useState('')
  const [addingUser, setAddingUser] = useState(false)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const { data, error: fetchError } = await supabase
        .from('admin_users')
        .select('*')
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError
      setUsers(data || [])
    } catch (err) {
      console.error('Error fetching users:', err)
      setError('Erreur lors du chargement des utilisateurs')
    } finally {
      setLoading(false)
    }
  }

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newEmail.trim()) return

    try {
      setAddingUser(true)
      setError(null)

      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser()

      const { error: insertError } = await supabase.from('admin_users').insert({
        email: newEmail,
        created_by: currentUser?.id,
      })

      if (insertError) throw insertError

      setNewEmail('')
      await fetchUsers()
    } catch (err) {
      console.error('Error adding user:', err)
      setError('Erreur lors de l\'ajout de l\'utilisateur')
    } finally {
      setAddingUser(false)
    }
  }

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) return

    try {
      const { error: deleteError } = await supabase.from('admin_users').delete().eq('id', id)
      if (deleteError) throw deleteError
      setUsers(users.filter((user) => user.id !== id))
    } catch (err) {
      console.error('Error deleting user:', err)
      setError('Erreur lors de la suppression')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-gray-500">Chargement...</div>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Utilisateurs administrateurs</h1>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-300 rounded-lg flex items-start gap-3">
          <AlertCircle size={20} className="text-red-600 mt-0.5 flex-shrink-0" />
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {/* Add New User Form */}
      <div className="mb-8 bg-navy-800 rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Ajouter un nouvel utilisateur</h2>
        <form onSubmit={handleAddUser} className="flex gap-4 flex-col md:flex-row">
          <div className="flex-1 relative">
            <Mail className="absolute left-3 top-3 text-gray-500" size={20} />
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="Adresse e-mail"
              className="w-full pl-10 pr-4 py-2 bg-navy-700 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:border-gold"
            />
          </div>
          <button
            type="submit"
            disabled={addingUser || !newEmail.trim()}
            className="bg-gold hover:bg-gold-strong disabled:bg-gray-300 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors whitespace-nowrap"
          >
            <Plus size={20} />
            {addingUser ? 'Ajout...' : 'Ajouter'}
          </button>
        </form>
      </div>

      {/* Users Table */}
      <div className="bg-navy-800 rounded-lg border border-gray-200 overflow-hidden">
        {users.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Aucun utilisateur administrateur trouvé
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-navy-700 border-b border-gray-300">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">
                    Adresse e-mail
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">
                    Date de création
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-600">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-100 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(user.created_at).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="p-2 hover:bg-gray-200 rounded transition-colors text-red-600 hover:text-red-300"
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
    </div>
  )
}
