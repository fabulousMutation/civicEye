'use client';

import { useState, useEffect, useCallback } from 'react';
import { ThumbsUp, ThumbsDown, BadgeCheck, AlertTriangle, Loader2 } from 'lucide-react';

type VoteState = {
  confirms: number;
  rejects: number;
  userVote: 'confirm' | 'reject' | null;
  verified: boolean;
};

const VERIFY_THRESHOLD = 5;

export default function CommunityVote({ reportId }: { reportId: string }) {
  const [state, setState] = useState<VoteState>({ confirms: 0, rejects: 0, userVote: null, verified: false });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const fetchVotes = useCallback(async () => {
    try {
      const res = await fetch(`/api/votes?report_id=${reportId}`);
      if (res.ok) {
        const data = await res.json();
        setState({
          confirms: data.confirms,
          rejects:  data.rejects,
          userVote: data.userVote,
          verified: data.confirms >= VERIFY_THRESHOLD,
        });
      }
    } catch { /* silent */ }
    setFetching(false);
  }, [reportId]);

  useEffect(() => { fetchVotes(); }, [fetchVotes]);

  const castVote = async (voteType: 'confirm' | 'reject') => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch('/api/votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ report_id: reportId, vote_type: voteType }),
      });
      if (res.ok) {
        const data = await res.json();
        setState({
          confirms: data.confirms,
          rejects:  data.rejects,
          userVote: voteType,
          verified: data.verified,
        });
      }
    } catch { /* silent */ }
    setLoading(false);
  };

  if (fetching) {
    return (
      <div className="glass-card p-5 flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const total = state.confirms + state.rejects;
  const confirmPct = total > 0 ? Math.round((state.confirms / total) * 100) : 0;

  return (
    <div className="glass-card p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="section-label">Community Validation</div>
        {state.verified && (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-success/10 border border-success/20 rounded-full">
            <BadgeCheck className="w-3.5 h-3.5 text-success" />
            <span className="text-[10px] font-black text-success uppercase tracking-widest">Community Verified</span>
          </div>
        )}
        {!state.verified && state.rejects >= 3 && (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-danger/10 border border-danger/20 rounded-full">
            <AlertTriangle className="w-3.5 h-3.5 text-danger" />
            <span className="text-[10px] font-black text-danger uppercase tracking-widest">Flagged</span>
          </div>
        )}
      </div>

      {/* Vote buttons */}
      <div className="flex gap-3">
        <button
          onClick={() => castVote('confirm')}
          disabled={loading}
          className={`flex-1 flex items-center justify-center gap-2 h-12 rounded-2xl border font-bold text-sm transition-all disabled:opacity-60 ${
            state.userVote === 'confirm'
              ? 'bg-success text-white border-success shadow-lg shadow-success/20'
              : 'bg-success/10 text-success border-success/20 hover:bg-success/20'
          }`}
          aria-label="Confirm this report"
        >
          {loading && state.userVote !== 'confirm' ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <ThumbsUp className="w-4 h-4" />
          )}
          Confirm <span className="font-black">{state.confirms}</span>
        </button>
        <button
          onClick={() => castVote('reject')}
          disabled={loading}
          className={`flex-1 flex items-center justify-center gap-2 h-12 rounded-2xl border font-bold text-sm transition-all disabled:opacity-60 ${
            state.userVote === 'reject'
              ? 'bg-danger text-white border-danger shadow-lg shadow-danger/20'
              : 'bg-danger/10 text-danger border-danger/20 hover:bg-danger/20'
          }`}
          aria-label="Reject this report"
        >
          {loading && state.userVote !== 'reject' ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <ThumbsDown className="w-4 h-4" />
          )}
          Reject <span className="font-black">{state.rejects}</span>
        </button>
      </div>

      {/* Progress bar */}
      {total > 0 && (
        <div className="space-y-1.5">
          <div className="h-2 bg-danger/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-success rounded-full transition-all duration-500"
              style={{ width: `${confirmPct}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] font-bold text-muted-foreground">
            <span>{confirmPct}% confirmed</span>
            <span>{VERIFY_THRESHOLD - state.confirms > 0 ? `${VERIFY_THRESHOLD - state.confirms} more to verify` : 'Verified!'}</span>
          </div>
        </div>
      )}

      {state.userVote && (
        <p className="text-[10px] text-center text-muted-foreground">
          You voted: <strong className={state.userVote === 'confirm' ? 'text-success' : 'text-danger'}>
            {state.userVote === 'confirm' ? '👍 Confirmed' : '👎 Rejected'}
          </strong>
        </p>
      )}
    </div>
  );
}
