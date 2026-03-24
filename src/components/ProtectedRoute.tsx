import { ReactNode, useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase, isAdmin } from '../lib/supabase'

interface ProtectedRouteProps {
  children: ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [isAdminUser, setIsAdminUser] = useState(false)

  useEffect(() => {
    async function checkAuth() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setIsAuthenticated(false)
        return
      }

      const adminStatus = await isAdmin(user.email || '')
      if (!adminStatus) {
        setIsAuthenticated(false)
        return
      }

      setIsAuthenticated(true)
      setIsAdminUser(true)
    }

    checkAuth()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        setIsAuthenticated(false)
        setIsAdminUser(false)
      } else if (session.user) {
        const adminStatus = await isAdmin(session.user.email || '')
        setIsAuthenticated(adminStatus)
        setIsAdminUser(adminStatus)
      }
    })

    return () => {
      subscription?.unsubscribe()
    }
  }, [])

  if (isAuthenticated === null) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-navy-900">
        <div className="text-gray-500">Chargement...</div>
      </div>
    )
  }

  if (!isAuthenticated || !isAdminUser) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
