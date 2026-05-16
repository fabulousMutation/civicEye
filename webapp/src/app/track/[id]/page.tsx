/* eslint-disable @next/next/no-img-element */
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import { ArrowLeft, Clock, MapPin, AlertTriangle, BadgeCheck, ShieldAlert, Brain, Shield, CheckCircle2, Timer } from 'lucide-react';
import DraftEditor from '@/components/DraftEditor';
import CommunityVote from '@/components/CommunityVote';
import EvidenceStrength from '@/components/EvidenceStrength';
import ShareDirect from '@/components/ShareDirect';

export const revalidate = 0;

function PriorityBadge({ priority }: { priority?: string }) {
    if (!priority || priority === 'NONE') return null;
    const cls = priority === 'High' ? 'badge-high' : priority === 'Medium' ? 'badge-medium' : 'badge-low';
    return <span className={`badge ${cls}`}>{priority} Priority</span>;
}

function StatusTimeline({ report }: { report: { status?: string; created_at: string; acknowledged_at?: string; resolved_at?: string } }) {
    const steps = [
        {
            label: 'Submitted',
            date: report.created_at,
            active: true,
            icon: CheckCircle2,
        },
        {
            label: 'Under Review',
            date: report.acknowledged_at,
            active: report.status === 'PENDING_REVIEW' || report.status === 'AUTHORITY_NOTIFIED' || report.status === 'RESOLVED',
            icon: Clock,
        },
        {
            label: 'Authority Notified',
            date: report.status === 'AUTHORITY_NOTIFIED' || report.status === 'RESOLVED' ? report.acknowledged_at || report.created_at : null,
            active: report.status === 'AUTHORITY_NOTIFIED' || report.status === 'RESOLVED',
            icon: Shield,
        },
        {
            label: 'Resolved',
            date: report.resolved_at,
            active: report.status === 'RESOLVED',
            icon: BadgeCheck,
        },
    ];

    return (
        <div className="space-y-1">
            {steps.map((step, i) => {
                const isLast = i === steps.length - 1;
                return (
                    <div key={i} className="flex gap-4">
                        <div className="flex flex-col items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all ${
                                step.active ? 'bg-primary/10 text-primary' : 'bg-secondary text-muted-foreground/30'
                            }`}>
                                <step.icon className="w-4 h-4" />
                            </div>
                            {!isLast && (
                                <div className={`w-0.5 h-8 my-1 rounded-full ${step.active ? 'bg-primary/30' : 'bg-border'}`} />
                            )}
                        </div>
                        <div className="pt-1">
                            <p className={`font-bold text-sm ${step.active ? 'text-foreground' : 'text-muted-foreground/40'}`}>
                                {step.label}
                            </p>
                            {step.date && step.active && (
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">
                                    {new Date(step.date).toLocaleDateString()} · {new Date(step.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

function getDaysSince(dateStr: string): number {
    return Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
}

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
            <main className="min-h-screen flex items-center justify-center bg-background p-6">
                <div className="text-center p-12 glass-card max-w-md w-full animate-scale-in">
                    <AlertTriangle className="w-16 h-16 text-danger mx-auto mb-6" />
                    <h1 className="text-3xl font-black mb-3">Not Found</h1>
                    <p className="text-muted-foreground mb-8">Tracking ID <span className="font-mono text-foreground font-bold">{id}</span> does not exist.</p>
                    <Link href="/" className="primary-action w-full">Return Home</Link>
                </div>
            </main>
        );
    }

    const authorityEmail = report.authority_contact_info?.email || 'N/A';
    const authorityDept = report.authority_contact_info?.department || 'Awaiting Routing';
    const daysPending = getDaysSince(report.created_at);
    const statusColor = report.status === 'AUTHORITY_NOTIFIED' ? 'text-success' :
                         report.status === 'REJECTED' ? 'text-danger' :
                         report.status === 'RESOLVED' ? 'text-success' : 'text-warning';
    const statusDot = report.status === 'AUTHORITY_NOTIFIED' ? 'status-dot-resolved' :
                      report.status === 'REJECTED' ? 'status-dot-rejected' :
                      report.status === 'RESOLVED' ? 'status-dot-resolved' : 'status-dot-pending';

    return (
        <main className="min-h-screen bg-background pb-24">
            <div className="max-w-xl mx-auto px-6 pt-12 space-y-8">

                <Link href="/" className="inline-flex items-center text-sm font-bold text-muted-foreground hover:text-primary transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-2" /> DASHBOARD
                </Link>

                <header className="space-y-4 animate-fade-in-up">
                    <div className="flex items-center justify-between">
                        <span className="section-label">Tracking Receipt</span>
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-secondary rounded-full border border-border">
                            <div className={`status-dot ${statusDot}`} />
                            <span className="text-[10px] font-bold uppercase tracking-wider">{report.status.replace('_', ' ')}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                        <h1 className="text-4xl font-black tracking-tight text-foreground">
                            {report.status === 'REJECTED' ? (report.rejection_title || 'Rejected Report') : (report.issue_type || 'Report')}
                        </h1>
                        <PriorityBadge priority={report.priority} />
                    </div>
                    <div className="flex items-center gap-4 text-[11px] font-bold text-muted-foreground uppercase tracking-widest flex-wrap">
                        <span className="flex items-center gap-1.5"><Clock className="w-3 h-3" /> {new Date(report.geotag_timestamp || report.created_at).toLocaleDateString()}</span>
                        <span className="flex items-center gap-1.5">
                            <MapPin className="w-3 h-3" />
                            {report.address
                                ? <span className="normal-case tracking-normal font-medium max-w-[300px] truncate">{report.address}</span>
                                : `${report.location_lat?.toFixed(3)}, ${report.location_lng?.toFixed(3)}`
                            }
                        </span>
                    </div>
                </header>

                {/* Evidence Image */}
                <div className="glass-card p-4 animate-fade-in-up delay-100" style={{ opacity: 0 }}>
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

                {/* AI Detection Card */}
                {report.status !== 'REJECTED' && (
                    <div className="glass-card p-5 space-y-4 animate-fade-in-up delay-200" style={{ opacity: 0 }}>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center">
                                <Brain className="w-5 h-5 text-accent" />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-sm">Detected: {report.issue_type}</span>
                                    <span className="badge badge-accent">AI</span>
                                </div>
                                {report.confidence_score && (
                                    <div className="flex items-center gap-2 mt-1.5">
                                        <span className="text-xs text-muted-foreground font-medium">
                                            Confidence: {report.confidence_score}%
                                        </span>
                                        <div className="confidence-meter flex-1 max-w-[120px]">
                                            <div
                                                className="confidence-meter-fill"
                                                style={{
                                                    width: `${report.confidence_score}%`,
                                                    backgroundColor: report.confidence_score > 70 ? 'rgb(var(--success))' :
                                                        report.confidence_score > 40 ? 'rgb(var(--warning))' : 'rgb(var(--danger))'
                                                }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* AI-Generated Warning */}
                        {report.ai_generated_likelihood > 50 && (
                            <div className="flex items-center gap-2 p-3 bg-warning/10 border border-warning/20 rounded-xl text-xs font-bold text-warning">
                                <AlertTriangle className="w-4 h-4 shrink-0" />
                                ⚠️ Likely AI-generated image ({report.ai_generated_likelihood}%)
                            </div>
                        )}
                    </div>
                )}

                {/* SLA / Time Tracker */}
                {report.status !== 'REJECTED' && (
                    <div className="glass-card p-5 animate-fade-in-up delay-300" style={{ opacity: 0 }}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                    daysPending > 7 ? 'bg-danger/10' : daysPending > 3 ? 'bg-warning/10' : 'bg-success/10'
                                }`}>
                                    <Timer className={`w-5 h-5 ${
                                        daysPending > 7 ? 'text-danger' : daysPending > 3 ? 'text-warning' : 'text-success'
                                    }`} />
                                </div>
                                <div>
                                    <p className="font-bold text-sm">
                                        {report.status === 'RESOLVED'
                                            ? `Resolved in ${daysPending} day${daysPending !== 1 ? 's' : ''}`
                                            : `Pending for ${daysPending} day${daysPending !== 1 ? 's' : ''}`
                                        }
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {daysPending > 7 && report.status !== 'RESOLVED' ? '⚠️ Exceeds expected SLA' : 'Tracking active'}
                                    </p>
                                </div>
                            </div>
                            <span className={`font-black text-2xl ${statusColor}`}>
                                {daysPending}d
                            </span>
                        </div>
                    </div>
                )}

                {/* Status Timeline */}
                {report.status !== 'REJECTED' && (
                    <div className="glass-card p-6 space-y-4 animate-fade-in-up delay-400" style={{ opacity: 0 }}>
                        <div className="section-label">Status Timeline</div>
                        <StatusTimeline report={report} />
                    </div>
                )}

                {/* Evidence Strength */}
                {report.status !== 'REJECTED' && (
                    <div className="animate-fade-in-up delay-500" style={{ opacity: 0 }}>
                        <EvidenceStrength
                            confidenceScore={report.confidence_score}
                            aiGeneratedLikelihood={report.ai_generated_likelihood}
                            confirmCount={report.confirm_count || 0}
                            rejectCount={report.reject_count || 0}
                            verificationStatus={report.verification_status}
                        />
                    </div>
                )}

                {/* Community Vote — non-rejected reports only */}
                {report.status !== 'REJECTED' && (
                    <div className="animate-fade-in-up delay-600" style={{ opacity: 0 }}>
                        <CommunityVote reportId={report.tracking_id} />
                    </div>
                )}

                <div className="space-y-12 animate-fade-in-up delay-700" style={{ opacity: 0 }}>
                    {report.status === 'REJECTED' ? (
                        <div className="bg-danger/5 border border-danger/20 rounded-3xl p-8 space-y-4">
                            <div className="flex items-center gap-3 text-danger">
                                <ShieldAlert className="w-6 h-6 font-bold" />
                                <h3 className="text-lg font-black uppercase tracking-wider">
                                    {report.rejection_title || 'Submission Rejected'}
                                </h3>
                            </div>
                            <p className="text-danger/70 leading-relaxed font-medium">
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

                {/* Share */}
                <div className="animate-fade-in-up delay-800 pt-4" style={{ opacity: 0 }}>
                    <ShareDirect
                        trackingId={report.tracking_id}
                        issueType={report.issue_type}
                        priority={report.priority}
                    />
                </div>

                <footer className="pt-10 border-t border-border flex flex-col items-center gap-4">
                    <div className="text-center space-y-1">
                        <p className="section-label">Secure Verification ID</p>
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
