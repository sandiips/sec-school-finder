// src/app/api/rank/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Map UI “importance” to weights (tweak freely)
const toWeight = (v: string) => (v === 'High' ? 0.4 : v === 'Medium' ? 0.2 : 0.0);

// very small slugifier aligned with your DB slugs
function slugify(input: string | null | undefined): string | null {
  if (!input) return null;
  return input
    .toLowerCase()
    .replace(/’/g, "'")            // normalize curly apostrophes
    .replace(/&/g, ' and ')
    .replace(/\./g, '')
    .replace(/[^a-z0-9'\s-]/g, '') // keep alnum, spaces, hyphens, apostrophes
    .trim()
    .replace(/['\s]+/g, '-')       // spaces/apostrophes -> hyphen
    .replace(/-+/g, '-');
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      psle_score,
      gender,                // 'Any' | 'Boys' | 'Girls' | 'Co-ed'
      postal_code,
      distance_importance,
      sports_importance,
      cca_importance,
      culture_importance,
      sports_selected = [],
      ccas_selected = [],
      culture_selected = [],
      limit = 6,
      lat,
      lng,
      primary_school        // <— from UI
    } = body;

    if (!Number.isFinite(psle_score) || psle_score < 4 || psle_score > 32) {
      return NextResponse.json({ error: 'PSLE score must be between 4 and 32.' }, { status: 400 });
    }
    if (!/^\d{6}$/.test(String(postal_code || ''))) {
      return NextResponse.json({ error: 'Invalid postal code' }, { status: 400 });
    }
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return NextResponse.json({ error: 'Missing lat/lng' }, { status: 400 });
    }

    const weight_dist = toWeight(distance_importance);
    const weight_sport = toWeight(sports_importance);
    const weight_cca = toWeight(cca_importance);
    const weight_culture = toWeight(culture_importance);

    const max_distance_km = 10;

    const primary_slug = slugify(primary_school);

    const { data, error } = await supabase.rpc('rank_schools1', {
      user_score: psle_score,
      user_lat: lat,
      user_lng: lng,
      gender_pref: gender || 'Any',
      sports_selected,
      ccas_selected,
      culture_selected,
      max_distance_km,
      weight_dist,
      weight_sport,
      weight_cca,
      weight_culture,
      limit_count: limit,
      primary_slug           // <— NEW
    });

    if (error) {
      console.error('rank_schools1 error', error);
      return NextResponse.json({ error: 'Ranking failed' }, { status: 500 });
    }

    const schools = (data || []).map((row: any) => {
  const row_id = `${row.code}-${row.track ?? 'NA'}-${row.posting_group ?? 'IP'}`;
  return {
      row_id,
      code: row.code,
      name: row.name,
      address: row.address,
      distance_km: row.distance_km,
      posting_group: row.posting_group,
      track: row.track,                 // 'IP' | 'PG3_AFF' | 'PG3_OPEN'
      cop_max_score: row.cop_max_score,
      is_affiliated: row.is_affiliated,
      sports_matches: row.sports_matches || [],
      ccas_matches: row.ccas_matches || [],
      culture_matches: row.culture_matches || [],
      composite_score: row.composite_score,
      why:
        row.why ??
        [
          row.sports_matches?.length ? `${row.sports_matches.length} sports match${row.sports_matches.length > 1 ? 'es' : ''}` : null,
          row.ccas_matches?.length ? `${row.ccas_matches.length} CCA match${row.ccas_matches.length > 1 ? 'es' : ''}` : null,
          row.culture_matches?.length ? `${row.culture_matches.length} culture match${row.culture_matches.length > 1 ? 'es' : ''}` : null,
          Number.isFinite(row.distance_km) ? `${row.distance_km.toFixed(1)} km from home` : null
        ].filter(Boolean).join(' • ')
      };
    });

    const summary =
      schools.length === 0
        ? 'No suitable matches found within your distance and preference settings.'
        : `These schools were ranked using your distance preference, selected sports/CCAs and culture traits, and COP cut-offs (affiliation-aware).`;

    return NextResponse.json({ summary, schools });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 });
  }
}
