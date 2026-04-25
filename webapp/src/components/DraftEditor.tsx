'use client';

import { useState } from 'react';
import { UserCheck, Mail, Plus, Send, Loader2, Image as ImageIcon } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

export default function DraftEditor({ report, authorityDept, authorityEmail }: { report: { tracking_id?: string; text_summary?: string; status?: string; [key: string]: unknown }, authorityDept: string, authorityEmail: string }) {
    const [summary, setSummary] = useState((report.text_summary as string) || '');
    const [files, setFiles] = useState<File[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [status, setStatus] = useState(report.status);

    const isPending = status === 'PENDING_REVIEW';
    const hasBeenSent = status === 'AUTHORITY_NOTIFIED' || status === 'Authority Esculated';

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFiles(prev => [...prev, ...Array.from(e.target.files!)]);
        }
    };

    const handleSend = async () => {
        if (!summary) return;
        setIsSubmitting(true);
        try {
            const uploadPromises = files.map(async (file) => {
                const fileExt = file.name.split('.').pop();
                const fileName = `${report.tracking_id}_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
                const { error } = await supabase.storage.from('evidence').upload(fileName, file);
                if (error) throw error;
                const { data: publicData } = supabase.storage.from('evidence').getPublicUrl(fileName);
                return publicData.publicUrl;
            });
            
            const uploadedUrls = await Promise.all(uploadPromises);

            const res = await fetch('/api/authority', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    reportId: report.tracking_id,
                    text_summary: summary,
                    additional_images: uploadedUrls
                })
            });

            if (!res.ok) throw new Error('API failed');

            setStatus('AUTHORITY_NOTIFIED');
            setFiles([]);
        } catch (err) {
            console.error(err);
            alert('Transmission failed. Check connection.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-12">
            {/* Draft Section */}
            <div className="space-y-4">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Report Summary</h3>
                <div className={`${isPending ? 'bg-secondary' : 'bg-secondary/30'} rounded-3xl p-6 transition-all`}>
                    {isPending ? (
                        <textarea 
                            className="w-full text-lg leading-relaxed font-medium bg-transparent border-none focus:ring-0 p-0 min-h-[160px] resize-none placeholder:text-muted-foreground/50"
                            value={summary}
                            onChange={(e) => setSummary(e.target.value)}
                            placeholder="Describe the issue in detail..."
                        />
                    ) : (
                        <p className="text-lg leading-relaxed font-medium text-foreground">
                            {summary}
                        </p>
                    )}
                </div>
            </div>

            {/* Evidence Gallery */}
            {isPending && (
                <div className="space-y-4">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Additional Evidence</h3>
                    <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x">
                        <label className="flex-shrink-0 w-32 h-32 flex flex-col items-center justify-center border-2 border-dashed border-border rounded-3xl cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all text-muted-foreground snap-start">
                            <Plus className="w-6 h-6 mb-2" />
                            <span className="text-[10px] font-bold">ADD PHOTO</span>
                            <input type="file" multiple accept="image/*" className="hidden" onChange={handleFileChange} />
                        </label>
                        
                        {files.map((file, i) => (
                            <div key={i} className="flex-shrink-0 w-32 h-32 rounded-3xl bg-secondary border border-border flex items-center justify-center relative snap-start">
                                <ImageIcon className="w-6 h-6 text-muted-foreground opacity-30" />
                                <div className="absolute bottom-2 left-2 right-2 truncate text-[8px] font-black uppercase text-muted-foreground">{file.name}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Authority Card */}
            <div className="space-y-4">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Routing Information</h3>
                <div className="flex items-center gap-5 p-6 bg-secondary border border-border rounded-3xl shadow-sm">
                    <div className="w-14 h-14 bg-secondary rounded-2xl flex items-center justify-center">
                        <UserCheck className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="font-extrabold text-foreground truncate">{authorityDept}</p>
                        <p className="text-xs font-bold text-muted-foreground">{authorityEmail}</p>
                    </div>
                    {hasBeenSent && authorityEmail !== 'N/A' && (
                        <a href={`mailto:${authorityEmail}`} className="w-10 h-10 flex items-center justify-center bg-primary/10 rounded-full text-primary">
                            <Mail className="w-4 h-4" />
                        </a>
                    )}
                </div>
            </div>

            {/* Submission Logic */}
            {isPending && (
                <button
                    onClick={handleSend}
                    disabled={isSubmitting || !summary.trim()}
                    className="primary-action w-full h-16 text-lg disabled:opacity-50 disabled:grayscale transition-all mt-4"
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="w-6 h-6 animate-spin" /> TRANSMITTING...
                        </>
                    ) : (
                        <>
                            <Send className="w-5 h-5" /> SEND TO AUTHORITY
                        </>
                    )}
                </button>
            )}
        </div>
    );
}

