import React, { useEffect } from 'react'
import { Link } from 'react-router-dom'

const LANDING_CSS = `
*{box-sizing:border-box;margin:0;padding:0}
:root{
  --navy:#1a2744;--navy-mid:#243358;--navy-light:#2e4070;--navy-tint:#eaecf2;
  --gold:#b8932a;--gold-light:#d4a83a;--gold-bg:#fdf8ee;
  --text:#1a2032;--text-mid:#3d4a62;--text-light:#6b7a96;
  --surface:#ffffff;--bg:#f4f2ee;--border:#d8dae2;
}
html{scroll-behavior:smooth}
body{font-family:'DM Sans',sans-serif;background:var(--bg);color:var(--text);overflow-x:hidden}

.hero{background:var(--navy);min-height:100vh;display:flex;flex-direction:column;position:relative;overflow:hidden;}
.hero-grid{position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.03) 1px,transparent 1px);background-size:60px 60px;animation:gridDrift 20s linear infinite;}
@keyframes gridDrift{from{transform:translate(0,0)}to{transform:translate(60px,60px)}}
.hero-glow{position:absolute;top:-200px;right:-200px;width:700px;height:700px;border-radius:50%;background:radial-gradient(circle,rgba(184,147,42,0.15) 0%,transparent 70%);animation:glowPulse 6s ease-in-out infinite;}
.hero-glow2{position:absolute;bottom:-300px;left:-100px;width:600px;height:600px;border-radius:50%;background:radial-gradient(circle,rgba(46,64,112,0.6) 0%,transparent 70%);}
@keyframes glowPulse{0%,100%{transform:scale(1);opacity:0.8}50%{transform:scale(1.1);opacity:1}}
.lp-nav{position:relative;z-index:10;display:flex;justify-content:space-between;align-items:center;padding:24px 60px;}
.nav-logo{display:flex;flex-direction:column;line-height:1;}
.nav-logo-text{display:flex;align-items:baseline;gap:2px;}
.logo-parcel{font-family:'Playfair Display',serif;font-weight:700;font-size:22px;color:#fff;letter-spacing:-0.02em;}
.logo-comp{font-family:'Playfair Display',serif;font-weight:700;font-size:22px;color:var(--gold-light);letter-spacing:-0.02em;}
.logo-sub{font-size:9px;letter-spacing:0.2em;color:rgba(255,255,255,0.35);text-transform:uppercase;margin-top:2px;}
.lp-nav-links{display:flex;gap:32px;align-items:center;}
.lp-nav-links a{color:rgba(255,255,255,0.65);text-decoration:none;font-size:14px;font-weight:500;transition:color 0.2s;}
.lp-nav-links a:hover{color:#fff;}
.nav-cta{background:var(--gold);color:#fff !important;padding:10px 24px;border-radius:6px;font-weight:700;font-size:13px;letter-spacing:0.04em;text-decoration:none;transition:all 0.2s;}
.nav-cta:hover{background:var(--gold-light) !important;color:#fff !important;transform:translateY(-1px);}
.hero-content{flex:1;display:flex;align-items:center;padding:60px 60px 80px;position:relative;z-index:5;gap:80px;}
.hero-left{flex:1;max-width:600px;}
.hero-badge{display:inline-flex;align-items:center;gap:8px;background:rgba(184,147,42,0.15);border:1px solid rgba(184,147,42,0.3);border-radius:20px;padding:6px 14px;margin-bottom:28px;animation:fadeUp 0.6s ease both;}
.hero-badge-dot{width:6px;height:6px;border-radius:50%;background:var(--gold-light);animation:glowPulse 2s infinite;flex-shrink:0;}
.hero-badge-text{font-size:11px;color:var(--gold-light);letter-spacing:0.08em;text-transform:uppercase;font-weight:700;}
.hero-h1{font-family:'Playfair Display',serif;font-size:clamp(40px,5vw,68px);font-weight:900;line-height:1.05;color:#fff;letter-spacing:-0.02em;margin-bottom:24px;animation:fadeUp 0.6s 0.1s ease both;}
.hero-h1 em{color:var(--gold-light);font-style:normal;}
.hero-sub{font-size:18px;line-height:1.7;color:rgba(255,255,255,0.65);max-width:480px;margin-bottom:40px;font-weight:300;animation:fadeUp 0.6s 0.2s ease both;}
.hero-actions{display:flex;gap:14px;align-items:center;animation:fadeUp 0.6s 0.3s ease both;}
.btn-primary{background:var(--gold);color:#fff;padding:15px 32px;border-radius:7px;font-weight:700;font-size:15px;letter-spacing:0.03em;text-decoration:none;transition:all 0.25s;box-shadow:0 4px 24px rgba(184,147,42,0.4);display:inline-block;}
.btn-primary:hover{background:var(--gold-light);color:#fff;transform:translateY(-2px);box-shadow:0 8px 32px rgba(184,147,42,0.5);}
.btn-secondary{color:rgba(255,255,255,0.75);font-size:14px;font-weight:500;text-decoration:none;display:flex;align-items:center;gap:6px;transition:color 0.2s;}
.btn-secondary:hover{color:#fff;}
.btn-secondary svg{transition:transform 0.2s;}
.btn-secondary:hover svg{transform:translateX(4px);}
.hero-stats{display:flex;gap:40px;margin-top:56px;padding-top:40px;border-top:1px solid rgba(255,255,255,0.1);animation:fadeUp 0.6s 0.4s ease both;}
.stat-num{font-family:'Playfair Display',serif;font-size:36px;font-weight:700;color:#fff;line-height:1;}
.stat-label{font-size:12px;color:rgba(255,255,255,0.45);margin-top:4px;letter-spacing:0.06em;text-transform:uppercase;}
.hero-right{flex:0 0 480px;position:relative;animation:fadeUp 0.6s 0.3s ease both;}
.app-mockup{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);border-radius:12px;overflow:hidden;backdrop-filter:blur(10px);}
.mock-bar{background:rgba(26,39,68,0.8);padding:12px 16px;display:flex;align-items:center;gap:8px;border-bottom:1px solid rgba(255,255,255,0.08);}
.mock-dots{display:flex;gap:6px;}
.mock-dot{width:10px;height:10px;border-radius:50%;}
.mock-url{flex:1;background:rgba(255,255,255,0.06);border-radius:4px;padding:5px 12px;font-size:11px;color:rgba(255,255,255,0.4);font-family:monospace;margin:0 8px;}
.mock-body{padding:20px;}
.mock-search{display:flex;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);border-radius:6px;overflow:hidden;margin-bottom:16px;}
.mock-search-icon{padding:10px 14px;background:var(--navy-mid);display:flex;align-items:center;}
.mock-search-text{flex:1;padding:10px 12px;font-size:12px;color:rgba(255,255,255,0.5);font-style:italic;}
.mock-search-btn{background:var(--navy-mid);padding:10px 18px;font-size:12px;color:rgba(255,255,255,0.7);font-weight:700;letter-spacing:0.04em;}
.mock-table{width:100%;border-collapse:collapse;}
.mock-th{font-size:10px;letter-spacing:0.08em;color:rgba(255,255,255,0.4);text-transform:uppercase;padding:6px 8px;border-bottom:1px solid rgba(255,255,255,0.08);text-align:left;}
.mock-row td{font-size:11px;padding:8px;border-bottom:1px solid rgba(255,255,255,0.05);color:rgba(255,255,255,0.7);}
.mock-row:hover td{background:rgba(255,255,255,0.04);}
.mock-badge{display:inline-block;padding:2px 8px;border-radius:3px;font-size:9px;font-weight:700;letter-spacing:0.04em;}
.badge-ok{background:rgba(42,107,68,0.25);color:#7ae0a8;border:1px solid rgba(42,107,68,0.4);}
.badge-warn{background:rgba(184,122,26,0.2);color:#f0c060;border:1px solid rgba(184,122,26,0.35);}
.mock-class{font-size:9px;background:rgba(46,64,112,0.4);border:1px solid rgba(46,64,112,0.6);border-radius:3px;padding:1px 6px;color:rgba(255,255,255,0.6);}
.mock-price{color:#7ae0a8 !important;font-weight:700 !important;}
.mock-footer{margin-top:12px;padding-top:12px;border-top:1px solid rgba(255,255,255,0.06);display:flex;justify-content:space-between;align-items:center;}
.mock-count{font-size:10px;color:rgba(255,255,255,0.3);}
.mock-export{font-size:10px;color:var(--gold-light);font-weight:700;letter-spacing:0.04em;}
.mock-glow{position:absolute;top:-40px;right:-40px;width:200px;height:200px;border-radius:50%;background:radial-gradient(circle,rgba(184,147,42,0.2) 0%,transparent 70%);pointer-events:none;}
@keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}

.lp-section{padding:100px 60px;}
.section-label{font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:var(--gold);font-weight:700;margin-bottom:16px;}
.section-title{font-family:'Playfair Display',serif;font-size:clamp(32px,4vw,52px);font-weight:700;line-height:1.1;letter-spacing:-0.02em;color:var(--navy);margin-bottom:20px;}
.section-sub{font-size:17px;line-height:1.7;color:var(--text-light);max-width:560px;font-weight:300;}

.trust-bar{background:var(--surface);border-top:1px solid var(--border);border-bottom:1px solid var(--border);padding:28px 60px;display:flex;align-items:center;justify-content:space-between;gap:40px;}
.trust-label{font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:var(--text-light);font-weight:500;white-space:nowrap;}
.trust-items{display:flex;gap:48px;align-items:center;flex-wrap:wrap;}
.trust-item{font-size:13px;color:var(--text-light);font-weight:500;display:flex;align-items:center;gap:8px;}
.trust-icon{width:20px;height:20px;opacity:0.5;}

.features-section{background:var(--surface);}
.features-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:32px;margin-top:64px;}
.feature-card{background:var(--bg);border:1px solid var(--border);border-radius:10px;padding:32px;transition:all 0.25s;position:relative;overflow:hidden;}
.feature-card::before{content:'';position:absolute;top:0;left:0;right:0;height:3px;background:var(--gold);transform:scaleX(0);transform-origin:left;transition:transform 0.3s ease;}
.feature-card:hover{transform:translateY(-4px);box-shadow:0 12px 40px rgba(26,39,68,0.12);border-color:var(--gold);}
.feature-card:hover::before{transform:scaleX(1);}
.feature-icon{width:48px;height:48px;background:var(--navy-tint);border-radius:10px;display:flex;align-items:center;justify-content:center;margin-bottom:20px;font-size:22px;}
.feature-title{font-family:'Playfair Display',serif;font-size:20px;font-weight:700;color:var(--navy);margin-bottom:10px;}
.feature-desc{font-size:14px;line-height:1.7;color:var(--text-light);}

.how-section{background:var(--navy);color:#fff;position:relative;overflow:hidden;}
.how-section::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse at 80% 50%,rgba(184,147,42,0.1) 0%,transparent 60%);}
.how-section .section-title{color:#fff;}
.how-steps{display:grid;grid-template-columns:repeat(4,1fr);gap:0;margin-top:64px;position:relative;}
.how-steps::before{content:'';position:absolute;top:32px;left:calc(12.5% + 16px);right:calc(12.5% + 16px);height:1px;background:linear-gradient(90deg,transparent,rgba(184,147,42,0.5),rgba(184,147,42,0.5),rgba(184,147,42,0.5),transparent);}
.step{padding:0 24px;text-align:center;}
.step-num{width:64px;height:64px;border-radius:50%;background:rgba(184,147,42,0.15);border:2px solid rgba(184,147,42,0.4);display:flex;align-items:center;justify-content:center;margin:0 auto 20px;font-family:'Playfair Display',serif;font-size:24px;font-weight:700;color:var(--gold-light);position:relative;z-index:1;}
.step-title{font-weight:700;font-size:16px;color:#fff;margin-bottom:8px;}
.step-desc{font-size:13px;color:rgba(255,255,255,0.5);line-height:1.6;}

.demo-section{background:var(--bg);}
.demo-inner{display:flex;gap:80px;align-items:center;}
.demo-text{flex:1;}
.demo-checks{margin-top:32px;display:flex;flex-direction:column;gap:14px;}
.check-item{display:flex;gap:14px;align-items:flex-start;}
.check-icon{width:22px;height:22px;border-radius:50%;background:rgba(184,147,42,0.15);border:1px solid rgba(184,147,42,0.3);display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px;font-size:11px;color:var(--gold);font-weight:700;}
.check-text{font-size:14px;color:var(--text-mid);line-height:1.5;}
.check-text strong{color:var(--navy);font-weight:700;}
.demo-visual{flex:0 0 520px;}
.demo-screen{background:var(--surface);border:1px solid var(--border);border-radius:10px;overflow:hidden;box-shadow:0 24px 80px rgba(26,39,68,0.15);}
.demo-screen-bar{background:var(--navy);padding:10px 16px;display:flex;align-items:center;gap:8px;}
.demo-screen-title{font-size:11px;color:rgba(255,255,255,0.5);letter-spacing:0.05em;margin-left:8px;}
.demo-content{padding:20px;}
.fg-mock{background:var(--navy);border-radius:8px;padding:28px;text-align:center;}
.fg-logo{font-family:'Playfair Display',serif;font-size:24px;font-weight:700;color:#fff;margin-bottom:4px;}
.fg-logo span{color:var(--gold-light);}
.fg-sub{font-size:11px;color:rgba(255,255,255,0.35);letter-spacing:0.1em;text-transform:uppercase;margin-bottom:24px;}
.fg-form{text-align:left;}
.fg-label{font-size:10px;letter-spacing:0.1em;text-transform:uppercase;color:rgba(255,255,255,0.4);font-weight:700;margin-bottom:6px;}
.fg-select{width:100%;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.15);border-radius:6px;padding:10px 14px;color:rgba(255,255,255,0.8);font-size:13px;margin-bottom:16px;font-family:'DM Sans',sans-serif;}
.fg-years{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:20px;}
.yr-chip{padding:5px 12px;border-radius:20px;font-size:11px;font-weight:700;border:1px solid rgba(184,147,42,0.4);color:var(--gold-light);background:rgba(184,147,42,0.15);}
.fg-btn{width:100%;background:var(--gold);color:#fff;border:none;border-radius:6px;padding:12px;font-family:'Playfair Display',serif;font-size:15px;font-weight:700;cursor:pointer;letter-spacing:0.02em;}

.testi-section{background:var(--surface);}
.testi-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:24px;}
.testi-card{background:var(--bg);border:1px solid var(--border);border-radius:10px;padding:28px;position:relative;}
.testi-quote{font-family:'Playfair Display',serif;font-size:48px;line-height:0.8;color:var(--gold);opacity:0.3;position:absolute;top:20px;left:24px;}
.testi-text{font-size:14px;line-height:1.8;color:var(--text-mid);margin-bottom:20px;padding-top:16px;}
.testi-author{display:flex;align-items:center;gap:12px;}
.testi-avatar{width:38px;height:38px;border-radius:50%;background:var(--navy-tint);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;color:var(--navy);}
.testi-name{font-weight:700;font-size:13px;color:var(--navy);}
.testi-role{font-size:11px;color:var(--text-light);}

.pricing-section{background:var(--bg);}
.pricing-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:24px;margin-top:56px;max-width:960px;margin-left:auto;margin-right:auto;}
.price-card{background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:36px;position:relative;transition:all 0.25s;}
.price-card:hover{transform:translateY(-4px);box-shadow:0 16px 48px rgba(26,39,68,0.12);}
.price-card.featured{background:var(--navy);border-color:var(--gold);box-shadow:0 8px 40px rgba(26,39,68,0.25);}
.price-popular{position:absolute;top:-12px;left:50%;transform:translateX(-50%);background:var(--gold);color:#fff;font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;padding:4px 14px;border-radius:12px;white-space:nowrap;}
.price-tier{font-size:12px;letter-spacing:0.1em;text-transform:uppercase;color:var(--text-light);font-weight:700;margin-bottom:12px;}
.price-card.featured .price-tier{color:rgba(255,255,255,0.5);}
.price-amount{font-family:'Playfair Display',serif;font-size:48px;font-weight:700;color:var(--navy);line-height:1;}
.price-card.featured .price-amount{color:#fff;}
.price-period{font-size:13px;color:var(--text-light);margin-top:4px;margin-bottom:24px;}
.price-card.featured .price-period{color:rgba(255,255,255,0.45);}
.price-divider{height:1px;background:var(--border);margin-bottom:24px;}
.price-card.featured .price-divider{background:rgba(255,255,255,0.1);}
.price-features{list-style:none;display:flex;flex-direction:column;gap:12px;margin-bottom:32px;}
.price-feature{font-size:13px;color:var(--text-mid);display:flex;gap:10px;align-items:flex-start;}
.price-card.featured .price-feature{color:rgba(255,255,255,0.7);}
.price-check{color:var(--gold);font-weight:700;flex-shrink:0;}
.price-btn{display:block;text-align:center;padding:13px;border-radius:7px;font-weight:700;font-size:14px;letter-spacing:0.03em;text-decoration:none;transition:all 0.2s;}
.price-btn-outline{border:2px solid var(--border);color:var(--navy);}
.price-btn-outline:hover{border-color:var(--navy);background:var(--navy-tint);}
.price-btn-gold{background:var(--gold);color:#fff;box-shadow:0 4px 20px rgba(184,147,42,0.35);}
.price-btn-gold:hover{background:var(--gold-light);color:#fff;transform:translateY(-1px);}

.cta-section{background:var(--navy);padding:100px 60px;text-align:center;position:relative;overflow:hidden;}
.cta-section::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse at 50% 100%,rgba(184,147,42,0.15) 0%,transparent 60%);}
.cta-section .section-title{color:#fff;text-align:center;}
.cta-body{font-size:18px;color:rgba(255,255,255,0.55);margin-bottom:40px;font-weight:300;}
.cta-actions{display:flex;gap:16px;justify-content:center;position:relative;}

.lp-footer{background:#0f1729;padding:48px 60px;display:flex;justify-content:space-between;align-items:center;}
.footer-logo{font-family:'Playfair Display',serif;font-size:18px;color:#fff;font-weight:700;}
.footer-logo span{color:var(--gold-light);}
.footer-tagline{font-size:11px;color:rgba(255,255,255,0.3);margin-top:4px;letter-spacing:0.06em;}
.footer-links{display:flex;gap:24px;}
.footer-links a{font-size:13px;color:rgba(255,255,255,0.4);text-decoration:none;transition:color 0.2s;}
.footer-links a:hover{color:rgba(255,255,255,0.8);}
.footer-copy{font-size:12px;color:rgba(255,255,255,0.25);}

.reveal{opacity:0;transform:translateY(30px);transition:all 0.7s cubic-bezier(0.16,1,0.3,1);}
.reveal.visible{opacity:1;transform:translateY(0);}
.reveal-delay-1{transition-delay:0.1s;}
.reveal-delay-2{transition-delay:0.2s;}
.reveal-delay-3{transition-delay:0.3s;}
.lp-shape{position:absolute;border-radius:50%;opacity:0.04;background:#fff;pointer-events:none;}
`

