import type { RouteStats } from "@/lib/loopwalk/types";
import { formatDuration, formatPace } from "@/lib/loopwalk/metrics";

interface Props {
  stats: RouteStats;
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-md border border-border bg-surface-2/50 px-3 py-2">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-0.5 font-serif text-lg leading-tight text-foreground">
        {value}
        {sub && <span className="ml-1 text-xs text-muted-foreground">{sub}</span>}
      </div>
    </div>
  );
}

export function StatGrid({ stats }: Props) {
  return (
    <div className="grid grid-cols-3 gap-2">
      <Stat label="Distance" value={stats.distanceKm.toFixed(2)} sub="km" />
      <Stat label="Duration" value={formatDuration(stats.durationMin)} />
      <Stat label="Pace" value={formatPace(stats.paceMinPerKm)} />
      <Stat label="Speed" value={stats.speedKmh.toFixed(1)} sub="km/h" />
      <Stat label="Calories" value={String(stats.calories)} sub="kcal" />
      <Stat label="Steps" value={stats.steps != null ? stats.steps.toLocaleString() : "—"} />
      <Stat label="Elevation" value="—" sub="m" />
      <Stat label="Scenic" value={`${stats.scenicScore}`} sub="/100" />
      <Stat label="Safety" value={`${stats.safetyScore}`} sub="/100" />
    </div>
  );
}
