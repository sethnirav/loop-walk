import { useEffect, useMemo, useRef } from "react";
import { MapContainer, TileLayer, Polyline, Marker, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import type { GeneratedRoute, LatLng } from "@/lib/loopwalk/types";

const startIcon = L.divIcon({
  className: "loopwalk-start-icon",
  html: `<div style="
    width:18px;height:18px;border-radius:50%;
    background:#caff33;border:3px solid #0a0a0a;
    box-shadow:0 0 0 2px #caff33, 0 0 16px rgba(202,255,51,0.7);
  "></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

function FitToRoute({ coords }: { coords: [number, number][] | null }) {
  const map = useMap();
  useEffect(() => {
    if (coords && coords.length) {
      const bounds = L.latLngBounds(coords);
      map.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [coords, map]);
  return null;
}

function ClickHandler({ onClick }: { onClick?: (p: LatLng) => void }) {
  useMapEvents({
    click(e) {
      onClick?.({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

interface Props {
  start: LatLng | null;
  routes: GeneratedRoute[];
  activeId: string | null;
  onActivate: (id: string) => void;
  onMapClick?: (p: LatLng) => void;
}

export function RouteMap({ start, routes, activeId, onActivate, onMapClick }: Props) {
  const initialCenter: [number, number] = useMemo(
    () => (start ? [start.lat, start.lng] : [48.8566, 2.3522]),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  const activeCoords = useMemo(
    () => routes.find((r) => r.id === activeId)?.coordinates ?? null,
    [routes, activeId],
  );
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (start && mapRef.current) {
      mapRef.current.setView([start.lat, start.lng], mapRef.current.getZoom() || 14);
    }
  }, [start]);

  return (
    <MapContainer
      center={initialCenter}
      zoom={14}
      style={{ height: "100%", width: "100%" }}
      ref={(m) => {
        mapRef.current = m;
      }}
      zoomControl={true}
      attributionControl={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
      />
      <ClickHandler onClick={onMapClick} />
      {routes
        .filter((r) => r.id !== activeId)
        .map((r) => (
          <Polyline
            key={r.id}
            positions={r.coordinates}
            pathOptions={{ color: "#0a0a0a", weight: 4, opacity: 0.45, dashArray: "6 8" }}
            eventHandlers={{ click: () => onActivate(r.id) }}
          />
        ))}
      {routes
        .filter((r) => r.id === activeId)
        .map((r) => (
          <Polyline
            key={r.id}
            positions={r.coordinates}
            pathOptions={{ color: "#5b8def", weight: 6, opacity: 0.95 }}
          />
        ))}
      {start && <Marker position={[start.lat, start.lng]} icon={startIcon} />}
      <FitToRoute coords={activeCoords} />
    </MapContainer>
  );
}
