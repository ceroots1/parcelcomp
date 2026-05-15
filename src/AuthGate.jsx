import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

const T = {
  navy:       '#1a2744',
  gold:       '#b8932a',
  text:       '#1a2032',
  textLight:  '#6b7a96',
  border:     '#d8dae2',
  surfaceAlt: '#f9f7f4',
  bg:         '#f4f2ee',
  flagRed:    '#b53a3a',
  flagBg:     '#fdf2f2',
  flagBorder: '#e8c4c4',
  okGreen:    '#2a6b44',
  okBg:       '#f2faf5',
  okBorder:   '#b0d8c0',
}

const Logo = () => (
  <div style={{ textAlign: 'center', marginBottom: '28px' }}>
    <div style={{ display: 'inline-flex', alignItems: 'baseline', gap: '2px', marginBottom: '6px' }}>
      <span style={{ fontFamily: 'Merriweather, serif', fontWeight: 700, fontSize: '28px', color: T.navy }}>Parcel</span>
      <span style={{ fontFamily: 'Merriweather, serif', fontWeight: 700, fontSize: '28px', color: T.gold }}>Comp</span>
    </div>
    <p style={{ color: T.textLight, fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase', margin: 0 }}>
      CRE Consulting · Indiana SDF
    </p>
  </div>
)

const Card = ({ children }) => (
  <div style={{
    background: '#fff', borderRadius: '8px', padding: '40px 44px',
    maxWidth: '400px', width: '92%',
    boxShadow: '0 8px 40px rgba(20,30,60,0.12)',
    border: '1px solid ' + T.border
  }}>
    {children}
  </div>
)

const ErrorBox = ({ message }) => (
  message ? (
    <div style={{
      background: T.flagBg, border: '1px solid ' + T.flagBorder,
      borderRadius: '5px', padding: '10px 13px', color: T.flagRed,
      fontSize: '12px', marginBottom: '14px', lineHeight: '1.6'
    }}>
      {message}
    </div>
  ) : null
)

const InputField = ({ label, type, value, onChange, placeholder, autoFocus }) => (
  <div style={{ marginBottom: '14px' }}>
    <label style={{
      display: 'block', fontSize: '11px', fontWeight: 700, color: T.textLight,
      letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '5px'
    }}>
      {label}
    </label>
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      autoFocus={autoFocus}
      required
      style={{
        width: '100%', border: '1px solid ' + T.border, borderRadius: '5px',
        padding: '11px 13px', fontFamily: 'Lato, sans-serif', fontSize: '14px',
        color: T.text, background: T.surfaceAlt, boxSizing: 'border-box',
        outline: 'none', transition: 'border-color 0.15s'
      }}
      onFocus={e => e.target.style.borderColor = T.gold}
      onBlur={e => e.target.style.borderColor = T.border}
    />
  </div>
)

const PrimaryButton = ({ children, onClick, type = 'button', disabled, loading }) => (
  <button
    type={type}
    onClick={onClick}
    disabled={disabled || loading}
    style={{
      width: '100%', background: (disabled || loading) ? '#9aa3b5' : T.navy,
      color: '#fff', border: 'none', borderRadius: '5px', padding: '13px',
      fontFamily: 'Lato, sans-serif', fontWeight: 700, fontSize: '14px',
      cursor: (disabled || loading) ? 'wait' : 'pointer',
      letterSpacing: '0.04em', transition: 'background 0.15s'
    }}
  >
    {loading ? '…' : children}
  </button>
)

const GhostButton = ({ children, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    style={{
      width: '100%', background: 'none', border: 'none',
      color: T.textLight, fontSize: '12px',
      cursor: 'pointer', marginTop: '12px', padding: '6px'
    }}
  >
    {children}
  </button>
)

// ─────────────────────────────────────────────────────────────
//  SCREENS
// ─────────────────────────────────────────────────────────────

function LoadingScreen() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', background: T.bg, fontFamily: 'Lato, sans-serif'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          fontSize: '32px', display: 'inline-block', color: T.navy,
          marginBottom: '12px', animation: 'spin 1s linear infinite'
        }}>↻</div>
        <p style={{ color: T.textLight, fontSize: '13px' }}>Loading ParcelComp…</p>
      </div>
    </div>
  )
}

