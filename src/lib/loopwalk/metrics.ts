import type { Activity, RouteStats } from "./types";

const SPEED: Record<Activity, number> = { walk: 5, run: 10, bike: 18 };
const MET: Record<Activity, number> = { walk: 3.8, run: 9.8, bike: 7.5 };
const STRIDE_M: Record<Activity, number | null> = { walk: 0.75, run: 1.0, bike: null };
const DEFAULT_WEIGHT_KG = 70;

export function computeStats(
  activity: Activity,
  distanceM: number,
  targetKm: number,
  scenicScore: number,
  safetyScore: number,
): RouteStats {
  const distanceKm = distanceM / 1000;
  const speed = SPEED[activity];
  const hours = distanceKm / speed;
  const durationMin = hours * 60;
  const paceMinPerKm = activity === "bike" ? null : 60 / speed;
  const calories = MET[activity] * DEFAULT_WEIGHT_KG * hours;
  const stride = STRIDE_M[activity];
  const steps = stride ? Math.round(distanceM / stride) : null;

  const difficulty: RouteStats["difficulty"] =
    targetKm <= 4 ? "Easy" : targetKm <= 10 ? "Moderate" : "Hard";

  return {
    distanceKm,
    durationMin,
    paceMinPerKm,
    speedKmh: speed,
    calories: Math.round(calories),
    steps,
    elevationGain: null,
    elevationLoss: null,
    difficulty,
    scenicScore: Math.round(scenicScore),
    safetyScore: Math.round(safetyScore),
  };
}

export function formatDuration(min: number): string {
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return h > 0 ? `${h}h ${m}m` : `${m} min`;
}

export function formatPace(p: number | null): string {
  if (p == null) return "—";
  const m = Math.floor(p);
  const s = Math.round((p - m) * 60);
  return `${m}:${s.toString().padStart(2, "0")} /km`;
}
