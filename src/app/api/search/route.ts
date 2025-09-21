// src/app/api/search/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
    
export async function GET(req: Request) {
  const url = new URL(req.url);
  const score = Number(url.searchParams.get('score'));
  const primary = url.searchParams.get('primary'); // <-- slug from UI
  const lat = Number(url.searchParams.get('lat'));
  const lng = Number(url.searchParams.get('lng'));
  const maxDistanceKm = Number(url.searchParams.get('maxDistanceKm') ?? 5);

  if (!Number.isFinite(score) || !Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ error: 'Missing or invalid params' }, { status: 400 });
  }

  // Call the RPC with user_primary (expects name/slug; slug is perfect)
  const { data, error } = await supabase.rpc('rank_schools', {
    user_score: score,
    user_lat: lat,
    user_lng: lng,
    gender_pref: 'Any',         // Home page is distance-first, gender-agnostic
    sports_selected: null,
    ccas_selected: null,
    culture_selected: null,
    max_distance_km: maxDistanceKm,
    weight_dist: 1,             // distance-first page
    weight_sport: 0,
    weight_cca: 0,
    weight_culture: 0,
    limit_count: 12,            // or keep your current default
    in_year: 2024,
    user_primary: primary ?? null // <-- IMPORTANT
  });

  if (error) {
    console.error(error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }

  // Pass through fields used by the UI (cop_max_score & is_affiliated included)
  return NextResponse.json(data ?? []);
}
