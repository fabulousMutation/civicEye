'use client';
import { MessageSquare, Mail } from 'lucide-react';

export default function ShareDirect({ summary, trackingLink, email }: { summary: string, trackingLink: string, email: string }) {
    
    const smsBody = encodeURIComponent(`Civic Alert: ${summary}. Track it here: ${trackingLink}`);
    const smsUrl = `sms:?body=${smsBody}`;
    
    const emailSubject = encodeURIComponent("Urgent Civic Issue Report");
    const emailUrl = `mailto:${email}?subject=${emailSubject}&body=${smsBody}`;

    return (
        <div className="flex gap-3 w-full mt-2">
            <a href={smsUrl} className="flex-1 flex items-center justify-center gap-2 p-3 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 font-bold transition-colors shadow-sm">
                <MessageSquare className="w-4 h-4" /> Native SMS
            </a>
            <a href={emailUrl} className="flex-1 flex items-center justify-center gap-2 p-3 bg-purple-50 text-purple-700 border border-purple-200 rounded-lg hover:bg-purple-100 font-bold transition-colors shadow-sm">
                <Mail className="w-4 h-4" /> Native Email
            </a>
        </div>
    );
}
