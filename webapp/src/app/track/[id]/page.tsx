/* eslint-disable @next/next/no-img-element */
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import { ArrowLeft, Clock, MapPin, AlertTriangle, BadgeCheck, ShieldAlert } from 'lucide-react';
import DraftEditor from '@/components/DraftEditor';

export const revalidate = 0;

export default async function TrackPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const { id } = params;

    const { data: report, error } = await supabase
        .from('reports')
        .select('*')
        .eq('tracking_id', id)
        .single();

    if (error || !report) {
        return (
            <main className="min-h-screen flex items-center justify-center bg-muted p-6">
                <div className="text-center p-12 bg-secondary rounded-[2rem] shadow-2xl max-w-md w-full border border-border">
                    <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-6" />
                    <h1 className="text-3xl font-black mb-3">Not Found</h1>
                    <p className="text-muted-foreground mb-8">Tracking ID <span className="font-mono text-foreground font-bold">{id}</span> does not exist.</p>
                    <Link href="/" className="primary-action w-full">Return Home</Link>
                </div>
            </main>
        );
    }

    const authorityEmail = report.authority_contact_info?.email || 'N/A';
    const authorityDept = report.authority_contact_info?.department || 'Awaiting Routing';

    return (
        <main className="min-h-screen bg-background pb-24">
            <div className="max-w-xl mx-auto px-6 pt-12 space-y-8">
                
                <Link href="/" className="inline-flex items-center text-sm font-bold text-muted-foreground hover:text-primary transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-2" /> DASHBOARD
                </Link>

                <header className="space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Tracking Receipt</span>
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-secondary rounded-full border border-border">
                            <div className={`w-1.5 h-1.5 rounded-full ${report.status === 'REJECTED' ? 'bg-red-500' : 'bg-emerald-500'}`} />
                            <span className="text-[10px] font-bold uppercase tracking-wider">{report.status.replace('_', ' ')}</span>
                        </div>
                    </div>
                    <h1 className="text-4xl font-extrabold tracking-tight text-foreground">{report.issue_type}</h1>
                    <div className="flex items-center gap-4 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
                        <span className="flex items-center gap-1.5"><Clock className="w-3 h-3" /> {new Date(report.geotag_timestamp || report.created_at).toLocaleDateString()}</span>
                        <span className="flex items-center gap-1.5"><MapPin className="w-3 h-3" /> {report.location_lat?.toFixed(3)}, {report.location_lng?.toFixed(3)}</span>
                    </div>
                </header>

                <div className="bg-secondary/50 rounded-[2.5rem] p-4 border border-border">
                    {report.image_url ? (
                        <div className="rounded-[2rem] overflow-hidden border border-border aspect-[4/3] bg-muted">
                            <img src={report.image_url} alt="Evidence" className="w-full h-full object-cover" />
                        </div>
                    ) : (
                        <div className="aspect-[4/3] rounded-[2rem] border-2 border-dashed border-border flex flex-col items-center justify-center text-muted-foreground">
                            <ShieldAlert className="w-12 h-12 mb-4 opacity-20" />
                            <p className="font-bold text-sm">NO VISUAL EVIDENCE</p>
                        </div>
                    )}
                </div>

                <div className="space-y-12">
                    {report.status === 'REJECTED' ? (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-3xl p-8 space-y-4">
                            <div className="flex items-center gap-3 text-red-500">
                                <ShieldAlert className="w-6 h-6 font-bold" />
                                <h3 className="text-lg font-black uppercase tracking-wider">Submission Rejected</h3>
                            </div>
                            <p className="text-red-400 leading-relaxed font-medium">
                                {report.rejection_reason || report.text_summary}
                            </p>
                        </div>
                    ) : (
                        <DraftEditor 
                            report={report} 
                            authorityDept={authorityDept} 
                            authorityEmail={authorityEmail} 
                        />
                    )}
                </div>

                <footer className="pt-12 border-t border-border flex flex-col items-center gap-6">
                    <div className="text-center space-y-2">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Secure Verification ID</p>
                        <p className="font-mono text-lg font-bold tracking-tighter">{report.tracking_id}</p>
                    </div>
                    <div className="w-12 h-12 bg-primary/5 rounded-full flex items-center justify-center border border-primary/10">
                        <BadgeCheck className="w-6 h-6 text-primary" />
                    </div>
                </footer>
            </div>
        </main>
    );
}

