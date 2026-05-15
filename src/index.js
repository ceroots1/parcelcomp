import React from 'react'
import ReactDOM from 'react-dom/client'
import AuthGate from './AuthGate'
import App from './ParcelComp'

const root = ReactDOM.createRoot(document.getElementById('root'))

root.render(
  <AuthGate>
    {({ session, onLogout }) => (
      <App session={session} onLogout={onLogout} />
    )}
  </AuthGate>
)