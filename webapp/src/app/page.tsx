/* eslint-disable @next/next/no-img-element */
import { supabase } from '@/lib/supabaseClient';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Camera, MapPin, ArrowRight, ChevronRight, Shield, Brain, Eye, Zap, TrendingUp, Users, CheckCircle2, BarChart3 } from 'lucide-react';

function PriorityBadge({ priority }: { priority?: string }) {
    if (!priority || priority === 'NONE') return null;
    const cls = priority === 'High' ? 'badge-high' : priority === 'Medium' ? 'badge-medium' : 'badge-low';
    return (
        <span className={`badge ${cls}`}>
            {priority}
        </span>
    );
}

export const revalidate = 0;

export default async function HomePage() {
    const supabaseServer = createClient();
    const { data: { user } } = await supabaseServer.auth.getUser();

    // Fetch global stats for the landing page
    const { count: totalReports } = await supabase
        .from('reports')
        .select('*', { count: 'exact', head: true })
        .neq('status', 'REJECTED');

    const { count: resolvedReports } = await supabase
        .from('reports')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'AUTHORITY_NOTIFIED');

    const { count: totalCitizens } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

    let reports = null;
    let userStatsTotal = 0;
    let userStatsResolved = 0;
    let userStatsPending = 0;
    if (user) {
        const { data } = await supabase
            .from('reports')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });
        reports = data;
        if (data) {
            userStatsTotal = data.length;
            userStatsResolved = data.filter(r => r.status === 'AUTHORITY_NOTIFIED').length;
            userStatsPending = data.filter(r => r.status === 'PENDING_REVIEW').length;
        }
    }

    // --- LOGGED OUT: Premium Landing Page ---
    if (!user) {
        return (
            <main className="min-h-screen bg-background overflow-hidden">
                {/* Hero Section */}
                <section className="relative pt-20 pb-28 px-6">
                    {/* Background mesh gradient */}
                    <div className="absolute inset-0 mesh-gradient opacity-60" />
                    {/* Floating decorative elements */}
                    <div className="absolute top-32 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl animate-float" />
                    <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/5 rounded-full blur-3xl animate-float delay-500" />

                    <div className="relative max-w-4xl mx-auto text-center space-y-8">
                        {/* Badge */}
                        <div className="animate-fade-in-up inline-flex items-center gap-2 px-5 py-2.5 bg-primary/10 border border-primary/20 rounded-full text-primary text-xs font-bold uppercase tracking-widest">
                            <Eye className="w-3.5 h-3.5" />
                            AI-Powered Civic Reporting
                        </div>

                        {/* Headline */}
                        <h1 className="animate-fade-in-up delay-100 text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-[0.9]" style={{ opacity: 0 }}>
                            Be the Eye
                            <br />
                            <span className="gradient-text">of Your City</span>
                        </h1>

                        {/* Subtext */}
                        <p className="animate-fade-in-up delay-200 text-lg sm:text-xl text-muted-foreground max-w-xl mx-auto leading-relaxed" style={{ opacity: 0 }}>
                            Report civic issues in seconds. Track your city live.
                            <br className="hidden sm:block" />
                            Our AI classifies, maps, and routes it to the right authority.
                        </p>

                        {/* CTA Buttons */}
                        <div className="animate-fade-in-up delay-300 flex flex-col sm:flex-row items-center justify-center gap-4 pt-4" style={{ opacity: 0 }}>
                            <Link href="/register" className="primary-action h-16 px-10 text-lg font-black w-full sm:w-auto animate-pulse-glow">
                                Report Issue <ArrowRight className="w-5 h-5" />
                            </Link>
                            <Link href="/login" className="h-16 px-10 flex items-center justify-center gap-2 bg-secondary border border-border rounded-2xl text-foreground font-bold text-lg hover:bg-muted hover:border-primary/20 transition-all w-full sm:w-auto">
                                Sign In
                            </Link>
                        </div>
                    </div>
                </section>

                {/* Stats Section */}
                <section className="py-12 px-6 border-t border-border/50">
                    <div className="max-w-4xl mx-auto">
                        <div className="grid grid-cols-3 gap-6">
                            {[
                                { value: totalReports || 0, label: "Issues Reported", icon: BarChart3 },
                                { value: resolvedReports || 0, label: "Issues Resolved", icon: CheckCircle2 },
                                { value: totalCitizens || 0, label: "Active Citizens", icon: Users },
                            ].map((stat, i) => (
                                <div key={i} className="stat-card text-center animate-fade-in-up" style={{ animationDelay: `${400 + i * 100}ms` }}>
                                    <stat.icon className="w-5 h-5 text-primary mx-auto mb-2" />
                                    <div className="text-3xl sm:text-4xl font-black tracking-tight text-foreground">
                                        {stat.value}
                                    </div>
                                    <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                        {stat.label}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* How It Works */}
                <section className="py-16 px-6 bg-secondary/30">
                    <div className="max-w-5xl mx-auto">
                        <div className="text-center mb-12 space-y-3">
                            <div className="section-label">How It Works</div>
                            <h2 className="text-4xl sm:text-5xl font-black tracking-tight">
                                Three steps. One photo.
                                <br />
                                <span className="text-muted-foreground">Real civic action.</span>
                            </h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {[
                                {
                                    icon: Camera,
                                    step: "01",
                                    title: "Capture",
                                    desc: "Open the camera, snap a photo of the issue. Our interface feels like a native app — fast and intuitive."
                                },
                                {
                                    icon: Brain,
                                    step: "02",
                                    title: "AI Analyzes",
                                    desc: "Vision AI classifies the issue, assigns severity, extracts metadata, and generates a detailed report automatically."
                                },
                                {
                                    icon: Zap,
                                    step: "03",
                                    title: "City Responds",
                                    desc: "Your report is routed to the correct municipal department. Track progress in real-time until resolution."
                                },
                            ].map((feature, i) => (
                                <div key={i} className="feature-card relative animate-fade-in-up" style={{ animationDelay: `${i * 150}ms` }}>
                                    <div className="absolute -top-3 -left-1 text-6xl font-black text-primary/5 select-none">
                                        {feature.step}
                                    </div>
                                    <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
                                        <feature.icon className="w-6 h-6 text-primary" />
                                    </div>
                                    <h3 className="text-xl font-black">{feature.title}</h3>
                                    <p className="text-muted-foreground text-sm leading-relaxed">{feature.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Why CivicEye */}
                <section className="py-16 px-6">
                    <div className="max-w-5xl mx-auto">
                        <div className="text-center mb-12 space-y-3">
                            <div className="section-label">Why CivicEye</div>
                            <h2 className="text-4xl sm:text-5xl font-black tracking-tight">
                                Not just a project.
                                <br />
                                <span className="text-muted-foreground">A civic infrastructure.</span>
                            </h2>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            {[
                                { icon: Brain,     title: "AI-Powered Detection",  desc: "Computer vision classifies issues with confidence scoring, severity assessment, and automatic categorization." },
                                { icon: MapPin,    title: "Precision Geolocation",  desc: "GPS auto-tags exact coordinates. Reverse geocoding provides human-readable addresses instantly." },
                                { icon: TrendingUp,title: "Real-Time Tracking",     desc: "Follow your report from submission to resolution. SLA tracking ensures accountability." },
                                { icon: Shield,    title: "Verified & Trustworthy", desc: "AI gatekeeper filters spam and invalid submissions. Community validation ensures report integrity." },
                            ].map((item, i) => (
                                <div key={i} className="flex gap-5 p-6 rounded-3xl border border-border hover:border-primary/20 hover:bg-secondary/50 transition-all duration-300 animate-fade-in-up" style={{ animationDelay: `${i * 100}ms` }}>
                                    <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center shrink-0">
                                        <item.icon className="w-5 h-5 text-primary" />
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="font-bold text-lg">{item.title}</h3>
                                        <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Final CTA */}
                <section className="py-24 px-6 relative overflow-hidden">
                    <div className="absolute inset-0 bg-foreground" />
                    <div className="absolute inset-0 mesh-gradient opacity-30" />
                    <div className="relative max-w-3xl mx-auto text-center space-y-8">
                        <h2 className="text-4xl sm:text-5xl font-black tracking-tighter text-background">
                            Your city needs you.
                        </h2>
                        <p className="text-background/50 max-w-md mx-auto text-lg leading-relaxed">
                            Join citizens making their neighborhoods safer, cleaner, and more responsive — one report at a time.
                        </p>
                        <Link href="/register" className="inline-flex items-center justify-center gap-2 bg-primary text-white font-black h-16 px-10 rounded-2xl text-lg hover:brightness-110 transition-all shadow-xl shadow-primary/30">
                            Create Free Account <ArrowRight className="w-5 h-5" />
                        </Link>
                    </div>
                </section>

                {/* Footer */}
                <footer className="py-10 px-6 border-t border-border">
                    <div className="max-w-6xl mx-auto flex items-center justify-between">
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Shield className="w-4 h-4 text-primary" />
                            <span className="text-xs font-black uppercase tracking-widest">CivicEye</span>
                        </div>
                        <p className="text-xs text-muted-foreground">AI-Powered Civic Reporting Platform</p>
                    </div>
                </footer>
            </main>
        );
    }

    // --- LOGGED IN: Enhanced Personal Dashboard ---
    const userName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Citizen';

    return (
        <main className="min-h-screen bg-background">
            <div className="max-w-xl mx-auto px-6 pt-8 pb-24 space-y-8">
                {/* Welcome Header */}
                <header className="space-y-2 animate-fade-in-up">
                    <p className="section-label">Welcome back</p>
                    <h1 className="text-3xl font-black tracking-tight">{userName}</h1>
                </header>

                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-3 animate-fade-in-up delay-100" style={{ opacity: 0 }}>
                    {[
                        { value: userStatsTotal, label: "Total", color: "text-foreground" },
                        { value: userStatsResolved, label: "Resolved", color: "text-success" },
                        { value: userStatsPending, label: "Pending", color: "text-warning" },
                    ].map((stat, i) => (
                        <div key={i} className="stat-card text-center py-4">
                            <div className={`text-2xl font-black ${stat.color}`}>{stat.value}</div>
                            <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mt-1">{stat.label}</div>
                        </div>
                    ))}
                </div>

                {/* Quick Actions */}
                <div className="animate-fade-in-up delay-200" style={{ opacity: 0 }}>
                    <Link href="/report" className="primary-action w-full h-14 text-base font-bold">
                        <Camera className="w-5 h-5" /> Report New Issue <ArrowRight className="w-4 h-4 ml-auto" />
                    </Link>
                </div>

                {/* Reports List */}
                <section className="space-y-4 animate-fade-in-up delay-300" style={{ opacity: 0 }}>
                    <div className="flex items-center justify-between">
                        <h2 className="section-label">Your Reports</h2>
                        <span className="text-[10px] font-bold text-muted-foreground">{reports?.length || 0} total</span>
                    </div>

                    <div className="space-y-3">
                        {reports && reports.length > 0 ? (
                            reports.map((report) => (
                                <Link
                                    key={report.id}
                                    href={`/track/${report.tracking_id}`}
                                    className="group report-card"
                                >
                                    {report.image_url ? (
                                        <div className="w-14 h-14 rounded-2xl overflow-hidden bg-secondary shrink-0 border border-border">
                                            <img src={report.image_url} alt="" className="w-full h-full object-cover" />
                                        </div>
                                    ) : (
                                        <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center shrink-0 border border-border">
                                            <Camera className="w-5 h-5 text-muted-foreground" />
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-extrabold text-foreground truncate">
                                                {report.status === 'REJECTED' ? (report.rejection_title || 'Rejected Report') : report.issue_type}
                                            </span>
                                            <PriorityBadge priority={report.priority} />
                                            <div className={`status-dot ${
                                                report.status === 'AUTHORITY_NOTIFIED' ? 'status-dot-resolved' :
                                                report.status === 'REJECTED' ? 'status-dot-rejected' : 'status-dot-pending'
                                            }`} />
                                        </div>
                                        <div className="flex items-center gap-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                            <span>{report.status?.replace('_', ' ')}</span>
                                            <span className="font-mono text-[9px] opacity-50">{report.tracking_id}</span>
                                        </div>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-primary transition-colors shrink-0" />
                                </Link>
                            ))
                        ) : (
                            <div className="py-20 text-center space-y-6">
                                <div className="w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center mx-auto">
                                    <Eye className="w-8 h-8 text-primary/30" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="font-black text-lg">No Issues Reported Yet</h3>
                                    <p className="text-muted-foreground text-sm">Be the first to report an issue in your area 👀</p>
                                </div>
                                <Link href="/report" className="primary-action inline-flex h-14 px-8 text-base">
                                    Submit Your First Report <ArrowRight className="w-5 h-5" />
                                </Link>
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </main>
    );
}
