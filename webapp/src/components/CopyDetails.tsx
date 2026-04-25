'use client';
import { Copy, Check } from 'lucide-react';
import { useState } from 'react';

export default function CopyDetails({ textToCopy }: { textToCopy: string }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(textToCopy);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (e) {
            console.error('Failed to copy', e);
        }
    }

    return (
        <button onClick={handleCopy} className="flex items-center gap-2 p-3 bg-secondary border border-border rounded-lg text-sm font-bold text-foreground hover:bg-muted transition-colors w-full justify-center shadow-sm">
            {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
            {copied ? <span className="text-green-700">Copied to Clipboard!</span> : 'Copy Formatted Details'}
        </button>
    );
}
