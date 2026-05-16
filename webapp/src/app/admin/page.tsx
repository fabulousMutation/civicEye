import { supabase } from '@/lib/supabaseClient';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Shield, CheckCircle2, Clock, AlertTriangle, BarChart3, RefreshCw, Zap, TrendingUp } from 'lucide-react';

export const revalidate = 0;

const STATUS_OPTIONS = ['PENDING_REVIEW', 'AUTHORITY_NOTIFIED', 'RESOLVED', 'REJECTED'] as const;
type Status = typeof STATUS_OPTIONS[number];

const STATUS_META: Record<Status, { label: string; color: string; bg: string; icon: typeof CheckCircle2 }> = {
  PENDING_REVIEW:    { label: 'Pending',   color: 'text-warning', bg: 'bg-warning/10',  icon: Clock        },
  AUTHORITY_NOTIFIED:{ label: 'Notified',  color: 'text-primary', bg: 'bg-primary/10',  icon: Zap          },
  RESOLVED:          { label: 'Resolved',  color: 'text-success', bg: 'bg-success/10',  icon: CheckCircle2 },
  REJECTED:          { label: 'Rejected',  color: 'text-danger',  bg: 'bg-danger/10',   icon: AlertTriangle},
};

type Report = {
  tracking_id: string;
  issue_type: string;
  priority: string;
  status: Status;
  address?: string;
  created_at: string;
  image_url?: string;
  rejection_title?: string;
  confidence_score?: number;
  confirm_count?: number;
  reject_count?: number;
  verification_status?: string;
};

async function updateStatus(formData: FormData) {
  'use server';
  const tracking_id = formData.get('tracking_id') as string;
  const status = formData.get('status') as string;
  if (tracking_id && status) {
    const updates: Record<string, unknown> = { status };
    if (status === 'RESOLVED') updates.resolved_at = new Date().toISOString();
    if (status === 'AUTHORITY_NOTIFIED') updates.acknowledged_at = new Date().toISOString();
    await supabase.from('reports').update(updates).eq('tracking_id', tracking_id);
  }
}