export default function LandingPage() {
  useEffect(() => {
    const fontLink = document.createElement('link')
    fontLink.rel = 'stylesheet'
    fontLink.href = 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@300;400;500;700&display=swap'
    document.head.appendChild(fontLink)

    const style = document.createElement('style')
    style.id = 'landing-page-css'
    style.textContent = LANDING_CSS
    document.head.appendChild(style)

    const revealEls = document.querySelectorAll('.reveal')
    const revealObserver = new IntersectionObserver(
      (entries) => entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('visible'); revealObserver.unobserve(e.target) }
      }),
      { threshold: 0.1 }
    )
    revealEls.forEach(el => revealObserver.observe(el))

    const countEls = document.querySelectorAll('.count-up')
    const countObserver = new IntersectionObserver(
      (entries) => entries.forEach(e => {
        if (e.isIntersecting) {
          const el = e.target
          const target = parseInt(el.dataset.target, 10)
          const duration = 2000
          const start = performance.now()
          const tick = (t) => {
            const p = Math.min((t - start) / duration, 1)
            el.textContent = Math.round((1 - Math.pow(1 - p, 3)) * target).toLocaleString()
            if (p < 1) requestAnimationFrame(tick)
          }
          requestAnimationFrame(tick)
          countObserver.unobserve(el)
        }
      }),
      { threshold: 0.5 }
    )
    countEls.forEach(el => countObserver.observe(el))

    return () => {
      document.head.removeChild(fontLink)
      const injected = document.getElementById('landing-page-css')
      if (injected) document.head.removeChild(injected)
      revealObserver.disconnect()
      countObserver.disconnect()
    }
  }, [])

  return (
    <>
      {/* ── HERO ── */}
      <section className="hero">
        <div className="hero-grid" />
        <div className="hero-glow" />
        <div className="hero-glow2" />
        <div className="lp-shape" style={{ width: '400px', height: '400px', top: '-100px', left: '40%' }} />
        <div className="lp-shape" style={{ width: '200px', height: '200px', bottom: '10%', right: '5%' }} />

        <nav className="lp-nav">
          <div className="nav-logo">
            <div className="nav-logo-text">
              <span className="logo-parcel">Parcel</span><span className="logo-comp">Comp</span>
            </div>
            <span className="logo-sub">CRE Consulting · Indiana SDF</span>
          </div>
          <div className="lp-nav-links">
            <a href="#features">Features</a>
            <a href="#how">How It Works</a>
            <a href="#pricing">Pricing</a>
            <Link to="/app" className="nav-cta">Launch App →</Link>
          </div>
        </nav>

        <div className="hero-content">
          <div className="hero-left">
            <div className="hero-badge">
              <span className="hero-badge-dot" />
              <span className="hero-badge-text">Indiana SDF · Allen County Live · 9,600+ Transactions</span>
            </div>
            <h1 className="hero-h1">The Smartest Way to Find <em>Comparable Sales</em> in Indiana</h1>
            <p className="hero-sub">
              ParcelComp combines every Indiana SDF transaction with AI-powered search, instant FMV analysis,
              and one-click MD-26 export — purpose-built for ROW appraisers and CRE professionals.
            </p>
            <div className="hero-actions">
              <Link to="/app" className="btn-primary">Start Searching Free</Link>
              <a href="#how" className="btn-secondary">
                See how it works
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </a>
            </div>
            <div className="hero-stats">
              <div>
                <div className="stat-num"><span className="count-up" data-target="9629">0</span></div>
                <div className="stat-label">SDF Transactions</div>
              </div>
              <div>
                <div className="stat-num"><span className="count-up" data-target="92">0</span></div>
                <div className="stat-label">Indiana Counties</div>
              </div>
              <div>
                <div className="stat-num">
                  <span style={{ color: 'rgba(255,255,255,0.3)' }}>{'<'}</span>
                  30
                  <span style={{ color: 'var(--gold-light)' }}>s</span>
                </div>
                <div className="stat-label">AI Search Time</div>
              </div>
            </div>
          </div>

          <div className="hero-right">
            <div className="mock-glow" />
            <div className="app-mockup">
              <div className="mock-bar">
                <div className="mock-dots">
                  <div className="mock-dot" style={{ background: '#ff5f57' }} />
                  <div className="mock-dot" style={{ background: '#febc2e' }} />
                  <div className="mock-dot" style={{ background: '#28c840' }} />
                </div>
                <div className="mock-url">parcelcomp.com/app</div>
              </div>
              <div className="mock-body">
                <div className="mock-search">
                  <div className="mock-search-icon">
                    <svg width="14" height="14" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2.5" viewBox="0 0 24 24">
                      <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                    </svg>
                  </div>
                  <div className="mock-search-text">vacant ag land Allen County 40+ acres arm's length 2023–2025</div>
                  <div className="mock-search-btn">Search</div>
                </div>
                <table className="mock-table">
                  <thead>
                    <tr>
                      <th className="mock-th">Status</th>
                      <th className="mock-th">Class</th>
                      <th className="mock-th">Address</th>
                      <th className="mock-th">Sale Price</th>
                      <th className="mock-th">Acres</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="mock-row">
                      <td><span className="mock-badge badge-ok">✓ OK</span></td>
                      <td><span className="mock-class">101</span></td>
                      <td>8001 W Jefferson Blvd</td>
                      <td className="mock-price">$6,500,000</td>
                      <td>44.24</td>
                    </tr>
                    <tr className="mock-row">
                      <td><span className="mock-badge badge-ok">✓ OK</span></td>
                      <td><span className="mock-class">101</span></td>
                      <td>5501 S W Hamilton Rd</td>
                      <td className="mock-price">$6,750,000</td>
                      <td>37.97</td>
                    </tr>
                    <tr className="mock-row">
                      <td><span className="mock-badge badge-warn">? Verify</span></td>
                      <td><span className="mock-class">500</span></td>
                      <td>4200 N Clinton St</td>
                      <td className="mock-price">$890,000</td>
                      <td>41.00</td>
                    </tr>
                    <tr className="mock-row">
                      <td><span className="mock-badge badge-ok">✓ OK</span></td>
                      <td><span className="mock-class">101</span></td>
                      <td>9800 Coldwater Rd</td>
                      <td className="mock-price">$2,100,000</td>
                      <td>52.50</td>
                    </tr>
                  </tbody>
                </table>
                <div className="mock-footer">
                  <span className="mock-count">Showing 4 of 127 results · Allen County · 2023–2025</span>
                  <span className="mock-export">↓ Export MD-26</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TRUST BAR ── */}
      <div className="trust-bar">
        <span className="trust-label">Trusted Data From</span>
        <div className="trust-items">
          <div className="trust-item">
            <svg className="trust-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" />
            </svg>
            Indiana SDF Gateway
          </div>
          <div className="trust-item">
            <svg className="trust-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            DLGF Code List 60
          </div>
          <div className="trust-item">
            <svg className="trust-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20" />
            </svg>
            IndianaMap / IDNR
          </div>
          <div className="trust-item">
            <svg className="trust-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            Supabase Encrypted Storage
          </div>
          <div className="trust-item">
            <svg className="trust-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
            Claude AI · Anthropic
          </div>
        </div>
      </div>

      {/* ── FEATURES ── */}
      <section className="lp-section features-section" id="features">
        <div style={{ textAlign: 'center', marginBottom: '8px' }} className="reveal">
          <span className="section-label">Why ParcelComp</span>
        </div>
        <h2 className="section-title reveal" style={{ textAlign: 'center', margin: '0 auto 16px' }}>
          Everything You Need.<br />Nothing You Don't.
        </h2>
        <p className="section-sub reveal" style={{ textAlign: 'center', margin: '0 auto' }}>
          Built from the ground up for Indiana right-of-way appraisers, eminent domain analysis, and CRE comparable sales research.
        </p>
        <div className="features-grid">
          <div className="feature-card reveal reveal-delay-1">
            <div className="feature-icon">🤖</div>
            <h3 className="feature-title">AI-Powered Natural Language Search</h3>
            <p className="feature-desc">
              Just type what you need — "vacant ag land Hamilton County 40–80 acres arm's length after 2022" — and Claude AI
              translates it to precise filters instantly. No forms to fill out.
            </p>
          </div>
          <div className="feature-card reveal reveal-delay-2">
            <div className="feature-icon">⚖️</div>
            <h3 className="feature-title">Automatic FMV / Arm's Length Screening</h3>
            <p className="feature-desc">
              Every transaction is automatically screened for related parties, nominal prices, foreclosures, and non-market
              indicators. Flagged, verified, and color-coded at a glance.
            </p>
          </div>
          <div className="feature-card reveal reveal-delay-3">
            <div className="feature-icon">📄</div>
            <h3 className="feature-title">One-Click MD-26 Export</h3>
            <p className="feature-desc">
              Select your comps, click export. Receive a fully populated MD-26 Word document with street view photos, aerial
              maps, field notes, and AI-generated land descriptions — ready for your report.
            </p>
          </div>
          <div className="feature-card reveal reveal-delay-1">
            <div className="feature-icon">🗺️</div>
            <h3 className="feature-title">County-First Data Loading</h3>
            <p className="feature-desc">
              Choose your state, county, and transaction years before loading. Data stays scoped, fast, and relevant —
              engineered to scale from one county to all 92 without performance loss.
            </p>
          </div>
          <div className="feature-card reveal reveal-delay-2">
            <div className="feature-icon">📝</div>
            <h3 className="feature-title">Team Notes &amp; Verification</h3>
            <p className="feature-desc">
              Add field observations, verification notes, and mark comps as appraiser-verified. Notes are shared across your
              entire team in real time and appear in your MD-26 Comments section.
            </p>
          </div>
          <div className="feature-card reveal reveal-delay-3">
            <div className="feature-icon">📊</div>
            <h3 className="feature-title">Live Statistics Dashboard</h3>
            <p className="feature-desc">
              Instant median price, price-per-acre analysis, acreage distribution, and FMV quality breakdown — all scoped to
              exactly what you've filtered. Export full CSV anytime.
            </p>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="lp-section how-section" id="how">
        <div style={{ position: 'relative' }}>
          <span className="section-label reveal" style={{ display: 'block', textAlign: 'center' }}>Simple 4-Step Workflow</span>
          <h2 className="section-title reveal" style={{ textAlign: 'center', margin: '0 auto 8px' }}>
            From Login to<br /><em style={{ color: 'var(--gold-light)', fontStyle: 'normal' }}>MD-26 in Minutes</em>
          </h2>
          <div className="how-steps">
            <div className="step reveal reveal-delay-1">
              <div className="step-num">1</div>
              <h4 className="step-title">Select Your County</h4>
              <p className="step-desc">Choose state, county, and transaction years. Only the data you need loads — fast and focused.</p>
            </div>
            <div className="step reveal reveal-delay-2">
              <div className="step-num">2</div>
              <h4 className="step-title">Search with AI</h4>
              <p className="step-desc">Describe what you need in plain English. AI filters and ranks results in under 30 seconds.</p>
            </div>
            <div className="step reveal reveal-delay-3">
              <div className="step-num">3</div>
              <h4 className="step-title">Review &amp; Verify</h4>
              <p className="step-desc">FMV flags highlight non-arm's length sales automatically. Add team notes to your best comps.</p>
            </div>
            <div className="step reveal reveal-delay-3">
              <div className="step-num">4</div>
              <h4 className="step-title">Export MD-26</h4>
              <p className="step-desc">Check your comps, click Export. Download a complete Word document ready for your appraisal report.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── DEMO VISUAL ── */}
      <section className="lp-section demo-section">
        <div className="demo-inner">
          <div className="demo-text reveal">
            <span className="section-label">Intelligent Filtering</span>
            <h2 className="section-title">
              Stop Sorting Spreadsheets.<br />Start <em style={{ fontStyle: 'normal', color: 'var(--gold)' }}>Finding Comps.</em>
            </h2>
            <p className="section-sub">
              ParcelComp replaces hours of manual Gateway SDF browsing with a conversation. Describe what you need — the AI does the rest.
            </p>
            <div className="demo-checks">
              <div className="check-item">
                <div className="check-icon">✓</div>
                <p className="check-text"><strong>SDF ID direct lookup</strong> — paste any comp number and jump straight to it</p>
              </div>
              <div className="check-item">
                <div className="check-icon">✓</div>
                <p className="check-text"><strong>All 92 Indiana counties</strong> — Allen, Hamilton, Marion, and every county ready to load on demand</p>
              </div>
              <div className="check-item">
                <div className="check-icon">✓</div>
                <p className="check-text"><strong>DLGF property classes decoded</strong> — 500s RESIDENTIAL, 100s AG, 400s COMMERCIAL — human-readable in every view</p>
              </div>
              <div className="check-item">
                <div className="check-icon">✓</div>
                <p className="check-text"><strong>Bulk CSV export</strong> — download your filtered dataset for Excel analysis anytime</p>
              </div>
              <div className="check-item">
                <div className="check-icon">✓</div>
                <p className="check-text"><strong>Multi-tract consolidation</strong> — linked SDF parcels automatically combined with summed acreage and AV</p>
              </div>
            </div>
          </div>
          <div className="demo-visual reveal reveal-delay-2">
            <div className="demo-screen">
              <div className="demo-screen-bar">
                <div className="mock-dots">
                  <div className="mock-dot" style={{ background: '#ff5f57' }} />
                  <div className="mock-dot" style={{ background: '#febc2e' }} />
                  <div className="mock-dot" style={{ background: '#28c840' }} />
                </div>
                <span className="demo-screen-title">Select Dataset — ParcelComp</span>
              </div>
              <div className="demo-content">
                <div className="fg-mock">
                  <div className="fg-logo">Parcel<span>Comp</span></div>
                  <div className="fg-sub">CRE Consulting · Indiana SDF</div>
                  <div className="fg-form">
                    <div className="fg-label">State</div>
                    <select className="fg-select" defaultValue="Indiana">
                      <option>Indiana</option>
                    </select>
                    <div className="fg-label">County</div>
                    <select className="fg-select" defaultValue="ALLEN County">
                      <option>ALLEN County</option>
                    </select>
                    <div className="fg-label">Sale Years</div>
                    <div className="fg-years">
                      {['2021', '2022', '2023', '2024', '2025'].map(y => (
                        <span key={y} className="yr-chip">{y}</span>
                      ))}
                    </div>
                    <button type="button" className="fg-btn">Load Transactions →</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="lp-section testi-section">
        <span className="section-label" style={{ display: 'block', textAlign: 'center' }}>From the Field</span>
        <h2 className="section-title reveal" style={{ textAlign: 'center' }}>What Appraisers Are Saying</h2>
        <p className="section-sub reveal" style={{ textAlign: 'center', margin: '0 auto 60px' }}>
          Real feedback from right-of-way and CRE professionals using ParcelComp in active appraisal assignments.
        </p>
        <div className="testi-grid">
          <div className="testi-card reveal reveal-delay-1">
            <div className="testi-quote">"</div>
            <p className="testi-text">
              I used to spend half a day pulling comps from Gateway SDF and formatting them manually. Now I search in plain
              English, flag arm's length issues automatically, and export the MD-26 in one click. This changed my workflow entirely.
            </p>
            <div className="testi-author">
              <div className="testi-avatar">MR</div>
              <div>
                <div className="testi-name">M. Roberts, MAI</div>
                <div className="testi-role">Certified General Appraiser · Fort Wayne, IN</div>
              </div>
            </div>
          </div>
          <div className="testi-card reveal reveal-delay-2">
            <div className="testi-quote">"</div>
            <p className="testi-text">
              The FMV screening alone is worth it. Related-party transfers and foreclosure sales used to slip through our review.
              Now they're flagged automatically before we even look at the table. Huge time saver for INDOT projects.
            </p>
            <div className="testi-author">
              <div className="testi-avatar">JK</div>
              <div>
                <div className="testi-name">J. Kessler</div>
                <div className="testi-role">ROW Acquisition Manager · Indianapolis, IN</div>
              </div>
            </div>
          </div>
          <div className="testi-card reveal reveal-delay-3">
            <div className="testi-quote">"</div>
            <p className="testi-text">
              Being able to add verified field notes that the whole team sees is a game changer. We're running a 12-parcel
              eminent domain project and shared notes on every comp keep us consistent across three appraisers.
            </p>
            <div className="testi-author">
              <div className="testi-avatar">SL</div>
              <div>
                <div className="testi-name">S. Larson, SRA</div>
                <div className="testi-role">Senior Appraiser · CRE Consulting Group</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section className="lp-section pricing-section" id="pricing">
        <span className="section-label" style={{ display: 'block', textAlign: 'center' }}>Simple Pricing</span>
        <h2 className="section-title reveal" style={{ textAlign: 'center' }}>Built for Professionals,<br />Priced for Teams</h2>
        <div className="pricing-grid">
          <div className="price-card reveal reveal-delay-1">
            <div className="price-tier">Starter</div>
            <div className="price-amount">$49</div>
            <div className="price-period">per user / month</div>
            <div className="price-divider" />
            <ul className="price-features">
              <li className="price-feature"><span className="price-check">✓</span>1 county loaded at a time</li>
              <li className="price-feature"><span className="price-check">✓</span>Full AI search</li>
              <li className="price-feature"><span className="price-check">✓</span>FMV screening</li>
              <li className="price-feature"><span className="price-check">✓</span>CSV export</li>
              <li className="price-feature"><span className="price-check">✓</span>5 MD-26 exports/month</li>
              <li className="price-feature"><span className="price-check">✓</span>Personal notes</li>
            </ul>
            <Link to="/app" className="price-btn price-btn-outline">Get Started</Link>
          </div>
          <div className="price-card featured reveal reveal-delay-2">
            <div className="price-popular">Most Popular</div>
            <div className="price-tier">Professional</div>
            <div className="price-amount" style={{ color: '#fff' }}>$129</div>
            <div className="price-period">per user / month</div>
            <div className="price-divider" />
            <ul className="price-features">
              <li className="price-feature"><span className="price-check">✓</span>All 92 Indiana counties</li>
              <li className="price-feature"><span className="price-check">✓</span>Unlimited AI search</li>
              <li className="price-feature"><span className="price-check">✓</span>Advanced FMV analysis</li>
              <li className="price-feature"><span className="price-check">✓</span>Unlimited MD-26 exports</li>
              <li className="price-feature"><span className="price-check">✓</span>Team shared notes</li>
              <li className="price-feature"><span className="price-check">✓</span>Street View + aerial photos</li>
              <li className="price-feature"><span className="price-check">✓</span>Statistics dashboard</li>
            </ul>
            <Link to="/app" className="price-btn price-btn-gold">Start Free Trial</Link>
          </div>
          <div className="price-card reveal reveal-delay-3">
            <div className="price-tier">Enterprise</div>
            <div className="price-amount">Custom</div>
            <div className="price-period">volume &amp; state licensing</div>
            <div className="price-divider" />
            <ul className="price-features">
              <li className="price-feature"><span className="price-check">✓</span>Multi-state data</li>
              <li className="price-feature"><span className="price-check">✓</span>Unlimited team seats</li>
              <li className="price-feature"><span className="price-check">✓</span>White-label option</li>
              <li className="price-feature"><span className="price-check">✓</span>Custom data imports</li>
              <li className="price-feature"><span className="price-check">✓</span>API access</li>
              <li className="price-feature"><span className="price-check">✓</span>Dedicated support</li>
            </ul>
            <a href="mailto:info@consultcre.com" className="price-btn price-btn-outline">Contact Sales</a>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="cta-section">
        <div style={{ position: 'relative' }}>
          <span className="section-label reveal" style={{ display: 'block', textAlign: 'center' }}>Get Started Today</span>
          <h2 className="section-title reveal">
            Your Next Comp Is<br /><em style={{ color: 'var(--gold-light)', fontStyle: 'normal' }}>30 Seconds Away.</em>
          </h2>
          <p className="cta-body reveal">
            Join Indiana appraisers and ROW professionals who've replaced manual SDF research with ParcelComp.
          </p>
          <div className="cta-actions reveal">
            <Link to="/app" className="btn-primary" style={{ fontSize: '16px', padding: '17px 40px' }}>
              Launch ParcelComp Free →
            </Link>
            <a href="mailto:info@consultcre.com" className="btn-secondary" style={{ color: 'rgba(255,255,255,0.6)' }}>
              Talk to Sales
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </a>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="lp-footer">
        <div>
          <div className="footer-logo">Parcel<span>Comp</span></div>
          <div className="footer-tagline">CRE Consulting · Indiana SDF · DLGF Code List 60</div>
        </div>
        <div className="footer-links">
          <Link to="/app">App</Link>
          <a href="#features">Features</a>
          <a href="#pricing">Pricing</a>
          <a href="mailto:info@consultcre.com">Contact</a>
          <a href="https://consultcre.com" target="_blank" rel="noopener noreferrer">CRE Consulting</a>
        </div>
        <div className="footer-copy">© 2026 CRE Consulting. All rights reserved.</div>
      </footer>
    </>
  )
}
