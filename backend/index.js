require('dotenv').config()
const express = require('express')
const cors = require('cors')
const fetch = require('node-fetch')

const app = express()
app.use(cors())

const GRID_SIZE = 0.001 // ~100m cells — street level

// Fetch live NYC 311 service calls (last 7 days, up to 50k rows)
// Dataset: https://data.cityofnewyork.us/resource/erm2-nwe9.json
async function fetchCrimeData() {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10)

  // Use NYPD complaint data for crime, 311 for disorder — merge both
  const [crimeRes, callsRes] = await Promise.all([
    fetch(
      `https://data.cityofnewyork.us/resource/5uac-w243.json` +
      `?$limit=25000&$where=cmplnt_fr_dt>'${sevenDaysAgo}'` +
      `&$select=latitude,longitude,law_cat_cd`
    ),
    fetch(
      `https://data.cityofnewyork.us/resource/erm2-nwe9.json` +
      `?$limit=25000&$where=created_date>'${sevenDaysAgo}T00:00:00'` +
      `&$select=latitude,longitude,complaint_type`
    ),
  ])

  const [crimes, calls] = await Promise.all([crimeRes.json(), callsRes.json()])

  // Normalise 311 calls to same shape with low severity
  const normalised311 = calls
    .filter(c => c.latitude && c.longitude)
    .map(c => ({ latitude: c.latitude, longitude: c.longitude, law_cat_cd: 'VIOLATION' }))

  return [...(Array.isArray(crimes) ? crimes : []), ...normalised311]
}

// Weight by offense severity
const SEVERITY = { FELONY: 3, MISDEMEANOR: 2, VIOLATION: 1 }

function buildZones(crimes) {
  const grid = {}

  for (const c of crimes) {
    const lat = parseFloat(c.latitude)
    const lng = parseFloat(c.longitude)
    if (!lat || !lng) continue

    const row = Math.floor(lat / GRID_SIZE)
    const col = Math.floor(lng / GRID_SIZE)
    const key = `${row},${col}`

    if (!grid[key]) grid[key] = { row, col, score: 0, count: 0 }
    grid[key].score += SEVERITY[c.law_cat_cd] ?? 1
    grid[key].count++
  }

  // Normalize scores 0–1
  const scores = Object.values(grid).map(z => z.score)
  const maxScore = Math.max(...scores, 1)

  const features = Object.values(grid).map(({ row, col, score, count }) => {
    const minLat = row * GRID_SIZE
    const minLng = col * GRID_SIZE
    const normalized = score / maxScore

    // Safety: 1 = safest (green), 0 = most dangerous (red)
    const safety = 1 - normalized

    return {
      type: 'Feature',
      properties: { safety, count, score },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [minLng,            minLat           ],
          [minLng + GRID_SIZE, minLat           ],
          [minLng + GRID_SIZE, minLat + GRID_SIZE],
          [minLng,            minLat + GRID_SIZE],
          [minLng,            minLat           ],
        ]],
      },
    }
  })

  return { type: 'FeatureCollection', features }
}

// Cache for 10 minutes
let cache = null
let cacheTime = 0

async function getZones() {
  if (cache && Date.now() - cacheTime < 5 * 60 * 1000) return cache
  const crimes = await fetchCrimeData()
  cache = buildZones(crimes)
  cacheTime = Date.now()
  return cache
}

// Score a route's coords against safety grid (higher = safer)
function scoreRoute(coords, zones) {
  const grid = {}
  for (const f of zones.features) {
    const [minLng, minLat] = f.geometry.coordinates[0][0]
    const key = `${Math.floor(minLat / GRID_SIZE)},${Math.floor(minLng / GRID_SIZE)}`
    grid[key] = f.properties.safety
  }
  let total = 0
  for (const [lng, lat] of coords) {
    const key = `${Math.floor(lat / GRID_SIZE)},${Math.floor(lng / GRID_SIZE)}`
    total += grid[key] ?? 1
  }
  return total / coords.length
}

// Get incidents that fall within cells along a route
function getIncidentsAlongRoute(coords, zones) {
  const cellKeys = new Set()
  for (const [lng, lat] of coords) {
    cellKeys.add(`${Math.floor(lat / GRID_SIZE)},${Math.floor(lng / GRID_SIZE)}`)
  }
  const incidents = []
  for (const f of zones.features) {
    const [minLng, minLat] = f.geometry.coordinates[0][0]
    const key = `${Math.floor(minLat / GRID_SIZE)},${Math.floor(minLng / GRID_SIZE)}`
    if (cellKeys.has(key) && f.properties.count > 0) {
      incidents.push({ count: f.properties.count, safety: f.properties.safety })
    }
  }
  incidents.sort((a, b) => a.safety - b.safety) // worst first
  return incidents
}

