'use client';

import { useEffect, useRef, useState } from 'react';
import type { Map as LeafletMap, DivIcon, CircleMarker } from 'leaflet';

type Report = {
  tracking_id: string;
  issue_type: string;
  priority: string;
  status: string;
  location_lat: number;
  location_lng: number;
  address?: string;
  image_url?: string;
  confidence_score?: number;
  created_at: string;
  text_summary?: string;
};

type MapViewProps = {
  reports: Report[];
  center?: [number, number];
  zoom?: number;
};

const PRIORITY_COLORS: Record<string, string> = {
  High:   '#EF4444',
  Medium: '#F59E0B',
  Low:    '#10B981',
};

const STATUS_LABELS: Record<string, string> = {
  PENDING_REVIEW:    '⏳ Pending',
  AUTHORITY_NOTIFIED:'✅ Notified',
  RESOLVED:          '🟢 Resolved',
};

export default function MapView({ reports, center, zoom = 12 }: MapViewProps) {
  const mapRef = useRef<LeafletMap | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<(CircleMarker | { marker: unknown; remove: () => void })[]>([]);
  const [heatmap, setHeatmap] = useState(false);
  const [filter, setFilter] = useState<'all' | 'High' | 'Medium' | 'Low'>('all');
  const [isReady, setIsReady] = useState(false);

  // Compute map center from reports if not provided
  const mapCenter: [number, number] = center ?? (() => {
    if (reports.length === 0) return [20.5937, 78.9629]; // India default
    const avgLat = reports.reduce((s, r) => s + r.location_lat, 0) / reports.length;
    const avgLng = reports.reduce((s, r) => s + r.location_lng, 0) / reports.length;
    return [avgLat, avgLng];
  })();

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    // Dynamic import to avoid SSR issues
    import('leaflet').then((L) => {
      // Fix default icon broken by webpack
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      const map = L.map(containerRef.current!, {
        center: mapCenter,
        zoom,
        zoomControl: true,
        scrollWheelZoom: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      mapRef.current = map;
      setIsReady(true);
    });

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Render/re-render markers whenever reports, filter, or heatmap mode changes
  useEffect(() => {
    if (!isReady || !mapRef.current) return;

    import('leaflet').then((L) => {
      const map = mapRef.current!;

      // Clear existing markers
      markersRef.current.forEach((m) => {
        if ('remove' in m) (m as CircleMarker).remove();
      });
      markersRef.current = [];

      const filtered = filter === 'all' ? reports : reports.filter(r => r.priority === filter);

      filtered.forEach((report) => {
        const color = PRIORITY_COLORS[report.priority] || '#6B7280';
        const lat = report.location_lat;
        const lng = report.location_lng;

        if (heatmap) {
          // Heatmap mode: semi-transparent large circles
          const radius = report.priority === 'High' ? 400 : report.priority === 'Medium' ? 250 : 150;
          const circle = L.circle([lat, lng], {
            radius,
            color: color,
            fillColor: color,
            fillOpacity: 0.15,
            weight: 0,
          }).addTo(map);
          markersRef.current.push(circle as CircleMarker);

          // Small dot center
          const dot = L.circleMarker([lat, lng], {
            radius: 4,
            color: color,
            fillColor: color,
            fillOpacity: 0.8,
            weight: 1,
          }).addTo(map);
          markersRef.current.push(dot);
        } else {
          // Pin mode: custom colored DivIcon
          const icon: DivIcon = L.divIcon({
            className: '',
            html: `
              <div style="
                width:32px;height:32px;
                background:${color};
                border:3px solid white;
                border-radius:50% 50% 50% 0;
                transform:rotate(-45deg);
                box-shadow:0 2px 8px rgba(0,0,0,0.3);
              "></div>
            `,
            iconSize: [32, 32],
            iconAnchor: [16, 32],
            popupAnchor: [0, -36],
          });

          const marker = L.marker([lat, lng], { icon }).addTo(map);

          // Rich popup
          const popupHtml = `
            <div style="font-family:Inter,sans-serif;min-width:200px;max-width:240px;border-radius:12px;overflow:hidden;">
              ${report.image_url ? `<img src="${report.image_url}" style="width:100%;height:110px;object-fit:cover;display:block;" alt=""/>` : ''}
              <div style="padding:10px 12px 12px;">
                <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
                  <span style="
                    background:${color};
                    color:white;
                    font-size:9px;
                    font-weight:900;
                    letter-spacing:0.1em;
                    padding:2px 8px;
                    border-radius:999px;
                    text-transform:uppercase;
                  ">${report.priority}</span>
                </div>
                <p style="font-weight:800;font-size:13px;margin:4px 0 2px;">${report.issue_type}</p>
                <p style="font-size:11px;color:#6B7280;margin:0 0 6px;">${STATUS_LABELS[report.status] || report.status}</p>
                ${report.address ? `<p style="font-size:10px;color:#9CA3AF;margin:0 0 6px;">📍 ${report.address}</p>` : ''}
                ${report.confidence_score ? `<p style="font-size:10px;color:#9CA3AF;margin:0 0 8px;">🤖 AI Confidence: ${report.confidence_score}%</p>` : ''}
                <a href="/track/${report.tracking_id}" style="
                  display:block;
                  background:#3B82F6;
                  color:white;
                  text-align:center;
                  padding:6px;
                  border-radius:8px;
                  font-size:11px;
                  font-weight:700;
                  text-decoration:none;
                ">View Report →</a>
              </div>
            </div>
          `;
          marker.bindPopup(popupHtml, { maxWidth: 260, className: 'civic-popup' });
          markersRef.current.push(marker as unknown as CircleMarker);
        }
      });
    });
  }, [isReady, reports, filter, heatmap]);

  return (
    <div className="relative w-full h-full">
      {/* Map container */}
      <div ref={containerRef} className="w-full h-full rounded-3xl overflow-hidden" />

      {/* Controls overlay */}
      <div className="absolute top-4 left-4 z-[1000] flex flex-col gap-2">
        {/* Heatmap toggle */}
        <button
          onClick={() => setHeatmap(h => !h)}
          className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider shadow-lg backdrop-blur-md border transition-all ${
            heatmap
              ? 'bg-danger text-white border-danger/50'
              : 'bg-background/90 text-foreground border-border hover:border-primary/30'
          }`}
        >
          {heatmap ? '🔥 Heatmap ON' : '📍 Pin Mode'}
        </button>

        {/* Filter chips */}
        <div className="flex flex-col gap-1.5">
          {(['all', ...Object.keys(PRIORITY_COLORS)] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f as typeof filter)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider shadow backdrop-blur-md border transition-all text-left ${
                filter === f
                  ? 'bg-primary text-white border-primary/50'
                  : 'bg-background/90 text-muted-foreground border-border hover:border-primary/30'
              }`}
            >
              {f === 'all' ? '⬤ All' : (
                <span style={{ color: filter === f ? 'white' : PRIORITY_COLORS[f] }}>
                  ⬤ {f}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 right-4 z-[1000] bg-background/90 backdrop-blur-md border border-border rounded-2xl p-3 shadow-lg">
        <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-2">Legend</p>
        {Object.entries(PRIORITY_COLORS).map(([level, color]) => (
          <div key={level} className="flex items-center gap-2 mb-1 last:mb-0">
            <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: color }} />
            <span className="text-[10px] font-bold text-foreground">{level}</span>
          </div>
        ))}
        <div className="border-t border-border mt-2 pt-2">
          <p className="text-[9px] text-muted-foreground">{reports.length} reports</p>
        </div>
      </div>

      {/* Loading overlay */}
      {!isReady && (
        <div className="absolute inset-0 z-[2000] bg-background flex items-center justify-center rounded-3xl">
          <div className="text-center space-y-3">
            <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-bold text-muted-foreground">Loading Map...</p>
          </div>
        </div>
      )}
    </div>
  );
}
