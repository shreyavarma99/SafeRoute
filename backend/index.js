require('dotenv').config()
const express = require('express')
const cors = require('cors')
const fetch = require('node-fetch')

const app = express()
app.use(cors())

const GRID_SIZE = 0.008 // ~0.8km cells

// Fetch recent NYPD complaints from NYC Open Data (last 90 days, up to 5000 rows)
async function fetchCrimeData() {
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10)

  const url =
    `https://data.cityofnewyork.us/resource/5uac-w243.json` +
    `?$limit=5000&$where=cmplnt_fr_dt>'${ninetyDaysAgo}'` +
    `&$select=latitude,longitude,law_cat_cd`

  const res = await fetch(url)
  if (!res.ok) throw new Error(`NYC API error: ${res.status}`)
  return res.json()
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
  if (cache && Date.now() - cacheTime < 10 * 60 * 1000) return cache
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

    // Fetch up to 3 alternative routes
    const dirRes = await fetch(
      `https://api.mapbox.com/directions/v5/${profile}/` +
      `${origin[0]},${origin[1]};${destCoord[0]},${destCoord[1]}` +
      `?alternatives=true&geometries=geojson&overview=full&access_token=${token}`
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
      safety: scoreRoute(r.geometry.coordinates, zones),
    }))
    scored.sort((a, b) => b.safety - a.safety)
    const best = scored[0]

    res.json({
      geometry: best.geometry,
      destination: geoData.features[0].place_name,
      destCoord,
      safetyScore: Math.round(best.safety * 100),
      duration: Math.round(best.duration / 60),
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

app.listen(3001, () => console.log('SafeRoute backend running on http://localhost:3001'))
