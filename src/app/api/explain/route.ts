// src/app/api/explain/route.ts
// Explainer with: (a) explicit sport naming in all sentences
//                 (b) top-N sports when sports_selected is empty (no "all sports" dump)

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';


export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type IncomingSchool = { code: string; name?: string };
type ExplainRequest = {
  inYear?: number;                  // optional; auto-detected if missing
  schools: IncomingSchool[];
  sports_selected?: string[];       // optional filter
  debug?: boolean;                  // optional: include debug trail
};

type StageRow = {
  code: string;
  sport: string;
  gender: string | null;
  division: string | null;
  stage: string | null;
  year: number;
};

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_ROLE ||
  process.env.SUPABASE_KEY;

// When no sports are selected, we’ll show only the strongest few:
const MAX_SPORTS_WHEN_UNFILTERED = 3;

// Stage weights & normalization
const STAGE_RANK: Record<string, number> = {
  F: 4, FINAL: 4, FINALS: 4, 'GRAND FINAL': 4,
  SF: 3, SEMI: 3, SEMIFINAL: 3, SEMIFINALS: 3,
  '3RD_4TH': 2, '3RD/4TH': 2, 'THIRD/FOURTH': 2,
  QF: 1, QTR: 1, QUARTERFINAL: 1, QUARTERFINALS: 1,
};

function normalizeStage(s?: string | null): string {
  if (!s) return '';
  const u = s.trim().toUpperCase();
  if (u === 'FINAL' || u === 'FINALS' || u === 'GRAND FINAL') return 'F';
  if (u === 'SEMI' || u === 'SEMIFINAL' || u === 'SEMIFINALS') return 'SF';
  if (u === '3RD/4TH' || u === 'THIRD/FOURTH' || u === '3RD_4TH') return '3RD_4TH';
  if (u === 'QTR' || u === 'QUARTERFINAL' || u === 'QUARTERFINALS') return 'QF';
  return u;
}
function toCountWord(n: number): string {
  if (n === 1) return 'once';
  if (n === 2) return 'twice';
  if (n === 3) return 'thrice';
  return `${n} times`;
}
function rangeLabel(minY: number, maxY: number): string {
  return minY === maxY ? `in ${minY}` : `over ${minY}\u2013${maxY}`;
}
function strengthLabel(score: number): 'very strong' | 'strong' | 'fair strength' | null {
  if (score >= 7) return 'very strong';
  if (score >= 4) return 'strong';
  if (score >= 2) return 'fair strength';
  return null;
}
function keyForBucket(sport: string, gender?: string | null, division?: string | null): string {
  return [sport, gender || '', division || ''].join('||');
}

async function fetchSchoolNamesByCode(
  supabase: SupabaseClient<any>,   // or: ReturnType<typeof createClient>
  codes: string[]
): Promise<Map<string, string>> {
  const nameMap = new Map<string, string>();
  if (codes.length === 0) return nameMap;
  const { data, error } = await supabase
    .from('secondary_with_affiliations')
    .select('code, name')
    .in('code', codes);
  if (!error && data) {
    for (const row of data as any[]) {
      if (row?.code) nameMap.set(String(row.code), row.name || `School ${row.code}`);
    }
  }
  return nameMap;
}

// —— Natural language helpers (explicitly include sport every time) ——
function clauseForSport(
  i: number,
  sport: string,
  strength: 'very strong' | 'strong' | 'fair strength',
  stageName: 'Finals' | 'Semifinals' | '3rd/4th',
  freq: number,
  gender?: string | null,
  division?: string | null,
  minY?: number,
  maxY?: number
): string {
  const sportLabel = sport.toLowerCase(); // stylistic; feels natural in prose
  const gPart = gender ? ` for ${gender}` : '';
  const dPart = division ? ` in the ${division} Division` : '';
  const yrs = (minY != null && maxY != null) ? ` ${rangeLabel(minY, maxY)}` : '';
  const count = toCountWord(freq);

  // Small variations to avoid robotic feel
  const openers = [
    `In ${sportLabel}, it is ${strength},`,
    `In ${sportLabel}, the team is ${strength},`,
    `In ${sportLabel}, it shows ${strength} form,`,
  ];
  const verbs = [
    `having reached ${stageName}${gPart}${dPart} ${count}${yrs}.`,
    `with ${stageName}${gPart}${dPart} ${count}${yrs}.`,
    `making ${stageName}${gPart}${dPart} ${count}${yrs}.`,
  ];

  const opener = openers[i % openers.length];
  const verb = verbs[i % verbs.length];
  return `${opener} ${verb}`;
}

