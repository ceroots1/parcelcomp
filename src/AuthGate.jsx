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
}

export default function AuthGate({ children }) {
  const [session, setSession]   = useState(undefined)
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode]         = useState('login')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => setSession(session)
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

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  // Loading
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

  // Logged in — render the app
  if (session) {
    return children({ session, onLogout: handleLogout })
  }

  // Login screen
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

        {/* Wordmark */}
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

        {/* Sent confirmation */}
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