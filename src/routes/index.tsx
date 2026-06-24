import { lazy, Suspense, useCallback, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Loader2, Sparkles, RotateCw, Sun, Moon } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import { StartInput } from "@/components/loopwalk/StartInput";
import { DistanceChips } from "@/components/loopwalk/DistanceChips";
import { ActivityToggle } from "@/components/loopwalk/ActivityToggle";
import { RouteCard } from "@/components/loopwalk/RouteCard";
import { StatGrid } from "@/components/loopwalk/StatGrid";
import { generateRoutes } from "@/lib/loopwalk/generator";
import { reverseGeocode } from "@/lib/loopwalk/nominatim";
import type { Activity, GeneratedRoute, LatLng } from "@/lib/loopwalk/types";

const RouteMap = lazy(() =>
  import("@/components/loopwalk/RouteMap").then((m) => ({ default: m.RouteMap })),
);

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "LoopWalk — Discover a new loop every day" },
      {
        name: "description",
        content:
          "Generate random loop walking, running, and cycling routes that start and end at your door and match your target distance.",
      },
    ],
  }),
  component: LoopWalkPage,
});

function LoopWalkPage() {
  const [start, setStart] = useState<LatLng | null>(null);
  const [startLabel, setStartLabel] = useState("");
  const [distance, setDistance] = useState(5);
  const [activity, setActivity] = useState<Activity>("walk");
  const [routes, setRoutes] = useState<GeneratedRoute[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { theme, toggle: toggleTheme } = useTheme();

  const handlePick = (label: string, p: LatLng) => {
    setStart(p);
    setStartLabel(label);
    setRoutes([]);
    setActiveId(null);
  };

  const handleMapClick = useCallback(async (p: LatLng) => {
    setStart(p);
    setStartLabel(`${p.lat.toFixed(4)}, ${p.lng.toFixed(4)}`);
    setRoutes([]);
    setActiveId(null);
    const label = await reverseGeocode(p.lat, p.lng);
    setStartLabel(label);
  }, []);

  const handleUseLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation not available in this browser.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const p = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setStart(p);
        const label = await reverseGeocode(p.lat, p.lng);
        setStartLabel(label);
        setLocating(false);
      },
      () => {
        setError("Could not get your location.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  };

  const handleGenerate = async () => {
    if (!start) {
      setError("Choose a starting point first.");
      return;
    }
    setError(null);
    setBusy(true);
    setRoutes([]);
    setActiveId(null);
    try {
      const rs = await generateRoutes({ start, targetKm: distance, activity });
      if (!rs.length) {
        setError("Couldn't build a loop here. Try a different distance or location.");
      } else {
        setRoutes(rs);
        setActiveId(rs[0].id);
      }
    } catch {
      setError("Routing service is unavailable. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const activeRoute = routes.find((r) => r.id === activeId) ?? null;

  return (
    <div className="flex h-screen w-screen flex-col lg:flex-row">
      {/* Left control rail */}
      <aside className="flex h-full w-full shrink-0 flex-col overflow-y-auto border-b border-border bg-background lg:w-[440px] lg:border-b-0 lg:border-r">
        {/* Brand */}
        <div className="border-b border-border px-6 py-5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="font-serif text-3xl leading-none text-foreground">
                  Loop<span className="italic text-primary">Walk</span>
                </span>
                <span className="size-1.5 rounded-full bg-primary" />
              </div>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                A new loop, every day. Pick a start, set a distance, generate.
              </p>
            </div>
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
              title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
              className="inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-foreground/80 transition hover:border-primary hover:text-primary"
            >
              {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </button>
          </div>
        </div>


        <div className="flex-1 space-y-6 px-6 py-6">
          <section className="space-y-2">
            <Label>Starting point</Label>
            <StartInput
              value={startLabel}
              onPick={handlePick}
              onUseLocation={handleUseLocation}
              locating={locating}
            />
            <p className="text-[11px] text-muted-foreground">
              Or click anywhere on the map to drop a start pin.
            </p>
          </section>

          <section className="space-y-2">
            <Label>Distance</Label>
            <DistanceChips value={distance} onChange={setDistance} />
          </section>

          <section className="space-y-2">
            <Label>Activity</Label>
            <ActivityToggle value={activity} onChange={setActivity} />
          </section>

          <button
            type="button"
            disabled={busy || !start}
            onClick={handleGenerate}
            className="group relative flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-3.5 text-sm font-semibold uppercase tracking-widest text-primary-foreground transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {busy ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Generating loops…
              </>
            ) : routes.length > 0 ? (
              <>
                <RotateCw className="size-4" />
                Regenerate
              </>
            ) : (
              <>
                <Sparkles className="size-4" />
                Generate routes
              </>
            )}
          </button>

          {error && (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive-foreground">
              {error}
            </div>
          )}

          {/* Results */}
          {routes.length > 0 && (
            <section className="space-y-3 pt-2">
              <div className="flex items-baseline justify-between">
                <h2 className="font-serif text-xl text-foreground">
                  <span className="italic">{routes.length}</span> loops found
                </h2>
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  Tap to preview
                </span>
              </div>
              <div className="space-y-2">
                {routes.map((r, i) => (
                  <RouteCard
                    key={r.id}
                    route={r}
                    index={i}
                    active={r.id === activeId}
                    activity={activity}
                    onClick={() => setActiveId(r.id)}
                  />
                ))}
              </div>

              {activeRoute && (
                <div className="mt-4 space-y-3 rounded-lg border border-border bg-surface p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-serif text-lg italic text-foreground">
                      Route details
                    </h3>
                    <span className="text-[10px] uppercase tracking-widest text-primary">
                      Active
                    </span>
                  </div>
                  <StatGrid stats={activeRoute.stats} />
                  <p className="pt-1 text-[10px] leading-relaxed text-muted-foreground">
                    Elevation data requires a routing API key — coming soon.
                  </p>
                </div>
              )}
            </section>
          )}
        </div>

        <div className="border-t border-border px-6 py-3 text-[10px] uppercase tracking-widest text-muted-foreground">
          Routing via OSRM · Tiles © OpenStreetMap, CARTO
        </div>
      </aside>

      {/* Right map */}
      <main className="relative h-[60vh] flex-1 lg:h-full">
        <Suspense
          fallback={
            <div className="flex h-full items-center justify-center text-muted-foreground">
              <Loader2 className="size-5 animate-spin" />
            </div>
          }
        >
          <RouteMap
            start={start}
            routes={routes}
            activeId={activeId}
            onActivate={setActiveId}
            onMapClick={handleMapClick}
          />
        </Suspense>

        {!start && !busy && (
          <div className="pointer-events-none absolute inset-x-0 top-6 z-[500] mx-auto w-fit max-w-[90%] rounded-full border border-border bg-background/80 px-4 py-2 text-center text-xs text-foreground/80 backdrop-blur">
            Click anywhere on the map to set your starting point
          </div>
        )}
      </main>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
      {children}
    </div>
  );
}
