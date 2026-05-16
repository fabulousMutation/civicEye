'use client';

import MediaCapture from '@/components/MediaCapture';
import DuplicateWarning from '@/components/DuplicateWarning';
import ShareDirect from '@/components/ShareDirect';
import { useState } from 'react';
import { Loader2, CheckCircle2, Navigation, Mail, AlertTriangle, Brain, Shield, MapPin, Clock, ArrowRight, Camera, Sparkles } from 'lucide-react';

type SubmissionStep = 'idle' | 'uploading' | 'analyzing' | 'classifying' | 'routing' | 'done';

const STEP_CONFIG: Record<string, { icon: typeof Loader2; title: string; subtitle: string }> = {
    uploading: { icon: Loader2, title: "Uploading Evidence...", subtitle: "Securely transferring your image to the cloud." },
    analyzing: { icon: Brain, title: "AI Analyzing Evidence...", subtitle: "Extracting metadata, identifying issue characteristics." },
    classifying: { icon: Shield, title: "Classifying Severity...", subtitle: "Determining priority level and issue category." },
    routing: { icon: Navigation, title: "Finding Local Authority...", subtitle: "Matching the right department for your area." },
};

export default function ReportPage() {
    const [step, setStep] = useState<SubmissionStep>('idle');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [result, setResult] = useState<any>(null);

    const handleMediaCaptured = async (data: { imageUrl: string, location: {lat: number, lng: number}, timestamp: string }) => {
        try {
            // Step 1: Uploading (already done by MediaCapture, but show brief state)
            setStep('uploading');
            await new Promise(r => setTimeout(r, 600));

            // Step 2: AI Analysis
            setStep('analyzing');
            const response = await fetch('/api/classify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    imageUrl: data.imageUrl,
                    location: data.location,
                    timestamp: data.timestamp
                }),
            });

            const aiData = await response.json();
            if(!response.ok) throw new Error(aiData.error || "AI Classification failed.");

            // Step 3: Check rejection
            if (aiData.is_rejected) {
                setStep('done');
                setResult({
                    is_rejected: true,
                    rejection_title: aiData.classification?.rejection_title || "Submission Rejected",
                    rejection_reason: aiData.classification?.rejection_reason || "This is not a valid civic issue.",
                    tracing_id: aiData.tracing_id || aiData.report?.tracking_id
                });
                return;
            }

            // Step 4: Routing
            setStep('routing');
            const authResponse = await fetch('/api/authority', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    reportId: aiData.tracing_id || aiData.report?.tracking_id,
                    lat: data.location.lat,
                    lng: data.location.lng,
                    issueType: aiData.classification?.issue_type || "civic issue"
                })
            });

            let authData = null;
            if (authResponse.ok) {
                authData = await authResponse.json();
            }

            setStep('done');
            setResult({
                ...aiData,
                contact: authData?.contact,
                location: data.location
            });

        } catch (error) {
            console.error(error);
            setStep('idle');
            alert("Error during classification: " + error);
        }
    };

    const isProcessing = step !== 'idle' && step !== 'done';
    const currentStepConfig = STEP_CONFIG[step];

    return (
        <main className="min-h-screen bg-background py-12 px-4 sm:px-6 relative">
            <div className="max-w-3xl mx-auto space-y-8 relative z-10">
                {/* Header */}
                {step === 'idle' && (
                    <div className="text-center animate-fade-in-up">
                        <div className="section-label mb-3">New Report</div>
                        <h1 className="text-4xl font-black text-foreground tracking-tight">Report a Civic Issue</h1>
                        <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
                            Capture the evidence and our Vision AI will automatically classify, prioritize, and route it.
                        </p>
                    </div>
                )}

                {/* Media Capture (initial state) */}
                {step === 'idle' && !result && (
                    <MediaCapture onMediaCaptured={handleMediaCaptured} />
                )}

                {/* ===== SUCCESS: Premium Confirmation Card ===== */}
                {result && !result.is_rejected && (
                    <div className="animate-scale-in max-w-lg mx-auto space-y-6">
                        {/* Success Header */}
                        <div className="text-center space-y-4 pt-4">
                            <div className="relative w-20 h-20 mx-auto">
                                <div className="absolute inset-0 bg-success/20 rounded-full animate-ping" style={{ animationDuration: '1.5s' }} />
                                <div className="relative w-20 h-20 bg-success/10 rounded-full flex items-center justify-center border-2 border-success/30">
                                    <CheckCircle2 className="w-10 h-10 text-success" />
                                </div>
                            </div>
                            <div>
                                <h2 className="text-2xl font-black tracking-tight">Report Submitted Successfully</h2>
                                <p className="text-muted-foreground text-sm mt-1">Your issue has been logged and is under verification.</p>
                            </div>
                        </div>

                        {/* Duplicate Warning (if nearby reports exist) */}
                        {result.duplicates && result.duplicates.length > 0 && (
                            <DuplicateWarning
                                duplicates={result.duplicates}
                                onDismiss={() => setResult((r: typeof result) => ({ ...r, duplicates: [] }))}
                            />
                        )}

                        {/* AI Detection Badge */}
                        <div className="glass-card p-5 space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center">
                                    <Brain className="w-5 h-5 text-accent" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-sm">Detected: {result.classification?.issue_type || result.issue_type}</span>
                                        <span className="badge badge-accent">AI</span>
                                    </div>
                                    {result.classification?.confidence_score && (
                                        <div className="flex items-center gap-2 mt-1.5">
                                            <span className="text-xs text-muted-foreground font-medium">
                                                Confidence: {result.classification.confidence_score}%
                                            </span>
                                            <div className="confidence-meter flex-1 max-w-[120px]">
                                                <div
                                                    className="confidence-meter-fill"
                                                    style={{
                                                        width: `${result.classification.confidence_score}%`,
                                                        backgroundColor: result.classification.confidence_score > 70 ? 'rgb(var(--success))' :
                                                            result.classification.confidence_score > 40 ? 'rgb(var(--warning))' : 'rgb(var(--danger))'
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* AI-Generated Image Warning */}
                            {result.classification?.ai_generated_likelihood > 50 && (
                                <div className="flex items-center gap-2 p-3 bg-warning/10 border border-warning/20 rounded-xl text-xs font-bold text-warning">
                                    <AlertTriangle className="w-4 h-4 shrink-0" />
                                    ⚠️ Likely AI-generated image ({result.classification.ai_generated_likelihood}%)
                                </div>
                            )}
                        </div>

                        {/* Issue Summary */}
                        <div className="glass-card p-5 space-y-3">
                            <div className="section-label">Issue Summary</div>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Tracking ID</span>
                                    <span className="font-mono font-bold text-primary text-sm">{result.tracing_id || result.tracking_id || result.report?.tracking_id}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Classification</span>
                                    <span className="font-bold text-sm">{result.classification?.issue_type || result.issue_type}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Priority</span>
                                    <PriorityBadge priority={result.classification?.priority || result.priority} />
                                </div>
                                {result.classification?.text_summary && (
                                    <div className="pt-2 border-t border-border">
                                        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                                            {result.classification.text_summary}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Map Preview */}
                        {result.location && (
                            <div className="glass-card p-5 space-y-3">
                                <div className="section-label flex items-center gap-2">
                                    <MapPin className="w-3 h-3" /> Location Tagged
                                </div>
                                <div className="aspect-[2/1] rounded-2xl overflow-hidden border border-border bg-muted">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={`https://maps.googleapis.com/maps/api/staticmap?center=${result.location.lat},${result.location.lng}&zoom=16&size=600x300&markers=color:blue%7C${result.location.lat},${result.location.lng}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || ''}`}
                                        alt="Location preview"
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            // Fallback: show coordinates if Google Maps static API fails
                                            const target = e.target as HTMLImageElement;
                                            target.style.display = 'none';
                                            target.parentElement!.innerHTML = `
                                                <div class="w-full h-full flex flex-col items-center justify-center bg-secondary text-center p-6">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-primary mb-3"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                                                    <p class="font-bold text-sm">${result.location.lat.toFixed(5)}, ${result.location.lng.toFixed(5)}</p>
                                                    <p class="text-xs text-muted-foreground mt-1">GPS Coordinates Tagged</p>
                                                </div>
                                            `;
                                        }}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Status & Notification */}
                        <div className="glass-card p-5 space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-warning/10 rounded-xl flex items-center justify-center">
                                    <Clock className="w-5 h-5 text-warning" />
                                </div>
                                <div>
                                    <span className="font-bold text-sm">Under Verification</span>
                                    <p className="text-xs text-muted-foreground">You&apos;ll be notified when your report is reviewed and routed.</p>
                                </div>
                            </div>
                        </div>

                        {/* Authority Contact (if available) */}
                        {result.contact && (
                            <div className="glass-card p-5 space-y-3">
                                <div className="section-label">Routed Authority</div>
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                                        <Mail className="w-5 h-5 text-primary" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-sm truncate">{result.contact.department}</p>
                                        <p className="text-xs text-muted-foreground truncate">{result.contact.email}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Share */}
                        <ShareDirect
                            trackingId={result.tracing_id || result.report?.tracking_id || result.tracking_id || ''}
                            issueType={result.classification?.issue_type || result.issue_type}
                            priority={result.classification?.priority || result.priority}
                        />

                        {/* Actions */}
                        <div className="space-y-3 pt-2">
                            <button
                                onClick={() => window.location.href = `/track/${result.tracing_id || result.report?.tracking_id || result.tracking_id}`}
                                className="primary-action w-full h-14 text-base font-bold"
                            >
                                Track Status Live <ArrowRight className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => { setResult(null); setStep('idle'); }}
                                className="w-full h-12 flex items-center justify-center gap-2 bg-secondary border border-border rounded-2xl font-bold text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                            >
                                <Camera className="w-4 h-4" /> Report Another Issue
                            </button>
                        </div>
                    </div>
                )}

                {/* ===== REJECTED: Styled Rejection Card ===== */}
                {result && result.is_rejected && (
                    <div className="animate-scale-in max-w-lg mx-auto space-y-6">
                        <div className="glass-card border-danger/20 p-8 text-center space-y-6">
                            <div className="w-16 h-16 bg-danger/10 text-danger rounded-full flex items-center justify-center mx-auto">
                                <AlertTriangle className="w-8 h-8" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-danger mb-3">{result.rejection_title || "Submission Rejected"}</h2>
                                <div className="bg-danger/5 text-danger/80 border border-danger/10 p-4 rounded-xl text-left font-medium text-sm leading-relaxed">
                                    {result.rejection_reason}
                                </div>
                            </div>
                            <p className="text-muted-foreground text-sm leading-relaxed">
                                Our AI gatekeeper determined this image does not depict a valid civic issue. This submission has been halted.
                            </p>
                            <button onClick={() => { setResult(null); setStep('idle'); }} className="primary-action w-full">
                                <Camera className="w-5 h-5" /> Take Another Photo
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* ===== STEPPED PROGRESS OVERLAY ===== */}
            {isProcessing && currentStepConfig && (
                <div className="fixed inset-0 z-50 bg-background/90 backdrop-blur-md flex flex-col items-center justify-center animate-fade-in">
                    {/* Spinner */}
                    <div className="relative w-28 h-28 flex items-center justify-center mb-8">
                        <div className="absolute inset-0 border-[3px] border-primary/10 rounded-full" />
                        <div className="absolute inset-0 border-[3px] border-primary rounded-full border-t-transparent animate-spin" style={{ animationDuration: '1s' }} />
                        <div className="absolute inset-2 border-[2px] border-accent/10 rounded-full" />
                        <div className="absolute inset-2 border-[2px] border-accent rounded-full border-b-transparent animate-spin" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }} />
                        <currentStepConfig.icon className="w-8 h-8 text-primary animate-pulse" />
                    </div>

                    {/* Title */}
                    <h2 className="text-2xl font-black text-foreground tracking-tight animate-fade-in-up">{currentStepConfig.title}</h2>
                    <p className="text-muted-foreground mt-2 font-medium text-sm animate-fade-in-up delay-100" style={{ opacity: 0 }}>
                        {currentStepConfig.subtitle}
                    </p>

                    {/* Step Progress */}
                    <div className="flex items-center gap-2 mt-8">
                        {Object.keys(STEP_CONFIG).map((s, i) => {
                            const stepKeys = Object.keys(STEP_CONFIG);
                            const currentIdx = stepKeys.indexOf(step);
                            const isActive = i <= currentIdx;
                            return (
                                <div key={s} className="flex items-center gap-2">
                                    <div className={`w-2.5 h-2.5 rounded-full transition-all duration-500 ${isActive ? 'bg-primary scale-110' : 'bg-border'}`} />
                                    {i < stepKeys.length - 1 && (
                                        <div className={`w-8 h-0.5 rounded-full transition-all duration-500 ${isActive ? 'bg-primary' : 'bg-border'}`} />
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Animated tip */}
                    <div className="mt-10 flex items-center gap-2 text-xs text-muted-foreground animate-breathe">
                        <Sparkles className="w-3.5 h-3.5" />
                        Powered by AI Vision
                    </div>
                </div>
            )}
        </main>
    );
}

function PriorityBadge({ priority }: { priority?: string }) {
    if (!priority || priority === 'NONE') return null;
    const cls = priority === 'High' ? 'badge-high' : priority === 'Medium' ? 'badge-medium' : 'badge-low';
    return <span className={`badge ${cls}`}>{priority}</span>;
}