export default async function AdminPage() {
  // Auth + role check
  const supabaseServer = createClient();
  const { data: { user } } = await supabaseServer.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles').select('role, full_name').eq('id', user.id).single();
  if (profile?.role !== 'admin') redirect('/');

  // Fetch reports
  const { data: reports, count } = await supabase
    .from('reports')
    .select('tracking_id, issue_type, priority, status, address, created_at, image_url, rejection_title, confidence_score, confirm_count, reject_count, verification_status', { count: 'exact' })
    .order('created_at', { ascending: false })
    .limit(100);

  const safeReports: Report[] = (reports || []) as Report[];

  // Admin stats
  const stats = {
    total:    safeReports.length,
    pending:  safeReports.filter(r => r.status === 'PENDING_REVIEW').length,
    notified: safeReports.filter(r => r.status === 'AUTHORITY_NOTIFIED').length,
    resolved: safeReports.filter(r => r.status === 'RESOLVED').length,
    rejected: safeReports.filter(r => r.status === 'REJECTED').length,
  };

  return (
    <main className="min-h-screen bg-background pb-20">
      <div className="max-w-6xl mx-auto px-6 pt-8 space-y-10">

        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in-up">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Shield className="w-5 h-5 text-primary" />
              <p className="section-label">Admin Panel</p>
            </div>
            <h1 className="text-4xl font-black tracking-tight">Control Center</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Logged in as <strong className="text-foreground">{profile.full_name || user.email}</strong>
            </p>
          </div>
          <div className="flex gap-3">
            <Link href="/dashboard" className="inline-flex items-center gap-2 px-4 py-2.5 bg-secondary border border-border rounded-2xl text-sm font-bold hover:border-primary/30 transition-all">
              <BarChart3 className="w-4 h-4 text-primary" /> Analytics
            </Link>
            <form action={async () => { 'use server'; }}>
              <Link href="/admin" className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-2xl text-sm font-bold hover:brightness-110 transition-all">
                <RefreshCw className="w-4 h-4" /> Refresh
              </Link>
            </form>
          </div>
        </header>

        {/* KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 animate-fade-in-up delay-100" style={{ opacity: 0 }}>
          {[
            { label: 'Total',    value: stats.total,    color: 'text-foreground', bg: 'bg-secondary' },
            { label: 'Pending',  value: stats.pending,  color: 'text-warning',    bg: 'bg-warning/10' },
            { label: 'Notified', value: stats.notified, color: 'text-primary',    bg: 'bg-primary/10' },
            { label: 'Resolved', value: stats.resolved, color: 'text-success',    bg: 'bg-success/10' },
            { label: 'Rejected', value: stats.rejected, color: 'text-danger',     bg: 'bg-danger/10'  },
          ].map((s, i) => (
            <div key={i} className={`glass-card p-4 text-center ${s.bg}`}>
              <div className={`text-3xl font-black ${s.color}`}>{s.value}</div>
              <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Resolution rate bar */}
        <div className="glass-card p-5 space-y-3 animate-fade-in-up delay-200" style={{ opacity: 0 }}>
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 font-bold"><TrendingUp className="w-4 h-4 text-primary" /> Resolution Rate</span>
            <span className="font-black text-primary">
              {stats.total > 0 ? Math.round(((stats.resolved + stats.notified) / stats.total) * 100) : 0}%
            </span>
          </div>
          <div className="h-3 bg-secondary rounded-full overflow-hidden flex">
            <div className="h-full bg-success transition-all" style={{ width: `${stats.total > 0 ? (stats.resolved / stats.total) * 100 : 0}%` }} />
            <div className="h-full bg-primary transition-all" style={{ width: `${stats.total > 0 ? (stats.notified / stats.total) * 100 : 0}%` }} />
          </div>
          <div className="flex gap-4 text-[10px] font-bold text-muted-foreground">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-success inline-block" /> Resolved</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary inline-block" /> Notified</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-warning inline-block" /> Pending</span>
          </div>
        </div>

        {/* Reports Table */}
        <div className="space-y-3 animate-fade-in-up delay-300" style={{ opacity: 0 }}>
          <div className="flex items-center justify-between">
            <h2 className="font-black text-lg">All Reports</h2>
            <span className="text-xs text-muted-foreground">{count || 0} total</span>
          </div>

          <div className="space-y-2">
            {safeReports.map((report) => {
              const meta = STATUS_META[report.status] || STATUS_META.PENDING_REVIEW;
              const Icon = meta.icon;
              const displayName = report.status === 'REJECTED'
                ? (report.rejection_title || 'Rejected Report')
                : report.issue_type;

              return (
                <div
                  key={report.tracking_id}
                  className="glass-card p-4 flex flex-col sm:flex-row sm:items-center gap-4"
                >
                  {/* Thumbnail */}
                  {report.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={report.image_url} alt="" className="w-14 h-14 rounded-2xl object-cover shrink-0 border border-border" />
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-secondary border border-border flex items-center justify-center shrink-0">
                      <Icon className={`w-6 h-6 ${meta.color}`} />
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-black text-sm truncate">{displayName}</span>
                      {report.priority && report.priority !== 'NONE' && (
                        <span className={`badge ${report.priority === 'High' ? 'badge-high' : report.priority === 'Medium' ? 'badge-medium' : 'badge-low'}`}>
                          {report.priority}
                        </span>
                      )}
                      <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${meta.bg} ${meta.color}`}>
                        <Icon className="w-3 h-3" />{meta.label}
                      </span>
                      {report.verification_status === 'verified' && (
                        <span className="text-[10px] font-black text-success">✓ Community Verified</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {report.address || 'No address'} · {new Date(report.created_at).toLocaleDateString()} ·{' '}
                      <span className="font-mono">{report.tracking_id}</span>
                    </p>
                    {report.confidence_score && (
                      <p className="text-[10px] text-muted-foreground">
                        AI: {report.confidence_score}% confidence · 👍 {report.confirm_count || 0} · 👎 {report.reject_count || 0}
                      </p>
                    )}
                  </div>

                  {/* Status control */}
                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      href={`/track/${report.tracking_id}`}
                      className="text-xs font-bold text-primary hover:underline px-3 py-1.5 bg-primary/10 rounded-xl"
                    >
                      View
                    </Link>
                    <form action={updateStatus}>
                      <input type="hidden" name="tracking_id" value={report.tracking_id} />
                      <select
                        name="status"
                        defaultValue={report.status}
                        onChange={(e) => {
                          const form = e.target.closest('form') as HTMLFormElement;
                          if (form) {
                            const fd = new FormData(form);
                            fd.set('status', e.target.value);
                            fetch('/api/admin/reports', {
                              method: 'PATCH',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                tracking_id: report.tracking_id,
                                status: e.target.value
                              })
                            }).then(() => window.location.reload());
                          }
                        }}
                        className="text-xs font-bold bg-secondary border border-border rounded-xl px-3 py-1.5 cursor-pointer hover:border-primary/30 transition-all outline-none"
                      >
                        {STATUS_OPTIONS.map(s => (
                          <option key={s} value={s}>{STATUS_META[s].label}</option>
                        ))}
                      </select>
                    </form>
                  </div>
                </div>
              );
            })}

            {safeReports.length === 0 && (
              <div className="py-16 text-center glass-card">
                <CheckCircle2 className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" />
                <p className="text-muted-foreground font-bold">No reports found</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