function singleSportSentence(
  schoolName: string,
  sport: string,
  strength: 'very strong' | 'strong' | 'fair strength',
  stageName: 'Finals' | 'Semifinals' | '3rd/4th',
  freq: number,
  gender?: string | null,
  division?: string | null,
  minY?: number,
  maxY?: number
): string {
  const sportLabel = sport.toLowerCase();
  const gPart = gender ? ` for ${gender}` : '';
  const dPart = division ? ` in the ${division} Division` : '';
  const yrs = (minY != null && maxY != null) ? ` ${rangeLabel(minY, maxY)}` : '';
  const count = toCountWord(freq);
  // IMPORTANT: keep sport explicitly named
  return `${schoolName} is ${strength} in ${sportLabel}, ` +
         `having reached ${stageName}${gPart}${dPart} ${count}${yrs}.`;
}

export async function POST(req: Request) {
  const debugTrail: any[] = [];
  const url = new URL(req.url);
  const dbgParam = url.searchParams.get('debug');
  let dbgEnabled = dbgParam === '1';

  const d = (msg: string, extra?: any) => {
    if (dbgEnabled) {
      debugTrail.push({ msg, ...(extra ? { extra } : {}) });
      if (extra) console.log('[explain]', msg, extra);
      else console.log('[explain]', msg);
    }
  };

  try {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      d('env.missing', { hasUrl: !!SUPABASE_URL, hasKey: !!SUPABASE_SERVICE_ROLE_KEY });
      return NextResponse.json({ error: 'Supabase env missing', debug: debugTrail }, { status: 500 });
    }
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    let body: ExplainRequest;
    try {
      body = (await req.json()) as ExplainRequest;
    } catch (e: any) {
      d('parse.error', { message: e?.message });
      return NextResponse.json({ error: 'Invalid JSON body', debug: debugTrail }, { status: 400 });
    }
    if (!dbgEnabled && body?.debug) dbgEnabled = true;

    const schools = Array.isArray(body?.schools) ? body.schools : [];
    const sportsSelected = Array.isArray(body?.sports_selected) ? body.sports_selected : [];
    const codes = [...new Set(schools.map(s => String(s.code)))];

    if (codes.length === 0) {
      d('validate.fail', { reason: 'no schools' });
      return NextResponse.json({ error: 'Provide schools[].', debug: debugTrail }, { status: 400 });
    }

    // Auto-detect reference year if not provided
    let refYear = Number(body?.inYear);
    if (!refYear || Number.isNaN(refYear)) {
      let q = supabase
        .from('school_sport_results')
        .select('year')
        .in('code', codes)
        .order('year', { ascending: false })
        .limit(1);
      const { data: latest } = await q;
      refYear = latest && latest[0]?.year ? Number(latest[0].year) : 2024;
      d('refYear', { refYear });
    }

    const years = [refYear - 2, refYear - 1, refYear];
    const minY = Math.min(...years);
    const maxY = Math.max(...years);

    // Fetch raw rows
    const { data: rows, error } = await supabase
      .from('school_sport_results')
      .select('code, sport, gender, division, stage, year')
      .in('code', codes)
      .gte('year', minY)
      .lte('year', maxY);

    if (error) {
      d('supabase.error', { code: error.code, message: error.message, details: error.details });
      return NextResponse.json({ error: 'Failed to fetch sport results', debug: debugTrail }, { status: 500 });
    }

    // Optional sport filter
    const sportsSet = new Set(sportsSelected.map(s => s.trim().toLowerCase()));
    const filtered: StageRow[] = (rows as StageRow[]).filter(r => {
      if (!sportsSelected.length) return true;
      return sportsSet.has((r.sport || '').toLowerCase());
    });

    // School names
    const providedNameMap = new Map<string, string>();
    for (const s of schools) if (s.name) providedNameMap.set(String(s.code), s.name);
    const needNames = codes.filter(c => !providedNameMap.has(c));
    const dbNameMap = await fetchSchoolNamesByCode(supabase, needNames);

    // Aggregate per school, per (sport,gender,division)
    type BucketCounts = {
      sport: string;
      gender?: string | null;
      division?: string | null;
      years: Set<number>;
      finals: number;
      semis: number;
      third: number;
      qf: number;
      score: number;
    };
    const bySchool: Record<string, Record<string, BucketCounts>> = {};

    for (const row of filtered) {
      const code = String(row.code);
      const sport = row.sport;
      if (!code || !sport || row.year == null) continue;

      const gender = row.gender || undefined;
      const division = row.division || undefined;
      const stage = normalizeStage(row.stage);

      const bucketKey = keyForBucket(sport, gender, division);
      bySchool[code] ||= {};
      const b = (bySchool[code][bucketKey] ||= {
        sport, gender, division,
        years: new Set<number>(),
        finals: 0, semis: 0, third: 0, qf: 0, score: 0,
      });

      b.years.add(row.year);
      const rank = STAGE_RANK[stage] || 0;
      if (rank === 4) b.finals += 1;
      else if (rank === 3) b.semis += 1;
      else if (rank === 2) b.third += 1;
      else if (rank === 1) b.qf += 1;

      b.score = b.finals * 4 + b.semis * 3 + b.third * 2 + b.qf * 1;
    }

    // Build natural sentences
    const per_school = codes.map(code => {
      const displayName =
        providedNameMap.get(code) ||
        dbNameMap.get(code) ||
        `School ${code}`;

      const buckets = Object.values(bySchool[code] || {});
      // group by sport and pick the best (gender/division) bucket per sport
      const bySport = new Map<string, BucketCounts[]>();
      for (const b of buckets) {
        bySport.set(b.sport, [...(bySport.get(b.sport) || []), b]);
      }

      type SportSummary = {
        sport: string;
        strength: 'very strong' | 'strong' | 'fair strength';
        stageName: 'Finals' | 'Semifinals' | '3rd/4th';
        freq: number;
        gender?: string | null;
        division?: string | null;
        minB: number;
        maxB: number;
        score: number;
      };
      let summaries: SportSummary[] = [];

      for (const [sport, list] of bySport.entries()) {
        // choose the strongest bucket for this sport
        const sorted = list.slice().sort((a, b) => {
          if (b.score !== a.score) return b.score - a.score;
          const aBest = a.finals > 0 ? 4 : a.semis > 0 ? 3 : a.third > 0 ? 2 : a.qf > 0 ? 1 : 0;
          const bBest = b.finals > 0 ? 4 : b.semis > 0 ? 3 : b.third > 0 ? 2 : b.qf > 0 ? 1 : 0;
          if (bBest !== aBest) return bBest - aBest;
          return (b.years.size - a.years.size);
        });
        const best = sorted[0];
        if (!best) continue;

        // Must have Finals/Semis/3rd counts to talk about it
        const hasFinals = best.finals > 0;
        const hasSemis  = best.semis  > 0;
        const hasThird  = best.third  > 0;
        if (!hasFinals && !hasSemis && !hasThird) continue;

        const strength = strengthLabel(best.score);
        if (!strength) continue;

        // headline stage + frequency
        let stageName: 'Finals' | 'Semifinals' | '3rd/4th';
        let freq: number;
        if (hasFinals) { stageName = 'Finals'; freq = best.finals; }
        else if (hasSemis) { stageName = 'Semifinals'; freq = best.semis; }
        else { stageName = '3rd/4th'; freq = best.third; }

        const yearsArr = [...best.years];
        summaries.push({
          sport, strength, stageName, freq,
          gender: best.gender, division: best.division,
          minB: Math.min(...yearsArr), maxB: Math.max(...yearsArr),
          score: best.score,
        });
      }

      // If nothing strong, return empty strings
      if (!summaries.length) return { code, one_liner: '', explanation: '' };

      // Sort sports by strength score so strongest are mentioned first
      summaries.sort((a, b) => b.score - a.score);

      // NEW: If user did NOT select sports, limit to top N only
      if (!sportsSelected.length && summaries.length > MAX_SPORTS_WHEN_UNFILTERED) {
        summaries = summaries.slice(0, MAX_SPORTS_WHEN_UNFILTERED);
      }

      // Build clauses (sport mentioned every time)
      const clauses = summaries.map((s, i) =>
        clauseForSport(i, s.sport, s.strength, s.stageName, s.freq, s.gender, s.division, s.minB, s.maxB)
      );

      // Compose explanation
      let explanation: string;
      if (clauses.length === 1) {
        // Single sport: explicit sport naming
        const s = summaries[0];
        explanation = singleSportSentence(
          displayName, s.sport, s.strength, s.stageName, s.freq, s.gender, s.division, s.minB, s.maxB
        );
      } else {
        // Multi-sport: one lead + varied clauses (all name the sport)
        const lead = `${displayName} shows strong performance across multiple sports.`;
        // Add a light connector before the final clause for readability
        const decorated = clauses.map((c, idx) =>
          (idx === clauses.length - 1 && clauses.length > 1)
            ? c.replace(/^In /, 'Additionally, in ')
            : c
        );
        explanation = `${lead} ${decorated.join(' ')}`;
      }

      // one_liner mirrors the strongest sport sentence (explicit sport naming)
      const s0 = summaries[0];
      const one_liner = singleSportSentence(
        displayName, s0.sport, s0.strength, s0.stageName, s0.freq, s0.gender, s0.division, s0.minB, s0.maxB
      );

      return { code, one_liner, explanation };
    });

    const payload: any = { overall: '', per_school };
    if (dbgEnabled) payload.debug = debugTrail;
    return NextResponse.json(payload);
  } catch (err: any) {
    console.error('[explain] fatal', err);
    return NextResponse.json({ error: err?.message || 'error' }, { status: 400 });
  }
}