function SetPasswordScreen({ onSubmit, loading, error }) {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [localError, setLocalError] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    setLocalError('')
    if (password.length < 8) {
      setLocalError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setLocalError('Passwords do not match.')
      return
    }
    onSubmit(password)
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', background: T.bg, fontFamily: 'Lato, sans-serif'
    }}>
      <Card>
        <Logo />
        <p style={{
          color: T.textLight, fontSize: '13px', textAlign: 'center',
          marginBottom: '24px', lineHeight: '1.6'
        }}>
          Welcome to ParcelComp.<br />Please set your password to continue.
        </p>
        <form onSubmit={handleSubmit}>
          <InputField
            label="New Password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="At least 8 characters"
            autoFocus
          />
          <div style={{ marginBottom: '20px' }}>
            <InputField
              label="Confirm Password"
              type="password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder="Repeat your password"
            />
          </div>
          <ErrorBox message={localError || error} />
          <PrimaryButton type="submit" loading={loading}>
            Set Password &amp; Sign In
          </PrimaryButton>
        </form>
      </Card>
    </div>
  )
}

function LoginScreen({ onLogin, onForgot, error, loading }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState('login') // 'login' | 'forgot' | 'sent'

  const handleLogin = (e) => {
    e.preventDefault()
    onLogin(email, password)
  }

  const handleForgot = (e) => {
    e.preventDefault()
    onForgot(email, () => setMode('sent'))
  }

  if (mode === 'sent') {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', background: T.bg, fontFamily: 'Lato, sans-serif'
      }}>
        <Card>
          <Logo />
          <div style={{ textAlign: 'center', color: T.textLight, fontSize: '13px', lineHeight: '1.8' }}>
            <div style={{ fontSize: '36px', marginBottom: '14px' }}>✉️</div>
            <p>Password reset email sent to</p>
            <p><strong style={{ color: T.navy }}>{email}</strong></p>
            <p style={{ marginTop: '8px' }}>
              Check your inbox and click the link to set a new password.
            </p>
            <GhostButton onClick={() => setMode('login')}>← Back to sign in</GhostButton>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', background: T.bg, fontFamily: 'Lato, sans-serif'
    }}>
      <Card>
        <Logo />
        <form onSubmit={mode === 'login' ? handleLogin : handleForgot}>
          <InputField
            label="Email Address"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoFocus
          />
          {mode === 'login' && (
            <div style={{ marginBottom: '20px' }}>
              <InputField
                label="Password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
          )}
          <ErrorBox message={error} />
          <PrimaryButton type="submit" loading={loading}>
            {mode === 'login' ? 'Sign In' : 'Send Reset Link'}
          </PrimaryButton>
          <GhostButton onClick={() => { setMode(mode === 'login' ? 'forgot' : 'login') }}>
            {mode === 'login' ? 'Forgot your password?' : '← Back to sign in'}
          </GhostButton>
        </form>
        <p style={{
          textAlign: 'center', color: T.textLight, fontSize: '11px',
          marginTop: '22px', borderTop: '1px solid ' + T.border,
          paddingTop: '16px', lineHeight: '1.7'
        }}>
          Access is by invitation only.<br />
          Contact{' '}
          <a href="mailto:info@consultcre.com"
            style={{ color: T.navy, fontWeight: 700, textDecoration: 'none' }}>
            info@consultcre.com
          </a>
        </p>
      </Card>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
//  MAIN AUTHGATE
// ─────────────────────────────────────────────────────────────

