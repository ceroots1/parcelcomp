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

export default function AuthGate({ children }) {
  const [session, setSession]       = useState(undefined)
  const [email, setEmail]           = useState('')
  const [password, setPassword]     = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [mode, setMode]             = useState('login')
  // mode options:
  //   'login'        — normal sign in screen
  //   'forgot'       — enter email to send reset link
  //   'sent'         — confirmation that reset email was sent
  //   'set_password' — new user setting password after clicking invite link
  //   'password_updated' — confirmation screen after password set
  const [error, setError]           = useState('')
  const [loading, setLoading]       = useState(false)

  useEffect(() => {
    // Check URL for tokens — this is how invite links and password
    // reset links come back to the app
    const hash = window.location.hash
    const params = new URLSearchParams(window.location.search)

    // Supabase puts tokens in the URL hash after invite/reset clicks
    // The hash looks like: #access_token=...&type=invite
    // or: #access_token=...&type=recovery
    if (hash && hash.includes('access_token')) {
      const hashParams = new URLSearchParams(hash.substring(1))
      const type = hashParams.get('type')
      const accessToken = hashParams.get('access_token')
      const refreshToken = hashParams.get('refresh_token')

      if (accessToken && (type === 'invite' || type === 'recovery')) {
        // Set the session from the URL tokens
        supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken || ''
        }).then(({ data, error }) => {
          if (!error && data.session) {
            // User is temporarily logged in — now prompt them to set a password
            setMode('set_password')
            setSession(data.session)
            // Clean the tokens out of the URL so it looks tidy
            window.history.replaceState({}, document.title, window.location.pathname)
          }
        })
        return
      }
    }

    // Normal session check on page load
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        // Don't override set_password mode when session updates
        setSession(prev => {
          return session
        })
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
    setLoading(false)
  }

  const handleForgotPassword = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin
    })
    if (error) setError(error.message)
    else setMode('sent')
    setLoading(false)
  }

  const handleSetPassword = async (e) => {
    e.preventDefault()
    setError('')
    if (password !== confirmPassword) {
      setError('Passwords do not match — please try again.')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setMode('password_updated')
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setMode('login')
    setSession(null)
  }

  // ── LOADING ───────────────────────────────────────────────
  if (session === undefined) {
    return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center',
        minHeight:'100vh', background:T.bg, fontFamily:'Lato, sans-serif' }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Lato:wght@400;700&family=Merriweather:wght@700&display=swap');
          @keyframes spin { to { transform: rotate(360deg) } }
        `}</style>
        <div style={{ textAlign:'center' }}>
          <div style={{ fontSize:'32px', animation:'spin 1s linear infinite',
            display:'inline-block', color:T.navy, marginBottom:'12px' }}>↻</div>
          <p style={{ color:T.textLight, fontSize:'13px' }}>Loading ParcelComp…</p>
        </div>
      </div>
    )
  }

  // ── SET PASSWORD SCREEN ───────────────────────────────────
  // Shown when a new user clicks their invite link
  if (mode === 'set_password') {
    return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center',
        minHeight:'100vh', background:T.bg, fontFamily:'Lato, sans-serif' }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Lato:wght@400;700;900&family=Merriweather:wght@700&display=swap');
          .auth-input:focus { outline: 2px solid ${T.gold} !important; border-color: ${T.gold} !important; }
        `}</style>
        <div style={{ background:'#fff', borderRadius:'8px', padding:'40px 44px',
          maxWidth:'400px', width:'92%',
          boxShadow:'0 8px 40px rgba(20,30,60,0.12)', border:'1px solid '+T.border }}>

          <div style={{ textAlign:'center', marginBottom:'28px' }}>
            <div style={{ display:'inline-flex', alignItems:'baseline', gap:'2px', marginBottom:'6px' }}>
              <span style={{ fontFamily:'Merriweather, serif', fontWeight:700, fontSize:'28px', color:T.navy }}>Parcel</span>
              <span style={{ fontFamily:'Merriweather, serif', fontWeight:700, fontSize:'28px', color:T.gold }}>Comp</span>
            </div>
            <p style={{ color:T.textLight, fontSize:'12px', margin:0, marginTop:'4px' }}>
              Welcome — please set your password to continue
            </p>
          </div>

          {mode === 'password_updated' ? (
            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize:'36px', marginBottom:'14px' }}>✓</div>
              <p style={{ color:T.okGreen, fontWeight:700, fontSize:'14px', marginBottom:'8px' }}>
                Password set successfully
              </p>
              <p style={{ color:T.textLight, fontSize:'13px', marginBottom:'20px' }}>
                You are now signed in to ParcelComp.
              </p>
              <button
                onClick={() => setMode('done')}
                style={{ background:T.navy, color:'#fff', border:'none', borderRadius:'5px',
                  padding:'12px 24px', fontFamily:'Lato, sans-serif', fontWeight:700,
                  fontSize:'14px', cursor:'pointer' }}>
                Go to ParcelComp →
              </button>
            </div>
          ) : (
            <form onSubmit={handleSetPassword}>
              <div style={{ marginBottom:'14px' }}>
                <label style={{ display:'block', fontSize:'11px', fontWeight:700, color:T.textLight,
                  letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:'5px' }}>
                  New Password
                </label>
                <input type="password" className="auth-input" value={password}
                  onChange={e => setPassword(e.target.value)} required autoFocus
                  placeholder="At least 8 characters"
                  style={{ width:'100%', border:'1px solid '+T.border, borderRadius:'5px',
                    padding:'11px 13px', fontFamily:'Lato, sans-serif', fontSize:'14px',
                    color:T.text, background:T.surfaceAlt, boxSizing:'border-box' }}
                />
              </div>

              <div style={{ marginBottom:'20px' }}>
                <label style={{ display:'block', fontSize:'11px', fontWeight:700, color:T.textLight,
                  letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:'5px' }}>
                  Confirm Password
                </label>
                <input type="password" className="auth-input" value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)} required
                  placeholder="Repeat your password"
                  style={{ width:'100%', border:'1px solid '+T.border, borderRadius:'5px',
                    padding:'11px 13px', fontFamily:'Lato, sans-serif', fontSize:'14px',
                    color:T.text, background:T.surfaceAlt, boxSizing:'border-box' }}
                />
              </div>

              {error && (
                <div style={{ background:T.flagBg, border:'1px solid '+T.flagBorder,
                  borderRadius:'5px', padding:'10px 13px', color:T.flagRed,
                  fontSize:'12px', marginBottom:'14px', lineHeight:'1.5' }}>
                  {error}
                </div>
              )}

              <button type="submit" disabled={loading}
                style={{ width:'100%', background:loading ? '#9aa3b5' : T.navy,
                  color:'#fff', border:'none', borderRadius:'5px', padding:'13px',
                  fontFamily:'Lato, sans-serif', fontWeight:700, fontSize:'14px',
                  cursor:loading ? 'wait' : 'pointer', letterSpacing:'0.04em' }}>
                {loading ? '…' : 'Set Password & Sign In'}
              </button>
            </form>
          )}
        </div>
      </div>
    )
  }

  // ── PASSWORD UPDATED CONFIRMATION ─────────────────────────
  if (mode === 'password_updated') {
    return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center',
        minHeight:'100vh', background:T.bg, fontFamily:'Lato, sans-serif' }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Lato:wght@400;700&family=Merriweather:wght@700&display=swap');`}</style>
        <div style={{ background:'#fff', borderRadius:'8px', padding:'40px 44px',
          maxWidth:'400px', width:'92%', textAlign:'center',
          boxShadow:'0 8px 40px rgba(20,30,60,0.12)', border:'1px solid '+T.border }}>
          <div style={{ fontSize:'48px', marginBottom:'16px' }}>✓</div>
          <h2 style={{ fontFamily:'Merriweather, serif', color:T.navy, marginBottom:'10px' }}>
            Password Set
          </h2>
          <p style={{ color:T.textLight, fontSize:'13px', marginBottom:'24px', lineHeight:'1.6' }}>
            Your password has been set. You are now signed in.
          </p>
          <button onClick={() => setMode('done')}
            style={{ background:T.navy, color:'#fff', border:'none', borderRadius:'5px',
              padding:'12px 28px', fontFamily:'Lato, sans-serif', fontWeight:700,
              fontSize:'14px', cursor:'pointer' }}>
            Open ParcelComp →
          </button>
        </div>
      </div>
    )
  }

  // ── LOGGED IN — render the app ────────────────────────────
  if (session && mode !== 'set_password') {
    return children({ session, onLogout: handleLogout })
  }

  // ── LOGIN SCREEN ──────────────────────────────────────────
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center',
      minHeight:'100vh', background:T.bg, fontFamily:'Lato, sans-serif' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lato:wght@400;700;900&family=Merriweather:wght@700&display=swap');
        @keyframes spin { to { transform: rotate(360deg) } }
        .auth-input:focus { outline: 2px solid ${T.gold} !important; border-color: ${T.gold} !important; }
      `}</style>

      <div style={{ background:'#fff', borderRadius:'8px', padding:'40px 44px',
        maxWidth:'400px', width:'92%',
        boxShadow:'0 8px 40px rgba(20,30,60,0.12)', border:'1px solid '+T.border }}>

        <div style={{ textAlign:'center', marginBottom:'30px' }}>
          <div style={{ display:'inline-flex', alignItems:'baseline', gap:'2px', marginBottom:'6px' }}>
            <span style={{ fontFamily:'Merriweather, serif', fontWeight:700, fontSize:'30px', color:T.navy }}>Parcel</span>
            <span style={{ fontFamily:'Merriweather, serif', fontWeight:700, fontSize:'30px', color:T.gold }}>Comp</span>
          </div>
          <p style={{ color:T.textLight, fontSize:'11px', letterSpacing:'0.12em',
            textTransform:'uppercase', margin:0 }}>
            CRE Consulting · Indiana SDF
          </p>
        </div>

        {mode === 'sent' ? (
          <div style={{ textAlign:'center', color:T.textLight, fontSize:'13px', lineHeight:'1.8' }}>
            <div style={{ fontSize:'36px', marginBottom:'14px' }}>✉️</div>
            <p>Password reset email sent to</p>
            <p><strong style={{ color:T.navy }}>{email}</strong></p>
            <p style={{ marginTop:'8px' }}>Check your inbox and click the link to set a new password.</p>
            <button onClick={() => { setMode('login'); setError('') }}
              style={{ marginTop:'18px', background:'none', border:'none',
                color:T.navy, fontWeight:700, cursor:'pointer', fontSize:'13px' }}>
              ← Back to sign in
            </button>
          </div>

        ) : (
          <form onSubmit={mode === 'login' ? handleLogin : handleForgotPassword}>

            <div style={{ marginBottom:'14px' }}>
              <label style={{ display:'block', fontSize:'11px', fontWeight:700,
                color:T.textLight, letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:'5px' }}>
                Email Address
              </label>
              <input type="email" className="auth-input" value={email}
                onChange={e => setEmail(e.target.value)} required autoFocus
                placeholder="you@example.com"
                style={{ width:'100%', border:'1px solid '+T.border, borderRadius:'5px',
                  padding:'11px 13px', fontFamily:'Lato, sans-serif', fontSize:'14px',
                  color:T.text, background:T.surfaceAlt, boxSizing:'border-box' }}
              />
            </div>

            {mode === 'login' && (
              <div style={{ marginBottom:'20px' }}>
                <label style={{ display:'block', fontSize:'11px', fontWeight:700,
                  color:T.textLight, letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:'5px' }}>
                  Password
                </label>
                <input type="password" className="auth-input" value={password}
                  onChange={e => setPassword(e.target.value)} required placeholder="••••••••"
                  style={{ width:'100%', border:'1px solid '+T.border, borderRadius:'5px',
                    padding:'11px 13px', fontFamily:'Lato, sans-serif', fontSize:'14px',
                    color:T.text, background:T.surfaceAlt, boxSizing:'border-box' }}
                />
              </div>
            )}

            {error && (
              <div style={{ background:T.flagBg, border:'1px solid '+T.flagBorder,
                borderRadius:'5px', padding:'10px 13px', color:T.flagRed,
                fontSize:'12px', marginBottom:'14px', lineHeight:'1.5' }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading}
              style={{ width:'100%', background:loading ? '#9aa3b5' : T.navy,
                color:'#fff', border:'none', borderRadius:'5px', padding:'13px',
                fontFamily:'Lato, sans-serif', fontWeight:700, fontSize:'14px',
                cursor:loading ? 'wait' : 'pointer', letterSpacing:'0.04em' }}>
              {loading ? '…' : mode === 'login' ? 'Sign In' : 'Send Reset Link'}
            </button>

            <button type="button"
              onClick={() => { setMode(mode === 'login' ? 'forgot' : 'login'); setError('') }}
              style={{ width:'100%', background:'none', border:'none', color:T.textLight,
                fontSize:'12px', cursor:'pointer', marginTop:'12px', padding:'6px' }}>
              {mode === 'login' ? 'Forgot your password?' : '← Back to sign in'}
            </button>

          </form>
        )}

        <p style={{ textAlign:'center', color:T.textLight, fontSize:'11px',
          marginTop:'22px', borderTop:'1px solid '+T.border, paddingTop:'16px', lineHeight:'1.7' }}>
          Access is by invitation only.<br />
          Contact{' '}
          <a href="mailto:info@consultcre.com"
            style={{ color:T.navy, fontWeight:700, textDecoration:'none' }}>
            info@consultcre.com
          </a>
        </p>
      </div>
    </div>
  )
}