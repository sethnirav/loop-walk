import { useEffect, useRef, useState } from "react";
import { geocode, type GeocodeResult } from "@/lib/loopwalk/nominatim";
import { MapPin, Crosshair, Loader2 } from "lucide-react";
import type { LatLng } from "@/lib/loopwalk/types";

interface Props {
  value: string;
  onPick: (label: string, p: LatLng) => void;
  onUseLocation: () => void;
  locating?: boolean;
}

export function StartInput({ value, onPick, onUseLocation, locating }: Props) {
  const [q, setQ] = useState(value);
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const t = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => setQ(value), [value]);

  useEffect(() => {
    if (t.current) clearTimeout(t.current);
    if (!q.trim() || q === value) {
      setResults([]);
      return;
    }
    setLoading(true);
    t.current = setTimeout(async () => {
      const r = await geocode(q);
      setResults(r);
      setLoading(false);
      setOpen(true);
    }, 400);
    return () => {
      if (t.current) clearTimeout(t.current);
    };
  }, [q, value]);

  return (
    <div className="relative">
      <div className="flex items-stretch gap-2">
        <div className="relative flex-1">
          <MapPin className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onFocus={() => results.length && setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            placeholder="Search a starting point…"
            className="w-full rounded-md border border-border bg-surface px-9 py-3 text-sm text-foreground outline-none transition focus:border-primary"
          />
          {loading && (
            <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
          )}
        </div>
        <button
          type="button"
          onClick={onUseLocation}
          title="Use my location"
          className="flex items-center justify-center rounded-md border border-border bg-surface px-3 text-foreground transition hover:border-primary hover:text-primary"
        >
          {locating ? <Loader2 className="size-4 animate-spin" /> : <Crosshair className="size-4" />}
        </button>
      </div>
      {open && results.length > 0 && (
        <ul className="absolute z-[1000] mt-1 max-h-72 w-full overflow-auto rounded-md border border-border bg-surface shadow-2xl">
          {results.map((r, i) => (
            <li key={i}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onPick(r.label, { lat: r.lat, lng: r.lng });
                  setOpen(false);
                  setResults([]);
                }}
                className="block w-full px-3 py-2 text-left text-sm text-foreground/90 transition hover:bg-surface-2"
              >
                <span className="line-clamp-2">{r.label}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
