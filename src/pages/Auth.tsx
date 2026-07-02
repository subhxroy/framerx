import { useState, useCallback, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore, signIn, signUp, signInWithGoogle, resetPassword } from '@/store/authStore'
import SEO from '@/components/SEO'
import StructuredData, { organizationSchema } from '@/components/StructuredData'

const CARD_H = 160
const GAP = 12

const GALLERY_CARDS = [
  { bg: '#0a0a0a', accent: '#818cf8', dark: true, headline: 'Design without\nlimits', cta: 'Start free', tag: 'SaaS', accentLight: true },
  { bg: '#fafafa', accent: '#171717', dark: false, headline: 'Minimal.\nPowerful.', cta: 'Explore', tag: 'Portfolio', textColor: '#111111' },
  { bg: '#0f172a', accent: '#38bdf8', dark: true, headline: 'Ship faster\nthan ever', cta: 'Get started', tag: 'DevTool', accentLight: true },
  { bg: '#fff7ed', accent: '#ea580c', dark: false, headline: 'Brand that\nstands out', cta: 'See work', tag: 'Agency' },
  { bg: '#f0fdf4', accent: '#16a34a', dark: false, headline: 'Grow with\nconfidence', cta: 'Learn more', tag: 'Startup' },
  { bg: '#1e1e2e', accent: '#f5c2e7', dark: true, headline: 'Creative\ntools for all', cta: 'Try it free', tag: 'Design', accentLight: true },
  { bg: '#fdf4ff', accent: '#a855f7', dark: false, headline: 'Publish in\nminutes', cta: 'Publish', tag: 'CMS' },
  { bg: '#0c0c0c', accent: '#34d399', dark: true, headline: 'Data-driven\ndecisions', cta: 'Dashboard', tag: 'Analytics', accentLight: true },
  { bg: '#fffbeb', accent: '#d97706', dark: false, headline: 'Sell anything,\nanywhere', cta: 'Open shop', tag: 'E-commerce' },
]

const EXTENDED_CARDS = [...GALLERY_CARDS, ...GALLERY_CARDS, ...GALLERY_CARDS]

