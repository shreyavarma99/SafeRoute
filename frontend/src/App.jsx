import { useState, useRef, useEffect } from 'react'
import Map from './Map'
import './App.css'

function RaccoonSVG() {
  return (
    <svg viewBox="0 0 160 220" xmlns="http://www.w3.org/2000/svg" className="raccoon-svg">
      {/* === TAIL (behind body) === */}
      <g className="tail">
        <ellipse cx="118" cy="185" rx="28" ry="12" fill="#a09080" transform="rotate(-20 118 185)"/>
        <ellipse cx="118" cy="185" rx="22" ry="8" fill="#2a2a2a" transform="rotate(-20 118 185)"/>
        <ellipse cx="130" cy="172" rx="22" ry="10" fill="#a09080" transform="rotate(-30 130 172)"/>
        <ellipse cx="130" cy="172" rx="16" ry="6" fill="#2a2a2a" transform="rotate(-30 130 172)"/>
        <ellipse cx="138" cy="158" rx="18" ry="9" fill="#a09080" transform="rotate(-40 138 158)"/>
        <ellipse cx="138" cy="158" rx="12" ry="5" fill="#2a2a2a" transform="rotate(-40 138 158)"/>
      </g>

      {/* === BODY === */}
      <ellipse cx="78" cy="175" rx="38" ry="42" fill="#b0a090"/>
      {/* Belly */}
      <ellipse cx="78" cy="182" rx="22" ry="28" fill="#d8cfc0"/>

      {/* === ARMS === */}
      {/* Left arm */}
      <ellipse cx="42" cy="168" rx="12" ry="22" fill="#b0a090" transform="rotate(15 42 168)"/>
      <ellipse cx="36" cy="185" rx="10" ry="8" fill="#c8b89a"/>
      {/* Right arm */}
      <ellipse cx="114" cy="168" rx="12" ry="22" fill="#b0a090" transform="rotate(-15 114 168)"/>
      <ellipse cx="120" cy="185" rx="10" ry="8" fill="#c8b89a"/>

      {/* === LEGS / FEET === */}
      <ellipse cx="62" cy="210" rx="14" ry="9" fill="#a09080"/>
      <ellipse cx="94" cy="210" rx="14" ry="9" fill="#a09080"/>

      {/* === NECK === */}
      <ellipse cx="78" cy="135" rx="18" ry="12" fill="#b0a090"/>

      {/* === HEAD === */}
      {/* Ears */}
      <ellipse cx="50" cy="82" rx="14" ry="17" fill="#b0a090"/>
      <ellipse cx="106" cy="82" rx="14" ry="17" fill="#b0a090"/>
      <ellipse cx="50" cy="82" rx="8" ry="10" fill="#e8c4c4"/>
      <ellipse cx="106" cy="82" rx="8" ry="10" fill="#e8c4c4"/>

      {/* Head */}
      <circle cx="78" cy="108" r="38" fill="#c8b89a"/>

      {/* Cheek fluff */}
      <ellipse cx="44" cy="116" rx="12" ry="9" fill="#d8cfc0"/>
      <ellipse cx="112" cy="116" rx="12" ry="9" fill="#d8cfc0"/>

      {/* Eye mask */}
      <ellipse cx="62" cy="104" rx="16" ry="13" fill="#2a2a2a"/>
      <ellipse cx="94" cy="104" rx="16" ry="13" fill="#2a2a2a"/>
      <rect x="66" y="98" width="24" height="12" fill="#2a2a2a"/>

      {/* Eyes */}
      <circle cx="62" cy="103" r="9" fill="white"/>
      <circle cx="94" cy="103" r="9" fill="white"/>
      <circle cx="63" cy="103" r="5.5" fill="#1a1a2e"/>
      <circle cx="95" cy="103" r="5.5" fill="#1a1a2e"/>
      {/* Eye shine */}
      <circle cx="65.5" cy="100.5" r="2.5" fill="white"/>
      <circle cx="97.5" cy="100.5" r="2.5" fill="white"/>

      {/* Blink overlay — animated */}
      <ellipse cx="62" cy="103" r="9" fill="#c8b89a" className="blink-left"/>
      <ellipse cx="94" cy="103" r="9" fill="#c8b89a" className="blink-right"/>

      {/* Nose */}
      <ellipse cx="78" cy="116" rx="7" ry="5" fill="#d4748a"/>
      {/* Nose shine */}
      <ellipse cx="76" cy="114" rx="2.5" ry="1.5" fill="#e8a0b0" opacity="0.7"/>

      {/* Mouth */}
      <path d="M70 122 Q78 130 86 122" stroke="#a05060" strokeWidth="2.2" fill="none" strokeLinecap="round"/>

      {/* Forehead stripe */}
      <ellipse cx="78" cy="80" rx="6" ry="10" fill="#a89880" opacity="0.45"/>

      {/* Whiskers */}
      <line x1="30" y1="114" x2="56" y2="118" stroke="#888" strokeWidth="1" opacity="0.6"/>
      <line x1="30" y1="120" x2="56" y2="120" stroke="#888" strokeWidth="1" opacity="0.6"/>
      <line x1="100" y1="118" x2="126" y2="114" stroke="#888" strokeWidth="1" opacity="0.6"/>
      <line x1="100" y1="120" x2="126" y2="120" stroke="#888" strokeWidth="1" opacity="0.6"/>
    </svg>
  )
}

