import React from 'react'
import ReactDOM from 'react-dom/client'
import AuthGate from './AuthGate'
import FilterGate from './FilterGate'
import App from './ParcelComp'

const root = ReactDOM.createRoot(document.getElementById('root'))

root.render(
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
