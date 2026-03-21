# 🦝 SafeRoute
### *Find the safest way, not just the fastest*

---

SafeRoute is your digital twin for city safety. It maps live crime and incident data across every city block — updated every 5 minutes — and uses it to find you the safest route to your destination, not just the fastest one. It tells you which path to take, which one to avoid and why, and whether you should even head out at all.

---

## Features

### 🔥 Safety Heatmap
The map is covered by a live color-coded grid showing how safe each city block is right now. Blocks range from **green** (safe) to **red** (dangerous), refreshed every 5 minutes. Dangerous zones pulse red. Hover any block to see its safety score and how many incidents were reported there in the last 7 days.

### 🔍 Search & Autocomplete
Type any NYC address or landmark to set your start and destination. Results are biased toward your current map view so you get relevant suggestions fast.

### 🗺️ Safest Route
SafeRoute doesn't just find the fastest path — it finds the *safest* one. It fetches multiple route options, scores each one against live crime data, and picks the winner. You see:
- 🔵 **Safe route** — the best path based on safety
- 🔴 **Risky route** (dashed) — so you can see what you're avoiding
- A receipt showing the streets used, safety score, travel time, and distance

If a risky route exists, SafeRoute flags it too — telling you exactly which streets to avoid, how many incidents were recorded along that path in the last 7 days, and its safety score. You're not just told where to go; you're told what you're staying away from and why.

### 📍 Live Incident Reports
The 500 most recent reported incidents are shown as pulsing dots on the map. Tap any dot to see the complaint type, address, time reported, and current status.

| Category | Examples |
|---|---|
| 🔊 Noise | Noise - Street/Sidewalk, Noise - Vehicle, Noise - Commercial |
| 🚗 Traffic & Parking | Blocked driveway, illegal parking |
| 🏚️ Building & Housing | Housing violations, structural complaints |
| 🗑️ Sanitation | Dirty conditions, street condition issues |
| 🚨 Criminal Activity | Assault, robbery, drug activity |
| 🆘 Distress & Safety | Distress calls, suspicious persons |
| 🚸 Alerts | Amber alerts, missing persons |
| 🔥 Hazards | Fire hazards, dangerous conditions |

### 🌆 Street Activity Vibes *(walking only)*
Before you head out, SafeRoute checks how active each street on your route has been in the **last 6 hours**. Each segment gets a vibe:

| Vibe | Meaning |
|---|---|
| 🟢 Busy | Lots of activity — people around |
| 🟡 Moderate | Some activity |
| 🔴 Quiet | Unusually quiet for this hour — stay alert |
| 🔵 Calm | Low activity, but normal for daytime |

### 🤔 "Should I Go Right Now?"
SafeRoute combines your route's safety score with the current time of day to give you a plain-English recommendation — from ✅ *Go for it* to 🔴 *Avoid if possible*.

### 🦝 Rocky the Raccoon
Your in-app guide. Rocky walks you through the app, explains your route in plain English, and answers your safety questions as you plan your trip.

---

## Where the Data Comes From

SafeRoute uses two public NYC datasets, refreshed every 5 minutes:

| Dataset | What it contains | Used for |
|---|---|---|
| **NYPD Complaint Data** | All reported crimes in NYC, categorized by severity | Building the safety heatmap and scoring routes |
| **NYC 311 Service Requests** | Noise complaints, illegal parking, sanitation issues, etc. | Safety heatmap, live incident markers, street vibes |

