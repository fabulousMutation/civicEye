import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabase as adminSupabase } from '@/lib/supabaseClient';

async function requireAdmin() {
  const supabaseServer = createClient();
  const { data: { user } } = await supabaseServer.auth.getUser();
  if (!user) return null;
  const { data: profile } = await adminSupabase
    .from('profiles').select('role').eq('id', user.id).single();
  return profile?.role === 'admin' ? user : null;
}

// GET: fetch all reports (admin only)
export async function GET(req: NextRequest) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const limit  = parseInt(searchParams.get('limit') || '50');
  const page   = parseInt(searchParams.get('page') || '0');

  let query = adminSupabase
    .from('reports')
    .select('tracking_id, issue_type, priority, status, address, created_at, user_id, image_url, rejection_title, confidence_score, confirm_count, reject_count, verification_status', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(page * limit, (page + 1) * limit - 1);

  if (status) query = query.eq('status', status);

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ reports: data || [], total: count || 0 });
}

// PATCH: update report status (admin only)
export async function PATCH(req: NextRequest) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const body = await req.json();
  const { tracking_id, status, resolution_note } = body;

  if (!tracking_id || !status) {
    return NextResponse.json({ error: 'tracking_id and status required' }, { status: 400 });
  }

  const updates: Record<string, unknown> = { status };
  if (status === 'RESOLVED') updates.resolved_at = new Date().toISOString();
  if (status === 'AUTHORITY_NOTIFIED') updates.acknowledged_at = new Date().toISOString();
  if (resolution_note) updates.text_summary = resolution_note;

  const { data, error } = await adminSupabase
    .from('reports')
    .update(updates)
    .eq('tracking_id', tracking_id)
    .select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Notify report owner if we can find them
  try {
    const { data: report } = await adminSupabase
      .from('reports').select('user_id, tracking_id').eq('tracking_id', tracking_id).single();
    if (report?.user_id) {
      const statusLabel = status === 'RESOLVED' ? 'Resolved ✅' : status === 'AUTHORITY_NOTIFIED' ? 'Authority Notified 📣' : status;
      await adminSupabase.from('notifications').insert([{
        user_id: report.user_id,
        type: 'status_updated',
        title: `Report Status Updated: ${statusLabel}`,
        message: resolution_note || `Your report ${tracking_id} has been updated to: ${statusLabel}`,
        report_id: tracking_id,
      }]);
    }
  } catch { /* silent */ }

  return NextResponse.json({ report: data });
}
