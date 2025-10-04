'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { SchoolProfile } from '@/types/school';
import Navigation from '@/components/ui/Navigation';
import SchoolHero from '@/components/school/SchoolHero';
import MetricCard from '@/components/school/MetricCard';
import CutoffSection from '@/components/school/CutoffSection';
import SportsSection from '@/components/school/SportsSection';
import CCASection from '@/components/school/CCASection';
import CultureSection from '@/components/school/CultureSection';
import { ProfileHeroSkeleton, MetricCardSkeleton } from '@/components/ui/LoadingSkeleton';
import { sendGAEvent } from '@next/third-parties/google';

export default function SchoolProfilePage() {
  const params = useParams();
  const schoolCode = params.code as string;
  const [school, setSchool] = useState<SchoolProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadSchool() {
      try {
        setLoading(true);
        setError(null);

        // Call the real API endpoint
        const response = await fetch(`/api/school/${schoolCode}`);

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('School not found');
          } else if (response.status === 400) {
            throw new Error('Invalid school code');
          } else {
            throw new Error('Failed to load school profile');
          }
        }

        const schoolData: SchoolProfile = await response.json();
        setSchool(schoolData);

        // Track school profile view
        sendGAEvent('event', 'school_profile_view', {
          school_code: schoolCode,
          school_name: schoolData.name,
          school_type: schoolData.gender,
          has_ip_program: schoolData.hasIP || false,
          sports_count: schoolData.sports?.totalSportsWithData || 0,
          cca_categories: schoolData.ccas?.categoriesWithData || 0,
          referrer_page: document.referrer || 'direct'
        });

      } catch (err) {
        console.error('Error loading school:', err);
        setError(err instanceof Error ? err.message : 'Failed to load school profile');
      } finally {
        setLoading(false);
      }
    }

    if (schoolCode) {
      loadSchool();
    }
  }, [schoolCode]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <ProfileHeroSkeleton />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <MetricCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !school) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex items-center justify-center pt-32">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-primary mb-2">School Not Found</h1>
            <p className="text-secondary mb-4">{error || 'The requested school profile could not be found.'}</p>
            <a
              href="/"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-accent-blue hover:bg-blue-700"
            >
              Back to Search
            </a>
          </div>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />


      {/* Hero Section */}
      <SchoolHero school={school} />

      {/* Quick Stats Overview */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
          <MetricCard
            title="Sports Excellence"
            value={school.sports.totalSportsWithData.toString()}
            subtitle={`Sports with performance data`}
            icon="🏆"
            trend="positive"
          />
          <MetricCard
            title="CCA Programs"
            value={school.ccas.categoriesWithData.toString()}
            subtitle={`of ${school.ccas.availableCategories} categories available`}
            icon="🎯"
            trend="positive"
          />
          <MetricCard
            title="Culture Strengths"
            value={school.culture.coreValues.length.toString()}
            subtitle="Culture themes identified"
            icon="🌟"
            trend="positive"
          />
        </div>
      </div>

      {/* Detailed Sections - Emphasis on Holistic Development */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 space-y-8">
        <SportsSection school={school} />
        <CCASection school={school} />
        <CultureSection school={school} />
        <CutoffSection school={school} />
      </div>
    </div>
  );
}