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
  
  // load primaries for dropdown
  const { data: primaries } = useSWR('/api/primaries', fetcher);

  async function onSearch(e: React.FormEvent) {
    e.preventDefault();
    // geocode
    const geo = await fetch(`/api/geocode?pincode=${pincode}`).then(r => r.json());
    if (geo.error) {
      alert(geo.error);
      return;
    }
    const { lat, lng } = geo;

    // search
    const qs = new URLSearchParams({
      score,
      primary,
      lat: String(lat),
      lng: String(lng),
    });
    const data = await fetch(`/api/search?${qs}`).then(r => r.json());
    if (data.error) {
      alert(data.error);
      return;
    }
    setResults(data);
  }

  return (
    <main className="space-y-16">
      {/* Hero */}
      <section className="bg-gray-50 py-20">
        <div className="container mx-auto grid grid-cols-1 md:grid-cols-2 items-center gap-8 px-4">
          <div className="space-y-6">
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
                className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <select
                value={primary}
                onChange={e => setPrimary(e.target.value)}
                required
                className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Primary School</option>
                {primaries?.map((p: any) => (
                  <option key={p.slug} value={p.slug}>
                    {p.name}
                  </option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Postal Code"
                value={pincode}
                onChange={e => setPincode(e.target.value)}
                required
                className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="w-full bg-blue-600 text-white p-3 rounded font-semibold hover:bg-blue-700 transition"
              >
                Find Schools
              </button>
            </form>
          </div>
          <div className="flex justify-center">
            <Image
              src="https://unsplash.com/illustrations/back-to-school-education-concept-tiny-people-with-huge-backpack-educational-tools-calculator-school-stationery-globe-and-books-modern-flat-cartoon-style-vector-illustration-N_UNj0KzW3o"
              alt="Students school building"
              width={600}
              height={400}
              className="rounded-lg shadow-lg"
            />
          </div>
        </div>
      </section>

      {/* Results */}
      <section className="container mx-auto px-4">
        <h2 className="text-2xl font-bold mb-6">Recommendations</h2>
        {results.length === 0 ? (
          <p className="text-gray-600">Enter your details above and hit “Find Schools” to see results.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {results.map((s) => (
              <div key={s.code} className="bg-white border border-gray-200 rounded-lg shadow p-6 flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-semibold">{s.name}</h3>
                  <span className="text-gray-500 text-sm">{(s.distance_m/1000).toFixed(2)} km</span>
                </div>
                <p className="text-gray-700 mb-2">{s.address}</p>
                <p className="mb-2">
                  {s.is_affiliated
                    ? <span className="inline-block bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm">Affiliated</span>
                    : <span className="inline-block bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-sm">Non‑affiliated</span>
                  }
                </p>
                <p className="mt-auto text-gray-800">
                  COP Range: <strong>
                    {s.match_min_score}{s.match_min_qualifier||''} – {s.match_max_score}{s.match_max_qualifier||''}
                  </strong>
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