function GoNowButton({ safetyScore }) {
  const [advice, setAdvice] = useState(null)

  function assess() {
    const hour = new Date().getHours()
    const isNight = hour >= 22 || hour < 6
    const isEvening = hour >= 18 && hour < 22

    let msg, emoji
    if (safetyScore >= 80 && !isNight) {
      emoji = '🟢'; msg = "Yeah, go for it! This route looks really safe right now. Have a great trip! 🚀"
    } else if (safetyScore >= 80 && isNight) {
      emoji = '🟡'; msg = "The route itself is pretty safe, but it's late at night — stay aware of your surroundings and keep your phone handy! 🌙"
    } else if (safetyScore >= 60 && !isNight) {
      emoji = '🟡'; msg = "It's mostly fine to go! There's a little risk on this route but nothing too alarming. Stay alert and you'll be good 👍"
    } else if (safetyScore >= 60 && isNight) {
      emoji = '🟠'; msg = "I'd be a bit cautious — it's nighttime and this route has some moderate risk. Maybe stick to well-lit streets and stay aware! 🌙"
    } else if (safetyScore >= 40) {
      emoji = '🟠'; msg = `Hmm, I'd think twice! This route has a safety score of ${safetyScore}% — there's been some activity in the area. ${isNight ? 'Especially at this hour, ' : ''}consider an alternative or go with someone if you can 🤔`
    } else {
      emoji = '🔴'; msg = `I'd really recommend waiting or finding a different route! This area has a safety score of only ${safetyScore}% — that's pretty risky. ${isNight ? 'And it being nighttime makes it worse. ' : ''}Please stay safe! 🙏`
    }

    setAdvice({ emoji, msg })
  }

  return (
    <div className="go-now-wrap">
      {!advice && (
        <button className="go-now-btn" onClick={assess}>🤔 Should I go right now?</button>
      )}
      {advice && (
        <div className="go-now-result">
          <span className="go-now-emoji">{advice.emoji}</span>
          <p>{advice.msg}</p>
          <button className="go-now-reset" onClick={() => setAdvice(null)}>Ask again</button>
        </div>
      )}
    </div>
  )
}

