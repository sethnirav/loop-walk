import { ExternalLink } from "lucide-react";
import type { GeneratedRoute, Activity } from "@/lib/loopwalk/types";
import { formatDuration } from "@/lib/loopwalk/metrics";
import { googleMapsUrl } from "@/lib/loopwalk/share";

interface Props {
  route: GeneratedRoute;
  index: number;
  active: boolean;
  activity: Activity;
  onClick: () => void;
}

const DIFF_COLOR: Record<string, string> = {
  Easy: "text-emerald-300",
  Moderate: "text-amber-300",
  Hard: "text-rose-300",
};

export function RouteCard({ route, index, active, activity, onClick }: Props) {
  const s = route.stats;
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      className={`w-full cursor-pointer rounded-lg border px-4 py-3 text-left transition ${
        active
          ? "border-primary bg-primary/10 ring-1 ring-primary/40"
          : "border-border bg-surface hover:border-foreground/30"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
            Route {String.fromCharCode(65 + index)}
          </div>
          <div className="mt-0.5 font-serif text-2xl leading-tight text-foreground">
            {s.distanceKm.toFixed(2)} <span className="text-base text-muted-foreground">km</span>
          </div>
        </div>
        <div className="text-right">
          <div className="font-serif text-xl italic text-foreground/90">
            {formatDuration(s.durationMin)}
          </div>
          <div className={`text-[11px] uppercase tracking-widest ${DIFF_COLOR[s.difficulty]}`}>
            {s.difficulty}
          </div>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Cal</div>
          <div className="font-medium text-foreground">{s.calories}</div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Scenic</div>
          <div className="font-medium text-foreground">{s.scenicScore}</div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Safety</div>
          <div className="font-medium text-foreground">{s.safetyScore}</div>
        </div>
      </div>
      <div className="mt-3 flex">
        <a
          href={googleMapsUrl(route, activity)}
          target="_blank"
          rel="noreferrer noopener"
          onClick={(e) => {
            e.stopPropagation();
            // Fallback: some browsers block <a target=_blank> inside
            // interactive ancestors; force-open as a safety net.
            window.open(googleMapsUrl(route, activity), "_blank", "noopener,noreferrer");
            e.preventDefault();
          }}
          className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background/40 px-2.5 py-1 text-[11px] font-medium text-foreground/80 transition hover:border-primary hover:text-primary"
        >
          <ExternalLink className="size-3" />
          Open in Google Maps
        </a>
      </div>
    </div>
  );
}

