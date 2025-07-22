// src/app/page.tsx
'use client';

import Image from 'next/image';
import { useState, useRef, useEffect } from 'react';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function Home() {
  const [score, setScore]     = useState('');
  const [primary, setPrimary] = useState('');
  const [pincode, setPincode] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const resultsRef = useRef<HTMLDivElement>(null);
  const { data: primaries } = useSWR('/api/primaries', fetcher);

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

  // Auto-scroll to results on mobile when they update
  useEffect(() => {
    if (results.length > 0) {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [results]);

  return (
    <main className="space-y-16">
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-br from-pink-50 via-pink-100 to-white">
        <div className="container mx-auto grid grid-cols-1 md:grid-cols-2 items-center gap-8 px-4">
          {/* Left: Text & Form */}
          <div className="space-y-6 text-gray-900">
            <h1 className="text-4xl md:text-5xl font-extrabold leading-tight">
              Find the <span className="text-blue-600">RIGHT</span> school for <span className="text-blue-600">YOU</span>
            </h1>
            <p className="text-gray-700 text-lg">
              Discover the perfect secondary school based on your expected PSLE score, affiliation, and location.
            </p>
          </div>
          {/* Right: Hero Image */}
          <div className="relative w-full h-64 md:h-96 rounded-lg overflow-hidden shadow-lg">
            <Image
              src="/hero.jpg"
              alt="School students"
              fill
              style={{ objectFit: 'cover' }}
            />
          </div>
        </div>
      </section>

      {/* Main Content: Form + Results Side-by-Side */}
      <section className="container mx-auto px-4 py-12 flex flex-col md:flex-row gap-8">
        {/* Input Pane */}
        <div className="md:w-1/3 bg-white p-6 rounded-lg shadow">
          <form onSubmit={onSearch} className="space-y-4">
            <input
              type="number"
              placeholder="PSLE Score"
              value={score}
              onChange={e => setScore(e.target.value)}
              required
              className="w-full p-3 bg-gray-50 text-gray-900 border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
            <select
              value={primary}
              onChange={e => setPrimary(e.target.value)}
              required
              className="w-full p-3 bg-gray-50 text-gray-900 border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
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
              className="w-full p-3 bg-gray-50 text-gray-900 border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white p-3 rounded font-semibold transition"
            >
              Find Schools
            </button>
          </form>
        </div>

        {/* Results Pane */}
        <div ref={resultsRef} className="md:w-2/3 h-auto">
          {results.length === 0 ? (
            <p className="text-gray-600">Enter your details and click "Find Schools" to see recommendations.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {results.map((s) => {
                const displayName = s.name.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                const groupLabel = s.posting_group != null ? `PG ${s.posting_group}` : 'Integrated Programme';
                return (
                  <div
                    key={s.code}
                    className="bg-white border border-gray-200 rounded-lg p-4 flex flex-col h-full shadow"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{displayName}</h3>
                      <span className="text-gray-500 text-sm">{(s.distance_m/1000).toFixed(2)} km</span>
                    </div>
                    <p className="text-gray-700 mb-2 flex-grow">{s.address}</p>
                    <div className="flex space-x-2 items-center mb-2">
                      <span className={`inline-block px-2 py-1 rounded-full text-xs ${s.is_affiliated ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {s.is_affiliated ? 'Affiliated' : 'Non‑affiliated'}
                      </span>
                      <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">{groupLabel}</span>
                    </div>
                    <p className="mt-auto text-gray-800">
                      Cut‑off score for last admitted student – <strong>{s.match_max_score}</strong>
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
