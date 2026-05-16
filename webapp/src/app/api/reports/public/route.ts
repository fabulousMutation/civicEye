import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const severity = searchParams.get('severity');
    const limit = parseInt(searchParams.get('limit') || '200');

    let query = supabase
      .from('reports')
      .select('tracking_id, issue_type, priority, status, location_lat, location_lng, address, image_url, confidence_score, created_at, text_summary')
      .neq('status', 'REJECTED')
      .not('location_lat', 'is', null)
      .not('location_lng', 'is', null)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (category) query = query.ilike('issue_type', `%${category}%`);
    if (severity) query = query.eq('priority', severity);

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ reports: data || [] });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
