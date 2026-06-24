# LoopWalk — v1 Build Plan

A map-first single-page app that generates random loop routes (walk/run/bike) from a chosen start, matching a target distance, and shows multiple ranked options with Strava-style stats.

## Scope (v1)

In:
- Pick start location (search + click-on-map + "use my location")
- Choose target distance and activity (walk/run/bike)
- Generate 3 unique loop routes; show them on map; pick one
- Per-route stats panel: distance, duration, avg pace, avg speed, calories, steps, elevation gain/loss, difficulty, scenic score, safety score
- Regenerate

Out (later phases):
- Accounts, saved/favorites, history, comparison view, AI/weather/scenic optimization

## Design

- Palette: `#0a0a0a` bg, `#1f1f1f` surface, `#caff33` lime accent, `#fafafa` text — locked
- Type: Instrument Serif (headings, occasional italic) + Work Sans (body), loaded via `<link>` in `__root.tsx`, registered in `@theme`
- Layout: split-screen. Left ~38% dark control rail (brand, start input, distance chips, activity segmented control, Generate CTA, route result cards). Right ~62% full-bleed dark map with 3 colored loop polylines + start pin. Active card highlighted in lime.
- Editorial, athletic, urban — no generic dashboard chrome

## Architecture

Stack: TanStack Start + React + TS + Tailwind v4 + React Leaflet + Leaflet, OSM tiles (dark CartoDB Voyager/Dark Matter), OSRM public demo for routing.

Files:
```
src/routes/index.tsx              # the planning screen
src/components/loopwalk/
  ControlRail.tsx                 # left panel
  StartInput.tsx                  # geocode (Nominatim) + map-click + geolocate
  DistanceChips.tsx               # 2/5/7.5/10/15/20 km + custom
  ActivityToggle.tsx              # walk/run/bike
  RouteMap.tsx                    # Leaflet map, polylines, pins
  RouteCard.tsx                   # one result with stat grid
  RouteResults.tsx                # list of RouteCard
  StatGrid.tsx                    # reusable stat tiles
src/lib/loopwalk/
  generator.ts                    # waypoint sampling + OSRM calls + scoring
  osrm.ts                         # OSRM client (public demo)
  nominatim.ts                    # geocoding client
  metrics.ts                      # calories, steps, pace, difficulty
  scoring.ts                      # scenic/safety heuristics
  types.ts
src/styles.css                    # palette tokens + font families
src/routes/__root.tsx             # font <link>s, page meta
```

## Route generation algorithm

For target distance `D` and activity `A`:
1. Compute search radius `r ≈ D / (2π)` (loop circumference ≈ D).
2. Monte Carlo: generate `N=12` candidate triplets of waypoints by sampling 3 bearings (jittered ~120° apart) at distances `0.7r–1.1r` around the start.
3. For each triplet, request OSRM route `start → w1 → w2 → w3 → start` using profile `foot` (walk/run) or `bike` (cycling).
4. Validate: keep candidates where actual distance is within ±15% of `D`. Discard self-overlapping or degenerate routes (compare polyline overlap ratio).
5. Score each kept route:
   - distance fit (closer to `D` = better)
   - turn density (penalize chaotic)
   - overlap penalty (reward true loops)
   - scenic proxy v1: count of waypoints near parks/green via simple Nominatim tag lookup *(stub in v1; full Overpass query in later phase)*
   - safety proxy v1: prefer routes with fewer primary/trunk segments (from OSRM `road_class` annotations when present; otherwise neutral)
6. Return top 3 distinct routes (dedupe by polyline similarity).

If <3 valid candidates, expand bearings/radius and retry once.

## Stats computation

- Duration: distance / pace by activity (walk 5 km/h, run 10 km/h, bike 18 km/h) — user-adjustable later
- Pace: min/km from duration
- Speed: km/h
- Calories: MET × weight(kg default 70) × hours; METs: walk 3.8, run 9.8, bike 7.5
- Steps: distance(m) / stride(m); stride ≈ 0.75 walk, 1.0 run; n/a for bike
- Elevation: OSRM public demo has no elevation — v1 shows "—" with a tooltip "elevation requires API key"; placeholder field reserved
- Difficulty: bucket by distance + elevation; v1 uses distance-only bucket
- Scenic / Safety: 0–100 from scoring above

## Map

- React Leaflet + CartoDB Dark Matter tiles (free, attribution preserved)
- Polylines colored: active = lime `#caff33`, others = muted whites with reduced opacity
- Start marker custom DOM icon
- Fit bounds to active route on selection

## External services

- OSRM public demo (`router.project-osrm.org`) — no key, rate-limited. Plan acknowledges swap to OpenRouteService via stored secret later.
- Nominatim (`nominatim.openstreetmap.org`) for geocoding — include required User-Agent and debounce; cache last queries.

## Validation

- Build passes
- Map renders, generate produces 3 visible loops near requested distance
- Switching cards updates active polyline + stat panel
- No console errors; tile attribution present

## Out of scope for this build

Auth, persistence, history, favorites, comparison view, elevation API, Overpass scenic enrichment, AI recommendations, weather, narration. These slot in cleanly on top of the v1 module boundaries above.
