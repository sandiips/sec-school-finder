// src/app/page.tsx
'use client';

import Image from 'next/image'
import { useState } from 'react'
import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then(res => res.json())

export default function Home() {
  const [score, setScore]     = useState('')
  const [primary, setPrimary] = useState('')
  const [pincode, setPincode] = useState('')
  const [results, setResults] = useState<any[]>([])
  const { data: primaries }   = useSWR('/api/primaries', fetcher)

  async function onSearch(e: React.FormEvent) {
    e.preventDefault()
    const geo = await fetch(`/api/geocode?pincode=${pincode}`).then(r => r.json())
    if (geo.error) return alert(geo.error)
    const { lat, lng } = geo
    const qs = new URLSearchParams({ score, primary, lat: String(lat), lng: String(lng) })
    const data = await fetch(`/api/search?${qs}`).then(r => r.json())
    if (data.error) return alert(data.error)
    setResults(data)
  }

  return (
    <main className="space-y-16">

      {/* Hero */}
      <section
        className="py-20"
        style={{
          background: "linear-gradient(135deg, #1f1f1f 0%, #3f3f3f 100%)"
        }}
      >
        <div className="container mx-auto grid grid-cols-1 md:grid-cols-2 items-center gap-8 px-4">
          {/* Left text + form (light text on dark) */}
          <div className="space-y-6 text-white">
            <h1 className="text-4xl md:text-5xl font-extrabold leading-tight">
              Find the <span className="text-blue-400">RIGHT</span> school for <span className="text-blue-400">YOU</span>
            </h1>
            <p className="text-gray-300 text-lg">
              Discover the perfect secondary school based on your expected PSLE score, affiliation, and location.
            </p>
            <form onSubmit={onSearch} className="space-y-4 max-w-md">
              <input
                type="number"
                placeholder="PSLE Score"
                value={score}
                onChange={e => setScore(e.target.value)}
                required
                className="w-full p-3 bg-gray-800 text-white border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <select
                value={primary}
                onChange={e => setPrimary(e.target.value)}
                required
                className="w-full p-3 bg-gray-800 text-white border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="" disabled className="text-gray-500">Select Primary School</option>
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
                className="w-full p-3 bg-gray-800 text-white border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <button
                type="submit"
                className="w-full bg-blue-500 hover:bg-blue-600 text-white p-3 rounded font-semibold transition"
              >
                Find Schools
              </button>
            </form>
          </div>

          {/* Right image pane: fill full height of the text pane */}
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
      <section
        className="container mx-auto px-4 py-12"
        style={{ background: "#2f2f2f" }}
      >
        <h2 className="text-2xl font-bold text-white mb-6">Recommendations</h2>

        {results.length === 0 ? (
          <p className="text-gray-400">
            Enter your details above and hit “Find Schools” to see results.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {results.map((s) => (
              <div
                key={s.code}
                className="bg-gray-800 border border-gray-700 rounded-lg p-6 flex flex-col text-white"
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-semibold">{s.name}</h3>
                  <span className="text-gray-300 text-sm">{(s.distance_m/1000).toFixed(2)} km</span>
                </div>
                <p className="text-gray-300 mb-2">{s.address}</p>
                <p className="mb-2">
                  {s.is_affiliated
                    ? <span className="inline-block bg-green-600 text-white px-2 py-1 rounded-full text-sm">Affiliated</span>
                    : <span className="inline-block bg-gray-600 text-white px-2 py-1 rounded-full text-sm">Non‑affiliated</span>
                  }
                </p>
                <p className="mt-auto text-gray-200">
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
  )
}
