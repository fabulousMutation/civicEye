'use client';

import MediaCapture from '@/components/MediaCapture';
import { useState } from 'react';
import { Loader2, CheckCircle2, Navigation, Mail, AlertTriangle } from 'lucide-react';

export default function ReportPage() {
    const [analyzing, setAnalyzing] = useState(false);
    const [searching, setSearching] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [result, setResult] = useState<any>(null);

    const handleMediaCaptured = async (data: { imageUrl: string, location: {lat: number, lng: number}, timestamp: string }) => {
        console.log("Media Captured, advancing to AI Analysis:", data);
        setAnalyzing(true);
        
        try {
            // Task 3 Integration: Call Next.js Server API
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
            
            setAnalyzing(false);

            if (aiData.is_rejected) {
                setResult({
                    is_rejected: true,
                    rejection_reason: aiData.classification?.rejection_reason || "This is not a valid civic issue.",
                    tracing_id: aiData.tracing_id || aiData.report?.tracking_id
                });
                return;
            }

            setSearching(true);
            
            // Advance to searching for the required authority
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
            
            setResult({
                ...aiData,
                contact: authData?.contact
            });

        } catch (error) {
            console.error(error);
            alert("Error during classification: " + error);
        } finally {
            setAnalyzing(false);
            setSearching(false);
        }
    };

    return (
        <main className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 relative">
            <div className="max-w-3xl mx-auto space-y-8 relative z-10">
                <div className="text-center">
                    <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Report a Civic Issue</h1>
                    <p className="mt-3 text-lg text-gray-500 max-w-xl mx-auto">Capture the evidence and our advanced Vision AI will automatically extract context, assign priority, and route it to the proper authority.</p>
                </div>

                {!analyzing && !searching && !result && (
                    <MediaCapture onMediaCaptured={handleMediaCaptured} />
                )}

                {result && !result.is_rejected && (
                    <div className="bg-white p-8 rounded-2xl shadow-xl max-w-lg mx-auto border text-center animate-in fade-in zoom-in duration-500">
                        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle2 className="w-8 h-8" />
                        </div>
                        <h2 className="text-2xl font-bold mb-2">Report Submitted & Routed</h2>
                        <p className="text-gray-600 mb-6">Your issue has been logged securely and assigned an authority.</p>
                        
                        <div className="bg-gray-50 rounded-xl p-4 text-left space-y-3 mb-6">
                            <p><strong>Tracking ID:</strong> <span className="font-mono text-blue-600">{result.tracing_id || result.tracking_id || result.report?.tracking_id}</span></p>
                            <p><strong>AI Classification:</strong> {result.classification?.issue_type || result.issue_type}</p>
                            <p><strong>Priority assigned:</strong> {result.classification?.priority || result.priority}</p>
                            <p className="line-clamp-2"><strong>Summary:</strong> {result.classification?.text_summary || result.text_summary}</p>
                            
                            {result.contact && (
                                <div className="mt-4 pt-4 border-t border-gray-200">
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Routed Authority Contact</p>
                                    <p className="font-bold text-gray-900">{result.contact.department}</p>
                                    <p className="text-sm text-gray-600">{result.contact.email}</p>
                                    <div className="flex gap-2 mt-4">
                                        <a href={`mailto:${result.contact.email}?subject=Civic Report: ${result.classification?.issue_type}&body=Tracking ID: ${result.tracing_id || result.report?.tracking_id}%0A%0A${result.classification?.text_summary}`} className="flex-1 inline-flex justify-center items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition">
                                            <Mail className="w-4 h-4 mr-2" /> Email Directly
                                        </a>
                                    </div>
                                </div>
                            )}
                        </div>
                        
                        <button onClick={() => window.location.href = `/track/${result.tracing_id || result.report?.tracking_id || result.tracking_id}`} className="w-full bg-gray-900 text-white py-3 rounded-xl font-bold hover:bg-gray-800 transition-colors">
                            Track Status Live
                        </button>
                    </div>
                )}

                {result && result.is_rejected && (
                    <div className="bg-white p-8 rounded-2xl shadow-xl max-w-lg mx-auto border border-red-200 text-center animate-in fade-in zoom-in duration-500">
                        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                            <AlertTriangle className="w-8 h-8" />
                        </div>
                        <h2 className="text-2xl font-bold text-red-600 mb-3">Submission Rejected</h2>
                        
                        <div className="bg-red-50 text-red-900 border border-red-200 p-4 rounded-xl text-left mb-6 font-medium">
                            {result.rejection_reason}
                        </div>
                        
                        <p className="text-gray-500 text-sm mb-6 leading-relaxed">
                            Our AI gatekeeper determined this image does not depict a valid, physical civic issue. This submission has been halted and will not be routed to authorities.
                        </p>

                        <button onClick={() => window.location.reload()} className="w-full bg-gray-900 text-white py-3 rounded-xl font-bold hover:bg-gray-800 transition-colors">
                            Take Another Photo
                        </button>
                    </div>
                )}
            </div>

            {/* AI Global Loading State */}
            {analyzing && (
                <div className="fixed inset-0 z-50 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center">
                    <div className="relative w-24 h-24 flex items-center justify-center mb-6">
                        <div className="absolute inset-0 border-4 border-blue-100 rounded-full"></div>
                        <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
                        <Loader2 className="w-8 h-8 text-blue-600 animate-pulse" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">AI Analyzing Evidence...</h2>
                    <p className="text-gray-500 mt-2 font-medium">Extracting metadata, classifying severity, and mapping context.</p>
                </div>
            )}

            {/* Search Authority Loading State */}
            {searching && (
                <div className="fixed inset-0 z-50 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center">
                    <div className="relative w-24 h-24 flex items-center justify-center mb-6">
                        <div className="absolute inset-0 border-4 border-indigo-100 rounded-full"></div>
                        <div className="absolute inset-0 border-4 border-indigo-600 rounded-full border-b-transparent animate-spin"></div>
                        <Navigation className="w-8 h-8 text-indigo-600 animate-pulse" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Finding Local Authority...</h2>
                    <p className="text-gray-500 mt-2 font-medium">Scraping directory for correct civic department match.</p>
                </div>
            )}
        </main>
    )
}
