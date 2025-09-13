'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';

// Extracted primary school names from the SQL file
const PRIMARY_SCHOOLS = [
  'Admiralty Primary School',
  'Ahmad Ibrahim Primary School',
  'Ai Tong School',
  'Alexandra Primary School',
  'Anchor Green Primary School',
  'Anderson Primary School',
  'Ang Mo Kio Primary School',
  'Anglo-Chinese School (Junior)',
  'Anglo-Chinese School (Primary)',
  'Angsana Primary School',
  'Beacon Primary School',
  'Bedok Green Primary School',
  'Bendemeer Primary School',
  'Blangah Rise Primary School',
  'Boon Lay Garden Primary School',
  'Bukit Panjang Primary School',
  'Bukit Timah Primary School',
  'Bukit View Primary School',
  'Canberra Primary School',
  'Canossa Catholic Primary School',
  'Cantonment Primary School',
  'Casuarina Primary School',
  'Cedar Primary School',
  'Changkat Primary School',
  'CHIJ (Katong) Primary',
  'CHIJ (Kellock)',
  'CHIJ Our Lady of Good Counsel',
  'CHIJ Our Lady of the Nativity',
  'CHIJ Our Lady Queen of Peace',
  'CHIJ Primary (Toa Payoh)',
  'Chongfu School',
  'Chongzheng Primary School',
  'Chua Chu Kang Primary School',
  'Clementi Primary School',
  'Compassvale Primary School',
  'Concord Primary School',
  'Corporation Primary School',
  'Damai Primary School',
  'Dazhong Primary School',
  'De La Salle School',
  'East Spring Primary School',
  'Edgefield Primary School',
  'Elias Park Primary School',
  'Endeavour Primary School',
  'Evergreen Primary School',
  'Fairfield Methodist School (Primary)',
  'Farrer Park Primary School',
  'Fengshan Primary School',
  'Fern Green Primary School',
  'Fernvale Primary School',
  'First Toa Payoh Primary School',
  'Frontier Primary School',
  'Fuchun Primary School',
  'Fuhua Primary School',
  'Gan Eng Seng Primary School',
  'Geylang Methodist School (Primary)',
  'Gongshang Primary School',
  'Greendale Primary School',
  'Greenridge Primary School',
  'Greenwood Primary School',
  'Haig Girls\' School',
  'Henry Park Primary School',
  'Holy Innocents\' Primary School',
  'Hong Wen School',
  'Horizon Primary School',
  'Hougang Primary School',
  'Huamin Primary School',
  'Innova Primary School',
  'Jiemin Primary School',
  'Jing Shan Primary School',
  'Junyuan Primary School',
  'Jurong Primary School',
  'Jurong West Primary School',
  'Keming Primary School',
  'Kheng Cheng School',
  'Kong Hwa School',
  'Kranji Primary School',
  'Kuo Chuan Presbyterian Primary School',
  'Lakeside Primary School',
  'Lianhua Primary School',
  'Maha Bodhi School',
  'Marsiling Primary School',
  'Marymount Convent School',
  'Mayflower Primary School',
  'Mee Toh School',
  'Meridian Primary School',
  'Methodist Girls\' School (Primary)',
  'Montfort Junior School',
  'Nan Chiau Primary School',
  'Nan Hua Primary School',
  'Nanyang Primary School',
  'Naval Base Primary School',
  'New Town Primary School',
  'Ngee Ann Primary School',
  'North Spring Primary School',
  'North View Primary School',
  'North Vista Primary School',
  'Northland Primary School',
  'Northoaks Primary School',
  'Northshore Primary School',
  'Oasis Primary School',
  'Opera Estate Primary School',
  'Palm View Primary School',
  'Park View Primary School',
  'Pasir Ris Primary School',
  'Paya Lebar Methodist Girls\' School (Primary)',
  'Pei Chun Public School',
  'Pei Hwa Presbyterian Primary School',
  'Pei Tong Primary School',
  'Peiying Primary School',
  'Pioneer Primary School',
  'Poi Ching School',
  'Princess Elizabeth Primary School',
  'Punggol Cove Primary School',
  'Punggol Green Primary School',
  'Punggol Primary School',
  'Punggol View Primary School',
  'Qifa Primary School',
  'Qihua Primary School',
  'Queenstown Primary School',
  'Radin Mas Primary School',
  'Raffles Girls\' Primary School',
  'Red Swastika School',
  'River Valley Primary School',
  'Riverside Primary School',
  'Rivervale Primary School',
  'Rosyth School',
  'Rulang Primary School',
  'Sembawang Primary School',
  'Seng Kang Primary School',
  'Sengkang Green Primary School',
  'Shuqun Primary School',
  'Si Ling Primary School',
  'Singapore Chinese Girls\' Primary School',
  'South View Primary School',
  'Springdale Primary School',
  'St. Andrew\'s Junior School',
  'St. Anthony\'s Canossian Primary School',
  'St. Anthony\'s Primary School',
  'St. Gabriel\'s Primary School',
  'St. Hilda\'s Primary School',
  'St. Joseph\'s Institution Junior',
  'St. Margaret\'s School (Primary)',
  'St. Stephen\'s School',
  'Tampines North Primary School',
  'Tampines Primary School',
  'Tanjong Katong Primary School',
  'Tao Nan School',
  'Teck Ghee Primary School',
  'Teck Whye Primary School',
  'Telok Kurau Primary School',
  'Temasek Primary School',
  'Townsville Primary School',
  'Unity Primary School',
  'Valour Primary School',
  'Waterway Primary School',
  'Wellington Primary School',
  'West Grove Primary School',
  'West Spring Primary School',
  'West View Primary School',
  'Westwood Primary School',
  'White Sands Primary School',
  'Woodgrove Primary School',
  'Woodlands Primary School',
  'Woodlands Ring Primary School',
  'Xinghua Primary School',
  'Xingnan Primary School',
  'Xinmin Primary School',
  'Xishan Primary School',
  'Yangzheng Primary School',
  'Yew Tee Primary School',
  'Yio Chu Kang Primary School',
  'Yishun Primary School',
  'Yu Neng Primary School',
  'Yuhua Primary School',
  'Yumin Primary School',
  'Zhangde Primary School',
  'Zhenghua Primary School',
  'Zhonghua Primary School'
];

