import { ReactNode, useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase, isAdmin } from '../lib/supabase'

interface ProtectedRouteProps {
  children: ReactNode
}

// Read session directly from localStorage (no locks, instant)
function getSessionFromStorage(): { email: string } | null {
  try {
    const STORAGE_KEY = 'sb-pywjtmmmqenbhqnmtvxp-auth-token'
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    const expiresAt = parsed.expires_at || 0
    const now = Math.floor(Date.now() / 1000)
    if (expiresAt < now) return null // Token expired
    const email = parsed.user?.email
    if (!email) return null
    return { email }
  } catch {
    return null
  }
}

// Race a promise against a timeout
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  return Promise.race([
    promise,
    new Promise<null>((resolve) => setTimeout(() => resolve(null), ms)),
  ])
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [isAdminUser, setIsAdminUser] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function checkAuth() {
      try {
        // Strategy 1: Try getSession() with a 3-second timeout
        const sessionResult = await withTimeout(supabase.auth.getSession(), 3000)

        let email: string | null = null

        if (sessionResult?.data?.session?.user?.email) {
          email = sessionResult.data.session.user.email
        } else {
          // Strategy 2: Fallback — read directly from localStorage (no lock needed)
          const stored = getSessionFromStorage()
          if (stored) {
            email = stored.email
          }
        }

        if (cancelled) return

        if (!email) {
          setIsAuthenticated(false)
          return
        }

        const adminStatus = await isAdmin(email)
        if (cancelled) return

        if (!adminStatus) {
          setIsAuthenticated(false)
          return
        }

        setIsAuthenticated(true)
        setIsAdminUser(true)
      } catch (err) {
        console.error('Auth check failed:', err)
        if (!cancelled) {
          setIsAuthenticated(false)
        }
      }
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
