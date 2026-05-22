import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import LandingPage from './LandingPage'
import AuthGate from './AuthGate'
import FilterGate from './FilterGate'
import App from './ParcelComp'

function AppRoute() {
  return (
    <AuthGate>
      {({ session, onLogout }) => (
        <FilterGate>
          {({ countyPrefix, countyName, selectedYears, onChangeCounty }) => (
            <App session={session} onLogout={onLogout}
              countyPrefix={countyPrefix} countyName={countyName}
              selectedYears={selectedYears} onChangeCounty={onChangeCounty} />
          )}
        </FilterGate>
      )}
    </AuthGate>
  )
}

const root = ReactDOM.createRoot(document.getElementById('root'))

root.render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/app" element={<AppRoute />} />
    </Routes>
  </BrowserRouter>
)
