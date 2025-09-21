"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

// Convert slugs like "hwa-chong-institute" -> "Hwa Chong Institute"
function humanize(input?: string) {
  if (!input) return "";
  return input
    .split(/[-_]/g)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export default function HomePage() {
  // form state (unchanged: the 3 inputs + CTA)
  const [psle, setPsle] = useState("");
  const [primary, setPrimary] = useState("");
  const [postal, setPostal] = useState("");

  // results (we hide the feature cards once results exist)
  const [results, setResults] = useState<any[]>([]);
  const resultsRef = useRef<HTMLDivElement>(null);

  // primaries for the select
  const { data: primaries } = useSWR("/api/primaries", fetcher);

  useEffect(() => {
    if (results.length) {
      resultsRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [results]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    // 1) geocode postal
    const geo = await fetch(`/api/geocode?pincode=${postal}`).then((r) => r.json());
    if (geo.error) return alert(geo.error);

    // 2) call the SEARCH endpoint (distance‑first), NOT the ranking one
    const params = new URLSearchParams({
      score: psle,
      primary,
      lat: String(geo.lat),
      lng: String(geo.lng),
      inYear: '2024',
      maxDistanceKm: "10",
    });

    const data = await fetch(`/api/search?${params}`).then((r) => r.json());
    if (data?.error) return alert(data.error);

    // 3) make sure it's strictly sorted by distance (safety net)
    const normDist = (s: any) =>
      s?.distance_m != null ? Number(s.distance_m) : Number(s?.distance_km ?? 0) * 1000;

    const byDistance = [...(data ?? [])].sort((a, b) => normDist(a) - normDist(b));

    setResults(byDistance);
  }

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-gray-200">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
    <div className="flex items-center gap-3">
      {/* Logo wrapped in a Link */}
      <Link href="/">
        <Image
          src="/logo.svg"
          alt="School Advisor"
          width={160}
          height={40}
          priority
          className="h-10 w-auto"
        />
      </Link>
      <nav className="ml-2 flex items-center gap-2">
        <Link
          href="/"
          className="px-3 py-1.5 rounded text-sm font-medium text-gray-800 hover:bg-gray-100"
        >
          Home
        </Link>
        <Link
          href="/ranking"
          className="flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium text-gray-800 hover:text-white hover:bg-pink-600 transition-colors"
        >
          <span>School Assistant</span>
          <span className="bg-pink-600 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
            New
          </span>
        </Link>
      </nav>
    </div>
  </div>
</header>

     {/* HERO — full bleed, anchored right, blended into dark left */}
<section className="relative isolate min-h-[560px] md:min-h-[640px] lg:min-h-[720px]">
  {/* Full image covers entire hero */}
  <Image
    src="/hero.jpg"
    alt="Graduation background"
    fill
    priority
    sizes="100vw"
    className="object-cover"
    style={{ objectPosition: "20% 40%" }} // shift focal point: 80% right, 40% down
  />

  {/* Gradient overlay: dark on left, transparent on right */}
  <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />

  {/* Content left side */}
  <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14 md:py-24">
  {/* Give BOTH the text and the form the same width */}
  <div className="text-white w-full max-w-[48rem] md:max-w-[35rem]"> {/* ≈768–832px */}
    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight drop-shadow">
      <span className="block">Search beyond</span>
      <span className="block">PSLE scores</span>
    </h1>
      <p className="mt-4 sm:mt-6 text-white/90 text-lg">
        Sports | CCAs | Culture insights - Try the School Assistant now!
      </p>

            {/* Search panel – left aligned under subtitle */}
           {/* Search panel — same width & left edge as the text */}
    <form
      onSubmit={onSubmit}
      className="mt-6 sm:mt-8 w-full bg-white/95 backdrop-blur rounded-2xl shadow-xl p-4 sm:p-5 lg:p-6"
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <input
          type="number"
          placeholder="PSLE score"
          value={psle}
          onChange={(e) => setPsle(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500"
          required
        />

        <select
          value={primary}
          onChange={(e) => setPrimary(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-pink-500"
          required
        >
          <option value="">Primary school</option>
          {primaries?.map((p: any) => (
            <option key={p.slug} value={p.slug}>
              {p.name}
            </option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Postal code"
          value={postal}
          onChange={(e) => setPostal(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500"
          required
        />
      </div>

      <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-3">
        <button
          type="submit"
          className="inline-flex justify-center items-center rounded-lg bg-pink-600 px-5 py-3 text-white font-semibold hover:bg-pink-700"
        >
          Find Schools Now
        </button>
      </div>
    </form>
          </div>
        </div>
      </section>

      {/* Feature Cards (hidden once results show) */}
      {results.length === 0 && (
        <section className="py-14">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-center">
              School Advisor SG Difference
            </h2>
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="rounded-2xl border border-gray-200 p-6 shadow-sm">
                <div className="text-3xl">⭐</div>
                <h3 className="mt-3 font-semibold">Sports/CCAs Data</h3>
                <p className="mt-2 text-gray-600">
                  Find schools excelling in sports and CCAs, with data from National School Games and publicly reported sources.
                </p>
              </div>
              <div className="rounded-2xl border border-gray-200 p-6 shadow-sm">
                <div className="text-3xl">✨</div>
                <h3 className="mt-3 font-semibold">School Culture Insights</h3>
                <p className="mt-2 text-gray-600">
                  Know what the schools stand for with AI-generated summaries of their culture and values.
                </p>
              </div>
              <div className="rounded-2xl border border-gray-200 p-6 shadow-sm">
                <div className="text-3xl">📍</div>
                <h3 className="mt-3 font-semibold">Affiliations/IPs</h3>
                <p className="mt-2 text-gray-600">
                  Get personalized recommendations considering your primary school affiliations and Integrated Program options.
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Results (distance‑first; humanized names; responsive 1→2 columns) */}
      {results.length > 0 && (
        <section ref={resultsRef} className="py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            {results.map((s: any) => {
              const name = s.full_name || humanize(s.name);
              const km =
                s?.distance_km != null
                  ? Number(s.distance_km).toFixed(1)
                  : (Number(s?.distance_m ?? 0) / 1000).toFixed(1);
              const pg = s?.posting_group != null ? `PG ${s.posting_group}` : "IP";

              return (
                <div key={s.code ?? `${name}-${km}`} className="rounded-2xl border border-gray-200 p-6 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold">{name}</h3>
                      {s?.address && (
                        <p className="mt-1 text-sm text-gray-600">{s.address}</p>
                      )}
                      <div className="flex flex-wrap gap-2">
  {/* Affiliated badge */}
  <span className={`px-2 py-1 text-xs rounded-full ${
    s.is_affiliated ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
  }`}>
    {s.is_affiliated ? 'Affiliated' : 'Non-affiliated'}
  </span>

  {/* Stream tag */}
  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
    {s.posting_group == null ? 'Integrated Program' : `Posting Group ${s.posting_group}`}
  </span>

 {/* Cut-off badges (show up to three) */}
{s.ip_cutoff_max != null && (
  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
    Integrated Program Cut-off: {s.ip_cutoff_max}
  </span>
)}

{s.aff_pg_cutoff_max != null && (
  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
    Affiliated Cut-off: {s.aff_pg_cutoff_max}
  </span>
)}

{s.open_pg_cutoff_max != null && s.open_pg != null && (
  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
    Posting Group {s.open_pg} Cut-off: {s.open_pg_cutoff_max}
  </span>
)}
                      </div>
                    </div>
                    <span className="text-sm text-gray-500 whitespace-nowrap">{km} km</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
