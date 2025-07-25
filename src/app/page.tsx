'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function Home() {
  // Cut‑off Point Search state
  const [psle, setPsle] = useState('');
  const [primary, setPrimary] = useState('');
  const [home, setHome] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const resultsRef = useRef<HTMLDivElement>(null);

  // load primaries for dropdown
  const { data: primaries } = useSWR('/api/primaries', fetcher);

  // scroll into view after search
  useEffect(() => {
    if (results.length > 0) {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [results]);

  // helper to title‑case slug
  function humanize(slug: string) {
    return slug
      .split(/[-_]/g)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }

  async function onSearch(e: React.FormEvent) {
    e.preventDefault();
    // Geocode postal code
    const geo = await fetch(`/api/geocode?pincode=${home}`).then((r) => r.json());
    if (geo.error) {
      alert(geo.error);
      return;
    }
    // build query
    const qs = new URLSearchParams({
      score: psle,
      primary,
      lat: String(geo.lat),
      lng: String(geo.lng),
    });
    const data = await fetch(`/api/search?${qs}`).then((r) => r.json());
    if (data.error) {
      alert(data.error);
      return;
    }
    setResults(data);
  }

  return (
    <main className="space-y-10">
      {/* Top Nav */}
      <div className="bg-gray-50 py-3">
        <div className="container mx-auto px-4 flex space-x-4">
          <Link
            href="/"
            className="px-4 py-2 rounded bg-pink-600 text-white"
          >
            Home
          </Link>
          <Link
            href="/ranking"
            className="px-4 py-2 rounded bg-white text-gray-700 hover:bg-gray-100"
          >
            School Ranking Assistant
          </Link>
        </div>
      </div>

      {/* Hero + Cut‑off Search */}
      <section className="bg-white py-12">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-start gap-8">
          {/* Left: Heading + Form */}
          <div className="md:w-1/2 space-y-4">
            <span className="inline-block bg-pink-100 text-pink-700 px-3 py-1 rounded-full text-sm">
              Trusted by thousands of families since 2010
            </span>
            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900">
              Find the <span className="text-pink-600">RIGHT</span> school for{' '}
              <span className="text-pink-600">YOU</span>
            </h1>
            <p className="text-gray-600 text-lg">
              Get personalized school recommendations based on your PSLE score,
              affiliation & distance.
            </p>

            <form onSubmit={onSearch} className="mt-6 space-y-4">
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
              <button
                type="submit"
                className="w-full bg-pink-600 hover:bg-pink-700 text-white p-3 rounded text-lg"
              >
                Find Schools Now
              </button>
            </form>
          </div>

          {/* Right: Hero image or Results */}
          <div className="md:w-1/2" ref={resultsRef}>
            {results.length === 0 ? (
              <Image
                src="/hero.jpg"
                alt="Students and globe illustration"
                width={640}
                height={480}
                className="w-full rounded-lg shadow-lg object-cover"
              />
            ) : (
              <div className="space-y-6">
                {results.map((s) => {
                  const name = s.full_name || humanize(s.name);
                  const pg =
                    s.posting_group != null
                      ? `PG ${s.posting_group}`
                      : 'IP';
                  return (
                    <div
                      key={s.code}
                      className="bg-white border border-gray-200 rounded-lg p-4 shadow flex justify-between items-start"
                    >
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {name}
                        </h3>
                        <p className="text-gray-700">{s.address}</p>
                        <div className="mt-2 flex gap-2">
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${
                              s.is_affiliated
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {s.is_affiliated
                              ? 'Affiliated'
                              : 'Non‑affiliated'}
                          </span>
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                            {pg}
                          </span>
                        </div>
                        <p className="mt-2 text-gray-800">
                          Cut‑off point:{' '}
                          <strong>{s.cop_max_score}</strong>
                        </p>
                      </div>
                      <div className="text-gray-500 text-sm">
                        {(s.distance_m / 1000).toFixed(2)} km
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
