import { useState, useCallback, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import SEO from '@/components/SEO'
import StructuredData, { organizationSchema } from '@/components/StructuredData'

export default function ResetPassword() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [validToken, setValidToken] = useState<boolean | null>(null)

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setValidToken(false)
      return
    }

    const type = searchParams.get('type')
    const hash = window.location.hash
    const hashParams = hash ? new URLSearchParams(hash.replace('#', '')) : new URLSearchParams()

    const isRecovery = type === 'recovery' || hashParams.get('type') === 'recovery'
    const hasAccessToken = !!searchParams.get('access_token') || !!hashParams.get('access_token')

    if (isRecovery && hasAccessToken) {
      setValidToken(true)
      if (hash) {
        window.history.replaceState(null, '', window.location.pathname)
      }
      return
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setValidToken(true)
      }
    })

    const timer = setTimeout(() => {
      if (validToken === null) {
        setValidToken(false)
      }
    }, 3000)

    return () => {
      subscription.unsubscribe()
      clearTimeout(timer)
    }
  }, [searchParams, validToken])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password.trim() || password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    setLoading(true)
    setError('')

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.auth.updateUser({ password })
      setLoading(false)
      if (error) {
        setError(error.message)
        return
      }
    }

    setSuccess(true)
    setTimeout(() => navigate('/auth'), 3000)
  }, [password, navigate])

  if (validToken === false) {
    return (
      <div style={{ display: 'flex', width: '100vw', height: '100vh', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif' }}>
        <div style={{ maxWidth: 380, textAlign: 'center' }}>
          <div style={{ marginBottom: 28 }}>
            <svg width="28" height="34" viewBox="0 0 28 34" fill="none">
              <path d="M0 0H28V14H14L0 0Z" fill="#111111" />
              <path d="M0 14H14L28 28H0V14Z" fill="#111111" />
              <path d="M0 28H14V42L0 28Z" fill="#111111" />
            </svg>
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: '#111111', marginBottom: 8 }}>Invalid or expired link</h1>
          <p style={{ fontSize: 15, color: '#888888', marginBottom: 24 }}>This password reset link is invalid or has expired. Please request a new one.</p>
          <button
            onClick={() => navigate('/auth')}
            style={{ padding: '11px 24px', borderRadius: 8, background: '#111111', color: '#ffffff', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600, fontFamily: 'Inter, sans-serif' }}
          >
            Back to sign in
          </button>
        </div>
      </div>
    )
  }

  if (validToken === null) {
    return (
      <div style={{ display: 'flex', width: '100vw', height: '100vh', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif' }}>
        <span style={{ fontSize: 15, color: '#888888' }}>Verifying link...</span>
      </div>
    )
  }

  if (success) {
    return (
      <div style={{ display: 'flex', width: '100vw', height: '100vh', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif' }}>
        <div style={{ maxWidth: 380, textAlign: 'center' }}>
          <div style={{ marginBottom: 28 }}>
            <svg width="28" height="34" viewBox="0 0 28 34" fill="none">
              <path d="M0 0H28V14H14L0 0Z" fill="#111111" />
              <path d="M0 14H14L28 28H0V14Z" fill="#111111" />
              <path d="M0 28H14V42L0 28Z" fill="#111111" />
            </svg>
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: '#111111', marginBottom: 8 }}>Password updated</h1>
          <p style={{ fontSize: 15, color: '#888888', marginBottom: 24 }}>Your password has been reset. Redirecting to sign in...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <SEO title="Reset Password" description="Set your new Framer password." noIndex />
      <StructuredData data={organizationSchema()} />
      <div style={{ display: 'flex', width: '100vw', height: '100vh', overflow: 'hidden', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif' }}>
        <div style={{ width: '50%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5', padding: '40px 24px' }}>
          <div style={{ width: '100%', maxWidth: 380 }}>
            <div style={{ marginBottom: 28, display: 'flex', justifyContent: 'center' }}>
              <svg width="28" height="34" viewBox="0 0 28 34" fill="none">
                <path d="M0 0H28V14H14L0 0Z" fill="#111111" />
                <path d="M0 14H14L28 28H0V14Z" fill="#111111" />
                <path d="M0 28H14V42L0 28Z" fill="#111111" />
              </svg>
            </div>

            <h1 style={{ fontSize: 26, fontWeight: 700, color: '#111111', textAlign: 'center', marginBottom: 6, letterSpacing: '-0.5px', lineHeight: 1.2 }}>
              Set new password
            </h1>
            <p style={{ fontSize: 15, color: '#888888', textAlign: 'center', marginBottom: 28, fontWeight: 400 }}>
              Choose a strong password for your account.
            </p>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="New password (min. 6 characters)"
                required
                minLength={6}
                autoFocus
                style={{ width: '100%', padding: '11px 14px', borderRadius: 8, border: '1px solid #e0e0e0', background: '#ffffff', color: '#111111', fontSize: 14, fontFamily: 'Inter, sans-serif', outline: 'none', transition: 'border-color var(--duration-slow)' }}
              />

              {error && <p style={{ fontSize: 13, color: '#dc2626', margin: 0 }}>{error}</p>}

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '11px 16px',
                  borderRadius: 8,
                  background: loading ? '#e8e8e8' : '#111111',
                  color: loading ? '#555555' : '#ffffff',
                  border: 'none',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: 14,
                  fontWeight: 600,
                  fontFamily: 'Inter, sans-serif',
                  transition: 'background var(--duration-slow), color var(--duration-slow)',
                  marginTop: 2,
                }}
                onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#333333' }}
                onMouseLeave={e => { if (!loading) e.currentTarget.style.background = '#111111' }}
              >
                {loading ? 'Resetting...' : 'Reset password'}
              </button>
            </form>
          </div>
        </div>
        <div style={{ width: '50%', background: '#111111', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ color: '#555555', fontSize: 13 }}>Framer</p>
        </div>
      </div>
    </>
  )
}
