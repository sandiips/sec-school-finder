// src/app/page.tsx
'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { supabase } from '../lib/supabaseClient';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function Home() {
  const [score, setScore]     = useState('');
  const [primary, setPrimary] = useState('');
  const [pincode, setPincode] = useState('');
  const [results, setResults] = useState<any[]>([]);

  // Load primary schools for the dropdown
  const { data: primaries } = useSWR('/api/primaries', fetcher);

  async function onSearch(e: React.FormEvent) {
    e.preventDefault();

    // 1) Geocode the pincode
    const geo = await fetch(`/api/geocode?pincode=${pincode}`).then(r => r.json());
    if (geo.error) {
      alert(geo.error);
      return;
    }
    const { lat, lng } = geo;

    // 2) Call search RPC
    const qs = new URLSearchParams({
      score,
      primary,
      lat: String(lat),
      lng: String(lng)
    });
    const data = await fetch(`/api/search?${qs}`).then(r => r.json());
    if (data.error) {
      alert(data.error);
      return;
    }
    setResults(data);
  }

  return (
    <main className="p-6 max-w-2xl mx-auto">
      <h1 className="text-3xl mb-4">Secondary School Finder</h1>
      <form onSubmit={onSearch} className="space-y-3">
        <input
          type="number"
          placeholder="PSLE Score"
          value={score}
          onChange={e => setScore(e.target.value)}
          required
          className="w-full p-2 border rounded"
        />
        <select
          value={primary}
          onChange={e => setPrimary(e.target.value)}
          required
          className="w-full p-2 border rounded"
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
          className="w-full p-2 border rounded"
        />
        <button
          type="submit"
          className="w-full bg-blue-600 text-white p-2 rounded"
        >
          Find Schools
        </button>
      </form>

      <ul className="mt-6 space-y-4">
        {results.map((s) => (
          <li key={s.code} className="border p-4 rounded">
            <div className="flex justify-between">
              <h2 className="text-xl">{s.name}</h2>
              <span>{(s.distance_m/1000).toFixed(2)} km</span>
            </div>
            <p>{s.address}</p>
            <p>
              {s.is_affiliated
                ? <strong className="text-green-600">Affiliated</strong>
                : <em className="text-gray-600">Non‑affiliated</em>}
            </p>
            <p>
              COP Range: {s.match_min_score}{s.match_min_qualifier||''} – {s.match_max_score}{s.match_max_qualifier||''}
            </p>
          </li>
        ))}
      </ul>
    </main>
);
}