// ---- Fallbacks; will be replaced by /api/options if available ----
const FALLBACK_SPORTS = [
  'Badminton','Basketball','Football','Hockey','Swimming','Netball','SepakTakraw','Softball','Table Tennis','Tennis','Volleyball','Water Polo','Rugby','Squash'
];
const FALLBACK_CCAS = [
  'Robotics','Science Club','Drama','Choir','Art Club','Debate','Media Club','Computer Club'
];
const FALLBACK_CULTURE = [
  'Service/Care','Integrity/Moral Courage','Excellence','Compassion/Empathy','Leadership','Faith-based Character','People-centred Respect','Passion & Lifelong Learning','Responsibility/Accountability','Courage / Tenacity','Diversity & Inclusiveness','Innovation / Pioneering','Accountability / Stewardship','Holistic Development','Scholarship & Leadership Excellence'
];

// ---------- Small UI helpers ----------
const IMPORTANCE_OPTS = ['Low', 'Medium', 'High'] as const;
type ImportanceLevel = typeof IMPORTANCE_OPTS[number];

function Importance(
  { label, value, onChange }: { label: string; value: ImportanceLevel; onChange: (v: ImportanceLevel) => void }
) {
  return (
    <div className="space-y-2">
      {label ? <div className="text-sm font-medium text-gray-900">{label}</div> : null}
      <div className="grid grid-cols-3 gap-2">
        {IMPORTANCE_OPTS.map((o) => (
          <button
            key={o}
            type="button"
            onClick={() => onChange(o)}
            className={`py-2 rounded border text-sm font-medium
              ${value===o ? 'bg-rose-600 text-white border-rose-600' : 'bg-white text-gray-900 border-gray-300 hover:bg-gray-50'}`}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}

function MultiSelect(
  { placeholder, options, value, onChange }: { placeholder: string; options: string[]; value: string[]; onChange: (next: string[]) => void }
) {
  const [open,setOpen] = useState<boolean>(false);
  const [q,setQ] = useState<string>('');
  const wrapRef = useRef<HTMLDivElement|null>(null);

  const filtered = useMemo(
    () => options.filter(o => o.toLowerCase().includes(q.toLowerCase())),
    [options,q]
  );

  const toggleValue = (item: string) => {
    if (value.includes(item)) onChange(value.filter((v: string) => v !== item));
    else onChange([...value, item]);
  };
  const removeChip = (item: string) => onChange(value.filter((v: string) => v !== item));

  useEffect(() => {
    function onDoc(e: MouseEvent){ if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false); }
    function onKey(e: KeyboardEvent){ if (e.key === 'Escape') setOpen(false); }
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  return (
    <div className="relative" ref={wrapRef}>
      <button type="button" onClick={() => setOpen(v=>!v)} className="w-full min-h-[42px] rounded border border-gray-300 bg-white px-2 py-2 text-left">
        {value.length ? (
          <div className="flex flex-wrap gap-1">
            {value.map((v: string) => (
              <span key={v} className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-900">
                {v}
                <span onClick={(e)=>{e.stopPropagation(); removeChip(v);}} className="cursor-pointer text-gray-500 hover:text-gray-700" aria-label={`Remove ${v}`}>×</span>
              </span>
            ))}
          </div>
        ) : <span className="text-gray-500">{placeholder}</span>}
      </button>

      {open && (
        <div className="absolute z-20 mt-1 w-full rounded border border-gray-200 bg-white shadow-lg">
          <div className="p-2 border-b">
            <input
              placeholder="Search…"
              value={q}
              onChange={(e: React.ChangeEvent<HTMLInputElement>)=>setQ(e.target.value)}
              className="w-full rounded border border-gray-200 px-2 py-1 text-sm text-gray-900 placeholder:text-gray-400"
            />
          </div>
          <ul className="max-h-56 overflow-auto">
            {filtered.map(opt => {
              const selected = value.includes(opt);
              return (
                <li key={opt}>
                  <button
                    type="button"
                    onClick={() => toggleValue(opt)}
                    className={`w-full px-3 py-2 text-left text-sm ${selected ? 'bg-rose-50 text-rose-700' : 'hover:bg-gray-50 text-gray-900'}`}
                  >
                    <label className="inline-flex items-center gap-2">
                      <input type="checkbox" readOnly checked={selected}/>
                      {opt}
                    </label>
                  </button>
                </li>
              );
            })}
            {!filtered.length && <li className="px-3 py-2 text-sm text-gray-500">No matches</li>}
          </ul>
        </div>
      )}
    </div>
  );
}

// Single-select
type SingleSelectProps = {
  placeholder: string;
  options: string[];
  value: string;
  onChange: (next: string) => void;
};

function SingleSelect({ placeholder, options, value, onChange }: SingleSelectProps) {
  const [open, setOpen] = useState<boolean>(false);
  const [q, setQ] = useState<string>('');
  const wrapRef = useRef<HTMLDivElement | null>(null);

  const filtered = useMemo(
    () => options.filter((o) => o.toLowerCase().includes(q.toLowerCase())),
    [options, q]
  );

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  return (
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full min-h-[42px] rounded border border-gray-300 bg-white px-2 py-2 text-left"
      >
        {value ? (
          <span className="text-gray-900">{value}</span>
        ) : (
          <span className="text-gray-500">{placeholder}</span>
        )}
      </button>

      {open && (
        <div className="absolute z-20 mt-1 w-full rounded border border-gray-200 bg-white shadow-lg">
          <div className="p-2 border-b">
            <input
              placeholder="Search…"
              value={q}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQ(e.target.value)}
              className="w-full rounded border border-gray-200 px-2 py-1 text-sm text-gray-900 placeholder:text-gray-400"
            />
          </div>
          <ul className="max-h-56 overflow-auto">
            {filtered.map((opt) => (
              <li key={opt}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(opt);
                    setOpen(false);
                  }}
                  className={`w-full px-3 py-2 text-left text-sm ${
                    value === opt ? 'bg-rose-50 text-rose-700' : 'hover:bg-gray-50 text-gray-900'
                  }`}
                >
                  {opt}
                </button>
              </li>
            ))}
            {!filtered.length && <li className="px-3 py-2 text-sm text-gray-500">No matches</li>}
          </ul>
        </div>
      )}
    </div>
  );
}

// Utility function to format school names
function formatSchoolName(name: string): string {
  return name
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/* ------------------- NEW: Sport highlighters (visual only) ------------------- */
function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
function buildSportsRegex(list: string[]) {
  const alts = [...list].sort((a,b)=>b.length-a.length).map(escapeRegExp).join('|');
  return new RegExp(`\\b(${alts})\\b`, 'gi');
}
function getMentionedSports(text: string, list: string[]): string[] {
  if (!text) return [];
  const rx = buildSportsRegex(list);
  const seen = new Set<string>();
  const found: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = rx.exec(text)) !== null) {
    const raw = m[0];
    const canonical = list.find(s => s.toLowerCase() === raw.toLowerCase()) || raw;
    const key = canonical.toLowerCase();
    if (!seen.has(key)) { seen.add(key); found.push(canonical); }
  }
  return found;
}
function highlightSports(text: string, list: string[]) {
  if (!text) return <span className="text-gray-500">No sports explanation available.</span>;
  const rx = buildSportsRegex(list);
  const parts = text.split(rx);
  let idx = 0;
  return (
    <>
      {parts.map((p, i) => {
        const isMatch = i % 2 === 1;
        if (!isMatch) return <span key={`t-${idx++}`}>{p}</span>;
        return (
          <mark
            key={`m-${idx++}`}
            className="rounded bg-green-200/70 px-1 py-0.5 text-green-900"
          >
            {p}
          </mark>
        );
      })}
    </>
  );
}
/* --------------------------------------------------------------------------- */

// ---------- Main Page ----------
export default function Page() {
  // Basic info
  const [psle, setPsle] = useState<string>('');
  const [gender, setGender] = useState<string>('Any');
  const [postal, setPostal] = useState<string>('');
  const [primarySchool, setPrimarySchool] = useState<string>('');

  // Validation states
  const [isPsleValid, setIsPsleValid] = useState<boolean>(false);
  const [isPostalValid, setIsPostalValid] = useState<boolean>(false);

  // Priorities
  const [distImp, setDistImp] = useState<ImportanceLevel>('Low');
  const [sportImp, setSportImp] = useState<ImportanceLevel>('Low');
  const [ccaImp, setCcaImp] = useState<ImportanceLevel>('Low');
  const [cultureImp, setCultureImp] = useState<ImportanceLevel>('Low');

  const [sports, setSports] = useState<string[]>([]);
  const [ccas, setCcas] = useState<string[]>([]);
  const [cultures, setCultures] = useState<string[]>([]);

  const [summaryExplanation, setSummaryExplanation] = useState<string>('');
  const [schoolExplanations, setSchoolExplanations] = useState<Record<string, string>>({});

  // Options (try /api/options; fall back to constants)
  const [sportsList, setSportsList] = useState<string[]>(FALLBACK_SPORTS);
  const [ccaList, setCcaList] = useState<string[]>(FALLBACK_CCAS);
  const [cultureList, setCultureList] = useState<string[]>(FALLBACK_CULTURE);

  // Results
  const [summary, setSummary] = useState<string>('');
  const [schools, setSchools] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const hasResults = schools.length > 0;
  const resultsRef = useRef<HTMLDivElement | null>(null);

  // Validate inputs
  useEffect(() => {
    const psleNum = Number(psle);
    setIsPsleValid(!isNaN(psleNum) && psleNum >= 4 && psleNum <= 30);
    setIsPostalValid(/^\d{6}$/.test(postal));
  }, [psle, postal]);

  const isFormValid =
    isPsleValid &&
    isPostalValid &&
    primarySchool !== '';

  useEffect(() => {
    if (hasResults) resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [hasResults]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!isFormValid) {
      alert('Please ensure all inputs are valid before submitting.');
      return;
    }

    setLoading(true);
    try {
      const geo = await fetch(`/api/geocode?pincode=${postal}`).then((r) =>
        r.json()
      );
      if (geo.error) throw new Error(geo.error);

      const body = {
        psle_score: Number(psle),
        gender,
        postal_code: postal,
        primary_school: primarySchool,
        distance_importance: distImp,
        sports_importance: sportImp,
        cca_importance: ccaImp,
        culture_importance: cultureImp,
        sports_selected: sports,
        ccas_selected: ccas,
        culture_selected: cultures,
        limit: 10,
        lat: geo.lat,
        lng: geo.lng,
      };

      const res = await fetch('/api/rank', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }).then((r) => r.json());

      if (res.error) throw new Error(res.error);
      setSummaryExplanation(res.summary || '');
      setSchools(res.schools || []);

      // /api/explain call
      const explainPayload = {
        schools: (res.schools || []).slice(0, 6).map((s: any) => ({
          code: String(s.code ?? s.school_code ?? ''),
          name: s.name ? formatSchoolName(s.name) : undefined,
        })),
        sports_selected: (sports && sports.length) ? sports : undefined,
        debug: true,
      };
      console.log('[explain] sending payload →', explainPayload);

      const explainRes = await fetch('/api/explain?debug=1', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(explainPayload),
      }).then((r) => r.json());

      console.log('[explain] response →', explainRes);

      setSummaryExplanation(explainRes.overall || '');
      setSchoolExplanations(
        Object.fromEntries(
          (explainRes.per_school || []).map((r: any) => [r.code, r.explanation])
        )
      );
    } catch (err: any) {
      alert(err?.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  const FormBlocks = (
    <form onSubmit={onSubmit} className="space-y-6">
      {/* 1. Basic Information */}
      <div className="rounded-xl border bg-white p-5 shadow-sm">
        <h3 className="text-lg font-semibold mb-4 text-gray-900">
          1. Basic Information
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              PSLE Score (4–30)
            </label>
            <input
              value={psle}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPsle(e.target.value)}
              type="number"
              min={4}
              max={32}
              placeholder="Enter score"
              className={`w-full rounded border px-3 py-2 text-black ${
                isPsleValid ? 'border-gray-300' : 'border-red-500'
              }`}
            />
            {!isPsleValid && (
              <p className="text-sm text-red-500">PSLE score must be a number between 4 and 30.</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              Gender Preference
            </label>
            <select
              value={gender}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setGender(e.target.value)}
              className="w-full rounded border border-gray-300 px-3 py-2 text-gray-900"
            >
              <option>Any</option>
              <option>Boys</option>
              <option>Girls</option>
              <option>Co-ed</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              Home Postal Code (6-digit)
            </label>
            <input
              value={postal}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPostal(e.target.value)}
              placeholder="6-digit postal code"
              className={`w-full rounded border px-3 py-2 text-black ${
                isPostalValid ? 'border-gray-300' : 'border-red-500'
              }`}
            />
            {!isPostalValid && (
              <p className="text-sm text-red-500">Please enter a valid 6-digit Singapore postal code.</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              Current Primary School
            </label>
            <SingleSelect
              placeholder="Select Primary School"
              options={PRIMARY_SCHOOLS}
              value={primarySchool}
              onChange={setPrimarySchool}
            />
            {primarySchool === '' && (
              <p className="text-sm text-red-500">Please select your primary school.</p>
            )}
          </div>
        </div>
      </div>

      {/* 2. Tell Us What's Important */}
      <div className="rounded-xl border bg-white p-5 shadow-sm">
        <h3 className="text-lg font-semibold mb-4 text-gray-900">2. Tell Us What’s Important</h3>

        <div className="space-y-6">
          {/* Sports */}
          <div className="rounded-lg border border-rose-100 bg-rose-50 p-4 space-y-3">
            <div className="font-medium text-gray-900">Sports Interests</div>
            <Importance label="" value={sportImp} onChange={setSportImp}/>
            <MultiSelect placeholder="Select sports..." options={FALLBACK_SPORTS} value={sports} onChange={setSports}/>
          </div>

          {/* CCAs */}
          <div className="rounded-lg border border-rose-100 bg-rose-50 p-4 space-y-3">
            <div className="font-medium text-gray-900">CCA Interests</div>
            <Importance label="" value={ccaImp} onChange={setCcaImp}/>
            <MultiSelect placeholder="Select CCAs..." options={FALLBACK_CCAS} value={ccas} onChange={setCcas}/>
          </div>

          {/* Culture */}
          <div className="rounded-lg border border-rose-100 bg-rose-50 p-4 space-y-3">
            <div className="font-medium text-gray-900">School Culture</div>
            <Importance label="" value={cultureImp} onChange={setCultureImp}/>
            <MultiSelect placeholder="Select culture traits..." options={FALLBACK_CULTURE} value={cultures} onChange={setCultures}/>
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={!isFormValid || loading}
        className="w-full rounded-lg bg-rose-600 px-4 py-3 font-medium text-white hover:bg-rose-700 disabled:opacity-60"
      >
        {loading ? 'Finding your matches…' : '✨ Find Schools for Me ✨'}
      </button>
    </form>
  );

  return (
    <main className="min-h-screen bg-gradient-to-b from-rose-50 to-orange-50">
      {/* ===== Top App Header with logo + nav ===== */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="/logo.svg"
              alt="School Advisor"
              width={160}
              height={40}
              priority
              className="h-10 w-auto"
            />
            <nav className="ml-2 flex items-center gap-2">
              <Link
                href="/"
                className="px-3 py-1.5 rounded text-sm font-medium text-gray-800 hover:bg-gray-100"
              >
                Home
              </Link>
              <Link
                href="/ranking"
                className="px-3 py-1.5 rounded text-sm font-medium text-gray-800 hover:text-white hover:bg-pink-600 transition-colors"
              >
                School Assistant
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* ===== Title strip ===== */}
      <header className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900">School Assistant</h1>
        <p className="mt-2 text-gray-700">Find your perfect Top 6 secondary schools with AI-powered insights</p>
        <span className="mt-3 inline-block rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700">Premium Feature</span>
      </header>

      {/* Layout shifts once we have results */}
      {!hasResults ? (
        // Centered form before results
        <section className="container mx-auto max-w-4xl px-4 pb-16 flex justify-center">
          <div className="w-full max-w-xl">{FormBlocks}</div>
        </section>
      ) : (
        // 2-column grid after results
        <section
          ref={resultsRef}
          className="container mx-auto px-4 pb-16 grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          {/* Left sticky filters */}
          <aside className="md:col-span-1 md:sticky md:top-6 self-start">
            {FormBlocks}
          </aside>

          {/* Right: AI summary + ranked cards */}
          <div className="md:col-span-2 space-y-6">
            {/* AI Summary */}
            {summaryExplanation && (
              <div className="bg-blue-50 p-4 rounded-lg shadow text-gray-700">
                <h2 className="text-xl font-semibold mb-2">Ranking Summary </h2>
                <p>{summaryExplanation}</p>
              </div>
            )}

            <h2 className="text-xl font-semibold text-gray-900">Your Top 6 School Matches</h2>

            {schools.map((s, i) => {
              const sportsText = schoolExplanations[s.code] || '';
              const mentioned = getMentionedSports(sportsText, FALLBACK_SPORTS);

              return (
                <div key={s.row_id} className="rounded-xl border bg-white p-6 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-100 font-semibold text-rose-700">
                        {i + 1}
                      </div>
                      <div>
                        <div className="text-lg font-semibold text-gray-900">{formatSchoolName(s.name)}</div>
                        <div className="text-sm text-gray-700">{s.address}</div>
                      </div>
                    </div>
                    <div className="text-sm text-gray-700">
                      {typeof s.distance_km === 'number' ? s.distance_km.toFixed(1) : ''} km
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {s.is_affiliated !== undefined && (
                      <span className={`rounded-full px-2 py-1 text-xs ${s.is_affiliated?'bg-green-100 text-green-800':'bg-red-100 text-red-800'}`}>
                        {s.is_affiliated ? 'Affiliated' : 'Non-affiliated'}
                      </span>
                    )}
                    
                    <span className="rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-800">
                      {s.track === 'IP'
                        ? 'Integrated Program'
                        : s.track === 'PG3_AFF'
                        ? 'Posting Group 3 (Affiliated)'
                        : s.track === 'PG2_AFF'
                        ? 'Posting Group 2 (Affiliated)'
                        : s.track === 'PG1_AFF'
                        ? 'Posting Group 1 (Affiliated)'
                        : s.posting_group != null
                        ? `Posting Group ${s.posting_group}`
                        : 'Posting Group'}
                    </span>
                    
                    {s.cop_max_score !== undefined && (
                      <span className="rounded-full bg-yellow-100 px-2 py-1 text-xs text-yellow-800"> {s.track === 'IP'
                        ? `IP Cut-off: ${s.cop_max_score}`
                        : s.track === 'PG3_AFF'|| s.track === 'PG2_AFF' || s.track === 'PG1_AFF'
                        ? `Affiliated Cut-off: ${s.cop_max_score}`
                        : `Cut-off: ${s.cop_max_score}`
                      }</span>
                    )}
                  </div>

                  {s.why && (
                    <div className="mt-4 rounded-xl border border-gray-200 bg-white p-4">
                      <div className="mb-2 text-sm font-semibold text-gray-900">
                        Why this school could be a great fit
                      </div>

                      {/* ===== MOBILE: horizontal rail (3 stretched boxes) ===== */}
                      <div className="md:hidden -mx-4 px-4">
                        <div
                          className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory"
                          aria-label="School strengths: Sports, CCAs, Culture"
                        >
                          {/* SPORTS */}
                          <section className="min-w-[85%] snap-start rounded-lg border border-green-200 bg-green-50 p-3">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-semibold text-green-900 uppercase tracking-wide">Sports</span>
                              <div className="flex flex-wrap gap-1">
                                {mentioned.map(sp => (
                                  <span
                                    key={sp}
                                    className="rounded-full bg-green-200 text-green-900 px-2 py-0.5 text-xs font-medium"
                                  >
                                    {sp}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <p className="text-sm leading-relaxed text-green-900">
                              {sportsText
                                ? highlightSports(sportsText, FALLBACK_SPORTS)
                                : <span className="text-green-800/70">No sports explanation available.</span>}
                            </p>
                          </section>

                          {/* CCAs (placeholder) */}
                          <section className="min-w-[85%] snap-start rounded-lg border border-indigo-200 bg-indigo-50 p-3">
                            <div className="text-sm font-semibold text-indigo-900 uppercase tracking-wide mb-2">CCAs</div>
                            <p className="text-sm leading-relaxed text-indigo-900">
                              We’ll add CCA performance highlights here (e.g., robotics medals, performing arts awards).
                            </p>
                          </section>

                          {/* Culture (placeholder) */}
                          <section className="min-w-[85%] snap-start rounded-lg border border-amber-200 bg-amber-50 p-3">
                            <div className="text-sm font-semibold text-amber-900 uppercase tracking-wide mb-2">Culture</div>
                            <p className="text-sm leading-relaxed text-amber-900">
                              We’ll summarise culture fit based on your chosen traits (e.g., leadership, service, excellence).
                            </p>
                          </section>
                        </div>
                      </div>

                      {/* ===== DESKTOP: 3-column grid ===== */}
                      <div className="hidden md:grid md:grid-cols-3 md:gap-4">
                        {/* SPORTS */}
                        <section className="rounded-lg border border-green-200 bg-green-50 p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-semibold text-green-900 uppercase tracking-wide">Sports</span>
                            <div className="flex flex-wrap gap-1">
                              {mentioned.map(sp => (
                                <span
                                  key={sp}
                                  className="rounded-full bg-green-200 text-green-900 px-2 py-0.5 text-xs font-medium"
                                >
                                  {sp}
                                </span>
                              ))}
                            </div>
                          </div>
                          <p className="text-sm leading-relaxed text-green-900">
                            {sportsText
                              ? highlightSports(sportsText, FALLBACK_SPORTS)
                              : <span className="text-green-800/70">No sports explanation available.</span>}
                          </p>
                        </section>

                        {/* CCAs (placeholder) */}
                        <section className="rounded-lg border border-indigo-200 bg-indigo-50 p-3">
                          <div className="text-sm font-semibold text-indigo-900 uppercase tracking-wide mb-2">CCAs</div>
                          <p className="text-sm leading-relaxed text-indigo-900">
                            We’ll add CCA performance highlights here (e.g., robotics medals, performing arts awards).
                          </p>
                        </section>

                        {/* Culture (placeholder) */}
                        <section className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                          <div className="text-sm font-semibold text-amber-900 uppercase tracking-wide mb-2">Culture</div>
                          <p className="text-sm leading-relaxed text-amber-900">
                            We’ll summarise culture fit based on your chosen traits (e.g., leadership, service, excellence).
                          </p>
                        </section>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}
    </main>
  );
}
