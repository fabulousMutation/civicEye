import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabase as adminSupabase } from '@/lib/supabaseClient';

// GET: fetch notifications for the authenticated user
export async function GET(req: NextRequest) {
  try {
    const supabaseServer = createClient();
    const { data: { user } } = await supabaseServer.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '20');

    const { data, error } = await adminSupabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return NextResponse.json({ notifications: data || [] });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// POST: create a notification for a user
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { user_id, type, title, message, report_id } = body;
    if (!user_id || !type || !title || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data, error } = await adminSupabase
      .from('notifications')
      .insert([{ user_id, type, title, message, report_id }])
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ notification: data }, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// PATCH: mark notifications as read
export async function PATCH(req: NextRequest) {
  try {
    const supabaseServer = createClient();
    const { data: { user } } = await supabaseServer.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { ids } = body; // array of notification IDs, or 'all'

    let query = adminSupabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user.id);

    if (ids && ids !== 'all') {
      query = query.in('id', ids);
    }

    const { error } = await query;
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
