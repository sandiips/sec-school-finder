// src/app/api/search/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabaseClient';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const score       = parseInt(searchParams.get('score')  || '');
  const primary     = searchParams.get('primary')         || '';
  const lat         = parseFloat(searchParams.get('lat')  || '');
  const lng         = parseFloat(searchParams.get('lng')  || '');

  if (!score || !primary || !lat || !lng) {
    return NextResponse.json({ error: 'Missing query params' }, { status: 400 });
  }

  const { data, error } = await supabase.rpc('search_schools', {
    user_score:    score,
    user_primary:  primary,
    user_lat:      lat,
    user_lng:      lng,
    limit_count:   10
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}
