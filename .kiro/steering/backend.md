# Backend API

## Endpoints

### GET /api/zones
Returns a GeoJSON FeatureCollection of safety grid cells covering NYC.
- Fetches last 7 days of NYPD complaints + 311 calls (up to 25k each)
- Builds 0.001° grid, weights by severity (Felony=3, Misdemeanor=2, Violation/311=1)
- Normalizes scores, returns `safety` (0–1) and `count` per cell
- Cached for 5 minutes

### POST /api/route
Body: `{ origin: [lng, lat], destination: string, mode: "walking"|"driving" }`
- Geocodes destination via Mapbox
- Fetches up to 3 alternative routes with steps
- Scores each route against safety grid, picks safest
- Returns: geometry, safetyScore, duration, streets, stepGeometries, receipt, dangerRoute

### GET /api/incidents
Returns GeoJSON FeatureCollection of recent 311 incidents with coordinates.
- Last 7 days, ordered by most recent, up to 500
- Fields: complaint_type, descriptor, status, created_date, incident_address

### POST /api/street-vibe
Body: `{ streets: string[] }`
- Fetches last 6h of noise/activity 311 complaints
- Counts matches per street name
- Returns vibe per street: busy / moderate / quiet / calm
