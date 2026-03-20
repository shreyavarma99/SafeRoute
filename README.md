# SafeRoute 🦝

SafeRoute is a real-time pedestrian and driving safety navigation app for New York City. It overlays live crime and incident data on an interactive map, calculates the safest route between two points, and gives you a street-level activity report before you go.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, Mapbox GL JS |
| Backend | Node.js, Express |
| Map | Mapbox (tiles, geocoding, directions) |
| Data | NYC Open Data (Socrata API) |

---

## Getting Started

### Prerequisites
- Node.js 18+
- A free [Mapbox account](https://account.mapbox.com) — grab a public token

### Setup

```bash
# Backend
cd backend
cp .env.example .env        # add your MAPBOX_TOKEN
npm install
node index.js               # runs on http://localhost:3001

# Frontend (separate terminal)
cd frontend
cp .env.example .env        # add your VITE_MAPBOX_TOKEN
npm install
npm run dev                 # runs on http://localhost:5173
```

---

## How It Works

### 1. Safety Zone Heatmap

**Data source:** [NYPD Complaint Data (YTD)](https://data.cityofnewyork.us/resource/5uac-w243.json) + [NYC 311 Service Requests](https://data.cityofnewyork.us/resource/erm2-nwe9.json)

**What it fetches:** Up to 25,000 NYPD complaints and 25,000 311 calls from the **last 7 days**, refreshed every 5 minutes.

**How the grid is built:**
1. Each incident is mapped to a `0.001°` grid cell (~100m × 100m, roughly one city block)
2. Crimes are weighted by severity: Felony = 3, Misdemeanor = 2, Violation = 1. 311 calls = 1
3. Each cell gets a raw danger score (sum of weighted incidents)
4. Scores are normalized 0–1 across all cells
5. Safety = `1 - normalized_danger` (1 = safest, 0 = most dangerous)

**On the map:**
- Cells are rendered as filled polygons colored green → yellow → orange → red
- Opacity scales with danger (unsafe zones are more opaque, safe zones nearly transparent)
- A heatmap blur layer sits on top to smooth cell edges
- Dangerous cells (safety < 0.35) pulse with a red animation
- **Hover over any area** with your mouse to see a tooltip showing the safety score % and incident count for that block over the last 7 days
- Dangerous cells (safety < 0.35) pulse with a red animation
- Hovering a cell shows: safety score %, incident count (last 7 days)

---

### 2. Route Search & Autocomplete

**Data source:** [Mapbox Geocoding API](https://docs.mapbox.com/api/search/geocoding/)

Typing in the search bar fires a debounced request to Mapbox's geocoding endpoint. Results are proximity-biased to the current map center. Clicking a suggestion flies the map to that location and shows a popup with two buttons: **Set as Start** or **Set as Destination**.

---

### 3. Safest Route Calculation

**Data source:** [Mapbox Directions API](https://docs.mapbox.com/api/navigation/directions/)

**How it works:**

SafeRoute doesn't just find the fastest path — it finds the *safest* one by scoring every possible route against real crime and incident data.

1. **Get route candidates** — Mapbox Directions is called with `alternatives=true`, returning up to 3 different route options (walking or driving) between your start and destination.
2. **Score each route against the safety grid** — For every coordinate point along a route, the app looks up which ~100m grid cell that point falls in and reads its safety score (built from NYPD complaints + 311 data). All those cell scores are averaged together to produce a single safety score (0–100%) for the whole route.
3. **Pick the winner** — Routes are ranked by safety score, highest first. The top-scoring route is your safe route (shown as a blue line). The lowest-scoring route is flagged as the risky route (shown as a dashed red line) so you can see what you're avoiding.
4. **Show the tradeoff** — The receipt tells you which streets the safe route uses, how many riskier alternatives were avoided, and how many incidents were recorded along the danger route in the last 7 days.

In short: the app uses Mapbox to generate realistic navigation paths, then overlays its own crime/incident data to pick whichever path passes through the safest blocks.

**What's returned:**
- Safe route geometry (blue line on map)
- Risky route geometry (dashed red line on map)
- Safety score (0–100%)
- Estimated duration and distance
- Street names and turn-by-turn step geometries
- A plain-English receipt: route via X → Y → Z, safety label, avoided routes
- Risky route warning: streets taken, total incidents, safety score

---

### 4. Route Receipt & Map Popups

After routing, two draggable Mapbox popups appear anchored to the midpoints of each route line:

- **Blue popup (safe route):** Street path, safety score with plain-English label, how many riskier routes were avoided, walk/drive time and distance
- **Red popup (risky route):** Streets taken, total incidents recorded in those cells in the last 7 days, safety score warning

---

### 5. Live Incident Reports

**Data source:** [NYC 311 Service Requests](https://data.cityofnewyork.us/resource/erm2-nwe9.json)

Fetches up to 500 incidents from the **last 7 days** with coordinates, ordered by most recent. Each incident is rendered as a small orange pulsing circle on the map.

**Types of incidents reported include:**
- 🔊 Noise complaints (street/sidewalk, vehicles, commercial establishments)
- 🚗 Blocked driveways and illegal parking
- 🏚️ Building/housing violations
- 🗑️ Sanitation and street condition issues
- 🚨 Any other active 311 service requests with a recorded location

Clicking a marker shows:
- Complaint type and specific descriptor
- Address
- Time reported
- Status (Open / In Progress / Closed), color-coded

---

### 6. Street Activity Vibes (Walking Only)

**Data source:** [NYC 311 Service Requests](https://data.cityofnewyork.us/resource/erm2-nwe9.json)

After a walking route is calculated, the backend fetches noise and activity complaints (Noise - Street/Sidewalk, Noise - Vehicle, Noise - Commercial, Blocked Driveway, Illegal Parking) from the **last 6 hours** and counts how many match each street on your route.

**Vibe classification:**
| Count | Time | Vibe | Meaning |
|---|---|---|---|
| ≥ 5 reports | any | 🟢 Busy | Lots of activity, people around |
| ≥ 2 reports | any | 🟡 Moderate | Some activity |
| 0–1 reports | late night (11pm–5am) | 🔴 Quiet | Unusually quiet, stay alert |
| 0–1 reports | night (8pm–7am) | 🔴 Quiet | Quiet for the hour |
| 0–1 reports | daytime | 🔵 Calm | Normal for this time |

Each street segment is colored on the map using the exact step geometry from the directions API (not name-matching). A legend appears in the bottom-right corner when vibes are active.

---

### 7. "Should I Go Right Now?" Assessment

Rocky evaluates your route's safety score combined with the current time of day:

| Safety Score | Time | Verdict |
|---|---|---|
| ≥ 80% | Daytime | ✅ Go for it |
| ≥ 80% | Late night | 🟡 Safe route but stay aware |
| 60–79% | Daytime | 🟡 Mostly fine, stay alert |
| 60–79% | Night | 🟠 Be cautious |
| 40–59% | Any | 🟠 Think twice |
| < 40% | Any | 🔴 Avoid if possible |

---

### 8. Rocky the Raccoon (Chat UI)

Rocky is the chat assistant that guides you through the app. He:
- Explains how to use the search bar and set pins on first open
- Updates in real time as you set your start and destination (horizontal path tracker with checkmarks)
- Shows the route receipt with street names and safety breakdown
- Shows per-street activity vibes
- Answers "Should I go right now?" with a time-aware safety assessment
- Supports walking / driving mode toggle (changes the Mapbox directions profile)

---

## Data Sources

| Dataset | Provider | Endpoint | Used For |
|---|---|---|---|
| NYPD Complaint Data YTD | NYC Open Data | `5uac-w243` | Safety grid (crime severity) |
| 311 Service Requests | NYC Open Data | `erm2-nwe9` | Safety grid, incident markers, street vibes |
| Geocoding | Mapbox | `/geocoding/v5/mapbox.places` | Search autocomplete, destination lookup |
| Directions | Mapbox | `/directions/v5/mapbox/{profile}` | Route alternatives + step geometries |

---

## Environment Variables

### `frontend/.env`
```
VITE_MAPBOX_TOKEN=pk.your_token_here
```

### `backend/.env`
```
MAPBOX_TOKEN=pk.your_token_here
```

---

## Project Structure

```
kiro/
├── frontend/
│   ├── src/
│   │   ├── App.jsx        # Main UI, chat, route state, DraggableCard, GoNowButton, RouteTracker
│   │   ├── App.css        # All styles
│   │   └── Map.jsx        # Mapbox map, layers, markers, popups, vibe coloring
│   └── .env
└── backend/
    ├── index.js           # Express API: /api/zones, /api/route, /api/incidents, /api/street-vibe
    └── .env
```
