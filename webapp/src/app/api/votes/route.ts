import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabase as adminSupabase } from '@/lib/supabaseClient';

const VERIFY_THRESHOLD = 5;  // confirms needed for auto-verify
const FLAG_THRESHOLD   = 3;  // rejects needed to flag

// GET: vote counts for a report
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const reportId = searchParams.get('report_id');
    if (!reportId) return NextResponse.json({ error: 'report_id required' }, { status: 400 });

    const { data: votes } = await adminSupabase
      .from('votes')
      .select('vote_type, user_id')
      .eq('report_id', reportId);

    const confirms = (votes || []).filter(v => v.vote_type === 'confirm').length;
    const rejects  = (votes || []).filter(v => v.vote_type === 'reject').length;

    // Check if current user voted
    const supabaseServer = createClient();
    const { data: { user } } = await supabaseServer.auth.getUser();
    const userVote = user
      ? (votes || []).find(v => v.user_id === user.id)?.vote_type || null
      : null;

    return NextResponse.json({ confirms, rejects, userVote, total: (votes || []).length });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error' }, { status: 500 });
  }
}

// POST: cast a vote
export async function POST(req: NextRequest) {
  try {
    const supabaseServer = createClient();
    const { data: { user } } = await supabaseServer.auth.getUser();
    // Allow anonymous votes — no auth required

    const body = await req.json();
    const { report_id, vote_type } = body;
    if (!report_id || !['confirm', 'reject'].includes(vote_type)) {
      return NextResponse.json({ error: 'Invalid vote' }, { status: 400 });
    }

    // Upsert vote (one vote per user per report — if user exists)
    if (user) {
      await adminSupabase
        .from('votes')
        .upsert([{ report_id, user_id: user.id, vote_type }], { onConflict: 'report_id,user_id' });
    } else {
      // Anonymous: just insert (no uniqueness enforced)
      await adminSupabase
        .from('votes')
        .insert([{ report_id, vote_type }]);
    }

    // Recount
    const { data: votes } = await adminSupabase
      .from('votes')
      .select('vote_type')
      .eq('report_id', report_id);

    const confirms = (votes || []).filter(v => v.vote_type === 'confirm').length;
    const rejects  = (votes || []).filter(v => v.vote_type === 'reject').length;

    // Auto-verify if threshold reached
    if (confirms >= VERIFY_THRESHOLD) {
      await adminSupabase
        .from('reports')
        .update({ verification_status: 'verified', confirm_count: confirms, reject_count: rejects })
        .eq('tracking_id', report_id);
    } else if (rejects >= FLAG_THRESHOLD) {
      await adminSupabase
        .from('reports')
        .update({ verification_status: 'flagged', confirm_count: confirms, reject_count: rejects })
        .eq('tracking_id', report_id);
    } else {
      await adminSupabase
        .from('reports')
        .update({ confirm_count: confirms, reject_count: rejects })
        .eq('tracking_id', report_id);
    }

    return NextResponse.json({ confirms, rejects, verified: confirms >= VERIFY_THRESHOLD });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error' }, { status: 500 });
  }
}