export default function AuthGate({ children }) {
  // screen controls which screen is shown:
  //   'loading'      — checking session on startup
  //   'login'        — normal email/password login
  //   'set_password' — new user setting password after invite/reset link
  //   'app'          — logged in, show the main app
  const [screen, setScreen] = useState('loading')
  const [session, setSession] = useState(null)
  const [authError, setAuthError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // ── STEP 1: Let Supabase process the URL automatically ──
    // supabase.auth.getSession() automatically reads any tokens
    // in the URL hash (from invite links and password reset links)
    // and exchanges them for a real session. We do NOT need to
    // manually parse the URL hash ourselves.
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('getSession error:', error)
        setAuthError('There was a problem loading your session. Please try again.')
        setScreen('login')
        return
      }

      if (session) {
        setSession(session)
        // Check if this came from an invite or password reset link
        // by looking at the URL BEFORE Supabase cleans it up.
        // We check window.location.hash here since getSession
        // processes but doesn't always remove the hash immediately.
        const hash = window.location.hash
        const isInviteOrReset =
          hash.includes('type=invite') ||
          hash.includes('type=recovery') ||
          // Also check if the user has never set a password
          // (invite flow — account exists but password not confirmed)
          !session.user?.email_confirmed_at === false

        if (hash.includes('type=invite') || hash.includes('type=recovery')) {
          // User clicked an invite or reset link — show set password screen
          setScreen('set_password')
          // Clean the URL so tokens don't stay visible
          window.history.replaceState({}, document.title, window.location.pathname)
        } else {
          setScreen('app')
        }
      } else {
        // Check if there's an error in the URL hash
        // (e.g. expired link redirected back with error params)
        const hash = window.location.hash
        if (hash.includes('error=')) {
          const params = new URLSearchParams(hash.substring(1))
          const errorCode = params.get('error_code')
          const errorDesc = params.get('error_description')
          if (errorCode === 'otp_expired') {
            setAuthError(
              'Your invitation link has expired. Please contact info@consultcre.com to request a new invite.'
            )
          } else if (errorCode) {
            setAuthError(
              `Sign-in link error: ${(errorDesc || errorCode).replace(/\+/g, ' ')}. Please contact info@consultcre.com.`
            )
          }
          // Clean the URL
          window.history.replaceState({}, document.title, window.location.pathname)
        }
        setScreen('login')
      }
    })

    // ── STEP 2: Listen for auth state changes ──
    // This fires whenever the user logs in, logs out, or
    // their session refreshes. It also fires when Supabase
    // processes a token from the URL.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth event:', event)

        if (event === 'SIGNED_IN' && screen === 'loading') {
          // Only auto-advance to app during loading — not during
          // set_password flow where we want to stay on that screen
          return
        }

        if (event === 'PASSWORD_RECOVERY') {
          // User clicked a password reset link
          setSession(session)
          setScreen('set_password')
          window.history.replaceState({}, document.title, window.location.pathname)
          return
        }

        if (event === 'USER_UPDATED') {
          // Password was successfully updated — go to app
          setSession(session)
          setScreen('app')
          return
        }

        if (event === 'SIGNED_OUT') {
          setSession(null)
          setScreen('login')
          return
        }
      }
    )

    return () => subscription.unsubscribe()
  }, []) // run once on mount

  // ── HANDLERS ─────────────────────────────────────────────

  const handleLogin = async (email, password) => {
    setLoading(true)
    setAuthError('')
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setAuthError(error.message)
      setLoading(false)
      return
    }
    setSession(data.session)
    setScreen('app')
    setLoading(false)
  }

  const handleForgotPassword = async (email, onSent) => {
    setLoading(true)
    setAuthError('')
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/'
    })
    if (error) {
      setAuthError(error.message)
    } else {
      onSent()
    }
    setLoading(false)
  }

  const handleSetPassword = async (newPassword) => {
    setLoading(true)
    setAuthError('')
    const { data, error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) {
      setAuthError(error.message)
      setLoading(false)
      return
    }
    // Supabase fires USER_UPDATED event which moves to 'app' screen
    // but we also set it here as a fallback
    setSession(data.user)
    setScreen('app')
    setLoading(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setSession(null)
    setScreen('login')
    setAuthError('')
  }

  // ── RENDER ────────────────────────────────────────────────

  const Wrapper = ({ children }) => (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lato:wght@400;700;900&family=Merriweather:wght@700&display=swap');
        @keyframes spin { to { transform: rotate(360deg) } }
        * { box-sizing: border-box; }
      `}</style>
      {children}
    </>
  )

  if (screen === 'loading') {
    return <Wrapper><LoadingScreen /></Wrapper>
  }

  if (screen === 'set_password') {
    return (
      <Wrapper>
        <SetPasswordScreen
          onSubmit={handleSetPassword}
          loading={loading}
          error={authError}
        />
      </Wrapper>
    )
  }

  if (screen === 'app' && session) {
    return (
      <Wrapper>
        {children({ session, onLogout: handleLogout })}
      </Wrapper>
    )
  }

  // Default — login screen
  return (
    <Wrapper>
      <LoginScreen
        onLogin={handleLogin}
        onForgot={handleForgotPassword}
        error={authError}
        loading={loading}
      />
    </Wrapper>
  )
}