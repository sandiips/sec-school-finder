'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

// Simple title‑case helper
function humanize(slug: string) {
  return slug
    .split(/[-_]/g)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export default function SchoolRankingAssistantPage() {
  // form state
  const [psle, setPsle] = useState('');
  const [primary, setPrimary] = useState('');
  const [home, setHome] = useState('');
  const [maxDistance, setMaxDistance] = useState('5');
  const [distImp, setDistImp] = useState<'High' | 'Medium' | 'Low'>('High');
  const [sportImp, setSportImp] = useState<'High' | 'Medium' | 'Low'>('Medium');
  const [ccaImp, setCcaImp] = useState<'High' | 'Medium' | 'Low'>('Medium');

  // results
  const [rankingResults, setRankingResults] = useState<any[]>([]);
  const resultsRef = useRef<HTMLDivElement>(null);

  // load primary school list
  const { data: primaries } = useSWR('/api/primaries', fetcher);

  // scroll to results on load
  useEffect(() => {
    if (rankingResults.length) {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [rankingResults]);

  // handle form submit
  async function searchRanking(e: React.FormEvent) {
    e.preventDefault();
    // geocode pincode
    const geo = await fetch(`/api/geocode?pincode=${home}`).then((r) => r.json());
    if (geo.error) return alert(geo.error);

    const weightMap = { High: 0.4, Medium: 0.2, Low: 0.0 };
    const qs = new URLSearchParams({
      score: psle,
      primary,
      lat: String(geo.lat),
      lng: String(geo.lng),
      maxDistanceKm: maxDistance,
      weightDist: String(weightMap[distImp]),
      weightSport: String(weightMap[sportImp]),
      weightCca: String(weightMap[ccaImp]),
      limitCount: '6',
    });
    const data = await fetch(`/api/rank?${qs}`).then((r) => r.json());
    if (data.error) return alert(data.error);
    setRankingResults(data);
  }

  return (
    <main className="space-y-10">
      {/* Top Nav (no background) */}
      <div className="py-2">
        <div className="container mx-auto px-4 flex space-x-4">
          <Link
            href="/"
            className="px-4 py-2 rounded bg-white text-gray-700 hover:bg-gray-100"
          >
            Home
          </Link>
          <Link
            href="/ranking"
            className="px-4 py-2 rounded bg-pink-600 text-white"
          >
            School Ranking Assistant
          </Link>
        </div>
      </div>

      {/* Preferences Form & Results */}
      <section
        ref={resultsRef}
        className="container mx-auto px-4 py-8 flex flex-col md:flex-row gap-8"
      >
        {/* Form */}
        <div className="md:w-1/3 bg-white p-6 rounded-lg shadow space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">
            School Ranking Assistant
          </h2>
          <form onSubmit={searchRanking} className="space-y-4">
            {/* PSLE Score */}
            <div>
              <label className="block text-gray-700 mb-1">
                Expected PSLE Score
              </label>
              <input
                type="number"
                value={psle}
                onChange={(e) => setPsle(e.target.value)}
                required
                className="w-full p-3 border border-gray-300 rounded text-black"
              />
            </div>

            {/* Primary School */}
            <div>
              <label className="block text-gray-700 mb-1">
                Current Primary School
              </label>
              <select
                value={primary}
                onChange={(e) => setPrimary(e.target.value)}
                required
                className="w-full p-3 border border-gray-300 rounded text-black"
              >
                <option value="">Select Primary School</option>
                {primaries?.map((p: any) => (
                  <option key={p.slug} value={p.slug}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Home Pincode */}
            <div>
              <label className="block text-gray-700 mb-1">
                Home Base Postal Code
              </label>
              <input
                type="text"
                value={home}
                onChange={(e) => setHome(e.target.value)}
                required
                className="w-full p-3 border border-gray-300 rounded text-black"
              />
            </div>

            {/* Max Distance */}
            <div>
              <label className="block text-gray-700 mb-1">
                Max Distance (km)
              </label>
              <input
                type="number"
                value={maxDistance}
                onChange={(e) => setMaxDistance(e.target.value)}
                required
                className="w-full p-3 border border-gray-300 rounded text-black"
              />
            </div>

            {/* Importance Settings */}
            <div>
              <label className="block text-gray-700 mb-1">
                Importance of Distance
              </label>
              <select
                value={distImp}
                onChange={(e) => setDistImp(e.target.value as any)}
                className="w-full p-3 border border-gray-300 rounded text-black"
              >
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
              </select>
            </div>
            <div>
              <label className="block text-gray-700 mb-1">
                Sports Program Importance
              </label>
              <select
                value={sportImp}
                onChange={(e) => setSportImp(e.target.value as any)}
                className="w-full p-3 border border-gray-300 rounded text-black"
              >
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
              </select>
            </div>
            <div>
              <label className="block text-gray-700 mb-1">
                Other CCA Importance
              </label>
              <select
                value={ccaImp}
                onChange={(e) => setCcaImp(e.target.value as any)}
                className="w-full p-3 border border-gray-300 rounded text-black"
              >
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full bg-pink-600 hover:bg-pink-700 text-white p-3 rounded"
            >
              Generate My School Rankings
            </button>
          </form>
        </div>

        {/* Ranking Results */}
        <div className="md:w-2/3 space-y-6">
          {rankingResults.length === 0 ? (
            <p className="text-gray-600">
              Answer the questions and click “Generate My School Rankings”.
            </p>
          ) : (
            rankingResults.map((s, i) => {
              const name = s.full_name || humanize(s.name);
              const km = s.distance_km != null
                ? s.distance_km.toFixed(1)
                : (s.distance_m / 1000).toFixed(1);
              const pg = s.posting_group != null ? `PG ${s.posting_group}` : 'IP';

              return (
                <div
                  key={s.code}
                  className="bg-white p-6 rounded-lg shadow space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="text-xl font-bold text-pink-600">
                        {i + 1}
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {name}
                      </h3>
                    </div>
                    <span className="text-gray-500">{km} km</span>
                  </div>

                  <div className="flex gap-2">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        s.is_affiliated
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {s.is_affiliated ? 'Affiliated' : 'Non‑affiliated'}
                    </span>
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                      {pg}
                    </span>
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                      Cut‑off: {s.cop_max_score}
                    </span>
                  </div>

                  <p className="text-gray-600">
                    Ranked #{i + 1} based on your preferences. Located {km} km from home (within your {maxDistance} km). Cut‑off point: <strong>{s.cop_max_score}</strong>.
                  </p>
                </div>
              );
            })
          )}
        </div>
      </section>
    </main>
  );
}
