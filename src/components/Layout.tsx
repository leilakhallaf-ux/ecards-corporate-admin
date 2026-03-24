import { ReactNode, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import {
  LayoutGrid,
  FileText,
  Users,
  Settings,
  Globe,
  Mail,
  LogOut,
  Menu,
  X,
} from 'lucide-react'

interface LayoutProps {
  children: ReactNode
}

const navItems = [
  { path: '/', label: 'Tableau de bord', icon: LayoutGrid },
  { path: '/ecards', label: 'E-cards', icon: FileText },
  { path: '/submissions', label: 'Soumissions', icon: FileText },
  { path: '/users', label: 'Utilisateurs', icon: Users },
  { path: '/translations', label: 'Traductions', icon: Globe },
  { path: '/messages', label: 'Messages', icon: Mail },
]

export function Layout({ children }: LayoutProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <div className="flex h-screen bg-navy-900">
      {/* Sidebar */}
      <aside className="hidden md:flex md:w-64 bg-navy-800 border-r border-gray-700 flex-col">
        <div className="p-6">
          <h1 className="text-xl font-bold text-white">E-Cards Admin</h1>
          <p className="text-sm text-gray-400 mt-1">Corporate</p>
        </div>

        <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
          {navItems.map(({ path, label, icon: Icon }) => (
            <Link
              key={path}
              to={path}
              className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                location.pathname === path
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-navy-700'
              }`}
            >
              <Icon size={20} />
              <span>{label}</span>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-700">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-2 rounded-lg text-gray-300 hover:bg-navy-700 transition-colors"
          >
            <LogOut size={20} />
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between w-full px-4 py-4 bg-navy-800 border-b border-gray-700">
        <h1 className="text-lg font-bold text-white">E-Cards Admin</h1>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="text-gray-300 hover:text-white"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-16 bg-navy-800 z-50 overflow-y-auto">
          <nav className="p-4 space-y-2">
            {navItems.map(({ path, label, icon: Icon }) => (
              <Link
                key={path}
                to={path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                  location.pathname === path
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-navy-700'
                }`}
              >
                <Icon size={20} />
                <span>{label}</span>
              </Link>
            ))}
          </nav>
          <div className="p-4 border-t border-gray-700">
            <button
              onClick={() => {
                handleLogout()
                setMobileMenuOpen(false)
              }}
              className="flex items-center gap-3 w-full px-4 py-2 rounded-lg text-gray-300 hover:bg-navy-700 transition-colors"
            >
              <LogOut size={20} />
              <span>Déconnexion</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-4 md:p-8">{children}</div>
      </main>
    </div>
  )
}
