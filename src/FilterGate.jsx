import React, { useState } from 'react';
import { loadCountyYears } from './db';

const COUNTY_CODES = {
  "01":"ADAMS","02":"ALLEN","03":"BARTHOLOMEW","04":"BENTON","05":"BLACKFORD","06":"BOONE","07":"BROWN","08":"CARROLL",
  "09":"CASS","10":"CLARK","11":"CLAY","12":"CLINTON","13":"CRAWFORD","14":"DAVIESS","15":"DEARBORN","16":"DECATUR",
  "17":"DEKALB","18":"DELAWARE","19":"DUBOIS","20":"ELKHART","21":"FAYETTE","22":"FLOYD","23":"FOUNTAIN","24":"FRANKLIN",
  "25":"FULTON","26":"GIBSON","27":"GRANT","28":"GREENE","29":"HAMILTON","30":"HANCOCK","31":"HARRISON","32":"HENDRICKS",
  "33":"HENRY","34":"HOWARD","35":"HUNTINGTON","36":"JACKSON","37":"JASPER","38":"JAY","39":"JEFFERSON","40":"JENNINGS",
  "41":"JOHNSON","42":"KNOX","43":"KOSCIUSKO","44":"LAGRANGE","45":"LAKE","46":"LAPORTE","47":"LAWRENCE","48":"MADISON",
  "49":"MARION","50":"MARSHALL","51":"MARTIN","52":"MIAMI","53":"MONROE","54":"MONTGOMERY","55":"MORGAN","56":"NEWTON",
  "57":"NOBLE","58":"OHIO","59":"ORANGE","60":"OWEN","61":"PARKE","62":"PERRY","63":"PIKE","64":"PORTER","65":"POSEY",
  "66":"PULASKI","67":"PUTNAM","68":"RANDOLPH","69":"RIPLEY","70":"RUSH","71":"ST. JOSEPH","72":"SCOTT","73":"SHELBY",
  "74":"SPENCER","75":"STARKE","76":"STEUBEN","77":"SULLIVAN","78":"SWITZERLAND","79":"TIPPECANOE","80":"TIPTON",
  "81":"UNION","82":"VANDERBURGH","83":"VERMILLION","84":"VIGO","85":"WABASH","86":"WARREN","87":"WARRICK",
  "88":"WASHINGTON","89":"WAYNE","90":"WELLS","91":"WHITE","92":"WHITLEY",
};

const navy = '#1a2744';
const gold  = '#e6c05a';

const inputStyle = {
  width: '100%', padding: '9px 12px', borderRadius: '6px',
  border: '1px solid #dce3ee', fontFamily: 'Lato,sans-serif',
  fontSize: '14px', color: navy, background: '#fff',
  boxSizing: 'border-box', outline: 'none',
};

const labelStyle = {
  display: 'block', fontSize: '11px', fontWeight: 700,
  letterSpacing: '0.08em', color: '#8a96a8',
  textTransform: 'uppercase', marginBottom: '6px',
};

