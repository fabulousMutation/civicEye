/**
 * Impact Score Calculator
 * Computes a citizen's impact score from their report history.
 * Score increases for: valid reports, resolved reports, community confirmations.
 */

export type ReportForScore = {
  status: string;
  priority?: string;
};

export type ImpactLevel = {
  label: string;
  minScore: number;
  color: string;
  bgColor: string;
  badge: string;
};

export const IMPACT_LEVELS: ImpactLevel[] = [
  { label: 'Top Contributor',   minScore: 80, color: 'text-warning',        bgColor: 'bg-warning/10',  badge: '🏆' },
  { label: 'Active Citizen',    minScore: 50, color: 'text-primary',        bgColor: 'bg-primary/10',  badge: '⭐' },
  { label: 'Rising Reporter',   minScore: 20, color: 'text-accent',         bgColor: 'bg-accent/10',   badge: '📈' },
  { label: 'New Citizen',       minScore: 0,  color: 'text-muted-foreground', bgColor: 'bg-secondary', badge: '👋' },
];

/**
 * Calculate impact score from a list of reports.
 * Max score is 100.
 */
export function calculateImpactScore(reports: ReportForScore[]): number {
  let score = 0;

  for (const report of reports) {
    if (report.status === 'REJECTED') continue; // No points for rejected
    score += 5; // +5 for each valid submission

    if (report.status === 'AUTHORITY_NOTIFIED' || report.status === 'RESOLVED') {
      score += 15; // +15 for resolved
    }

    // Priority bonus
    if (report.priority === 'High') score += 5;
    else if (report.priority === 'Medium') score += 2;
  }

  return Math.min(100, score);
}

/**
 * Get the impact level metadata for a given score.
 */
export function getImpactLevel(score: number): ImpactLevel {
  return IMPACT_LEVELS.find(l => score >= l.minScore) ?? IMPACT_LEVELS[IMPACT_LEVELS.length - 1];
}