export default function Auth() {
  const navigate = useNavigate()
  const { loading, error, signUpPending, clearError } = useAuthStore()
  const [mode, setMode] = useState<'signin' | 'signup' | 'reset'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [resetSent, setResetSent] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [emailFocused, setEmailFocused] = useState(false)
  const [passwordFocused, setPasswordFocused] = useState(false)

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError('')
    if (!email.trim()) return

    if (mode === 'reset') {
      const ok = await resetPassword(email.trim())
      if (ok) setResetSent(true)
      return
    }

    if (!password.trim() || password.length < 6) {
      setPasswordError('Password must be at least 6 characters')
      return
    }

    const ok = mode === 'signin'
      ? await signIn(email.trim(), password)
      : await signUp(email.trim(), password)

    if (ok) navigate('/')
  }, [email, password, mode, navigate])

  const handleGoogle = useCallback(async () => {
    const ok = await signInWithGoogle()
    if (ok) navigate('/')
  }, [navigate])

  const goMode = (m: 'signin' | 'signup' | 'reset') => {
    setMode(m)
    setResetSent(false)
    setPasswordError('')
    clearError()
    if (m !== 'signup') useAuthStore.getState().setSignUpPending(false)
  }

  return (
    <>
      <SEO
        title="Sign In"
        description="Sign in to Framer to start building stunning websites with our AI-powered visual editor."
        canonical="https://framer.app/auth"
        noIndex
      />
      <StructuredData data={organizationSchema()} />
      <div style={{ display: 'flex', width: '100vw', height: '100vh', overflow: 'hidden', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif' }}>
      
      {/* ── LEFT PANEL ── */}
      <div style={{
        width: '50%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f5f5f5',
        position: 'relative',
        padding: '40px 24px',
      }}>
        {/* Form container */}
        <div style={{ width: '100%', maxWidth: 380 }}>
          
          {/* Framer Logo */}
          <div style={{ marginBottom: 28, display: 'flex', justifyContent: 'center' }}>
            <svg width="28" height="34" viewBox="0 0 28 34" fill="none">
              <path d="M0 0H28V14H14L0 0Z" fill="#111111" />
              <path d="M0 14H14L28 28H0V14Z" fill="#111111" />
              <path d="M0 28H14V42L0 28Z" fill="#111111" />
            </svg>
          </div>

          {/* Title */}
          <h1 style={{
            fontSize: 26,
            fontWeight: 700,
            color: '#111111',
            textAlign: 'center',
            marginBottom: 6,
            letterSpacing: '-0.5px',
            lineHeight: 1.2,
          }}>
            {mode === 'signin' ? 'Welcome to Framer' : mode === 'signup' ? 'Create your account' : 'Reset your password'}
          </h1>

          {/* Subtitle */}
          <p style={{
            fontSize: 15,
            color: '#888888',
            textAlign: 'center',
            marginBottom: 28,
            fontWeight: 400,
          }}>
            {mode === 'signin'
              ? 'Start publishing now.'
              : mode === 'signup'
                ? 'Sign up to get started.'
                : 'We\u2019ll send you a reset link.'}
          </p>

          {/* Google Button — shown first (like Framer) */}
          {mode !== 'reset' && (
            <button
              onClick={handleGoogle}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                padding: '11px 16px',
                borderRadius: 8,
                background: '#111111',
                color: '#ffffff',
                border: 'none',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 600,
                fontFamily: 'Inter, sans-serif',
                marginBottom: 16,
                transition: 'background var(--duration-slow)',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#222222')}
              onMouseLeave={e => (e.currentTarget.style.background = '#111111')}
            >
              {/* Real Google G logo */}
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.79-.07-1.54-.19-2.27h-11.3v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"/>
                <path fill="#34A853" d="M12.255 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96h-3.98v3.09C3.515 21.3 7.615 24 12.255 24z"/>
                <path fill="#FBBC05" d="M5.525 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62h-3.98a11.86 11.86 0 0 0 0 10.76l3.98-3.09z"/>
                <path fill="#EA4335" d="M12.255 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C18.205 1.19 15.495 0 12.255 0c-4.64 0-8.74 2.7-10.71 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"/>
              </svg>
              Continue with Google
            </button>
          )}

          {/* OR divider */}
          {mode !== 'reset' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ flex: 1, height: 1, background: '#e0e0e0' }} />
              <span style={{ fontSize: 12, color: '#aaaaaa', fontWeight: 500, letterSpacing: '0.02em' }}>OR</span>
              <div style={{ flex: 1, height: 1, background: '#e0e0e0' }} />
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            
            {mode === 'signup' && (
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Your name"
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  borderRadius: 8,
                  border: '1px solid #e0e0e0',
                  background: '#ffffff',
                  color: '#111111',
                  fontSize: 14,
                  fontFamily: 'Inter, sans-serif',
                  outline: 'none',
                  transition: 'border-color var(--duration-slow)',
                }}
                onFocus={e => (e.target.style.borderColor = '#111111')}
                onBlur={e => (e.target.style.borderColor = '#e0e0e0')}
              />
            )}

            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Enter your work email..."
              required
              style={{
                width: '100%',
                padding: '11px 14px',
                borderRadius: 8,
                border: `1px solid ${emailFocused ? '#111111' : '#e0e0e0'}`,
                background: '#ffffff',
                color: '#111111',
                fontSize: 14,
                fontFamily: 'Inter, sans-serif',
                outline: 'none',
                transition: 'border-color var(--duration-slow)',
              }}
              onFocus={() => setEmailFocused(true)}
              onBlur={() => setEmailFocused(false)}
            />

            {mode !== 'reset' && (
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Password (min. 6 characters)"
                required
                minLength={6}
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  borderRadius: 8,
                  border: `1px solid ${passwordFocused ? '#111111' : '#e0e0e0'}`,
                  background: '#ffffff',
                  color: '#111111',
                  fontSize: 14,
                  fontFamily: 'Inter, sans-serif',
                  outline: 'none',
                  transition: 'border-color var(--duration-slow)',
                }}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
              />
            )}

            {error && (
              <p style={{ fontSize: 13, color: '#dc2626', margin: 0 }}>{error}</p>
            )}

            {passwordError && (
              <p style={{ fontSize: 13, color: '#dc2626', margin: 0 }}>{passwordError}</p>
            )}

            {signUpPending && (
              <p style={{ fontSize: 13, color: '#16a34a', margin: 0 }}>
                Check your email for a confirmation link.
              </p>
            )}

            {mode === 'reset' && resetSent && (
              <p style={{ fontSize: 13, color: '#16a34a', margin: 0 }}>
                If an account exists for {email}, a reset link is on its way.
              </p>
            )}

            {/* Continue / Submit Button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '11px 16px',
                borderRadius: 8,
                background: '#e8e8e8',
                color: '#555555',
                border: 'none',
                cursor: loading ? 'wait' : 'pointer',
                fontSize: 14,
                fontWeight: 600,
                fontFamily: 'Inter, sans-serif',
                transition: 'background var(--duration-slow), color var(--duration-slow)',
                marginTop: 2,
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = '#d4d4d4'
                e.currentTarget.style.color = '#111111'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = '#e8e8e8'
                e.currentTarget.style.color = '#555555'
              }}
            >
              {loading
                ? 'Please wait...'
                : mode === 'signin'
                  ? 'Continue'
                  : mode === 'signup'
                    ? 'Create account'
                    : 'Send reset link'}
            </button>
          </form>

          {/* Footer links */}
          <div style={{ marginTop: 20, textAlign: 'center' }}>
            {mode === 'reset' ? (
              <p style={{ fontSize: 13, color: '#888888' }}>
                Remembered it?{' '}
                <button
                  onClick={() => goMode('signin')}
                  style={{ color: '#111111', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 13, fontFamily: 'Inter, sans-serif' }}
                >
                  Back to sign in
                </button>
              </p>
            ) : (
              <>
                <p style={{ fontSize: 13, color: '#888888', marginBottom: mode === 'signin' ? 4 : 0 }}>
                  {mode === 'signin' ? "Don't have an account?" : 'Already have an account?'}{' '}
                  <button
                    onClick={() => goMode(mode === 'signin' ? 'signup' : 'signin')}
                    style={{ color: '#111111', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 13, fontFamily: 'Inter, sans-serif' }}
                  >
                    {mode === 'signin' ? 'Sign up' : 'Sign in'}
                  </button>
                </p>
                {mode === 'signin' && (
                  <button
                    onClick={() => goMode('reset')}
                    style={{ color: '#888888', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 13, fontFamily: 'Inter, sans-serif' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#111111')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#888888')}
                  >
                    Forgot password?
                  </button>
                )}
              </>
            )}
          </div>

          {/* Terms */}
          <p style={{ fontSize: 11, color: '#bbbbbb', textAlign: 'center', marginTop: 24, lineHeight: 1.5 }}>
            By continuing, you agree to Framer's{' '}
            <span style={{ color: '#888888', cursor: 'pointer', textDecoration: 'underline' }}>Terms of Service</span>{' '}
            and{' '}
            <span style={{ color: '#888888', cursor: 'pointer', textDecoration: 'underline' }}>Privacy Policy</span>.
          </p>
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div style={{
        width: '50%',
        background: '#111111',
        overflow: 'hidden',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
        borderLeft: '1px solid #1f1f1f',
      }}>
        {/* Scrolling gallery — 3 columns */}
        <RightGallery />
      </div>
    </div>
    </>
  )
}

