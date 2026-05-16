import { supabase } from '@/lib/supabaseClient';
import { calculateImpactScore } from '@/lib/impactScore';
import Link from 'next/link';
import { Trophy, BarChart3, TrendingUp, CheckCircle2, Clock, Users, ArrowRight, Zap } from 'lucide-react';

export const revalidate = 60;

function BarChart({ data, maxVal }: { data: { label: string; value: number }[]; maxVal: number }) {
  return (
    <div className="space-y-3">
      {data.map((item) => (
        <div key={item.label} className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-foreground truncate max-w-[160px]">{item.label}</span>
            <span className="font-black">{item.value}</span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-primary transition-all duration-700"
              style={{ width: maxVal > 0 ? `${(item.value / maxVal) * 100}%` : '0%' }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function DonutChart({ data, total }: { data: { label: string; value: number; color: string }[]; total: number }) {
  const r = 52; const cx = 64; const cy = 64;
  const circumference = 2 * Math.PI * r;
  let cumulative = 0;
  const segments = data.map((item) => {
    const fraction = total > 0 ? item.value / total : 0;
    const dash = `${fraction * circumference} ${circumference}`;
    const offset = -cumulative * circumference;
    cumulative += fraction;
    return { ...item, dash, offset };
  });
  return (
    <div className="flex items-center gap-6">
      <svg width="128" height="128" viewBox="0 0 128 128" className="shrink-0">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgb(var(--border))" strokeWidth="16" />
        {segments.map((seg, i) => (
          <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={seg.color} strokeWidth="16"
            strokeDasharray={seg.dash} strokeDashoffset={seg.offset}
            transform="rotate(-90, 64, 64)" />
        ))}
        <text x={cx} y={cy - 4} textAnchor="middle" fontSize="20" fontWeight="900" fill="currentColor">{total}</text>
        <text x={cx} y={cy + 13} textAnchor="middle" fontSize="9" fill="#9CA3AF">reports</text>
      </svg>
      <div className="space-y-2 flex-1">
        {data.map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
            <span className="text-xs text-muted-foreground flex-1">{item.label}</span>
            <span className="text-xs font-black">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default async function DashboardPage() {
  const { data: reports } = await supabase
    .from('reports')
    .select('issue_type, priority, status, created_at, user_id')
    .neq('status', 'REJECTED')
    .order('created_at', { ascending: false })
    .limit(500);

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, anonymous_mode')
    .limit(50);

  const { data: allUserReports } = await supabase
    .from('reports')
    .select('user_id, status, priority')
    .not('user_id', 'is', null)
    .limit(1000);

  const safeReports = reports || [];
  const total = safeReports.length;
  const highCount = safeReports.filter(r => r.priority === 'High').length;
  const medCount  = safeReports.filter(r => r.priority === 'Medium').length;
  const lowCount  = safeReports.filter(r => r.priority === 'Low').length;
  const resolved  = safeReports.filter(r => r.status === 'AUTHORITY_NOTIFIED').length;
  const resRate   = total > 0 ? Math.round((resolved / total) * 100) : 0;

  const typeCounts: Record<string, number> = {};
  safeReports.forEach(r => { if (r.issue_type) typeCounts[r.issue_type] = (typeCounts[r.issue_type] || 0) + 1; });
  const topIssues = Object.entries(typeCounts).sort(([,a],[,b]) => b-a).slice(0, 7).map(([label, value]) => ({ label, value }));
  const maxIssue = topIssues[0]?.value || 1;

  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    const key = d.toISOString().split('T')[0];
    return { label: d.toLocaleDateString('en', { weekday: 'short' }), count: safeReports.filter(r => r.created_at?.startsWith(key)).length };
  });
  const maxDay = Math.max(...last7.map(d => d.count), 1);

  const leaderboard = (profiles || []).map(p => {
    const ur = (allUserReports || []).filter(r => r.user_id === p.id);
    return { ...p, score: calculateImpactScore(ur), reportCount: ur.length, resolvedCount: ur.filter(r => r.status === 'AUTHORITY_NOTIFIED').length };
  }).filter(p => p.reportCount > 0).sort((a, b) => b.score - a.score).slice(0, 10);

  const rankBadge = (i: number) => i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`;

  return (
    <main className="min-h-screen bg-background pb-20">
      <div className="max-w-6xl mx-auto px-6 pt-8 space-y-10">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in-up">
          <div>
            <p className="section-label">Analytics</p>
            <h1 className="text-4xl font-black tracking-tight">City Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">Civic issue trends and community impact</p>
          </div>
          <div className="flex gap-3">
            <Link href="/map" className="inline-flex items-center gap-2 px-4 py-2.5 bg-secondary border border-border rounded-2xl text-sm font-bold hover:border-primary/30 transition-all">
              🗺️ Live Map
            </Link>
            <Link href="/insights" className="primary-action h-10 px-5 text-sm">
              Insights <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </header>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in-up delay-100" style={{ opacity: 0 }}>
          {[
            { icon: BarChart3,    label: 'Total Reports', value: total,         color: 'text-foreground', bg: 'bg-secondary' },
            { icon: CheckCircle2, label: 'Resolved',       value: resolved,      color: 'text-success',    bg: 'bg-success/10' },
            { icon: Clock,        label: 'Pending',        value: total-resolved,color: 'text-warning',    bg: 'bg-warning/10' },
            { icon: TrendingUp,   label: 'Resolution %',   value: `${resRate}%`, color: 'text-primary',    bg: 'bg-primary/10' },
          ].map((s, i) => (
            <div key={i} className="glass-card p-5">
              <div className={`w-10 h-10 ${s.bg} rounded-xl flex items-center justify-center mb-3`}>
                <s.icon className={`w-5 h-5 ${s.color}`} />
              </div>
              <div className={`text-3xl font-black ${s.color}`}>{s.value}</div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Priority Donut */}
          <div className="glass-card p-6 space-y-4 animate-fade-in-up delay-200" style={{ opacity: 0 }}>
            <h2 className="font-black text-lg flex items-center gap-2"><Zap className="w-5 h-5 text-warning" /> Priority Breakdown</h2>
            <DonutChart total={total} data={[
              { label: 'High',   value: highCount, color: '#EF4444' },
              { label: 'Medium', value: medCount,  color: '#F59E0B' },
              { label: 'Low',    value: lowCount,  color: '#10B981' },
            ]} />
          </div>

          {/* 7-day Trend */}
          <div className="glass-card p-6 space-y-4 animate-fade-in-up delay-300" style={{ opacity: 0 }}>
            <h2 className="font-black text-lg flex items-center gap-2"><TrendingUp className="w-5 h-5 text-primary" /> 7-Day Trend</h2>
            <div className="flex items-end gap-2 h-32">
              {last7.map((day, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                  {day.count > 0 && <span className="text-[10px] font-black">{day.count}</span>}
                  <div className="w-full rounded-t-lg" style={{
                    height: `${Math.max((day.count / maxDay) * 96, 4)}px`,
                    backgroundColor: day.count > 0 ? 'rgb(var(--primary))' : 'rgb(var(--border))',
                    opacity: day.count > 0 ? 0.5 + (day.count / maxDay) * 0.5 : 0.3,
                  }} />
                  <span className="text-[9px] font-bold text-muted-foreground">{day.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Top Issue Types */}
          <div className="glass-card p-6 space-y-4 animate-fade-in-up delay-400" style={{ opacity: 0 }}>
            <h2 className="font-black text-lg flex items-center gap-2"><BarChart3 className="w-5 h-5 text-accent" /> Top Issue Types</h2>
            {topIssues.length > 0
              ? <BarChart data={topIssues} maxVal={maxIssue} />
              : <p className="text-muted-foreground text-sm text-center py-8">No reports yet</p>}
          </div>

          {/* Leaderboard */}
          <div className="glass-card p-6 space-y-4 animate-fade-in-up delay-500" style={{ opacity: 0 }}>
            <h2 className="font-black text-lg flex items-center gap-2"><Trophy className="w-5 h-5 text-warning" /> Top Contributors</h2>
            <div className="space-y-2">
              {leaderboard.length === 0 ? (
                <div className="text-center py-8"><Users className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" /><p className="text-sm text-muted-foreground">No contributors yet</p></div>
              ) : leaderboard.map((p, i) => (
                <div key={p.id} className={`flex items-center gap-3 p-3 rounded-2xl ${i < 3 ? 'bg-primary/5 border border-primary/10' : 'hover:bg-secondary'} transition-all`}>
                  <span className="text-lg w-8 text-center shrink-0">{rankBadge(i)}</span>
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-sm font-black text-primary">
                    {p.anonymous_mode ? '?' : (p.full_name?.[0] || '?')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate">{p.anonymous_mode ? 'Anonymous Citizen' : (p.full_name || 'Citizen')}</p>
                    <p className="text-[10px] text-muted-foreground">{p.reportCount} reports · {p.resolvedCount} resolved</p>
                  </div>
                  <div className="text-right shrink-0"><span className="font-black text-primary">{p.score}</span><p className="text-[9px] text-muted-foreground">pts</p></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
