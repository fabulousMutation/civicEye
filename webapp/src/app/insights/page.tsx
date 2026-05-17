import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import { TrendingUp, MapPin, Clock, BarChart3, ArrowRight, Zap, Calendar } from 'lucide-react';

export const revalidate = 60;

export default async function InsightsPage() {
  const { data: reports } = await supabase
    .from('reports')
    .select('issue_type, priority, status, created_at, address, location_lat, location_lng')
    .neq('status', 'REJECTED')
    .order('created_at', { ascending: false })
    .limit(500);

  const safeReports = reports || [];

  // Most common issues
  const typeCounts: Record<string, { count: number; high: number; resolved: number }> = {};
  safeReports.forEach(r => {
    if (!r.issue_type) return;
    if (!typeCounts[r.issue_type]) typeCounts[r.issue_type] = { count: 0, high: 0, resolved: 0 };
    typeCounts[r.issue_type].count++;
    if (r.priority === 'High') typeCounts[r.issue_type].high++;
    if (r.status === 'AUTHORITY_NOTIFIED') typeCounts[r.issue_type].resolved++;
  });
  const topIssues = Object.entries(typeCounts)
    .sort(([,a],[,b]) => b.count - a.count)
    .slice(0, 8)
    .map(([type, stats]) => ({ type, ...stats, resRate: stats.count > 0 ? Math.round((stats.resolved / stats.count) * 100) : 0 }));

  // Most affected areas
  const areaCounts: Record<string, number> = {};
  safeReports.forEach(r => {
    const area = r.address?.split(',')[0]?.trim() || 'Unknown';
    areaCounts[area] = (areaCounts[area] || 0) + 1;
  });
  const topAreas = Object.entries(areaCounts)
    .sort(([,a],[,b]) => b - a)
    .slice(0, 6)
    .map(([area, count]) => ({ area, count }));
  const maxArea = topAreas[0]?.count || 1;

  // Hourly distribution (peak times)
  const hourCounts = Array(24).fill(0);
  safeReports.forEach(r => {
    const h = new Date(r.created_at).getHours();
    hourCounts[h]++;
  });
  const peakHour = hourCounts.indexOf(Math.max(...hourCounts));
  const formatHour = (h: number) => h === 0 ? '12am' : h < 12 ? `${h}am` : h === 12 ? '12pm' : `${h-12}pm`;
  const maxHour = Math.max(...hourCounts, 1);

  // Monthly trend (last 6 months)
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(); d.setMonth(d.getMonth() - (5 - i)); d.setDate(1);
    const key = d.toISOString().slice(0, 7);
    return {
      label: d.toLocaleDateString('en', { month: 'short' }),
      count: safeReports.filter(r => r.created_at?.startsWith(key)).length,
    };
  });
  const maxMonth = Math.max(...months.map(m => m.count), 1);

  return (
    <main className="min-h-screen bg-background pb-20">
      <div className="max-w-5xl mx-auto px-6 pt-8 space-y-10">

        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in-up">
          <div>
            <p className="section-label">Intelligence</p>
            <h1 className="text-4xl font-black tracking-tight">City Insights</h1>
            <p className="text-sm text-muted-foreground mt-1">Patterns, trends, and hotspots derived from {safeReports.length} reports</p>
          </div>
          <Link href="/dashboard" className="primary-action h-10 px-5 text-sm">
            Dashboard <ArrowRight className="w-4 h-4" />
          </Link>
        </header>

        {/* Summary chips */}
        <div className="flex flex-wrap gap-3 animate-fade-in-up delay-100" style={{ opacity: 0 }}>
          {[
            { icon: BarChart3, label: `${Object.keys(typeCounts).length} issue types tracked` },
            { icon: MapPin,    label: `${Object.keys(areaCounts).length} areas affected` },
            { icon: Clock,     label: `Peak hour: ${formatHour(peakHour)}` },
          ].map((chip, i) => (
            <div key={i} className="flex items-center gap-2 px-4 py-2 bg-secondary border border-border rounded-full text-xs font-bold text-muted-foreground">
              <chip.icon className="w-3.5 h-3.5 text-primary" /> {chip.label}
            </div>
          ))}
        </div>

        {/* Most Common Issues */}
        <section className="glass-card p-6 space-y-5 animate-fade-in-up delay-200" style={{ opacity: 0 }}>
          <h2 className="font-black text-xl flex items-center gap-2">
            <Zap className="w-5 h-5 text-warning" /> Most Reported Issues
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {topIssues.map((issue, i) => (
              <div key={i} className="p-4 bg-secondary rounded-2xl border border-border hover:border-primary/20 transition-all space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-bold">{issue.type}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{issue.count} report{issue.count !== 1 ? 's' : ''}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-sm font-black ${issue.resRate >= 50 ? 'text-success' : issue.resRate >= 20 ? 'text-warning' : 'text-danger'}`}>
                      {issue.resRate}%
                    </p>
                    <p className="text-[10px] text-muted-foreground">resolved</p>
                  </div>
                </div>
                {issue.high > 0 && (
                  <span className="badge badge-high">{issue.high} High Priority</span>
                )}
                <div className="h-1.5 bg-background rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${issue.resRate}%`, opacity: 0.7 }} />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Most Affected Areas */}
        <section className="glass-card p-6 space-y-4 animate-fade-in-up delay-300" style={{ opacity: 0 }}>
          <h2 className="font-black text-xl flex items-center gap-2">
            <MapPin className="w-5 h-5 text-danger" /> Most Affected Areas
          </h2>
          {topAreas.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">No location data yet</p>
          ) : (
            <div className="space-y-3">
              {topAreas.map((area, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-bold truncate max-w-xs">{area.area}</span>
                    <span className="font-black text-foreground shrink-0">{area.count}</span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-danger transition-all duration-700"
                      style={{ width: `${(area.count / maxArea) * 100}%`, opacity: 0.7 }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Monthly + Hourly trend */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Monthly */}
          <div className="glass-card p-6 space-y-4 animate-fade-in-up delay-400" style={{ opacity: 0 }}>
            <h2 className="font-black text-lg flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" /> Monthly Trend
            </h2>
            <div className="flex items-end gap-2 h-28">
              {months.map((m, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  {m.count > 0 && <span className="text-[9px] font-black">{m.count}</span>}
                  <div className="w-full rounded-t-lg" style={{
                    height: `${Math.max((m.count / maxMonth) * 88, 4)}px`,
                    backgroundColor: 'rgb(var(--primary))',
                    opacity: m.count > 0 ? 0.4 + (m.count / maxMonth) * 0.6 : 0.15,
                  }} />
                  <span className="text-[9px] font-bold text-muted-foreground">{m.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Hourly heatmap */}
          <div className="glass-card p-6 space-y-4 animate-fade-in-up delay-500" style={{ opacity: 0 }}>
            <h2 className="font-black text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-accent" /> Peak Reporting Hours
            </h2>
            <div className="grid grid-cols-6 gap-1">
              {hourCounts.map((count, h) => (
                <div key={h} className="flex flex-col items-center gap-1">
                  <div
                    className="w-full rounded-md"
                    title={`${formatHour(h)}: ${count} reports`}
                    style={{
                      height: '28px',
                      backgroundColor: count > 0 ? `rgb(var(--primary))` : 'rgb(var(--border))',
                      opacity: count > 0 ? 0.2 + (count / maxHour) * 0.8 : 0.2,
                    }}
                  />
                  {h % 6 === 0 && <span className="text-[8px] text-muted-foreground">{formatHour(h)}</span>}
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Peak: <strong className="text-foreground">{formatHour(peakHour)}</strong> with {hourCounts[peakHour]} report{hourCounts[peakHour] !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