export default function FilterGate({ children }) {
  const [county, setCounty] = useState('');
  const [availableYears, setAvailableYears] = useState([]);
  const [selectedYears, setSelectedYears] = useState([]);
  const [yearsLoading, setYearsLoading] = useState(false);
  const [filter, setFilter] = useState(null);

  const handleCountyChange = async (e) => {
    const prefix = e.target.value;
    setCounty(prefix);
    setAvailableYears([]);
    setSelectedYears([]);
    if (!prefix) return;
    setYearsLoading(true);
    const years = await loadCountyYears(prefix);
    setAvailableYears(years);
    setSelectedYears([...years]);
    setYearsLoading(false);
  };

  const toggleYear = (year) => {
    setSelectedYears(prev =>
      prev.includes(year) ? prev.filter(y => y !== year) : [...prev, year]
    );
  };

  const handleLoad = () => {
    if (!county || !selectedYears.length) return;
    setFilter({ countyPrefix: county, countyName: COUNTY_CODES[county], years: [...selectedYears] });
  };

  if (filter) {
    return children({
      countyPrefix:    filter.countyPrefix,
      countyName:      filter.countyName,
      selectedYears:   filter.years,
      onChangeCounty:  () => setFilter(null),
    });
  }

  const canLoad = county && selectedYears.length > 0 && !yearsLoading;

  return (
    <div style={{ minHeight: '100vh', background: navy, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: 'Lato,sans-serif' }}>

      <div style={{ marginBottom: '28px', textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px', justifyContent: 'center' }}>
          <span style={{ fontFamily: 'Merriweather,serif', fontWeight: 700, fontSize: '26px', letterSpacing: '-0.02em', color: '#fff' }}>Parcel</span>
          <span style={{ fontFamily: 'Merriweather,serif', fontWeight: 700, fontSize: '26px', letterSpacing: '-0.02em', color: gold }}>Comp</span>
        </div>
        <div style={{ fontSize: '9px', letterSpacing: '0.22em', color: 'rgba(255,255,255,0.32)', marginTop: '4px', textTransform: 'uppercase' }}>
          CRE Consulting · Indiana SDF
        </div>
      </div>

      <div style={{ background: '#fff', borderRadius: '10px', padding: '32px 36px', width: '100%', maxWidth: '420px', boxShadow: '0 8px 40px rgba(10,18,40,0.35)' }}>
        <h2 style={{ margin: '0 0 6px', fontFamily: 'Merriweather,serif', fontSize: '17px', fontWeight: 700, color: navy }}>Select Dataset</h2>
        <p style={{ margin: '0 0 24px', fontSize: '13px', color: '#4a5568', lineHeight: 1.5 }}>Choose a county and sale years to load.</p>

        <label style={labelStyle}>State</label>
        <select disabled style={{ ...inputStyle, marginBottom: '18px', background: '#f8f9fc', cursor: 'not-allowed', opacity: 0.75 }}>
          <option>Indiana</option>
        </select>

        <label style={labelStyle}>County</label>
        <select value={county} onChange={handleCountyChange} style={{ ...inputStyle, marginBottom: '20px', cursor: 'pointer' }}>
          <option value="">— Select county —</option>
          {Object.entries(COUNTY_CODES).map(([code, name]) => (
            <option key={code} value={code}>{name} County</option>
          ))}
        </select>

        {county && (
          <>
            <label style={labelStyle}>
              Sale Years
              {yearsLoading && <span style={{ fontWeight: 400, letterSpacing: 0, textTransform: 'none', marginLeft: '6px' }}>loading…</span>}
            </label>
            {!yearsLoading && availableYears.length === 0 && (
              <p style={{ fontSize: '13px', color: '#8a96a8', margin: '0 0 20px' }}>No transactions found for this county.</p>
            )}
            {availableYears.length > 0 && (
              <>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                  {availableYears.map(year => {
                    const on = selectedYears.includes(year);
                    return (
                      <button key={year} onClick={() => toggleYear(year)}
                        style={{ padding: '5px 14px', borderRadius: '20px', border: '1px solid ' + (on ? navy : '#c8d0e0'), background: on ? navy : '#f0f3f8', color: on ? '#fff' : '#4a5568', fontFamily: 'Lato,sans-serif', fontSize: '13px', fontWeight: on ? 700 : 400, cursor: 'pointer', transition: 'all 0.12s' }}>
                        {year}
                      </button>
                    );
                  })}
                </div>
                <div style={{ marginBottom: '24px' }}>
                  <button onClick={() => setSelectedYears([...availableYears])}
                    style={{ background: 'none', border: 'none', color: '#8a96a8', fontSize: '11px', cursor: 'pointer', padding: '0', marginRight: '12px', textDecoration: 'underline' }}>
                    Select all
                  </button>
                  <button onClick={() => setSelectedYears([])}
                    style={{ background: 'none', border: 'none', color: '#8a96a8', fontSize: '11px', cursor: 'pointer', padding: '0', textDecoration: 'underline' }}>
                    Clear
                  </button>
                </div>
              </>
            )}
          </>
        )}

        <button onClick={handleLoad} disabled={!canLoad}
          style={{ width: '100%', padding: '11px', borderRadius: '6px', border: 'none', background: canLoad ? navy : '#c8d0e0', color: canLoad ? '#fff' : 'rgba(255,255,255,0.6)', fontFamily: 'Lato,sans-serif', fontSize: '14px', fontWeight: 700, cursor: canLoad ? 'pointer' : 'not-allowed', letterSpacing: '0.04em', transition: 'background 0.15s' }}>
          Load Transactions
        </button>
      </div>
    </div>
  );
}