Both datasets are pulled from [NYC Open Data](https://opendata.cityofnewyork.us/) and cover the **last 7 days**.

Routing and maps are powered by **Mapbox**.

---

## How the Safety Score Works

### Safety Score (per grid cell)

1. NYC is divided into `0.001°` cells (~100m × 100m, roughly one city block)
2. Every NYPD complaint and 311 call from the last 7 days is dropped into its cell
3. Each incident adds to that cell's score, weighted by severity:
   - Felony = 3, Misdemeanor = 2, Violation / 311 = 1
4. All cell scores are normalized by dividing by the highest score in the city — so the worst block in NYC = 1.0
5. `safety = 1 - normalized_score` — so **1.0 = safest, 0.0 = most dangerous**

### Best Route Selection

1. Mapbox Directions returns up to 3 alternative routes (walking or driving)
2. For each route, every coordinate along the path is mapped to its grid cell and that cell's safety score is read
3. All those scores are averaged → one safety score (0–1) for the whole route
4. Routes are sorted by that score, highest first — the top one is your **safe route**, the bottom one becomes the **risky route** shown in red
5. The score shown in the app is `Math.round(best.safety * 100)%`

**What does the % actually mean?**
A route scoring **85%** means the average city block it passes through is 85% of the way from the most dangerous block in NYC to a completely incident-free block. It's not absolute — it's relative to the rest of the city right now.

---

## Getting Started

### Prerequisites

| Requirement | Version | Notes |
|---|---|---|
| Node.js | 18+ | [Download here](https://nodejs.org) |
| npm | 9+ | Comes with Node.js |
| Mapbox account | Free tier | [Sign up here](https://account.mapbox.com) — grab a public token from your dashboard |

### Installation

**1. Clone the repo**
```bash
git clone https://github.com/shreyavarma99/SafeRoute.git
cd saferoute
```

**2. Set up the backend**
```bash
cd backend
cp .env.example .env
```

Open `.env` and add your token:
```env
MAPBOX_TOKEN=pk.your_token_here
```

Install and start:
```bash
npm install
node index.js
```

**3. Set up the frontend** *(open a new terminal)*
```bash
cd frontend
cp .env.example .env
```

Open `.env` and add your token:
```env
VITE_MAPBOX_TOKEN=pk.your_token_here
```

Install and start:
```bash
npm install
npm run dev
```

**4. Open the app**

Navigate to http://localhost:5173. Rocky will walk you through the rest.

### Troubleshooting

**Map not loading?** Double-check your `VITE_MAPBOX_TOKEN` in `frontend/.env` — it needs to start with `pk.`

**No routes showing?** Make sure the backend is running on port 3001 before starting the frontend.

**CORS errors?** Both servers need to be running simultaneously — backend first, then frontend.

---

## Scaling

SafeRoute currently runs on NYC data — NYPD complaints and 311 requests are some of the richest open public safety datasets in the world, which made NYC the right place to start.

The architecture is city-agnostic. As SafeRoute scales, the plan is to plug in equivalent open data sources from cities across the US and eventually globally — bringing the same real-time safety layer to every major city. The grid-based scoring system, routing engine, and UI work the same regardless of the data source underneath.

Currently, running SafeRoute locally requires your own Mapbox token for maps and routing. In a production version, this would be handled on the backend — users would just open the app, no setup needed.

---

## How It All Fits Together
<img width="1336" height="1106" alt="image" src="https://github.com/user-attachments/assets/4c55c5d1-eb7d-4550-9551-9cffc2983d93" />


```
  NYC Open Data (NYPD + 311)
            │
            │  refreshes every 5 min
            ▼
  ┌─────────────────────────┐
  │   Safety Grid Builder   │
  │  ~100m × 100m cells     │
  │  weighted danger scores │
  │  normalized 0 → 1       │
  └────────────┬────────────┘
               │
               ▼
  ┌─────────────────────────┐
  │     Routing Engine      │◀─── Mapbox Directions API
  │  fetches 3 route options│     (route candidates)
  │  scores each route      │
  │  picks the safest one   │
  └────────────┬────────────┘
               │
               ▼
  ┌─────────────────────────┐
  │    Rocky's Assessment   │
  │  safety score + time    │
  │  → should you go now?   │
  └─────────────────────────┘
```
**Github Link:** https://github.com/shreyavarma99/SafeRoute.git
**Demo:** https://youtu.be/pKm8eia1rws
---

*Built because getting there safely matters more than getting there fast.*

**GitHub:** https://github.com/shreyavarma99/SafeRoute
