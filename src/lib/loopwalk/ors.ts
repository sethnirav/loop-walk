import type { Activity, LatLng } from "./types";
import type { OsrmRoute } from "./osrm";

// Public OpenRouteService API key (browser-callable).
const ORS_API_KEY =
  "eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6ImNlNDc5NTAzOTFlYzRiOTBiYzllZDFlMGRlNmZjYmE2IiwiaCI6Im11cm11cjY0In0=";

function orsProfile(activity: Activity): string {
  if (activity === "bike") return "cycling-regular";
  if (activity === "run") return "foot-walking";
  return "foot-walking";
}

export async function orsRoute(
  activity: Activity,
  points: LatLng[],
): Promise<OsrmRoute | null> {
  const url = `https://api.openrouteservice.org/v2/directions/${orsProfile(activity)}/geojson`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: ORS_API_KEY,
      },
      body: JSON.stringify({
        coordinates: points.map((p) => [p.lng, p.lat]),
        instructions: false,
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const feat = data?.features?.[0];
    if (!feat) return null;
    const coords: [number, number][] = (feat.geometry?.coordinates ?? []).map(
      ([lng, lat]: [number, number]) => [lat, lng],
    );
    const summary = feat.properties?.summary ?? {};
    return {
      distanceM: summary.distance ?? 0,
      durationS: summary.duration ?? 0,
      coordinates: coords,
    };
  } catch {
    return null;
  }
}

export const ORS_ENABLED = true;
