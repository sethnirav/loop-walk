import { osrmRoute } from "./osrm";
import { computeStats } from "./metrics";
import type { GenerateParams, GeneratedRoute, LatLng } from "./types";

const EARTH_R = 6371; // km

function destPoint(start: LatLng, bearingDeg: number, distKm: number): LatLng {
  const br = (bearingDeg * Math.PI) / 180;
  const lat1 = (start.lat * Math.PI) / 180;
  const lng1 = (start.lng * Math.PI) / 180;
  const dr = distKm / EARTH_R;
  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(dr) + Math.cos(lat1) * Math.sin(dr) * Math.cos(br),
  );
  const lng2 =
    lng1 +
    Math.atan2(
      Math.sin(br) * Math.sin(dr) * Math.cos(lat1),
      Math.cos(dr) - Math.sin(lat1) * Math.sin(lat2),
    );
  return { lat: (lat2 * 180) / Math.PI, lng: (lng2 * 180) / Math.PI };
}

function rand(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function polylineSimilarity(a: [number, number][], b: [number, number][]): number {
  // Crude: sample a, count points within ~30m of any b sample
  if (!a.length || !b.length) return 0;
  const step = Math.max(1, Math.floor(a.length / 50));
  const bStep = Math.max(1, Math.floor(b.length / 50));
  const bSamples: [number, number][] = [];
  for (let i = 0; i < b.length; i += bStep) bSamples.push(b[i]);
  let hits = 0;
  let total = 0;
  for (let i = 0; i < a.length; i += step) {
    total++;
    const [la, lna] = a[i];
    for (const [lb, lnb] of bSamples) {
      const dLat = (la - lb) * 111;
      const dLng = (lna - lnb) * 111 * Math.cos((la * Math.PI) / 180);
      if (dLat * dLat + dLng * dLng < 0.0009) { // ~30m
        hits++;
        break;
      }
    }
  }
  return hits / total;
}

export async function generateRoutes(params: GenerateParams): Promise<GeneratedRoute[]> {
  const { start, targetKm, activity } = params;
  const baseRadius = targetKm / (2 * Math.PI);

  const attempts: Array<Promise<GeneratedRoute | null>> = [];
  const seedBearing = Math.random() * 360;

  const N = 10;
  for (let i = 0; i < N; i++) {
    const rotation = seedBearing + (i * 360) / N + rand(-15, 15);
    const r1 = baseRadius * rand(0.75, 1.05);
    const r2 = baseRadius * rand(0.75, 1.05);
    const r3 = baseRadius * rand(0.75, 1.05);
    const b1 = rotation;
    const b2 = rotation + 120 + rand(-25, 25);
    const b3 = rotation + 240 + rand(-25, 25);
    const w1 = destPoint(start, b1, r1);
    const w2 = destPoint(start, b2, r2);
    const w3 = destPoint(start, b3, r3);

    attempts.push(
      (async (): Promise<GeneratedRoute | null> => {
        const r = await osrmRoute(activity, [start, w1, w2, w3, start]);
        if (!r) return null;
        const km = r.distanceM / 1000;
        const ratio = km / targetKm;
        if (ratio < 0.7 || ratio > 1.35) return null;
        // Scoring
        const distanceFit = 1 - Math.abs(km - targetKm) / targetKm; // higher better
        const scenic = 50 + rand(-10, 30); // v1 stub
        const safety = 60 + rand(-15, 25); // v1 stub
        const score = distanceFit * 0.7 + (scenic / 100) * 0.15 + (safety / 100) * 0.15;
        return {
          id: crypto.randomUUID(),
          coordinates: r.coordinates,
          stats: computeStats(activity, r.distanceM, targetKm, scenic, safety),
          score,
        };
      })(),
    );
  }

  const results = (await Promise.all(attempts)).filter(
    (r): r is GeneratedRoute => r !== null,
  );

  // Dedupe by similarity
  results.sort((a, b) => b.score - a.score);
  const picked: GeneratedRoute[] = [];
  for (const r of results) {
    const dup = picked.some((p) => polylineSimilarity(r.coordinates, p.coordinates) > 0.55);
    if (!dup) picked.push(r);
    if (picked.length >= 3) break;
  }
  return picked;
}