function RightGallery() {
  const col1Ref = useRef<HTMLDivElement>(null)
  const col2Ref = useRef<HTMLDivElement>(null)
  const col3Ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let frame: number
    let offset1 = 0
    let offset2 = -60
    let offset3 = -30

    const SPEED = 0.3

    const animate = () => {
      offset1 = (offset1 + SPEED) % (CARD_H * EXTENDED_CARDS.length / 3 + GAP * EXTENDED_CARDS.length / 3)
      offset2 = (offset2 + SPEED * 0.8) % (CARD_H * EXTENDED_CARDS.length / 3 + GAP * EXTENDED_CARDS.length / 3)
      offset3 = (offset3 + SPEED * 1.1) % (CARD_H * EXTENDED_CARDS.length / 3 + GAP * EXTENDED_CARDS.length / 3)

      if (col1Ref.current) col1Ref.current.style.transform = `translateY(-${offset1}px)`
      if (col2Ref.current) col2Ref.current.style.transform = `translateY(-${offset2}px)`
      if (col3Ref.current) col3Ref.current.style.transform = `translateY(-${offset3}px)`

      frame = requestAnimationFrame(animate)
    }

    frame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frame)
  }, [])

  const col1 = [...GALLERY_CARDS, ...GALLERY_CARDS, ...GALLERY_CARDS]
  const col2 = [...GALLERY_CARDS.slice(3), ...GALLERY_CARDS, ...GALLERY_CARDS, ...GALLERY_CARDS.slice(0, 3)]
  const col3 = [...GALLERY_CARDS.slice(6), ...GALLERY_CARDS, ...GALLERY_CARDS, ...GALLERY_CARDS.slice(0, 6)]

  return (
    <div style={{
      position: 'absolute', inset: 0,
      display: 'flex', gap: 12, padding: '12px 12px',
      overflow: 'hidden',
    }}>
      {[col1, col2, col3].map((col, ci) => (
        <div
          key={ci}
          style={{ flex: 1, overflow: 'hidden', position: 'relative' }}
        >
          <div
            ref={ci === 0 ? col1Ref : ci === 1 ? col2Ref : col3Ref}
            style={{ display: 'flex', flexDirection: 'column', gap: 12, willChange: 'transform' }}
          >
            {col.map((card, i) => (
              <GalleryCard key={`${ci}-${i}`} card={card} />
            ))}
          </div>
          {/* Top fade */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 60, background: 'linear-gradient(to bottom, #111111, transparent)', pointerEvents: 'none', zIndex: 1 }} />
          {/* Bottom fade */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 60, background: 'linear-gradient(to top, #111111, transparent)', pointerEvents: 'none', zIndex: 1 }} />
        </div>
      ))}
    </div>
  )
}

