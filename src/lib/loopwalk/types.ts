export type Activity = "walk" | "run" | "bike";

export interface LatLng {
  lat: number;
  lng: number;
}

export interface RouteStats {
  distanceKm: number;
  durationMin: number;
  paceMinPerKm: number | null; // null for bike
  speedKmh: number;
  calories: number;
  steps: number | null;
  elevationGain: number | null;
  elevationLoss: number | null;
  difficulty: "Easy" | "Moderate" | "Hard";
  scenicScore: number; // 0-100
  safetyScore: number; // 0-100
}

export interface GeneratedRoute {
  id: string;
  coordinates: [number, number][]; // [lat, lng]
  stats: RouteStats;
  score: number;
}

export interface GenerateParams {
  start: LatLng;
  targetKm: number;
  activity: Activity;
}
