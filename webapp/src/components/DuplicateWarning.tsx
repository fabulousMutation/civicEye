/* eslint-disable @next/next/no-img-element */
'use client';

import Link from 'next/link';
import { AlertTriangle, ArrowRight, ThumbsUp, X } from 'lucide-react';
import { useState } from 'react';

type DuplicateReport = {
  tracking_id: string;
  issue_type: string;
  priority: string;
  status: string;
  address?: string;
  image_url?: string;
  created_at: string;
};

type Props = {
  duplicates: DuplicateReport[];
  onDismiss: () => void;
};

export default function DuplicateWarning({ duplicates, onDismiss }: Props) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || duplicates.length === 0) return null;

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss();
  };

  return (
    <div className="glass-card border-warning/30 p-5 space-y-4 animate-slide-in-right">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-warning/10 rounded-xl flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-warning" />
          </div>
          <div>
            <p className="font-black text-sm">Similar Issue Detected</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {duplicates.length} nearby report{duplicates.length !== 1 ? 's' : ''} may already cover this issue
            </p>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-secondary transition-colors text-muted-foreground"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Duplicate list */}
      <div className="space-y-2">
        {duplicates.slice(0, 2).map((dup) => (
          <div key={dup.tracking_id} className="flex items-center gap-3 p-3 bg-secondary rounded-2xl border border-border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {dup.image_url && (
              <img src={dup.image_url} alt="" className="w-10 h-10 rounded-xl object-cover shrink-0 border border-border" />
            )}
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm truncate">{dup.issue_type}</p>
              <p className="text-[10px] text-muted-foreground">
                {dup.status?.replace('_', ' ')} · {new Date(dup.created_at).toLocaleDateString()}
              </p>
            </div>
            <Link
              href={`/track/${dup.tracking_id}`}
              className="shrink-0 flex items-center gap-1 text-[10px] font-black text-primary hover:underline"
            >
              View <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <Link
          href={`/track/${duplicates[0].tracking_id}`}
          className="flex-1 h-10 flex items-center justify-center gap-1.5 bg-primary/10 text-primary border border-primary/20 rounded-xl text-xs font-bold hover:bg-primary/20 transition-all"
        >
          <ThumbsUp className="w-3.5 h-3.5" /> Upvote Existing
        </Link>
        <button
          onClick={handleDismiss}
          className="flex-1 h-10 flex items-center justify-center gap-1.5 bg-secondary border border-border rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
        >
          Continue Anyway
        </button>
      </div>
    </div>
  );
}
