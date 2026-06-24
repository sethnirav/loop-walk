import type { GeneratedRoute, Activity } from "./types";

/** Format a decimal degree to 6 decimals (~11 cm precision). */
function fmt(n: number): string {
  return n.toFixed(6);
}

/** Convert a decimal degree to DMS string, e.g. 12°34'56.7"N. */
function toDMS(deg: number, isLat: boolean): string {
  const hemi = isLat ? (deg >= 0 ? "N" : "S") : (deg >= 0 ? "E" : "W");
  const abs = Math.abs(deg);
  const d = Math.floor(abs);
  const mFloat = (abs - d) * 60;
  const m = Math.floor(mFloat);
  const s = ((mFloat - m) * 60).toFixed(1);
  return `${d}°${m}'${s}"${hemi}`;
}

/** "lat,lng" pair used in Google Maps URL fields. Accurate to ~11 cm. */
function pair([lat, lng]: [number, number]): string {
  return `${fmt(lat)},${fmt(lng)}`;
}

/** DMS-formatted pair, accepted by Google Maps search/dir as a precise place. */
export function toDMSPair([lat, lng]: [number, number]): string {
  return `${toDMS(lat, true)} ${toDMS(lng, false)}`;
}

/**
 * Build a Google Maps directions URL for a generated loop route.
 * Uses the Google Maps URLs API (api=1) with high-precision decimal
 * coordinates (6 decimals ≈ 11 cm) so the start/waypoints/end snap
 * exactly to the generated loop.
 */
export function googleMapsUrl(route: GeneratedRoute, activity: Activity): string {
  const coords = route.coordinates;
  if (!coords.length) return "https://www.google.com/maps";

  const start = coords[0];
  // Google Maps dir URL allows up to 9 waypoints. To force a true loop
  // (origin == destination), we use origin = start, destination = start,
  // and sample interior points as waypoints.
  const MAX_WP = 9;
  const inner = coords.slice(1, -1);
  const sampled: [number, number][] = [];
  if (inner.length) {
    const step = inner.length / (MAX_WP + 1);
    for (let i = 1; i <= MAX_WP; i++) {
      const idx = Math.min(inner.length - 1, Math.floor(i * step));
      sampled.push(inner[idx]);
    }
  }

  const travel = activity === "bike" ? "bicycling" : "walking";
  const origin = pair(start);
  const destination = pair(start);
  const waypoints = sampled.map(pair).join("|");

  // Build manually so the `|` separator stays literal (Google's parser is
  // happier that way than with %7C from URLSearchParams).
  const parts = [
    "api=1",
    `origin=${encodeURIComponent(origin)}`,
    `destination=${encodeURIComponent(destination)}`,
    `travelmode=${travel}`,
  ];
  if (waypoints) parts.push(`waypoints=${encodeURIComponent(waypoints)}`);
  return `https://www.google.com/maps/dir/?${parts.join("&")}`;
}
