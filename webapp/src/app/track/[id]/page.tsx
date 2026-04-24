import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import CopyDetails from '@/components/CopyDetails';
import { ArrowLeft, Clock, MapPin, AlertTriangle, UserCheck, Mail } from 'lucide-react';

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
            <main className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center p-8 bg-white rounded-2xl shadow-xl max-w-sm w-full border">
                    <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Report Not Found</h1>
                    <p className="text-gray-500 mb-6">Tracking ID <span className="font-mono text-gray-800 bg-gray-100 px-2 py-1 rounded">{id}</span> does not exist or has been removed.</p>
                    <Link href="/" className="bg-gray-900 text-white px-6 py-3 rounded-xl font-bold block w-full hover:bg-gray-800 transition-colors">Return to Dashboard</Link>
                </div>
            </main>
        );
    }

    const reportTextDetail = `CIVIC REPORT: ${report.tracking_id}\nStatus: ${report.status}\nPriority: ${report.priority}\nType: ${report.issue_type}\nDesc: ${report.text_summary}`;
    
    const authorityEmail = report.authority_contact_info?.email || 'N/A';
    const authorityDept = report.authority_contact_info?.department || 'Awaiting Routing';

    return (
        <main className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6">
            <div className="max-w-4xl mx-auto space-y-6">
                
                <Link href="/" className="inline-flex items-center text-gray-600 hover:text-blue-600 font-medium transition-colors bg-white px-4 py-2 rounded-lg border shadow-sm">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
                </Link>
                
                <div className="bg-white rounded-2xl shadow-sm border p-6 md:p-10">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-10 pb-8 border-b">
                        <div>
                            <div className="flex items-center gap-3 mb-3">
                                <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">{report.issue_type}</h1>
                                {report.tags?.slice(0,2).map((tag: string, i: number) => (
                                    <span key={i} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-bold rounded-md uppercase hidden sm:inline-block border">{tag}</span>
                                ))}
                            </div>
                            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                                <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {new Date(report.geotag_timestamp || report.created_at).toLocaleString()}</span>
                                <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> Location Tagged ({report.location_lat?.toFixed(2) || 'N/A'}, {report.location_lng?.toFixed(2) || 'N/A'})</span>
                            </div>
                        </div>
                        <div className="text-left md:text-right shrink-0 bg-gray-50 p-4 rounded-xl border">
                            <span className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Secure Tracking ID</span>
                            <span className="font-mono text-xl font-bold text-blue-700">{report.tracking_id}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-8">
                        {report.image_url ? (
                            <div className="rounded-2xl overflow-hidden border shadow-sm bg-gray-100 aspect-square lg:aspect-auto">
                                <img src={report.image_url} alt="Incident Evidence" className="w-full h-full object-cover" />
                            </div>
                        ) : (
                            <div className="rounded-2xl border-2 border-dashed bg-gray-50 flex flex-col items-center justify-center text-gray-400 font-medium aspect-square lg:aspect-auto">
                                <AlertTriangle className="w-8 h-8 mb-2 opacity-50" />
                                No Visual Evidence Available
                            </div>
                        )}

                        <div className="space-y-8">
                            <div>
                                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Priority Level</h3>
                                <span className={`inline-flex px-6 py-2 rounded-full text-sm font-bold uppercase tracking-wider shadow-sm border ${
                                    report.priority?.toLowerCase() === 'high' || report.priority?.toLowerCase() === 'critical' ? 'bg-red-50 text-red-700 border-red-200' : report.priority?.toLowerCase() === 'medium' ? 'bg-orange-50 text-orange-700 border-orange-200' : 'bg-green-50 text-green-700 border-green-200'
                                }`}>
                                    <div className={`w-2 h-2 rounded-full mr-2.5 my-auto ${
                                        report.priority?.toLowerCase() === 'high' || report.priority?.toLowerCase() === 'critical' ? 'bg-red-500 animate-pulse' : report.priority?.toLowerCase() === 'medium' ? 'bg-orange-500' : 'bg-green-500'
                                    }`}></div>
                                    {report.priority || "LOW"} PRIORITY
                                </span>
                            </div>

                            <div>
                                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">AI Vision Summary</h3>
                                <p className="text-gray-800 leading-relaxed bg-blue-50/50 p-5 rounded-xl border border-blue-100">{report.text_summary}</p>
                            </div>
                            
                            <div>
                                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Routed Authority</h3>
                                <div className="flex items-start gap-4 bg-gray-50 p-5 rounded-xl border">
                                    <div className="bg-white p-2 rounded-lg border shadow-sm shrink-0">
                                        <UserCheck className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-bold text-gray-900">{authorityDept}</p>
                                        <p className="text-sm text-gray-600 mt-1">{authorityEmail}</p>
                                        {authorityEmail !== 'N/A' && (
                                            <a href={`mailto:${authorityEmail}?subject=Civic Report Tracking: ${report.tracking_id}&body=Hello,%0A%0AI am following up on a civic issue report. Tracking ID: ${report.tracking_id}%0A%0ADescription: ${report.text_summary}`} className="mt-3 inline-flex items-center text-sm font-bold border border-blue-200 bg-white px-3 py-1.5 rounded-lg text-blue-600 hover:text-blue-800 hover:bg-blue-50 transition-colors">
                                                <Mail className="w-4 h-4 mr-1.5" /> Email Department
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-gray-100 pt-8 bg-gray-50 -mx-6 md:-mx-10 -mb-6 md:-mb-10 p-6 md:p-10 rounded-b-2xl">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">Sharing & Amplification</h3>
                        <p className="text-sm text-gray-500 mb-6 max-w-xl">Amplify this issue directly to community forums or notify authorities over out-of-band communication layers securely.</p>
                        
                        <div className="grid grid-cols-1 gap-6 w-full max-w-md">
                            <CopyDetails textToCopy={reportTextDetail} />
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
