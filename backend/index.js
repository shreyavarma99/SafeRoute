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

app.get('/api/zones', async (req, res) => {
  try {
    if (cache && Date.now() - cacheTime < 10 * 60 * 1000) {
      return res.json(cache)
    }
    const crimes = await fetchCrimeData()
    cache = buildZones(crimes)
    cacheTime = Date.now()
    res.json(cache)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

app.listen(3001, () => console.log('SafeRoute backend running on http://localhost:3001'))
