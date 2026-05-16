'use client';

import { useState } from 'react';
import { Share2, Copy, Check, MessageCircle, ExternalLink } from 'lucide-react';

type Props = {
  trackingId: string;
  issueType?: string;
  priority?: string;
};

export default function ShareDirect({ trackingId, issueType, priority }: Props) {
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);

  const url = typeof window !== 'undefined'
    ? `${window.location.origin}/track/${trackingId}`
    : `/track/${trackingId}`;

  const text = `🚨 Civic Issue Reported: ${issueType || 'Unknown'} (${priority || 'Unknown'} Priority)\nTrack it on CivicEye: ${url}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* silent */ }
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await navigator.share({ title: `CivicEye: ${issueType}`, text, url });
      } catch { /* dismissed */ }
    } else {
      setOpen(!open);
    }
  };

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
  const twitterUrl  = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;

  return (
    <div className="space-y-3">
      {/* Primary share button */}
      <button
        id="share-btn"
        onClick={handleNativeShare}
        className="w-full h-12 flex items-center justify-center gap-2 bg-secondary border border-border rounded-2xl font-bold text-sm text-foreground hover:border-primary/30 hover:bg-muted transition-all"
      >
        <Share2 className="w-4 h-4 text-primary" /> Share This Report
      </button>

      {/* Fallback panel (shown when Web Share API unavailable) */}
      {open && (
        <div className="glass-card p-4 space-y-3 animate-scale-in">
          <p className="section-label">Share via</p>
          <div className="grid grid-cols-3 gap-2">
            {/* WhatsApp */}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-1.5 p-3 bg-[#25D366]/10 border border-[#25D366]/20 rounded-2xl hover:bg-[#25D366]/20 transition-all"
            >
              <MessageCircle className="w-5 h-5 text-[#25D366]" />
              <span className="text-[10px] font-black text-[#25D366]">WhatsApp</span>
            </a>

            {/* Twitter/X */}
            <a
              href={twitterUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-1.5 p-3 bg-foreground/5 border border-border rounded-2xl hover:bg-foreground/10 transition-all"
            >
              <ExternalLink className="w-5 h-5 text-foreground" />
              <span className="text-[10px] font-black text-foreground">Twitter / X</span>
            </a>

            {/* Copy Link */}
            <button
              onClick={handleCopy}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border transition-all ${
                copied
                  ? 'bg-success/10 border-success/20'
                  : 'bg-primary/10 border-primary/20 hover:bg-primary/20'
              }`}
            >
              {copied
                ? <Check className="w-5 h-5 text-success" />
                : <Copy className="w-5 h-5 text-primary" />
              }
              <span className={`text-[10px] font-black ${copied ? 'text-success' : 'text-primary'}`}>
                {copied ? 'Copied!' : 'Copy Link'}
              </span>
            </button>
          </div>

          {/* Link preview */}
          <div className="flex items-center gap-2 p-3 bg-secondary rounded-xl border border-border">
            <span className="text-xs text-muted-foreground truncate flex-1 font-mono">{url}</span>
            <button onClick={handleCopy} className="shrink-0 text-primary hover:text-primary/70 transition-colors">
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      )}

      {/* Inline copy (always visible) */}
      {!open && (
        <button
          onClick={handleCopy}
          className={`w-full h-10 flex items-center justify-center gap-2 rounded-xl border text-xs font-bold transition-all ${
            copied
              ? 'bg-success/10 border-success/20 text-success'
              : 'bg-secondary border-border text-muted-foreground hover:text-foreground hover:border-primary/20'
          }`}
        >
          {copied ? <><Check className="w-3.5 h-3.5" /> Link Copied!</> : <><Copy className="w-3.5 h-3.5" /> Copy Report Link</>}
        </button>
      )}
    </div>
  );
}
