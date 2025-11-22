'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { sendGAEvent } from '@next/third-parties/google';
import Navigation from '@/components/ui/Navigation';
import { isValidSingaporePostalCode, getPostalCodeErrorMessage } from '@/lib/validation';
import MobileExplainerCards from '@/components/mobile/MobileExplainerCards';


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
  'Badminton','Basketball','Bowling','Canoeing','Cricket','Cross Country','Floorball','Football','Golf','Gymnastics','Hockey','Netball','Rugby','Sailing','SepakTakraw','Shooting','Softball','Squash','Swimming','Table Tennis','Taekwondo','Tennis','Track and Field','Volleyball','Water Polo','Wushu'
];
const FALLBACK_CCAS = [
  'Astronomy','Chemistry Olympiad','Math Olympiad','Robotics','National STEM'];
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
      {label ? <div className="text-sm font-medium text-white">{label}</div> : null}
      <div className="grid grid-cols-3 gap-2">
        {IMPORTANCE_OPTS.map((o) => (
          <button
            key={o}
            type="button"
            onClick={() => onChange(o)}
            className={`py-2 rounded border text-sm font-medium
              ${value===o ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-black border-gray-300 hover:bg-blue-50'}`}
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
              <span key={v} className="inline-flex items-center gap-1 rounded-full bg-gray-600 px-2 py-1 text-xs font-medium text-white">
                {v}
                <span onClick={(e)=>{e.stopPropagation(); removeChip(v);}} className="cursor-pointer text-gray-300 hover:text-white" aria-label={`Remove ${v}`}>×</span>
              </span>
            ))}
          </div>
        ) : <span className="text-placeholder">{placeholder}</span>}
      </button>

      {open && (
        <div className="absolute z-20 mt-1 w-full rounded border border-gray-200 bg-white shadow-lg">
          <div className="p-2 border-b">
            <input
              placeholder="Search…"
              value={q}
              onChange={(e: React.ChangeEvent<HTMLInputElement>)=>setQ(e.target.value)}
              className="w-full rounded border border-gray-200 px-2 py-1 text-sm text-black placeholder:text-placeholder"
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
                    className={`w-full px-3 py-2 text-left text-sm ${selected ? 'bg-blue-50 text-blue-700' : 'hover:bg-blue-50 text-black'}`}
                  >
                    <label className="inline-flex items-center gap-2">
                      <input type="checkbox" readOnly checked={selected}/>
                      {opt}
                    </label>
                  </button>
                </li>
              );
            })}
            {!filtered.length && <li className="px-3 py-2 text-sm text-muted">No matches</li>}
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
        className="w-full min-h-[42px] rounded border border-gray-300 bg-white px-2 py-2 text-left text-black"
      >
        {value ? (
          <span className="text-black">{value}</span>
        ) : (
          <span className="text-placeholder">{placeholder}</span>
        )}
      </button>

      {open && (
        <div className="absolute z-20 mt-1 w-full rounded border border-gray-200 bg-white shadow-lg">
          <div className="p-2 border-b">
            <input
              placeholder="Search…"
              value={q}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQ(e.target.value)}
              className="w-full rounded border border-gray-200 px-2 py-1 text-sm text-black placeholder:text-placeholder"
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
                    value === opt ? 'bg-blue-50 text-blue-700' : 'hover:bg-blue-50 text-black'
                  }`}
                >
                  {opt}
                </button>
              </li>
            ))}
            {!filtered.length && <li className="px-3 py-2 text-sm text-muted">No matches</li>}
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
  if (!text) return <span className="text-muted">No sports explanation available.</span>;
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
  const [schoolCultureShort, setSchoolCultureShort] = useState<Record<string, string>>({});


  // Validation states
  const [isPsleValid, setIsPsleValid] = useState<boolean>(false);
  const [isPostalValid, setIsPostalValid] = useState<boolean>(false);
  const [postalError, setPostalError] = useState<string>('');

  // Priorities
  const [distImp, setDistImp] = useState<ImportanceLevel>('Low');
  const [sportImp, setSportImp] = useState<ImportanceLevel>('Low');
  const [ccaImp, setCcaImp] = useState<ImportanceLevel>('Low');
  const [cultureImp, setCultureImp] = useState<ImportanceLevel>('Low');
  const [ccaExpl, setCcaExpl] = useState<Record<string, string>>({});


  const [sports, setSports] = useState<string[]>([]);
  const [ccas, setCcas] = useState<string[]>([]);
  const [cultures, setCultures] = useState<string[]>([]);

  const [summaryExplanation, setSummaryExplanation] = useState<string>('');
  const [schoolExplanations, setSchoolExplanations] = useState<Record<string, string>>({});

  // Options (dynamic from API with fallbacks)
  const [sportsList, setSportsList] = useState<string[]>(FALLBACK_SPORTS);
  const [ccaList, setCcaList] = useState<string[]>(FALLBACK_CCAS);
  const [cultureList, setCultureList] = useState<string[]>(FALLBACK_CULTURE);
  const [optionsLoading, setOptionsLoading] = useState<boolean>(true);
  const [optionsError, setOptionsError] = useState<string>('');

  // Results
  const [summary, setSummary] = useState<string>('');
  const [schools, setSchools] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [hasPerformedSearch, setHasPerformedSearch] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const hasResults = schools.length > 0;
  const hasSearched = hasPerformedSearch; // Has run a search (regardless of results)
  const resultsRef = useRef<HTMLDivElement | null>(null);

  // Fetch dynamic options from API
  useEffect(() => {
    async function fetchOptions() {
      try {
        setOptionsLoading(true);
        const response = await fetch('/api/options');

        if (!response.ok) {
          throw new Error(`Failed to fetch options: ${response.status}`);
        }

        const data = await response.json();

        // Update state with API data, keeping fallbacks as defaults
        if (data.sports && Array.isArray(data.sports)) {
          setSportsList(data.sports);
        }
        if (data.ccas && Array.isArray(data.ccas)) {
          setCcaList(data.ccas);
        }
        if (data.culture && Array.isArray(data.culture)) {
          setCultureList(data.culture);
        }

        setOptionsError('');
      } catch (error) {
        console.error('Failed to fetch options:', error);
        setOptionsError('Unable to load options. Using default values.');
        // Keep fallback values already set in state
      } finally {
        setOptionsLoading(false);
      }
    }

    fetchOptions();
  }, []);

  // Validate inputs
  useEffect(() => {
    const psleNum = Number(psle);
    setIsPsleValid(!isNaN(psleNum) && psleNum >= 4 && psleNum <= 30);

    const postalValid = isValidSingaporePostalCode(postal);
    setIsPostalValid(postalValid);

    if (postal.length > 0 && !postalValid) {
      setPostalError(getPostalCodeErrorMessage(postal));
    } else {
      setPostalError('');
    }
  }, [psle, postal]);

  const isFormValid =
    isPsleValid &&
    isPostalValid &&
    primarySchool !== '' &&
    !optionsLoading;

  useEffect(() => {
    if (hasResults) resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [hasResults]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!isFormValid) {
      // Track form validation failure
      sendGAEvent('event', 'ai_ranking_validation_failed', {
        psle_score: Number(psle) || null,
        gender: gender || null,
        postal_code: postal || null,
        primary_school: primarySchool || null,
        has_sports_selected: sports.length > 0,
        has_ccas_selected: ccas.length > 0,
        has_culture_selected: cultures.length > 0
      });
      alert('Please ensure all inputs are valid before submitting.');
      return;
    }

    // Track AI ranking search attempt
    sendGAEvent('event', 'ai_ranking_search_attempt', {
      psle_score: Number(psle),
      gender,
      postal_code: postal,
      primary_school: primarySchool,
      distance_importance: distImp,
      sports_importance: sportImp,
      cca_importance: ccaImp,
      culture_importance: cultureImp,
      sports_count: sports.length,
      ccas_count: ccas.length,
      culture_count: cultures.length,
      sports_selected: sports.join(','),
      ccas_selected: ccas.join(','),
      culture_selected: cultures.join(',')
    });

    setLoading(true);
    setHasPerformedSearch(false); // Reset search flag when starting new search
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
      setSuggestions(res.suggestions || []);
      setHasPerformedSearch(true); // Mark that we've performed a search

      // /api/explain call
     const explainPayload = {
  schools: (res.schools || []).slice(0, 6).map((s: any) => ({
    code: String(s.code ?? s.school_code ?? ''),
    name: s.name ? formatSchoolName(s.name) : undefined,
  })),
  sports_selected: (sports && sports.length) ? sports : undefined,
  ccas_selected: (ccas && ccas.length) ? ccas : undefined,   // ← NEW
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
      setSchoolCultureShort(
       Object.fromEntries(
        (explainRes.per_school || []).map((r: any) => [r.code, r.culture_short || ''])
      )
      );

setCcaExpl(
  Object.fromEntries(
    (explainRes.per_school || []).map((r: any) => [r.code, r.cca_explanation || ''])
  )
);

      // Track successful AI ranking completion
      sendGAEvent('event', 'ai_ranking_search_success', {
        psle_score: Number(psle),
        gender,
        postal_code: postal,
        primary_school: primarySchool,
        results_count: (res.schools || []).length,
        sports_count: sports.length,
        ccas_count: ccas.length,
        culture_count: cultures.length,
        has_summary_explanation: !!(res.summary || explainRes.overall),
        has_school_explanations: (explainRes.per_school || []).length > 0,
        search_type: 'ai_assistant_ranking'
      });

    } catch (err: any) {
      console.error('AI ranking search failed:', err);

      // Track ranking search error
      sendGAEvent('event', 'ai_ranking_search_error', {
        psle_score: Number(psle),
        gender,
        postal_code: postal,
        primary_school: primarySchool,
        error_message: err?.message || String(err),
        sports_count: sports.length,
        ccas_count: ccas.length,
        culture_count: cultures.length
      });

      // Provide user-friendly error messages
      let errorMessage = 'An unexpected error occurred. Please try again.';

      if (err?.message?.includes('geocode')) {
        errorMessage = 'Unable to validate your postal code. Please check and try again.';
      } else if (err?.message?.includes('rank')) {
        errorMessage = 'Unable to rank schools at the moment. Please try again later.';
      } else if (err?.message?.includes('explain')) {
        errorMessage = 'School recommendations generated, but detailed explanations are temporarily unavailable.';
      } else if (err?.message?.includes('network') || err?.message?.includes('fetch')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      }

      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  const FormBlocks = (
    <form onSubmit={onSubmit} className="space-y-6">
      {/* 1. Basic Information */}
      <div className="card-base bg-gray-800 border-gray-700">
        <h3 className="text-lg font-semibold mb-4 text-white ranking-basic-info-title">
          1. Basic Information
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white mb-1 ranking-label-psle">
              PSLE Score (4–30)
            </label>
            <input
              value={psle}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPsle(e.target.value)}
              type="number"
              min={4}
              max={30}
              placeholder="Enter score"
              className={`input-modern ${
                isPsleValid ? 'border-gray-300' : 'border-red-500'
              }`}
            />
            {!isPsleValid && (
              <p className="text-sm text-red-400">PSLE score must be a number between 4 and 30</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-1 ranking-label-gender">
              Gender Preference
            </label>
            <SingleSelect
              placeholder="Select Gender Preference"
              options={['Any', 'Boys', 'Girls', 'Co-ed']}
              value={gender}
              onChange={setGender}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-1 ranking-label-postal">
              Home Postal Code (6-digit)
            </label>
            <input
              value={postal}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPostal(e.target.value)}
              placeholder="6-digit postal code"
              className={`input-modern ${
                isPostalValid ? 'border-gray-300' : 'border-red-500'
              }`}
            />
            {!isPostalValid && postalError && (
              <p className="text-sm text-red-400">{postalError}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-1 ranking-label-primary">
              Current Primary School
            </label>
            <SingleSelect
              placeholder="Select Primary School"
              options={PRIMARY_SCHOOLS}
              value={primarySchool}
              onChange={setPrimarySchool}
            />
            {primarySchool === '' && (
              <p className="text-sm text-red-400">Please select your primary school.</p>
            )}
          </div>
        </div>
      </div>

      {/* 2. Tell Us What's Important */}
      <div className="card-base bg-gray-800 border-gray-700">
        <h3 className="text-lg font-semibold mb-4 text-white ranking-section-title">2. Tell Us What's Important</h3>

        {/* Options Loading/Error State */}
        {optionsLoading && (
          <div className="mb-4 p-3 bg-blue-100 border border-blue-300 rounded-lg">
            <p className="text-blue-800 text-sm">Loading preferences options...</p>
          </div>
        )}

        {optionsError && (
          <div className="mb-4 p-3 bg-yellow-100 border border-yellow-300 rounded-lg">
            <p className="text-yellow-800 text-sm">{optionsError}</p>
          </div>
        )}

        <div className="space-y-6">
          {/* Sports */}
          <div className="rounded-lg border border-gray-600 bg-gray-700 p-4 space-y-3">
            <div className="font-medium text-white">Sports Interests</div>
            <Importance label="" value={sportImp} onChange={setSportImp}/>
            <MultiSelect
              placeholder={optionsLoading ? "Loading sports..." : "Select sports..."}
              options={sportsList}
              value={sports}
              onChange={setSports}
            />
          </div>

          {/* CCAs */}
          <div className="rounded-lg border border-gray-600 bg-gray-700 p-4 space-y-3">
            <div className="font-medium text-white">CCA Interests</div>
            <Importance label="" value={ccaImp} onChange={setCcaImp}/>
            <MultiSelect
              placeholder={optionsLoading ? "Loading CCAs..." : "Select CCAs..."}
              options={ccaList}
              value={ccas}
              onChange={setCcas}
            />
          </div>

          {/* Culture */}
          <div className="rounded-lg border border-gray-600 bg-gray-700 p-4 space-y-3">
            <div className="font-medium text-white">School Culture</div>
            <Importance label="" value={cultureImp} onChange={setCultureImp}/>
            <MultiSelect
              placeholder={optionsLoading ? "Loading culture traits..." : "Select culture traits..."}
              options={cultureList}
              value={cultures}
              onChange={setCultures}
            />
          </div>
        </div>
      </div>

      <button
        id="search-btn"
        type="submit"
        disabled={!isFormValid || loading}
        className="btn-primary w-full disabled:opacity-60"
      >
        {optionsLoading ? 'Loading preferences...' : loading ? 'Finding your matches…' : '✨ Find Schools for Me ✨'}
      </button>

      {/* Zero Results Message - shown below the search button */}
      {hasSearched && !hasResults && (
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center justify-center mb-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-100">
              <svg className="h-4 w-4 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
          </div>
          <h3 className="text-sm font-semibold text-yellow-800 mb-2 text-center">No Schools Found</h3>
          <p className="text-yellow-700 text-sm mb-3 text-center">
            {suggestions.length > 0
              ? "No schools match your current criteria. Try these suggestions:"
              : "No schools match your current criteria. Try adjusting your preferences and searching again."
            }
          </p>

          {suggestions.length > 0 && (
            <div className="space-y-2 mb-4">
              {suggestions.map((suggestion, index) => (
                <div key={index} className="flex items-start space-x-2">
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-yellow-200 text-yellow-800 text-xs font-medium mt-0.5">
                    {index + 1}
                  </span>
                  <span className="text-yellow-700 text-sm">{suggestion}</span>
                </div>
              ))}
            </div>
          )}

          {/* Quick Action Buttons */}
          {gender && gender !== 'Any' && (
            <div className="flex justify-center">
              <button
                onClick={() => {
                  setGender('Any');
                  // Trigger search automatically after a short delay
                  setTimeout(() => {
                    const form = document.querySelector('form');
                    if (form) {
                      const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
                      form.dispatchEvent(submitEvent);
                    }
                  }, 100);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium"
              >
                Try "Any Gender"
              </button>
            </div>
          )}
        </div>
      )}
    </form>
  );

  return (
    <main className="min-h-screen pb-20 max-sm:pb-20 sm:pb-0">
      <Navigation />

      {/* ===== Hero section with light background ===== */}
      <section className="bg-white text-black">
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-3xl font-bold text-black">Find Secondary Schools with more than PSLE AL Score</h1>
          <p className="mt-2 text-black">Get personalized Top 6 secondary school recommendations based on your AL Score, preferences, and location</p>
        </div>
      </section>

      {/* Layout shifts once we have searched */}
      {!hasSearched ? (
        // Centered form before any search
        <section className="bg-gray-900 min-h-screen">
          <div className="container mx-auto max-w-4xl px-4 py-16 flex justify-center">
            <div className="w-full max-w-xl">{FormBlocks}</div>
          </div>
        </section>
      ) : (
        // 2-column grid after results
        <section
          ref={resultsRef}
          className="bg-gray-900 min-h-screen"
        >
          <div className="container mx-auto px-4 py-16 grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left sticky filters */}
            <aside className="lg:col-span-1 lg:sticky lg:top-6 self-start">
              <div className="w-full">{FormBlocks}</div>
            </aside>

            {/* Right: AI summary + ranked cards */}
            <div className="lg:col-span-2 space-y-6 bg-gray-900 p-6 rounded-lg">
            {/* AI Summary */}
            {summaryExplanation && (
              <div className="bg-gray-800 border border-gray-600 p-4 rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-2 text-white">Ranking Summary</h2>
                <p className="text-gray-300">{summaryExplanation}</p>
              </div>
            )}

            {/* Recommendations Summary - only show when we have results */}
            {hasResults && (
              <div className="bg-gray-900 p-4 mb-6">
                <h2 className="text-xl font-bold mb-2 text-black ranking-results-summary-title">Recommendations Summary</h2>
                <div className="text-black">
                  <p className="mb-3 ranking-results-summary-text">Below {Math.min(schools.length, 6)} school choices provide the best fit based on your preferences.</p>
                  <ul className="list-disc pl-5 space-y-1 ranking-results-disclaimer">
                    <li>Sports data is based on schools performance at the National School Games over 2022-2024.</li>
                    <li>CCA data is based on publicly available information at organizer or school websites.</li>
                    <li>Culture Summaries are generated from Principal's message and Values reported on school websites.</li>
                  </ul>
                </div>
              </div>
            )}

{/* Section break line - only show when we have results */}
{hasResults && <div className="border-t border-gray-600 mb-6"></div>}

{/* Top 6 Schools or No Results */}
{hasResults ? (
  <>
    <h2 className="text-xl font-semibold text-black">Your Top 6 School Matches</h2>
    {schools.slice(0, 6).map((s, i) => {
              const sportsText = schoolExplanations[s.code] || '';
              const mentioned = getMentionedSports(sportsText, sportsList);
              const cultureShort = schoolCultureShort[s.code] || '';
              const cultureTags: string[] = Array.isArray(s.culture_top_titles) ? s.culture_top_titles : [];
              return (
                <div key={s.row_id} className="card-school-result card-interactive">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-700">
                        {i + 1}
                      </div>
                      <div>
                        <div className="text-lg font-semibold text-black">{formatSchoolName(s.name)}</div>
                        <div className="text-sm text-secondary">{s.address}</div>
                      </div>
                    </div>
                    <div className="text-sm text-secondary">
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

                  {/* View Profile Button */}
                  <div className="mt-4">
                    <Link
                      href={`/school/${s.code || s.school_code}`}
                      className="btn-primary text-sm"
                    >
                      <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                      </svg>
                      View Profile
                    </Link>
                  </div>

                  {s.why && (
                    <div className="mt-4 rounded-xl border border-gray-200 bg-white p-4">
                      <div className="mb-2 text-sm font-semibold text-black">
                        Why this school could be a great fit
                      </div>


                      {/* ===== MOBILE ONLY: Swipeable explainer cards ===== */}
                      <div className="mobile-only">
                        <MobileExplainerCards
                          sportsData={{
                            text: sportsText,
                            mentionedSports: mentioned
                          }}
                          ccasData={{
                            text: ccaExpl[String(s.code)] || ''
                          }}
                          cultureData={{
                            text: cultureShort || 'Culture summary coming soon.',
                            cultureTags: cultureTags
                          }}
                        />
                      </div>

                      {/* ===== DESKTOP ONLY: 3-column grid ===== */}
                      <div className="desktop-only grid-cols-3 gap-4">
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
                              ? highlightSports(sportsText, sportsList)
                              : <span className="text-green-800/70">Couldn't find a fit with sports selected</span>}
                          </p>
                        </section>

                        {/* CCAs */}
                        <section className="rounded-lg border border-indigo-200 bg-indigo-50 p-3">
                          <div className="text-sm font-semibold text-indigo-900 uppercase tracking-wide mb-2">CCAs</div>
                          <p className="text-sm leading-relaxed text-indigo-900">
                            {(ccaExpl[String(s.code)] || '').trim()
                              ? ccaExpl[String(s.code)]
                              : <span className="text-indigo-900/70">Couldn't find a fit with CCAs selected</span>}
                          </p>
                        </section>


                        {/* Culture (placeholder) */}
                        <section className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                          <div className="text-sm font-semibold text-amber-900 uppercase tracking-wide mb-2">Culture</div>
                           {cultureTags.map((t) => (
                            <span
                             key={t}
                            className="rounded-full bg-amber-200 text-amber-900 px-2 py-0.5 text-xs font-medium"
                             >
                           {t}
                           </span>
                        ))}
                        
                          <p className="text-sm leading-relaxed text-amber-900">
                           {cultureShort || 'Culture summary coming soon.'} </p>
                        </section>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Other Schools to Consider */}
            {schools.length > 6 && (
              <>
                <h2 className="text-xl font-semibold text-black mt-8">Other Schools to Consider</h2>
                {schools.slice(6, 10).map((s, i) => {
                  const sportsText = schoolExplanations[s.code] || '';
                  const mentioned = getMentionedSports(sportsText, sportsList);
                  const cultureShort = schoolCultureShort[s.code] || '';
                  const cultureTags: string[] = Array.isArray(s.culture_top_titles) ? s.culture_top_titles : [];
                  return (
                    <div
                      key={s.row_id}
                      className="rounded-xl border bg-gray-100 p-6 shadow-sm"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white font-semibold text-black">
                            {i + 7}
                          </div>
                          <div>
                            <div className="text-lg font-semibold text-white">{formatSchoolName(s.name)}</div>
                            <div className="text-sm text-white">{s.address}</div>
                          </div>
                        </div>
                        <div className="text-sm text-white">
                          {typeof s.distance_km === 'number' ? s.distance_km.toFixed(1) : ''} km
                        </div>
                      </div>

                      {/* Tags/Chips */}
                      <div className="mt-3 flex flex-wrap gap-2">
                        {s.is_affiliated !== undefined && (
                          <span
                            className={`rounded-full px-2 py-1 text-xs ${
                              s.is_affiliated
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
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
                          <span className="rounded-full bg-yellow-100 px-2 py-1 text-xs text-yellow-800">
                            {s.track === 'IP'
                              ? `IP Cut-off: ${s.cop_max_score}`
                              : s.track === 'PG3_AFF' || s.track === 'PG2_AFF' || s.track === 'PG1_AFF'
                              ? `Affiliated Cut-off: ${s.cop_max_score}`
                              : `Cut-off: ${s.cop_max_score}`}
                          </span>
                        )}
                      </div>

                      {/* View Profile Button */}
                      <div className="mt-4">
                        <Link
                          href={`/school/${s.code || s.school_code}`}
                          className="btn-primary text-sm"
                        >
                          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                          </svg>
                          View Profile
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </>
            )}
  </>
) : (
  /* No Results Section */
  <div className="text-center py-12">
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
      <div className="flex items-center justify-center mb-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100">
          <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
      </div>
      <h3 className="text-lg font-semibold text-yellow-800 mb-2">No Schools Found</h3>
      <p className="text-yellow-700 mb-4">
        No schools match your current criteria. Here are some suggestions to help you find suitable schools:
      </p>

      {suggestions.length > 0 && (
        <div className="text-left">
          <h4 className="font-medium text-yellow-800 mb-3">Suggestions:</h4>
          <ul className="space-y-2">
            {suggestions.map((suggestion, index) => (
              <li key={index} className="flex items-start space-x-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-yellow-200 text-yellow-800 text-xs font-medium">
                  {index + 1}
                </span>
                <span className="text-yellow-700">{suggestion}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>

    {/* Quick Action Buttons */}
    {gender && gender !== 'Any' && (
      <div className="flex justify-center space-x-4 mb-6">
        <button
          onClick={() => {
            setGender('Any');
            // Trigger search automatically
            setTimeout(() => document.getElementById('search-btn')?.click(), 100);
          }}
          className="btn-primary bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
        >
          Try "Any Gender"
        </button>
      </div>
    )}

    <p className="text-gray-600 text-sm">
      Adjust your preferences in the form on the left and search again.
    </p>
  </div>
)}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
