"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import useSWR from "swr";
import { sendGAEvent } from '@next/third-parties/google';
import SchoolCard from "@/components/search/SchoolCard";
import ComparisonCounter from "@/components/search/ComparisonCounter";
import Navigation from "@/components/ui/Navigation";
import { isValidSingaporePostalCode, getPostalCodeErrorMessage, isValidPSLEScore, getPSLEScoreErrorMessage } from '@/lib/validation';

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
  const [isPostalValid, setIsPostalValid] = useState(false);
  const [postalError, setPostalError] = useState('');
  const [isPsleValid, setIsPsleValid] = useState(false);
  const [psleError, setPsleError] = useState('');

  // Validate postal code
  useEffect(() => {
    const valid = isValidSingaporePostalCode(postal);
    setIsPostalValid(valid);

    if (postal.length > 0 && !valid) {
      setPostalError(getPostalCodeErrorMessage(postal));
    } else {
      setPostalError('');
    }
  }, [postal]);

  // Validate PSLE score
  useEffect(() => {
    const valid = isValidPSLEScore(psle);
    setIsPsleValid(valid);

    if (psle.length > 0 && !valid) {
      setPsleError(getPSLEScoreErrorMessage(psle));
    } else {
      setPsleError('');
    }
  }, [psle]);

  // results (we hide the feature cards once results exist)
  const [results, setResults] = useState<any[]>([]);
  const resultsRef = useRef<HTMLDivElement>(null);

  // comparison state
  const [selectedSchools, setSelectedSchools] = useState<any[]>([]);

  // primaries for the select
  const { data: primaries } = useSWR("/api/primaries", fetcher);

  useEffect(() => {
    if (results.length) {
      resultsRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [results]);

  // Comparison functions
  const toggleSchoolComparison = (school: any) => {
    const isSelected = selectedSchools.some(s => s.code === school.code);

    if (isSelected) {
      // Track school removal from comparison
      sendGAEvent('event', 'school_removed_from_comparison', {
        school_code: school.code,
        school_name: school.name,
        removal_source: 'home_page_search',
        schools_remaining: selectedSchools.length - 1
      });
      setSelectedSchools(selectedSchools.filter(s => s.code !== school.code));
    } else if (selectedSchools.length < 4) {
      // Track school addition to comparison
      sendGAEvent('event', 'school_added_to_comparison', {
        school_code: school.code,
        school_name: school.name,
        addition_source: 'home_page_search',
        schools_selected: selectedSchools.length + 1,
        psle_score: parseInt(psle),
        distance_km: school.distance_km || school.distance,
        school_type: school.type
      });
      setSelectedSchools([...selectedSchools, school]);
    } else {
      // Track comparison limit reached
      sendGAEvent('event', 'comparison_limit_reached', {
        attempted_school_code: school.code,
        attempted_school_name: school.name,
        current_selection_count: selectedSchools.length,
        max_limit: 4
      });
      alert('Maximum 4 schools can be compared at once.');
    }
  };

  const clearAllComparisons = () => {
    // Track clearing all comparisons
    sendGAEvent('event', 'comparison_cleared_all', {
      schools_cleared: selectedSchools.length,
      clear_source: 'home_page_search'
    });
    setSelectedSchools([]);
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Prevent submission if postal code or PSLE score is invalid
    if (!isPostalValid || !postal.trim() || !isPsleValid || !psle.trim()) {
      return;
    }

    // Track search attempt
    sendGAEvent('event', 'distance_search_attempt', {
      psle_score: parseInt(psle),
      primary_school: primary,
      postal_code: postal,
      search_type: 'distance_based'
    });

    // 1) geocode postal
    const geo = await fetch(`/api/geocode?pincode=${postal}`).then((r) => r.json());
    if (geo.error) {
      // Track geocoding error
      sendGAEvent('event', 'search_error', {
        error_type: 'geocoding_failed',
        postal_code: postal,
        error_message: geo.error
      });
      return alert(geo.error);
    }

    // 2) call the SEARCH endpoint (distance‑first), NOT the ranking one
    const params = new URLSearchParams({
      score: psle,
      primary,
      lat: String(geo.lat),
      lng: String(geo.lng),
      inYear: '2024',
      maxDistanceKm: "50",
    });

    const data = await fetch(`/api/search?${params}`).then((r) => r.json());
    if (data?.error) {
      // Track search API error
      sendGAEvent('event', 'search_error', {
        error_type: 'api_search_failed',
        psle_score: parseInt(psle),
        primary_school: primary,
        error_message: data.error
      });
      return alert(data.error);
    }

    // 3) make sure it's strictly sorted by distance (safety net)
    const normDist = (s: any) =>
      s?.distance_m != null ? Number(s.distance_m) : Number(s?.distance_km ?? 0) * 1000;

    const byDistance = [...(data ?? [])].sort((a, b) => normDist(a) - normDist(b));

    // Track successful search
    sendGAEvent('event', 'distance_search_success', {
      psle_score: parseInt(psle),
      primary_school: primary,
      postal_code: postal,
      results_count: byDistance.length,
      search_type: 'distance_based',
      max_distance_km: 50
    });

    setResults(byDistance);
  }

  return (
    <div className="min-h-screen bg-white text-gray-900 pb-20 max-sm:pb-20 sm:pb-0">
      <Navigation />

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
      <span className="block">Go Beyond </span>
      <span className="block">PSLE AL Scores</span>
    </h1>
      <p className="mt-4 sm:mt-6 text-white/90 text-lg">
       <b> Sports & CCAs + AL Scores | Compare secondary schools </b> </p>
      <p className="mt-4 sm:mt-6 text-white/90 text-lg">
        Singapore's comprehensive secondary school finder with 2024 data
      </p>

            {/* Search panel – left aligned under subtitle */}
           {/* Search panel — same width & left edge as the text */}
    <form
      onSubmit={onSubmit}
      className="mt-6 sm:mt-8 w-full bg-white/95 backdrop-blur rounded-2xl shadow-xl p-4 sm:p-5 lg:p-6"
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <input
            type="number"
            placeholder="PSLE score (4-30)"
            value={psle}
            onChange={(e) => setPsle(e.target.value)}
            className={`input-modern ${
              psle.length > 0 && !isPsleValid ? 'border-red-500' : 'border-gray-300'
            }`}
            min="4"
            max="30"
            required
          />
          {psleError && (
            <p className="text-sm text-red-500 mt-1">{psleError}</p>
          )}
        </div>

        <select
          value={primary}
          onChange={(e) => setPrimary(e.target.value)}
          className="input-modern"
          required
        >
          <option value="">Primary school</option>
          {primaries?.map((p: any) => (
            <option key={p.slug} value={p.slug}>
              {p.name}
            </option>
          ))}
        </select>

        <div className="relative">
          <input
            type="text"
            placeholder="Postal code"
            value={postal}
            onChange={(e) => setPostal(e.target.value)}
            className={`input-modern ${
              postal.length > 0 && !isPostalValid ? 'border-red-500' : 'border-gray-300'
            }`}
            required
          />
          {postalError && (
            <p className="text-sm text-red-500 mt-1">{postalError}</p>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-3">
        <button
          type="submit"
          disabled={!isPostalValid || !postal.trim() || !isPsleValid || !psle.trim()}
          className={`${
            isPostalValid && postal.trim() && isPsleValid && psle.trim()
              ? 'btn-primary'
              : 'btn-primary opacity-50 cursor-not-allowed'
          }`}
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
              <span className="text-primary">School Advisor SG</span>{' '}
              <span className="text-secondary">Difference</span>
            </h2>
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white border-2 border-gray-900 rounded-xl p-6 hover:shadow-lg transition-all duration-200">
                <div className="text-3xl"></div>
                <h3 className="mt-3 text-title text-primary">Sports/CCAs Data</h3>
                <p className="mt-2 text-primary">
                  Find schools excelling in sports and CCAs, with data from National School Games and publicly reported sources.
                </p>
              </div>
              <div className="bg-white border-2 border-gray-900 rounded-xl p-6 hover:shadow-lg transition-all duration-200">
                <div className="text-3xl"></div>
                <h3 className="mt-3 text-title text-primary">School Culture Insights</h3>
                <p className="mt-2 text-primary">
                  Know what the schools stand for with AI-generated summaries of their culture and values.
                </p>
              </div>
              <div className="bg-white border-2 border-gray-900 rounded-xl p-6 hover:shadow-lg transition-all duration-200">
                <div className="text-3xl"></div>
                <h3 className="mt-3 text-title text-primary">Affiliations/IPs</h3>
                <p className="mt-2 text-primary">
                  Get personalized recommendations considering your primary school affiliations and Integrated Program options.
                </p>
              </div>
            </div>

            {/* Educational Section - Understanding PSLE AL Scores */}
            <div className="mt-12 bg-white rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-primary mb-6">Understanding PSLE AL Scores</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-primary mb-3">What is an AL Score?</h3>
                  <p className="text-primary mb-4">
                    Achievement Level (AL) scores range from 4 to 30, where <strong>lower scores are better</strong>.
                    Your PSLE AL score determines which secondary schools you can qualify for based on their cut-off scores.
                  </p>
                  <p className="text-primary">
                    AL scores replaced the old T-score system to reduce excessive competition and provide a clearer
                    indication of your child's academic achievement level.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-primary mb-3">How Cut-offs Work in 2025</h3>
                  <p className="text-primary mb-4">
                    Each secondary school sets cut-off scores based on the last student admitted. Schools with
                    <strong> lower cut-off scores are more academically competitive</strong>.
                  </p>
                  <p className="text-primary">
                    Cut-offs vary by posting group (PG1-PG3), Integrated Program (IP) tracks, and whether
                    you have primary school affiliations.
                  </p>
                </div>
              </div>

              {/* CTA to School Assistant */}
              <div className="mt-8 text-center">
                <Link href="/ranking" className="btn-primary inline-block">
                  Try Our Advanced School Ranking Assistant →
                </Link>
                <p className="text-sm text-gray-600 mt-2">
                  Get personalized recommendations beyond just PSLE scores - includes sports, CCAs, and culture matching
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Results with enhanced school cards */}
      {results.length > 0 && (
        <section ref={resultsRef} className="py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Results Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-primary">
                  Search Results
                </h2>
                <p className="text-primary mt-1">
                  {results.length} schools found, sorted by distance
                </p>
              </div>
              {selectedSchools.length > 0 && (
                <div className="text-sm text-primary">
                  {selectedSchools.length} schools selected for comparison
                </div>
              )}
            </div>

            {/* School Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {results.map((school: any) => (
                <SchoolCard
                  key={school.code ?? `${school.name}-${school.distance_km}`}
                  school={school}
                  isSelected={selectedSchools.some(s => s.code === school.code)}
                  onToggleCompare={toggleSchoolComparison}
                  showComparison={true}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Comparison Counter */}
      <ComparisonCounter
        selectedSchools={selectedSchools}
        onClearAll={clearAllComparisons}
        maxSchools={4}
      />

      {/* Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": "School Advisor SG - PSLE AL Score Secondary School Finder",
            "description": "Find the best secondary school in Singapore using your PSLE AL Score. Compare cut-offs, sports, CCAs, and culture fit for informed school selection.",
            "url": "https://schooladvisor.sg",
            "applicationCategory": "EducationApplication",
            "operatingSystem": "Web",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "SGD"
            },
            "creator": {
              "@type": "Organization",
              "name": "School Advisor SG"
            },
            "audience": {
              "@type": "Audience",
              "audienceType": "Parents and students preparing for secondary school admission in Singapore"
            },
            "featureList": [
              "PSLE AL Score based school search",
              "Secondary school cut-off comparison",
              "Sports and CCA performance analysis",
              "School culture matching",
              "Distance-based school finder",
              "Primary school affiliation guidance"
            ],
            "about": {
              "@type": "Thing",
              "name": "Singapore Secondary School Selection",
              "description": "Comprehensive tool for finding and comparing Singapore secondary schools using PSLE AL scores, with additional insights on sports, CCAs, and school culture."
            }
          })
        }}
      />
    </div>
  );
}
