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
  schools?: IncomingSchool[];
  sports_selected?: string[];
  inYear?: number;
  debug?: boolean;
  // NEW (CCA): allow optional CCA filters from client
  ccas_selected?: string[];
};

function isNonEmptyArray(x: any): x is any[] {
  return Array.isArray(x) && x.length > 0;
}
function isStr(x: any): x is string {
  return typeof x === 'string' && x.trim().length > 0;
}
function isNum(x: any): x is number {
  return typeof x === 'number' && Number.isFinite(x);
}
function isObj(x: any): x is Record<string, any> {
  return x && typeof x === 'object' && !Array.isArray(x);
}
function has<T extends object>(obj: T, key: keyof any): boolean {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

function dpush(debugTrail: any[], key: string, payload?: any) {
  debugTrail.push({ key, t: Date.now(), ...payload });
}

function normalizeSportName(s: string): string {
  return s
    .normalize('NFKC')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeStage(s?: string | null): string {
  const x = (s || '').toUpperCase().replace(/\s+/g, '').trim();
  if (!x) return '';
  // Common variants
  if (['F', 'FINAL', 'FINALS', 'GRANDFINAL', 'GF'].includes(x)) return 'FINAL';
  if (['SF', 'SEMI', 'SEMIFINAL', 'SEMIFINALS'].includes(x)) return 'SEMI';
  if (['3RD_4TH', '3RD/4TH', 'THIRD/FOURTH', '3RD4TH'].includes(x)) return '3RD_4TH';
  if (['QF', 'QTR', 'QUARTERFINAL', 'QUARTERFINALS'].includes(x)) return 'QF';
  return x;
}

function keyForBucket(sport: string, gender?: string | null, division?: string | null) {
  const g = (gender || '').toUpperCase();
  const d = (division || '').toUpperCase();
  return [sport, g, d].join('|');
}

function keyForBucket2(sport?: string | null, gender?: string | null, division?: string | null) {
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

// —— Natural language helpers (explicitly include sport every time)

function pluralize(n: number, singular: string, plural?: string): string {
  if (n === 1) return `${n} ${singular}`;
  return `${n} ${plural || (singular + 's')}`;
}

function stageToPhrase(stage: 'Finals' | 'Semifinals' | '3rd/4th'): string {
  // Keep readable, consistent capitalization
  return stage;
}

function strengthFromCounts(finals: number, semis: number, third: number, qf: number): 'very strong' | 'strong' | 'fair strength' {
  // Heuristic: finals weigh most, then semis, then 3rd/4th, then QF
  const score = finals * 4 + semis * 3 + third * 2 + qf * 1;
  if (score >= 8) return 'very strong';
  if (score >= 4) return 'strong';
  return 'fair strength';
}

function summarizeBucketToClause(
  idx: number,
  sport: string,
  finals: number,
  semis: number,
  third: number,
  qf: number,
  gender?: string | null,
  division?: string | null
): { clause: string; sentences: string[] } {
  const strength = strengthFromCounts(finals, semis, third, qf);
  const pieces: string[] = [];
  const freq = finals + semis + third + qf;

  // Example outputs (always include sport name):
  // - "In Badminton (Boys, B Division), the school has been very strong, reaching the Finals 2 times and Semifinals 1 time."
  // - "In Netball (Girls), the school has strong results, with Semifinals 2 times."
  const where =
    gender && division
      ? ` (${gender}, ${division} Division)`
      : gender
      ? ` (${gender})`
      : division
      ? ` (${division} Division)`
      : '';

  const counts: string[] = [];
  if (finals > 0) counts.push(`${pluralize(finals, 'Final')} appearances`);
  if (semis > 0) counts.push(`${pluralize(semis, 'Semifinal')} appearances`);
  if (third > 0) counts.push(`${pluralize(third, '3rd/4th placing')}`);
  if (qf > 0 && counts.length === 0) counts.push(`${pluralize(qf, 'Quarterfinal')} appearances`);

  const core =
    counts.length > 0
      ? `${counts.join(' and ')}`
      : `consistent participation`;

  const lead =
    strength === 'very strong'
      ? `In ${sport}${where}, the school has been very strong, with ${core}.`
      : strength === 'strong'
      ? `In ${sport}${where}, the school shows strong results, with ${core}.`
      : `In ${sport}${where}, the school has fair strength and ${core}.`;

  pieces.push(lead);

  return { clause: lead, sentences: pieces };
}

function singleSportSentence(
  schoolName: string,
  sport: string,
  strength: 'very strong' | 'strong' | 'fair strength',
  stageName: 'Finals' | 'Semifinals' | '3rd/4th',
  freq: number,
  gender?: string | null,
  division?: string | null,
  minB?: number,
  maxB?: number
): string {
  // "(School) is very strong in (Sport) (Girls, B Division), with frequent Finals appearances (2–3 times) over 2022–2024."
  const where =
    gender && division
      ? ` (${gender}, ${division} Division)`
      : gender
      ? ` (${gender})`
      : division
      ? ` (${division} Division)`
      : '';

  const band =
    minB && maxB && minB !== maxB
      ? `${minB}–${maxB} times`
      : minB
      ? `${minB} times`
      : `${freq} times`;

  let opening: string;
  if (strength === 'very strong') {
    opening = `${schoolName} is very strong in ${sport}${where}, with frequent ${stageName} appearances (${band}) over recent years.`;
  } else if (strength === 'strong') {
    opening = `${schoolName} is strong in ${sport}${where}, with regular ${stageName} appearances (${band}) over recent years.`;
  } else {
    opening = `${schoolName} shows fair strength in ${sport}${where}, with ${stageName} appearances (${band}) over recent years.`;
  }
  return opening;
}

function clauseForSport(
  idx: number,
  sport: string,
  strength: 'very strong' | 'strong' | 'fair strength',
  stageName: 'Finals' | 'Semifinals' | '3rd/4th',
  freq: number,
  gender?: string | null,
  division?: string | null,
  minB?: number,
  maxB?: number
): string {
  const where =
    gender && division
      ? ` (${gender}, ${division} Division)`
      : gender
      ? ` (${gender})`
      : division
      ? ` (${division} Division)`
      : '';

  const band =
    minB && maxB && minB !== maxB
      ? `${minB}–${maxB} times`
      : minB
      ? `${minB} times`
      : `${freq} times`;

  if (strength === 'very strong') {
    return `In ${sport}${where}, the school has been very strong, with ${stageName} appearances ${band}.`;
  } else if (strength === 'strong') {
    return `In ${sport}${where}, the school shows strong results, with ${stageName} appearances ${band}.`;
  } else {
    return `In ${sport}${where}, the school has fair strength, with ${stageName} appearances ${band}.`;
  }
}

// Limit the number of sports shown when no sports are selected by the user
const MAX_SPORTS_WHEN_UNFILTERED = 3;

// NEW (CCA): helpers to generate a CCA explanation matched by school_code, prefer details then fallback to scores.
const CCA_YEARS_WINDOW_FALLBACK = 3; // use the same 3-year window as sports

function ccaTitleCase(s: string) {
  return String(s || '')
    .replace(/[-_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

function placementToRankValue(p?: string | number | null): number {
  if (p == null) return 999;
  const s = String(p).toLowerCase().trim();
  const asNum = Number(s.replace(/[^0-9]/g, ''));
  if (!Number.isNaN(asNum) && asNum > 0) return asNum;
  if (/(champion|gold|winn?er)/.test(s)) return 1;
  if (/(runner[-\s]?up|silver)/.test(s)) return 2;
  if (/(third|bronze)/.test(s)) return 3;
  if (/(fourth|semi[-\s]?final)/.test(s)) return 4;
  if (/(quarter[-\s]?final|finalist)/.test(s)) return 6;
  return 999;
}

async function buildCcaExplanationFromDetailsByCode(
  supabase: SupabaseClient<any>,
  schoolCode: string,
  years: number[],
  ccasSelected: string[] | undefined,
  schoolName: string // ← NEW
): Promise<string> {
  // Try both possible key columns: school_code and code
  const tryFetch = async () => {
    let { data, error } = await supabase
      .from('school_cca_details')
      .select('*')
      .in('year', years as any)
      .eq('school_code', schoolCode)
      .order('year', { ascending: false });
    if (error?.code === '42703' || !data?.length) {
      ({ data, error } = await supabase
        .from('school_cca_details')
        .select('*')
        .in('year', years as any)
        .eq('code', schoolCode)
        .order('year', { ascending: false }));
    }
    return { data, error };
  };

  const { data, error } = await tryFetch();
  if (error) { console.error('CCA details fetch error:', error); return ''; }
  if (!data || !data.length) return '';

  const pick = (row: any, names: string[]) =>
    names.map(n => row?.[n]).find(v => v != null && String(v).trim() !== '') ?? '';

  const ccaKeys = ['cca', 'activity', 'cca_name', 'name'];
  const placementKeys = ['placement', 'position', 'result', 'medal'];
  const compKeys = ['event_name', 'competition', 'event', 'meet'];
  const toNum = (v: any) => (Number.isFinite(Number(v)) ? Number(v) : 0);
  const toYear = (v: any) => Number(v ?? 0) || 0;

  // Optional filter by selected CCAs
  const rows = (Array.isArray(ccasSelected) && ccasSelected.length)
    ? data.filter((r: any) => {
        const cca = String(pick(r, ccaKeys)).toLowerCase();
        return ccasSelected.some(sel => sel.toLowerCase() === cca);
      })
    : data;

  if (!rows.length) return '';

  // Group by CCA
  type Item = { year: number; label: string; labelNum?: number; comp?: string; score?: number };
  const byCca = new Map<string, Item[]>();

  for (const r of rows as any[]) {
    const cca = String(pick(r, ccaKeys)).trim();
    if (!cca) continue;
    const year = toYear(r.year);
    const label = String(pick(r, placementKeys));
    const labelNum = (() => {
      const m = label.match(/\d+/);
      return m ? Number(m[0]) : undefined;
    })();
    const comp = String(pick(r, compKeys));
    const score = toNum(r.score);

    const arr = byCca.get(cca) || [];
    arr.push({ year, label, labelNum, comp, score });
    byCca.set(cca, arr);
  }

  if (!byCca.size) return '';

  // Rank CCAs by count then by best numeric placement, then by total score
  const rankedCcas = Array.from(byCca.entries()).sort((a, b) => {
    const [ccaA, arrA] = a; const [ccaB, arrB] = b;
    if (arrB.length !== arrA.length) return arrB.length - arrA.length; // more placements first
    const bestA = Math.min(...arrA.map(x => x.labelNum ?? 999));
    const bestB = Math.min(...arrB.map(x => x.labelNum ?? 999));
    if (bestA !== bestB) return bestA - bestB; // lower placement number is better
    const scoreA = arrA.reduce((t, x) => t + (x.score ?? 0), 0);
    const scoreB = arrB.reduce((t, x) => t + (x.score ?? 0), 0);
    return scoreB - scoreA;
  });

  // Build up to 3 concise sentences
  const sentences: string[] = [];
  for (const [ccaRaw, arr] of rankedCcas.slice(0, 3)) {
    const CCA = ccaTitleCase(ccaRaw);
    // Single record → "<School> is good at <CCA> and has achieved placement <#> in <year>."
    if (arr.length === 1) {
      const { year, label, labelNum } = arr[0];
      const placeTxt = (labelNum != null) ? `${labelNum}` : (label || 'a top');
      sentences.push(
        `${schoolName} is good at ${CCA} and has achieved placement ${placeTxt} in ${year}.`
      );
      continue;
    }

    // Multiple records → "<School> is strong in <CCA> and has achieved <#> placements in <CCA> competitions in <years>."
    const count = arr.length;
    const yearsList = Array.from(new Set(arr.map(x => x.year))).sort((a, b) => b - a).join(', ');
    sentences.push(
      `${schoolName} is strong in ${CCA} and has achieved ${count} placements in ${CCA} competitions in ${yearsList}.`
    );
  }

  return sentences.join(' ');
}

async function buildCcaExplanationFromScoresByCode(
  supabase: SupabaseClient<any>,
  schoolCode: string,
  years: number[],
  ccasSelected: string[] | undefined,
  schoolName: string // ← NEW
): Promise<string> {
  // Try both key columns: school_code and code
  const tryFetch = async () => {
    let { data, error } = await supabase
      .from('school_cca_scores')
      .select('*')
      .in('year', years as any)
      .eq('school_code', schoolCode)
      .order('score', { ascending: false });
    if (error?.code === '42703' || !data?.length) {
      ({ data, error } = await supabase
        .from('school_cca_scores')
        .select('*')
        .in('year', years as any)
        .eq('code', schoolCode)
        .order('score', { ascending: false }));
    }
    return { data, error };
  };

  const { data, error } = await tryFetch();
  if (error) { console.error('CCA scores fetch error:', error); return ''; }
  if (!data || !data.length) return '';

  const pick = (row: any, names: string[]) =>
    names.map(n => row?.[n]).find(v => v != null && String(v).trim() !== '') ?? '';

  const rows = (Array.isArray(ccasSelected) && ccasSelected.length)
    ? data.filter((r: any) => {
        const cca = String(pick(r, ['cca','activity','cca_name','name'])).toLowerCase();
        return ccasSelected.some(sel => sel.toLowerCase() === cca);
      })
    : data;

  if (!rows.length) return '';

  type Agg = { cca: string; years: Set<number>; total: number; bestYear: number; bestScore: number };
  const byCca = new Map<string, Agg>();

  for (const r of rows as any[]) {
    const cca = String(pick(r, ['cca','activity','cca_name','name'])).trim();
    if (!cca) continue;
    const year = Number(r.year ?? 0) || 0;
    const score = Number(r.score ?? 0) || 0;

    const curr = byCca.get(cca) || { cca, years: new Set<number>(), total: 0, bestYear: year, bestScore: score };
    curr.years.add(year);
    curr.total += score;
    if (score > curr.bestScore) { curr.bestScore = score; curr.bestYear = year; }
    byCca.set(cca, curr);
  }

  const ranked = Array.from(byCca.values()).sort((a, b) => b.total - a.total).slice(0, 3);
  const sentences = ranked.map(a => {
    const yearsList = Array.from(a.years).sort((x, y) => y - x).join(', ');
    return `${schoolName} is strong in ${ccaTitleCase(a.cca)} based on good results in ${yearsList}.`;
  });

  return sentences.join(' ');
}

async function buildCcaExplanationForSchoolByCode(
  supabase: SupabaseClient<any>,
  schoolCode: string,
  years: number[],
  ccasSelected: string[] | undefined,
  schoolName: string // ← NEW
): Promise<string> {
  const fromDetails = await buildCcaExplanationFromDetailsByCode(
    supabase, schoolCode, years, ccasSelected, schoolName
  );
  if (fromDetails) return fromDetails;
  return buildCcaExplanationFromScoresByCode(
    supabase, schoolCode, years, ccasSelected, schoolName
  );
}


export async function POST(req: Request) {
  const debugTrail: any[] = [];
  const d = (k: string, payload?: any) => dpush(debugTrail, k, payload);

  try {
    const dbgEnabled = (() => {
      try {
        const u = new URL(req.url);
        return u.searchParams.get('debug') === '1';
      } catch {
        return false;
      }
    })();

    const SUPABASE_URL =
      process.env.NEXT_PUBLIC_SUPABASE_URL ||
      process.env.SUPABASE_URL;

    const SUPABASE_SERVICE_ROLE_KEY =
      process.env.SUPABASE_SERVICE_ROLE ||
      process.env.SUPABASE_KEY;

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      d('env.missing', { hasUrl: !!SUPABASE_URL, hasKey: !!SUPABASE_SERVICE_ROLE_KEY });
      return NextResponse.json({ error: 'Supabase env missing', debug: debugTrail }, { status: 500 });
    }
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    let body: ExplainRequest;
    try {
      body = (await req.json()) as ExplainRequest;
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const schools: IncomingSchool[] = Array.isArray(body?.schools) ? body.schools : [];
    const sportsSelected = Array.isArray(body?.sports_selected) ? body.sports_selected : [];
    // NEW (CCA): parse optional CCA filters
    const ccasSelected = Array.isArray(body?.ccas_selected) ? body.ccas_selected : [];

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
      d('fetch.error', { error });
      return NextResponse.json({ error: 'Failed to fetch sports results.', debug: debugTrail }, { status: 400 });
    }
    const raw: any[] = Array.isArray(rows) ? rows : [];
    d('fetch.ok', { count: raw.length });

    // Filter by sports if user selected any
    const sportsSelectedNorm = sportsSelected
      .map(s => normalizeSportName(String(s)))
      .filter(Boolean);
    const selectedSet = new Set(sportsSelectedNorm.map(s => s.toLowerCase()));

    const filtered = raw.filter(row => {
      const sport = normalizeSportName(String(row.sport || ''));
      if (!sport) return false;
      if (!selectedSet.size) return true;
      return selectedSet.has(sport.toLowerCase());
    });

    // Build a set of distinct sports present (debug only)
    const distinctSports = new Set<string>();
    filtered.forEach(r => {
      const sport = normalizeSportName(String(r.sport || ''));
      if (sport) distinctSports.add((sport || '').toLowerCase());
    });

    // School names
    const providedNameMap = new Map<string, string>();
    for (const s of schools) if (s.name) providedNameMap.set(String(s.code), s.name);
    const needNames = codes.filter(c => !providedNameMap.has(c));
    const dbNameMap = await fetchSchoolNamesByCode(supabase, needNames);
    // Culture summaries (120-word)
    let cultureByCode: Record<string, string> = {};
    try {
      const { data: cultureRows, error: cultureErr } = await supabase
        .from('school_culture_summaries')
        .select('school_code, short_summary')
        .in('school_code', codes);
      if (dbgEnabled) d('culture.fetch', { count: (cultureRows || []).length, err: cultureErr?.message });
      if (!cultureErr && cultureRows) {
        for (const r of cultureRows as any[]) {
          if (r?.school_code) cultureByCode[String(r.school_code)] = r.short_summary || '';
        }
      }
    } catch (e) {
      if (dbgEnabled) d('culture.fetch.error', { e: String(e) });
    }

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

    // Stage weights & normalization
    const STAGE_RANK: Record<string, number> = {
      F: 4, FINAL: 4, FINALS: 4, 'GRAND FINAL': 4,
      SF: 3, SEMI: 3, SEMIFINAL: 3, SEMIFINALS: 3,
      '3RD_4TH': 2, '3RD/4TH': 2, 'THIRD/FOURTH': 2,
      QF: 1, QTR: 1, QUARTERFINAL: 1, QUARTERFINALS: 1,
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

      b.score += rank;
    }

    // Aggregate by sport (gender/division buckets -> pick strongest per sport)
    const perBucketSummaries: Record<string, Record<string, { finals: number; semis: number; third: number; qf: number; years: number; score: number; minB: number; maxB: number }>> = {};
    for (const [code, buckets] of Object.entries(bySchool)) {
      perBucketSummaries[code] ||= {};
      for (const [bucketKey, b] of Object.entries(buckets)) {
        const yearsCount = (b.years?.size || 0);
        const minB = Math.min(b.finals + b.semis + b.third + b.qf, b.finals + b.semis + b.third + b.qf); // same value (we'll update later)
        const maxB = b.finals + b.semis + b.third + b.qf; // same value
        perBucketSummaries[code][bucketKey] = {
          finals: b.finals, semis: b.semis, third: b.third, qf: b.qf,
          years: yearsCount, score: b.score, minB, maxB
        };
      }
    // Stage weights & normalization
    // (moved above, now redundant)

    function normalizeStage(s?: string | null): string {
      const x = (s || '').toUpperCase().replace(/\s+/g, '').trim();
      if (!x) return '';
      if (['F', 'FINAL', 'FINALS', 'GRANDFINAL', 'GF'].includes(x)) return 'FINAL';
      if (['SF', 'SEMI', 'SEMIFINAL', 'SEMIFINALS'].includes(x)) return 'SEMI';
      if (['3RD_4TH', '3RD/4TH', 'THIRD/FOURTH', '3RD4TH'].includes(x)) return '3RD_4TH';
      if (['QF', 'QTR', 'QUARTERFINAL', 'QUARTERFINALS'].includes(x)) return 'QF';
      return x;
    }

    function keyForBucket(sport: string, gender?: string | null, division?: string | null) {
      const g = (gender || '').toUpperCase();
      const d = (division || '').toUpperCase();
      return [sport, g, d].join('|');
    }

    function keyForBucket2(sport?: string | null, gender?: string | null, division?: string | null) {
      return [sport, gender || '', division || ''].join('||');
    }
    }

    function keyForBucket2(sport?: string | null, gender?: string | null, division?: string | null) {
      return [sport, gender || '', division || ''].join('||');
    }

    // NEW (CCA): build per-school results WITH CCA explanation (by code)
    const per_school = await Promise.all(
      codes.map(async (code) => {
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
            return bBest - aBest;
          });
          const best = sorted[0];
          const strength = strengthFromCounts(best.finals, best.semis, best.third, best.qf);
          const stageName: 'Finals' | 'Semifinals' | '3rd/4th' =
            best.finals > 0 ? 'Finals' : best.semis > 0 ? 'Semifinals' : '3rd/4th';
          const freq = best.finals + best.semis + best.third + best.qf;

          const minB = Math.min(freq, freq);
          const maxB = Math.max(freq, freq);
          summaries.push({
            sport,
            strength,
            stageName,
            freq,
            gender: best.gender,
            division: best.division,
            minB,
            maxB,
            score: best.score,
          });
        }

        // If nothing strong, return empty strings (plus CCA explanation if any)
        // NEW (CCA): compute CCA explainer first, so even if no sports we still return it
        const cca_explanation = await buildCcaExplanationForSchoolByCode(
          supabase,
          code,
          years,
          ccasSelected,
          displayName            // ← NEW
        );

        if (!summaries.length) {
          return { code, one_liner: '', explanation: '', culture_short: (cultureByCode[code] || ''), cca_explanation };
        }

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

        // Single-sport vs multi-sport one-liner
        const s0 = summaries[0];
        const one_liner = singleSportSentence(
          displayName, s0.sport, s0.strength, s0.stageName, s0.freq, s0.gender, s0.division, s0.minB, s0.maxB
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
            idx === clauses.length - 1 && clauses.length > 1 ? `and ${c}` : c
          );
          explanation = [lead, ...decorated].join(' ');
        }

        // NEW (CCA): return original fields + cca_explanation
        return { code, one_liner, explanation, culture_short: (cultureByCode[code] || ''), cca_explanation };
      })
    );

    const payload: any = { overall: '', per_school };
    if (dbgEnabled) payload.debug = debugTrail;
    return NextResponse.json(payload);
  } catch (err: any) {
    console.error('[explain] fatal', err);
    return NextResponse.json({ error: err?.message || 'error' }, { status: 400 });
  }
}
