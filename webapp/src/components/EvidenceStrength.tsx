'use client';

import { Shield, Brain, Users, AlertTriangle, CheckCircle2 } from 'lucide-react';

type Props = {
  confidenceScore?: number;
  aiGeneratedLikelihood?: number;
  confirmCount?: number;
  rejectCount?: number;
  verificationStatus?: string;
};

function getMeterColor(score: number): string {
  if (score >= 70) return 'rgb(var(--success))';
  if (score >= 40) return 'rgb(var(--warning))';
  return 'rgb(var(--danger))';
}

export default function EvidenceStrength({
  confidenceScore = 0,
  aiGeneratedLikelihood = 0,
  confirmCount = 0,
  rejectCount = 0,
  verificationStatus = 'pending',
}: Props) {
  // Composite strength score
  const aiScore       = Math.max(0, confidenceScore - (aiGeneratedLikelihood * 0.5));
  const communityNet  = Math.max(0, confirmCount - rejectCount);
  const communityBonus= Math.min(30, communityNet * 6);
  const evidenceScore = Math.min(100, Math.round((aiScore * 0.7) + communityBonus));

  const strengthLabel =
    evidenceScore >= 75 ? 'High Confidence Issue' :
    evidenceScore >= 45 ? 'Moderate Confidence' :
    evidenceScore >= 20 ? 'Low Confidence' : 'Unverified';

  const strengthColor =
    evidenceScore >= 75 ? 'text-success' :
    evidenceScore >= 45 ? 'text-warning' : 'text-danger';

  const factors: { icon: typeof Shield; label: string; value: string; score: number; max: number }[] = [
    {
      icon: Brain,
      label: 'AI Classification',
      value: `${confidenceScore}% confidence`,
      score: confidenceScore,
      max: 100,
    },
    {
      icon: Shield,
      label: 'Image Authenticity',
      value: aiGeneratedLikelihood > 50
        ? `⚠️ ${aiGeneratedLikelihood}% AI-generated`
        : `✓ Appears genuine`,
      score: Math.max(0, 100 - aiGeneratedLikelihood),
      max: 100,
    },
    {
      icon: Users,
      label: 'Community Votes',
      value: `${confirmCount} confirm · ${rejectCount} reject`,
      score: Math.min(100, communityNet * 20),
      max: 100,
    },
  ];

  return (
    <div className="glass-card p-5 space-y-4">
      {/* Header + overall score */}
      <div className="flex items-center justify-between">
        <div className="section-label flex items-center gap-2">
          <Shield className="w-3 h-3" /> Evidence Strength
        </div>
        <div className={`flex items-center gap-1.5 ${strengthColor}`}>
          {evidenceScore >= 75
            ? <CheckCircle2 className="w-4 h-4" />
            : <AlertTriangle className="w-4 h-4" />
          }
          <span className="text-xs font-black">{strengthLabel}</span>
        </div>
      </div>

      {/* Master meter */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground font-medium">Overall Score</span>
          <span className={`font-black ${strengthColor}`}>{evidenceScore}/100</span>
        </div>
        <div className="confidence-meter">
          <div
            className="confidence-meter-fill"
            style={{ width: `${evidenceScore}%`, backgroundColor: getMeterColor(evidenceScore) }}
          />
        </div>
      </div>

      {/* Factor breakdown */}
      <div className="space-y-3 pt-1 border-t border-border">
        {factors.map((factor, i) => (
          <div key={i} className="space-y-1">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs">
                <factor.icon className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="font-bold text-muted-foreground">{factor.label}</span>
              </div>
              <span className="text-[10px] font-bold text-muted-foreground shrink-0">{factor.value}</span>
            </div>
            <div className="confidence-meter">
              <div
                className="confidence-meter-fill"
                style={{ width: `${factor.score}%`, backgroundColor: getMeterColor(factor.score) }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Verification badge */}
      {verificationStatus === 'verified' && (
        <div className="flex items-center gap-2 p-3 bg-success/10 border border-success/20 rounded-xl">
          <CheckCircle2 className="w-4 h-4 text-success" />
          <span className="text-xs font-black text-success">Community Verified Report</span>
        </div>
      )}
      {verificationStatus === 'flagged' && (
        <div className="flex items-center gap-2 p-3 bg-danger/10 border border-danger/20 rounded-xl">
          <AlertTriangle className="w-4 h-4 text-danger" />
          <span className="text-xs font-black text-danger">Flagged for Review</span>
        </div>
      )}
    </div>
  );
}