function RouteTracker({ pins, pinNames, route, loading, mode, error }) {
  const hasStart = !!pins.start
  const hasDest  = !!pins.dest
  const done     = hasStart && hasDest && !loading && route

  return (
    <div className="route-tracker">
      {/* Horizontal path */}
      <div className="route-path-row">
        {/* Start node */}
        <div className="route-node">
          <div className="node-label top">{hasStart ? pinNames.start.split(',')[0] : 'Start'}</div>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" fill={hasStart ? '#22c55e' : '#1c2333'} stroke={hasStart ? '#22c55e' : '#2a3444'} strokeWidth="2"/>
            {hasStart && <path d="M8 12 l3 3 l5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>}
          </svg>
        </div>

        {/* Connecting path */}
        <div className="route-path-line">
          <svg width="100%" height="24" viewBox="0 0 200 24" preserveAspectRatio="none" fill="none">
            <path d="M0 12 C40 4, 80 20, 120 8, 160 16, 200 12 200 12" stroke={done ? '#60a5fa' : '#2a3444'} strokeWidth="2.5" strokeLinecap="round" strokeDasharray={done ? 'none' : '5 4'} className={done ? 'h-path-fill' : ''}/>
          </svg>
        </div>

        {/* Dest node */}
        <div className="route-node">
          <div className="node-label top">{hasDest ? pinNames.dest.split(',')[0] : 'Destination'}</div>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" fill={hasDest ? '#60a5fa' : '#1c2333'} stroke={hasDest ? '#60a5fa' : '#2a3444'} strokeWidth="2"/>
            {hasDest && <path d="M8 12 l3 3 l5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>}
          </svg>
        </div>
      </div>

      {!hasStart && !hasDest && (
        <div className="rocky-intro">
          <p>👋 Hey! I'm <strong>Rocky</strong> and I'm here to find you the safest route around the city! 🦝</p>
          <p>Here's how it works:</p>
          <ol>
            <li>🔍 Use the <strong>search bar</strong> at the top to find a location</li>
            <li>📍 Click <strong>"Set as Start"</strong> to set your starting point</li>
            <li>🏁 Search again and click <strong>"Set as Destination"</strong></li>
            <li>🗺️ I'll instantly find you the <strong>safest route</strong> there!</li>
          </ol>
          <p>The map is shaded by safety — 🟢 green means safe, 🔴 red means risky. Let's go! 🚀</p>
        </div>
      )}
      {hasStart && !hasDest && <p className="route-hint">✅ Nice! Start is set. Now search for your <strong>destination</strong>! 🏁</p>}
      {!hasStart && hasDest && <p className="route-hint">✅ Destination locked in! Now search for your <strong>starting point</strong> 📍</p>}
      {loading && <div className="route-finding">🔍 Crunching the data, finding your safest path…</div>}
      {error && <div className="route-error">😬 Oops! {error}</div>}
      {done && (
        <div className="route-result">
          <p style={{marginBottom:6}}>🎉 Found it! Here's your safest route:</p>
          <span>🛡️ {route.safetyScore}% safe</span>
          <span>⏱ ~{route.duration} min {mode === 'walking' ? 'walk' : 'drive'}</span>
          {route.receipt?.length > 0 && (
            <div className="route-receipt">
              {route.receipt.map((line, i) => <div key={i}>{line}</div>)}
            </div>
          )}
          {mode === 'walking' && route.vibes?.length > 0 && (
            <div className="street-vibes">
              <div className="vibes-title">🛣️ Street activity right now:</div>
              {route.vibes.map((v, i) => (
                <div key={i} className={`vibe-row vibe-${v.vibe}`}>{v.note}</div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function DraggableCard({ title, titleColor, lines, initialPos, onClose }) {
  const [pos, setPos] = useState(initialPos)
  const dragging = useRef(null)

  function onMouseDown(e) {
    dragging.current = { startX: e.clientX - pos.x, startY: e.clientY - pos.y }
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }
  function onMouseMove(e) {
    if (!dragging.current) return
    setPos({ x: e.clientX - dragging.current.startX, y: e.clientY - dragging.current.startY })
  }
  function onMouseUp() {
    dragging.current = null
    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('mouseup', onMouseUp)
  }

  return (
    <div className="draggable-card" style={{ left: pos.x, top: pos.y }}>
      <div className="draggable-card-header" onMouseDown={onMouseDown}>
        <span style={{ color: titleColor, fontWeight: 700, fontSize: 13 }}>{title}</span>
        <button className="draggable-card-close" onClick={onClose}>✕</button>
      </div>
      <div className="draggable-card-body">
        {lines.map((l, i) => <div key={i}>{l}</div>)}
      </div>
    </div>
  )
}

export default function App() {
  const [open, setOpen] = useState(true)
  const [searchInput, setSearchInput] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [pins, setPins] = useState({ start: null, dest: null })
  const [pinNames, setPinNames] = useState({ start: '', dest: '' })
  const [route, setRoute] = useState(null)
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState('walking')
  const mapRef = useRef(null)
  const debounceRef = useRef(null)

  // Autocomplete via Mapbox Geocoding
  function onSearchChange(e) {
    const val = e.target.value
    setSearchInput(val)
    clearTimeout(debounceRef.current)
    if (!val.trim()) { setSuggestions([]); return }
    debounceRef.current = setTimeout(async () => {
      const token = import.meta.env.VITE_MAPBOX_TOKEN
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(val)}.json?limit=5&access_token=${token}`
      )
      const data = await res.json()
      setSuggestions(data.features ?? [])
    }, 300)
  }

  function selectSuggestion(feature) {
    setSearchInput(feature.place_name)
    setSuggestions([])
    mapRef.current?.flyTo(feature.center, feature.place_name)
  }

  function handlePinAction(type, coord, name) {
    setPins(p => ({ ...p, [type]: coord }))
    setPinNames(p => ({ ...p, [type]: name }))
  }

  const [routeError, setRouteError] = useState(null)

  async function runRoute(start, dest, destName) {
    setLoading(true)
    setRouteError(null)
    try {
      const res = await fetch('http://localhost:3001/api/route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ origin: start, destination: destName, mode }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setRoute({ geometry: data.geometry, pins: { start, dest }, safetyScore: data.safetyScore, duration: data.duration, receipt: data.receipt, dangerRoute: data.dangerRoute, streets: data.streets })

      // Fetch street vibes for walking routes
      if (mode === 'walking' && data.streets?.length) {
        fetch('http://localhost:3001/api/street-vibe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ streets: data.streets.slice(0, 5) }),
        })
          .then(r => r.json())
          .then(v => setRoute(r => r ? { ...r, vibes: v.vibes } : r))
          .catch(() => {})
      }
    } catch (e) {
      setRouteError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const [showSafeCard, setShowSafeCard] = useState(true)
  const [showDangerCard, setShowDangerCard] = useState(true)

  // Reset card visibility when new route is calculated
  useEffect(() => {
    if (route) { setShowSafeCard(true); setShowDangerCard(true) }
  }, [route?.geometry])
  useEffect(() => {
    if (pins.start && pins.dest) {
      setRoute(null)
      runRoute(pins.start, pins.dest, pinNames.dest)
    }
  }, [pins, mode])

  return (
    <div className="app-wrapper">
      <div className="map-frame">
        <div className="map-title">⬡ SafeRoute</div>

        {/* Autocomplete search */}
        <div className="map-search">
          <div className="search-wrap">
            <input
              type="text"
              placeholder="Search a location…"
              className="map-search-input"
              value={searchInput}
              onChange={onSearchChange}
              onKeyDown={e => e.key === 'Escape' && setSuggestions([])}
            />
            {suggestions.length > 0 && (
              <ul className="suggestions">
                {suggestions.map(f => (
                  <li key={f.id} onClick={() => selectSuggestion(f)}>{f.place_name}</li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <Map ref={mapRef} route={route} onPinAction={handlePinAction} />

        <div className="map-legend">
          <div className="legend-title">Safety Index</div>
          <div className="legend-bar"/>
          <div className="legend-labels"><span>High Risk</span><span>Safe</span></div>
        </div>
      </div>

      {/* Draggable route info cards — outside map-frame to avoid canvas stacking context */}
      {route && showSafeCard && (
        <DraggableCard
          title="🗺️ Safest Route"
          titleColor="#60a5fa"
          lines={route.receipt?.length > 0 ? route.receipt : [`🛡️ Safety score: ${route.safetyScore}%`, `⏱ ~${route.duration} min ${mode === 'walking' ? 'walk' : 'drive'}`]}
          initialPos={{ x: 80, y: 80 }}
          onClose={() => setShowSafeCard(false)}
        />
      )}
      {route?.dangerRoute && showDangerCard && (
        <DraggableCard
          title="⚠️ Risky Route"
          titleColor="#ef4444"
          lines={route.dangerRoute.warning?.length > 0 ? route.dangerRoute.warning : [`Safety score: ${route.dangerRoute.safetyScore}%`, `Incidents: ${route.dangerRoute.totalIncidents}`]}
          initialPos={{ x: 80, y: 280 }}
          onClose={() => setShowDangerCard(false)}
        />
      )}

      <div className="chat-widget">
        {open && (
          <div className="chat-panel">
            <div className="chat-header">
              <div className="chat-header-info">
                <div className="chat-name">Rocky</div>
                <div className="chat-status"><span className="status-dot"/>Safe Route AI</div>
              </div>
              <button className="chat-close" onClick={() => setOpen(false)}>✕</button>
            </div>

            <div className="mode-toggle">
              <button className={`mode-btn ${mode === 'walking' ? 'active' : ''}`} onClick={() => setMode('walking')}>🚶 Walking</button>
              <button className={`mode-btn ${mode === 'driving' ? 'active' : ''}`} onClick={() => setMode('driving')}>🚗 Driving</button>
            </div>

            <div className="chat-messages">
              <RouteTracker pins={pins} pinNames={pinNames} route={route} loading={loading} mode={mode} error={routeError} />
              {route && <GoNowButton safetyScore={route.safetyScore} />}
              {pins.start && pins.dest && (
                <button className="clear-btn" onClick={() => { setPins({ start: null, dest: null }); setRoute(null) }}>
                  Clear route
                </button>
              )}
            </div>
          </div>
        )}

        <button className="raccoon-btn" onClick={() => setOpen(o => !o)} aria-label="Open chat">
          <RaccoonSVG />
        </button>
      </div>
    </div>
  )
}