app.get('/api/zones', async (req, res) => {
  try {
    res.json(await getZones())
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

// POST /api/route  body: { origin: [lng,lat], destination: string }
app.use(express.json())
app.post('/api/route', async (req, res) => {
  try {
    const { origin, destination, mode = 'walking' } = req.body
    const profile = mode === 'driving' ? 'mapbox/driving' : 'mapbox/walking'
    const token = process.env.MAPBOX_TOKEN
    if (!token) return res.status(500).json({ error: 'MAPBOX_TOKEN not set' })

    // Geocode destination
    const geoRes = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(destination)}.json` +
      `?proximity=${origin[0]},${origin[1]}&limit=1&access_token=${token}`
    )
    const geoData = await geoRes.json()
    const destCoord = geoData.features?.[0]?.center
    if (!destCoord) return res.status(400).json({ error: 'Destination not found' })

    // Fetch up to 3 alternative routes — request steps for street names
    const dirRes = await fetch(
      `https://api.mapbox.com/directions/v5/${profile}/` +
      `${origin[0]},${origin[1]};${destCoord[0]},${destCoord[1]}` +
      `?alternatives=true&geometries=geojson&overview=full&steps=true&access_token=${token}`
    )
    const dirData = await dirRes.json()
    const routes = dirData.routes
    if (!routes?.length) return res.status(400).json({ error: 'No routes found' })

    const zones = await getZones()

    // Pick the safest route
    const scored = routes.map(r => ({
      geometry: r.geometry,
      duration: r.duration,
      distance: r.distance,
      steps: r.legs?.flatMap(l => l.steps) ?? [],
      safety: scoreRoute(r.geometry.coordinates, zones),
    }))
    scored.sort((a, b) => b.safety - a.safety)
    const best = scored[0]

    // Extract unique street names from steps
    const streets = [...new Set(
      (best.steps ?? [])
        .map(s => s.name)
        .filter(n => n && n.trim())
    )]

    // Build receipt explanation
    const pct = Math.round(best.safety * 100)
    const worst = scored[scored.length - 1]
    const avoided = scored.slice(1).map(r => Math.round(r.safety * 100))
    const receiptLines = [
      `📍 Route via: ${streets.slice(0, 5).join(' → ')}`,
      `🛡️ Safety score: ${pct}% — ${pct >= 80 ? 'very safe corridor' : pct >= 60 ? 'mostly safe' : pct >= 40 ? 'moderate risk' : 'use caution'}`,
      avoided.length ? `✅ Avoided ${avoided.length} riskier route${avoided.length > 1 ? 's' : ''} (scored ${avoided.join('%, ')}%)` : null,
      `⏱ ~${Math.round(best.duration / 60)} min ${mode === 'driving' ? 'drive' : 'walk'} · ${(best.distance / 1000).toFixed(1)}km`,
    ].filter(Boolean)

    // Worst route incidents
    let dangerRoute = null
    if (worst !== best) {
      const worstIncidents = getIncidentsAlongRoute(worst.geometry.coordinates, zones)
      const totalIncidents = worstIncidents.reduce((s, i) => s + i.count, 0)
      const worstStreets = [...new Set((worst.steps ?? []).map(s => s.name).filter(Boolean))]
      dangerRoute = {
        geometry: worst.geometry,
        safetyScore: Math.round(worst.safety * 100),
        totalIncidents,
        streets: worstStreets.slice(0, 4),
        warning: [
          `⚠️ Riskier route via: ${worstStreets.slice(0, 3).join(' → ')}`,
          `🚨 ${totalIncidents} incidents recorded in this area (last 7 days)`,
          `🛡️ Safety score: ${Math.round(worst.safety * 100)}% — avoid if possible`,
        ],
      }
    }

    res.json({
      geometry: best.geometry,
      destination: geoData.features[0].place_name,
      destCoord,
      safetyScore: pct,
      duration: Math.round(best.duration / 60),
      streets,
      receipt: receiptLines,
      dangerRoute,
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

// GET /api/incidents — recent incidents with description + status
app.get('/api/incidents', async (req, res) => {
  try {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 19)
    const url =
      `https://data.cityofnewyork.us/resource/erm2-nwe9.json` +
      `?$limit=500` +
      `&$where=created_date>'${since}' AND latitude IS NOT NULL` +
      `&$order=created_date DESC` +
      `&$select=latitude,longitude,complaint_type,descriptor,status,created_date,incident_address`
    const data = await (await fetch(url)).json()
    const features = data
      .filter(d => d.latitude && d.longitude)
      .map(d => ({
        type: 'Feature',
        properties: {
          type: d.complaint_type,
          descriptor: d.descriptor,
          status: d.status,
          address: d.incident_address,
          time: d.created_date,
        },
        geometry: { type: 'Point', coordinates: [parseFloat(d.longitude), parseFloat(d.latitude)] },
      }))
    res.json({ type: 'FeatureCollection', features })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

app.listen(3001, () => console.log('SafeRoute backend running on http://localhost:3001'))
