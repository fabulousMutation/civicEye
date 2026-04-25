/* eslint-disable @next/next/no-img-element */
import { supabase } from '@/lib/supabaseClient';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Camera, MapPin, Radio, ArrowRight, ChevronRight, Shield } from 'lucide-react';

export const revalidate = 0;

export default async function HomePage() {
    const supabaseServer = createClient();
    const { data: { user } } = await supabaseServer.auth.getUser();

    let reports = null;
    if (user) {
        const { data } = await supabase
            .from('reports')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });
        reports = data;
    }

    // --- LOGGED OUT: Landing Page ---
    if (!user) {
        return (
            <main className="min-h-screen bg-background">
                {/* Hero */}
                <section className="pt-16 pb-20 px-6">
                    <div className="max-w-3xl mx-auto text-center space-y-8">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-xs font-black uppercase tracking-widest">
                            <Radio className="w-3 h-3" /> AI-Powered Civic Reporting
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-[0.9]">
                            Report Issues.
                            <br />
                            <span className="text-primary">Drive Change.</span>
                        </h1>
                        <p className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
                            Snap a photo of a civic problem — potholes, broken streetlights, illegal dumping. Our AI classifies it, maps it, and routes it directly to the right authority.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                            <Link href="/register" className="primary-action h-16 px-10 text-lg font-black w-full sm:w-auto">
                                Start Reporting <ArrowRight className="w-5 h-5" />
                            </Link>
                            <Link href="/login" className="h-16 px-10 flex items-center justify-center gap-2 bg-secondary border border-border rounded-2xl text-foreground font-bold text-lg hover:bg-muted transition-all w-full sm:w-auto">
                                Sign In
                            </Link>
                        </div>
                    </div>
                </section>

                {/* Features */}
                <section className="py-20 px-6 border-t border-border">
                    <div className="max-w-5xl mx-auto">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl font-black tracking-tight mb-4">How It Works</h2>
                            <p className="text-muted-foreground max-w-md mx-auto">Three steps. One photo. Real civic action.</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {[
                                { icon: Camera, title: "Capture", desc: "Open the camera, snap a photo of the issue. Our interface feels like a native app." },
                                { icon: MapPin, title: "Locate", desc: "GPS automatically tags the precise location. No address typing needed." },
                                { icon: Shield, title: "AI Routes", desc: "Vision AI classifies the issue and routes it to the correct municipal department." },
                            ].map((feature, i) => (
                                <div key={i} className="p-8 bg-secondary border border-border rounded-3xl space-y-4 hover:shadow-xl hover:shadow-primary/5 hover:border-primary/20 transition-all">
                                    <div className="w-14 h-14 bg-secondary rounded-2xl flex items-center justify-center">
                                        <feature.icon className="w-6 h-6 text-primary" />
                                    </div>
                                    <h3 className="text-xl font-black">{feature.title}</h3>
                                    <p className="text-muted-foreground text-sm leading-relaxed">{feature.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* CTA */}
                <section className="py-20 px-6 bg-foreground text-background">
                    <div className="max-w-3xl mx-auto text-center space-y-8">
                        <h2 className="text-4xl font-black tracking-tighter">Your city needs you.</h2>
                        <p className="text-background/60 max-w-md mx-auto">Join thousands of citizens making their neighborhoods safer, cleaner, and more responsive.</p>
                        <Link href="/register" className="inline-flex items-center justify-center gap-2 bg-primary text-white font-black h-16 px-10 rounded-2xl text-lg hover:opacity-90 transition-all">
                            Create Free Account <ArrowRight className="w-5 h-5" />
                        </Link>
                    </div>
                </section>

                {/* Footer */}
                <footer className="py-10 px-6 border-t border-border">
                    <div className="max-w-6xl mx-auto flex items-center justify-between">
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Shield className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase tracking-widest">CivicEye</span>
                        </div>
                        <p className="text-xs text-muted-foreground">AI-Powered Civic Reporting Platform</p>
                    </div>
                </footer>
            </main>
        );
    }

    // --- LOGGED IN: Personal Dashboard ---
    return (
        <main className="min-h-screen bg-background">
            <div className="max-w-xl mx-auto px-6 pt-8 pb-20 space-y-10">
                <header className="space-y-2">
                    <h1 className="text-3xl font-black tracking-tight">Your Reports</h1>
                    <p className="text-muted-foreground text-sm">Track the status of issues you&apos;ve reported.</p>
                </header>

                <div className="space-y-3">
                    {reports && reports.length > 0 ? (
                        reports.map((report) => (
                            <Link 
                                key={report.id}
                                href={`/track/${report.tracking_id}`}
                                className="group flex items-center gap-4 p-5 bg-secondary border border-border rounded-3xl hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all"
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
                                        <span className="font-extrabold text-foreground truncate">{report.issue_type}</span>
                                        <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                            report.status === 'AUTHORITY_NOTIFIED' ? 'bg-emerald-500' :
                                            report.status === 'REJECTED' ? 'bg-red-500' : 'bg-primary'
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
                            <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mx-auto">
                                <Camera className="w-8 h-8 text-muted-foreground/30" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="font-black text-lg">No Reports Yet</h3>
                                <p className="text-muted-foreground text-sm">Start making a difference in your community.</p>
                            </div>
                            <Link href="/report" className="primary-action inline-flex h-14 px-8 text-base">
                                Submit Your First Report <ArrowRight className="w-5 h-5" />
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
