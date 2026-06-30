import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import type { ReactNode } from 'react'

interface Props {
  children: ReactNode
}

export default function ProtectedRoute({ children }: Props) {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const loading = useAuthStore((s) => s.loading)

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth', { replace: true })
    }
  }, [user, loading, navigate])

  if (loading) {
    return (
      <div
        className="flex items-center justify-center h-full w-full"
        style={{ background: 'var(--app-bg)' }}
      >
        <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading...</span>
      </div>
    )
  }

  if (!user) return null

  return <>{children}</>
}
