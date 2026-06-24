import type { Activity, LatLng } from "./types";
import { ORS_ENABLED, orsRoute } from "./ors";



const BASE = "https://router.project-osrm.org";

function profileFor(activity: Activity): string {
  // OSRM public demo supports 'foot', 'bike', 'car'
  return activity === "bike" ? "bike" : "foot";
}

export interface OsrmRoute {
  distanceM: number;
  durationS: number;
  coordinates: [number, number][]; // [lat, lng]
}

export async function osrmRoute(
  activity: Activity,
  points: LatLng[],
): Promise<OsrmRoute | null> {
  if (ORS_ENABLED) {
    const ors = await orsRoute(activity, points);
    if (ors) return ors;
  }
  const coords = points.map((p) => `${p.lng},${p.lat}`).join(";");
  const url = `${BASE}/route/v1/${profileFor(activity)}/${coords}?overview=full&geometries=geojson`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const route = data?.routes?.[0];
    if (!route) return null;
    const lineCoords: [number, number][] = (route.geometry?.coordinates ?? []).map(
      ([lng, lat]: [number, number]) => [lat, lng],
    );
    return {
      distanceM: route.distance,
      durationS: route.duration,
      coordinates: lineCoords,
    };
  } catch {
    return null;
  }
}
