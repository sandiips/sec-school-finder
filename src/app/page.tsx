// src/app/page.tsx
'use client';

import Image from 'next/image';
import { useState } from 'react';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function Home() {
  const [score, setScore]     = useState('');
  const [primary, setPrimary] = useState('');
  const [pincode, setPincode] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const { data: primaries }   = useSWR('/api/primaries', fetcher);

  async function onSearch(e: React.FormEvent) {
    e.preventDefault();
    const geo = await fetch(`/api/geocode?pincode=${pincode}`).then(r => r.json());
    if (geo.error) return alert(geo.error);
    const { lat, lng } = geo;
    const qs = new URLSearchParams({ score, primary, lat: String(lat), lng: String(lng) });
    const data = await fetch(`/api/search?${qs}`).then(r => r.json());
    if (data.error) return alert(data.error);
    setResults(data);
  }

  return (
    <main className="space-y-16">

      {/* Hero */}
      <section className="py-20 bg-gradient-to-br from-pink-50 via-pink-100 to-white">
        <div className="container mx-auto grid grid-cols-1 md:grid-cols-2 items-center gap-8 px-4">
          {/* Left */}
          <div className="space-y-6 text-gray-900">
            <h1 className="text-4xl md:text-5xl font-extrabold leading-tight">
              Find the <span className="text-blue-600">RIGHT</span> school for <span className="text-blue-600">YOU</span>
            </h1>
            <p className="text-gray-700 text-lg">
              Discover the perfect secondary school based on your expected PSLE score, affiliation, and location.
            </p>
            <form onSubmit={onSearch} className="space-y-4 max-w-md">
              <input
                type="number"
                placeholder="PSLE Score"
                value={score}
                onChange={e => setScore(e.target.value)}
                required
                className="w-full p-3 bg-white text-gray-900 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              <select
                value={primary}
                onChange={e => setPrimary(e.target.value)}
                required
                className="w-full p-3 bg-white text-gray-900 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="" disabled>Select Primary School</option>
                {primaries?.map((p: any) => (
                  <option key={p.slug} value={p.slug}>{p.name}</option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Postal Code"
                value={pincode}
                onChange={e => setPincode(e.target.value)}
                required
                className="w-full p-3 bg-white text-gray-900 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white p-3 rounded font-semibold transition"
              >
                Find Schools
              </button>
            </form>
          </div>
          {/* Right */}
          <div className="relative w-full h-96 md:h-[400px] rounded-lg overflow-hidden shadow-lg">
            <Image
              src="/hero.jpg"
              alt="School students"
              fill
              style={{ objectFit: 'cover' }}
            />
          </div>
        </div>
      </section>

      {/* Results */}
      <section className="container mx-auto px-4 py-12 bg-white">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Recommendations</h2>

        {results.length === 0 ? (
          <p className="text-gray-600">
            Enter your details above and hit “Find Schools” to see results.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {results.map((s) => {
              // Determine the posting-group label or "IP"
              const groupLabel = s.posting_group != null
                ? `PG ${s.posting_group}`
                : 'Integrated Programme';

              return (
                <div
                  key={s.code}
                  className="bg-gray-50 border border-gray-200 rounded-lg p-6 flex flex-col"
                >
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-semibold text-gray-900">{s.name}</h3>
                    <span className="text-gray-500 text-sm">{(s.distance_m/1000).toFixed(2)} km</span>
                  </div>

                  <p className="text-gray-700 mb-2">{s.address}</p>

                  {/* Tags for affiliation and posting group */}
                  <div className="flex space-x-2 mb-4">
                    <span className={`
                      inline-block px-2 py-1 rounded-full text-sm 
                      ${s.is_affiliated 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'}
                    `}>
                      {s.is_affiliated ? 'Affiliated' : 'Non‑affiliated'}
                    </span>
                    <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm">
                      {groupLabel}
                    </span>
                  </div>

                  {/* New cut‑off line */}
                  <p className="mt-auto text-gray-800">
                    Cut‑off score for last admitted student – <strong>{s.match_min_score}</strong>
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </section>

    </main>
  );
}
