import { ReactNode, useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

interface ProtectedRouteProps {
  children: ReactNode
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY
const STORAGE_KEY = `sb-${new URL(SUPABASE_URL).hostname.split('.')[0]}-auth-token`

// Read session directly from localStorage — no locks, instant
function getSessionFromStorage(): { email: string; accessToken: string } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    const expiresAt = parsed.expires_at || 0
    const now = Math.floor(Date.now() / 1000)
    if (expiresAt < now) return null
    const email = parsed.user?.email
    const accessToken = parsed.access_token
    if (!email || !accessToken) return null
    return { email, accessToken }
  } catch {
    return null
  }
}

// Check admin status via direct REST call (bypasses Supabase client locks)
async function checkAdminDirect(
  email: string,
  accessToken: string
): Promise<boolean> {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/admin_users?select=id&email=eq.${encodeURIComponent(email)}`,
      {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${accessToken}`,
        },
      }
    )
    if (!res.ok) return false
    const data = await res.json()
    return Array.isArray(data) && data.length > 0
  } catch {
    return false
  }
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [isAdminUser, setIsAdminUser] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function checkAuth() {
      try {
        // Read session directly from localStorage (no lock, instant)
        const stored = getSessionFromStorage()

        if (!stored) {
          if (!cancelled) setIsAuthenticated(false)
          return
        }

        // Check admin via direct REST (no Supabase client lock)
        const adminStatus = await checkAdminDirect(
          stored.email,
          stored.accessToken
        )
        if (cancelled) return

        if (!adminStatus) {
          setIsAuthenticated(false)
          return
        }

        setIsAuthenticated(true)
        setIsAdminUser(true)
      } catch (err) {
        console.error('Auth check failed:', err)
        if (!cancelled) setIsAuthenticated(false)
      }
    }

    checkAuth()

    // Listen for auth changes (login/logout) using the Supabase client
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        setIsAuthenticated(false)
        setIsAdminUser(false)
      } else if (event === 'SIGNED_IN' && session.user) {
        const adminStatus = await checkAdminDirect(
          session.user.email || '',
          session.access_token
        )
        setIsAuthenticated(adminStatus)
        setIsAdminUser(adminStatus)
      }
    })

    return () => {
      cancelled = true
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
