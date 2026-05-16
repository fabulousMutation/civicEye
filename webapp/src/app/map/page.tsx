import { supabase } from '@/lib/supabaseClient';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { MapPin, Layers, Filter } from 'lucide-react';

// Dynamic import with SSR disabled — Leaflet only runs in browser
const MapView = dynamic(() => import('@/components/MapView'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-secondary rounded-3xl">
      <div className="text-center space-y-3">
        <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs font-bold text-muted-foreground">Initialising Map...</p>
      </div>
    </div>
  ),
});

export const revalidate = 60;

export default async function MapPage() {
  const { data: reports } = await supabase
    .from('reports')
    .select('tracking_id, issue_type, priority, status, location_lat, location_lng, address, image_url, confidence_score, created_at, text_summary')
    .neq('status', 'REJECTED')
    .not('location_lat', 'is', null)
    .not('location_lng', 'is', null)
    .order('created_at', { ascending: false })
    .limit(300);

  const safeReports = (reports || []).filter(
    r => r.location_lat && r.location_lng
  );

  // Stats
  const highCount   = safeReports.filter(r => r.priority === 'High').length;
  const medCount    = safeReports.filter(r => r.priority === 'Medium').length;
  const lowCount    = safeReports.filter(r => r.priority === 'Low').length;
  const resolvedCount = safeReports.filter(r => r.status === 'AUTHORITY_NOTIFIED').length;

  return (
    <main className="min-h-screen bg-background">
      {/* Leaflet CSS must be loaded globally for map to render correctly */}
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
        crossOrigin=""
      />

      <div className="max-w-7xl mx-auto px-6 pt-8 pb-12 space-y-6">
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in-up">
          <div className="space-y-1">
            <p className="section-label">Live City Map</p>
            <h1 className="text-4xl font-black tracking-tight">Issue Map</h1>
            <p className="text-sm text-muted-foreground">
              Real-time civic issues across your city — click a pin to explore
            </p>
          </div>
          <Link href="/dashboard" className="inline-flex items-center gap-2 px-4 py-2.5 bg-secondary border border-border rounded-2xl text-sm font-bold hover:border-primary/30 transition-all">
            <Layers className="w-4 h-4 text-primary" /> View Dashboard
          </Link>
        </header>

        {/* Stat chips */}
        <div className="flex flex-wrap gap-3 animate-fade-in-up delay-100" style={{ opacity: 0 }}>
          {[
            { label: 'Total',    value: safeReports.length, color: 'bg-secondary text-foreground border-border' },
            { label: 'High',     value: highCount,           color: 'bg-danger/10 text-danger border-danger/20' },
            { label: 'Medium',   value: medCount,            color: 'bg-warning/10 text-warning border-warning/20' },
            { label: 'Low',      value: lowCount,            color: 'bg-success/10 text-success border-success/20' },
            { label: 'Notified', value: resolvedCount,       color: 'bg-primary/10 text-primary border-primary/20' },
          ].map((s) => (
            <div key={s.label} className={`flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-black uppercase tracking-wider ${s.color}`}>
              <span>{s.value}</span>
              <span className="opacity-60">{s.label}</span>
            </div>
          ))}
          <div className="flex items-center gap-1.5 px-4 py-2 bg-secondary rounded-full border border-border text-xs font-bold text-muted-foreground">
            <Filter className="w-3 h-3" /> Use map controls to filter
          </div>
        </div>

        {/* Map */}
        <div className="animate-fade-in-up delay-200 h-[calc(100vh-280px)] min-h-[500px] rounded-3xl border border-border overflow-hidden shadow-xl shadow-black/5" style={{ opacity: 0 }}>
          <MapView reports={safeReports} />
        </div>

        {/* Legend / Tips */}
        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground animate-fade-in-up delay-300" style={{ opacity: 0 }}>
          <span className="flex items-center gap-1.5"><MapPin className="w-3 h-3 text-danger" /> High Priority</span>
          <span className="flex items-center gap-1.5"><MapPin className="w-3 h-3 text-warning" /> Medium Priority</span>
          <span className="flex items-center gap-1.5"><MapPin className="w-3 h-3 text-success" /> Low Priority</span>
          <span className="text-muted-foreground/50">· Click a pin to see issue details · Toggle 🔥 for heatmap view</span>
        </div>
      </div>
    </main>
  );
}
