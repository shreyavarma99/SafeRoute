# SafeRoute Project

SafeRoute is a real-time pedestrian and driving safety navigation app for New York City.

## Stack
- Frontend: React 19, Vite, Mapbox GL JS
- Backend: Node.js, Express
- Data: NYC Open Data (Socrata), Mapbox APIs

## Key Conventions
- Backend runs on port 3001, frontend on 5173
- All NYC data fetched from `data.cityofnewyork.us` Socrata endpoints
- Mapbox token in `frontend/.env` as `VITE_MAPBOX_TOKEN` and `backend/.env` as `MAPBOX_TOKEN`
- Never hardcode tokens in source files
- Grid size for safety zones: `0.001°` (~100m per cell)
- Safety score: `1 - normalized_danger` (1 = safest, 0 = most dangerous)

## Architecture
- `backend/index.js` — all API routes: `/api/zones`, `/api/route`, `/api/incidents`, `/api/street-vibe`
- `frontend/src/Map.jsx` — Mapbox map, all layers, markers, popups
- `frontend/src/App.jsx` — UI state, Rocky chat, RouteTracker, GoNowButton, DraggableCard
- `frontend/src/App.css` — all styles

## Data Sources
- NYPD complaints: `https://data.cityofnewyork.us/resource/5uac-w243.json`
- 311 service requests: `https://data.cityofnewyork.us/resource/erm2-nwe9.json`
- Mapbox Geocoding: `/geocoding/v5/mapbox.places/{query}.json`
- Mapbox Directions: `/directions/v5/mapbox/{profile}/{coords}`
