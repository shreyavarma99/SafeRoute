import { useState } from 'react'
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

export default function App() {
  const [open, setOpen] = useState(false)

  return (
    <div className="app-wrapper">
      <div className="map-frame">
        <div className="map-title">⬡ SafeRoute</div>
        <Map />
        <div className="map-legend">
          <div className="legend-title">Safety Index</div>
          <div className="legend-bar"/>
          <div className="legend-labels">
            <span>High Risk</span>
            <span>Safe</span>
          </div>
        </div>
      </div>

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
            <div className="chat-messages">
              <div className="message bot">
                <p>Hey! I'm Rocky 🦝 — your safe route guide. Where are you headed?</p>
              </div>
            </div>
            <div className="chat-input-row">
              <input type="text" placeholder="Enter a destination..." className="chat-input" />
              <button className="chat-send">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"/>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              </button>
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