function GalleryCard({ card }: { card: typeof GALLERY_CARDS[0] }) {
  return (
    <div style={{
      height: CARD_H,
      borderRadius: 10,
      overflow: 'hidden',
      background: card.bg,
      flexShrink: 0,
      position: 'relative',
      boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
    }}>
      {/* Nav */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 5,
        padding: '8px 10px',
        borderBottom: `1px solid ${card.dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)'}`,
      }}>
        {[0,1,2].map(i => (
          <div key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: card.dark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)' }} />
        ))}
        <div style={{ flex: 1, height: 2, background: card.dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)', borderRadius: 2, marginLeft: 4 }} />
        <div style={{ width: 28, height: 5, background: card.accent + '55', borderRadius: 3 }} />
      </div>

      {/* Content */}
      <div style={{ padding: '12px 12px' }}>
        {/* Big headline block */}
        <div style={{
          fontSize: 15, fontWeight: 800,
          color: card.dark ? '#ffffff' : card.textColor || '#111111',
          letterSpacing: '-0.4px',
          lineHeight: 1.2,
          fontFamily: 'Inter, sans-serif',
          marginBottom: 8,
        }}>
          {card.headline}
        </div>
        {/* Description lines */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 12 }}>
          <div style={{ width: '85%', height: 3, background: card.dark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)', borderRadius: 2 }} />
          <div style={{ width: '65%', height: 3, background: card.dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)', borderRadius: 2 }} />
        </div>
        {/* CTA */}
        <div style={{
          display: 'inline-block',
          padding: '4px 10px', borderRadius: 5,
          background: card.accent,
          color: card.dark || card.accentLight ? '#000' : '#fff',
          fontSize: 9, fontWeight: 700,
          fontFamily: 'Inter, sans-serif',
          letterSpacing: '0.02em',
        }}>
          {card.cta}
        </div>
      </div>

      {/* Corner badge */}
      <div style={{
        position: 'absolute', bottom: 8, right: 8,
        padding: '2px 6px', borderRadius: 4,
        background: card.dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
        fontSize: 8, fontWeight: 500, color: card.dark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.35)',
        fontFamily: 'Inter, sans-serif',
      }}>
        {card.tag}
      </div>
    </div>
  )
}
