// src/app/api/rank/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabaseClient';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  // Required params
  const score        = Number(searchParams.get('score'));
  const primarySlug  = searchParams.get('primary');
  const lat          = Number(searchParams.get('lat'));
  const lng          = Number(searchParams.get('lng'));
  const maxDistance  = Number(searchParams.get('maxDistanceKm'));
  const weightDist   = Number(searchParams.get('weightDist'));
  const weightSport  = Number(searchParams.get('weightSport'));
  const weightCca    = Number(searchParams.get('weightCca'));
  const limitCount   = Number(searchParams.get('limitCount')) || 6;

  if (
    isNaN(score) || !primarySlug ||
    isNaN(lat)   || isNaN(lng)      ||
    isNaN(maxDistance) ||
    isNaN(weightDist)  ||
    isNaN(weightSport) ||
    isNaN(weightCca)
  ) {
    return NextResponse.json({ error: 'Missing or invalid query params' }, { status: 400 });
  }

  const { data, error } = await supabase.rpc('rank_schools', {
    user_score:      score,
    user_lat:        lat,
    user_lng:        lng,
    user_primary:    primarySlug,
    max_distance_km: maxDistance,
    weight_dist:     weightDist,
    weight_sport:    weightSport,
    weight_cca:      weightCca,
    limit_count:     limitCount,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}
