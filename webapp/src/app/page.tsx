import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';

export const revalidate = 0; // Dynamic rendering per request

export default async function Dashboard() {
    // Note: since this is a demo, we fetch all reports bridging out RLS policies implicitly
    const { data: reports, error } = await supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error(error);
        return <div className="p-8 text-red-500 font-bold flex flex-col items-center justify-center min-h-[50vh]">
            <h2 className="text-2xl">Database Connection Error</h2>
            <p>Ensure your Supabase project keys are set locally in .env.local and the table schema exists.</p>
        </div>;
    }

    return (
        <main className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header Banner */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-8 rounded-2xl shadow-sm border gap-4">
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Authority Dashboard & Live Feed</h1>
                        <p className="mt-2 text-gray-500 text-lg">Live tracker of AI-classified incident reports across the municipality.</p>
                    </div>
                    <Link href="/report" className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-xl font-bold hover:shadow-lg transition-all hover:scale-105 shrink-0">
                        + New Issue Report
                    </Link>
                </div>

                {/* Dashboard Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {reports?.map((report) => (
                        <div key={report.id} className="bg-white rounded-2xl shadow-sm border overflow-hidden hover:shadow-lg transition-all hover:-translate-y-1 flex flex-col group">
                            {/* Card Image */}
                            <div className="relative w-full h-48 overflow-hidden bg-gray-100 border-b">
                                {report.image_url ? (
                                    <img src={report.image_url} alt="Evidence" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400 font-medium">No Image Uploaded</div>
                                )}
                                
                                {/* Priority Badge Absolute */}
                                <div className="absolute top-3 right-3">
                                    <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm ${
                                        report.priority?.toLowerCase() === 'high' || report.priority?.toLowerCase() === 'critical' 
                                            ? 'bg-red-500 text-white' 
                                            : report.priority?.toLowerCase() === 'medium' 
                                                ? 'bg-orange-500 text-white' 
                                                : 'bg-green-500 text-white'
                                    }`}>
                                        {report.priority || "LOW"} PRIORITY
                                    </span>
                                </div>
                            </div>
                            
                            {/* Card Content */}
                            <div className="p-6 flex-1 flex flex-col">
                                <h3 className="font-bold text-xl leading-tight line-clamp-1 mb-2 text-gray-900">{report.issue_type}</h3>
                                
                                <p className="text-sm text-gray-600 mb-6 line-clamp-2 flex-1">{report.text_summary}</p>
                                
                                <div className="space-y-3 mt-auto text-sm">
                                    <div className="flex items-center justify-between border-t border-gray-100 pt-4">
                                        <span className="text-gray-500 font-medium">Current Status:</span>
                                        <span className="font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-lg">{report.status}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-gray-500 pb-3">
                                        <span className="font-medium">Tracking ID:</span>
                                        <span className="font-mono font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded">{report.tracking_id}</span>
                                    </div>

                                    {/* Action Button */}
                                    <Link href={`/track/${report.tracking_id}`} className="block w-full text-center bg-gray-50 border hover:bg-gray-100 hover:border-gray-300 text-gray-800 font-bold py-3 rounded-xl transition-colors mt-2">
                                        Inspect Full Report
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Empty State */}
                    {(!reports || reports.length === 0) && (
                         <div className="col-span-full py-24 text-center">
                            <h3 className="text-2xl font-bold text-gray-400 mb-2">No Reports Found</h3>
                            <p className="text-gray-500">The database is currently empty. Reports submitted will appear here.</p>
                         </div>
                    )}
                </div>
            </div>
        </main>
    )
}
