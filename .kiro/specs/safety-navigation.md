# SafeRoute — Safety Navigation Feature Spec

## Overview
Real-time safety-aware routing for NYC pedestrians and drivers.

## Requirements

### Safety Heatmap
- [ ] Fetch NYPD + 311 data for last 7 days on load
- [ ] Build 0.001° grid with weighted danger scores
- [ ] Render as fill polygons: red (dangerous) → green (safe)
- [ ] Opacity scales with danger level
- [ ] Pulse animation on cells with safety < 0.35
- [ ] Hover tooltip: safety %, incident count

### Search & Pin Flow
- [ ] Debounced autocomplete via Mapbox Geocoding
- [ ] Clicking suggestion flies map to location
- [ ] Popup with "Set as Start" / "Set as Destination" buttons
- [ ] Green star marker for start, blue star for destination
- [ ] Route auto-calculates when both pins are set

### Route Calculation
- [ ] Request up to 3 alternatives from Mapbox Directions
- [ ] Score each route against safety grid
- [ ] Display safest route as solid blue line
- [ ] Display riskiest route as dashed red line
- [ ] Blue popup: receipt with streets, safety score, avoided routes, time
- [ ] Red popup: warning with streets, incident count, safety score

### Rocky Chat
- [ ] Open by default on app load
- [ ] Friendly onboarding instructions
- [ ] Horizontal route tracker with checkmarks as pins are set
- [ ] Route receipt with street names and safety breakdown
- [ ] Street activity vibes per segment (walking only)
- [ ] "Should I go right now?" button with time-aware assessment
- [ ] Walking / Driving mode toggle

### Live Incidents
- [ ] Fetch last 7 days of 311 incidents with coordinates
- [ ] Render as small orange pulsing circles
- [ ] Click to show: type, descriptor, address, time, status

### Street Vibes (Walking)
- [ ] Fetch last 6h of noise/activity 311 reports after walking route
- [ ] Classify each route street: busy / moderate / quiet / calm
- [ ] Color street segments on map using step geometries
- [ ] Show vibe legend in bottom-right corner
- [ ] Show per-street notes in Rocky chat

## Out of Scope
- User accounts / saved routes
- Push notifications
- Non-NYC cities
