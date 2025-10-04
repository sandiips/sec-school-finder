'use client';

import { useState } from 'react';
import { mockSchools, validateAllMockSchools } from '@/data/mockSchools';
import Navigation from '@/components/ui/Navigation';
import Breadcrumb from '@/components/ui/Breadcrumb';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import MetricCard from '@/components/school/MetricCard';
import SchoolCard from '@/components/search/SchoolCard';
import ComparisonCounter from '@/components/search/ComparisonCounter';
import LoadingSkeleton, { SchoolCardSkeleton, MetricCardSkeleton } from '@/components/ui/LoadingSkeleton';

export default function TestComponentsPage() {
  const [selectedSchools, setSelectedSchools] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const validationResult = validateAllMockSchools();

  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Test Components' }
  ];

  const toggleSchoolSelection = (school: any) => {
    const isSelected = selectedSchools.some(s => s.code === school.code);
    if (isSelected) {
      setSelectedSchools(selectedSchools.filter(s => s.code !== school.code));
    } else if (selectedSchools.length < 4) {
      setSelectedSchools([...selectedSchools, school]);
    }
  };

  const clearAllSchools = () => {
    setSelectedSchools([]);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Breadcrumb items={breadcrumbItems} />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Component Testing</h1>
          <p className="text-gray-600">
            Testing all Phase 2 components and design system implementation
          </p>
        </div>

        {/* Data Validation */}
        <div className="mb-8 p-4 rounded-lg border border-gray-200 bg-white">
          <h2 className="text-lg font-semibold mb-2">Data Validation</h2>
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${validationResult.valid ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className={`font-medium ${validationResult.valid ? 'text-green-700' : 'text-red-700'}`}>
              {validationResult.valid ? 'All mock data valid' : 'Validation errors found'}
            </span>
          </div>
          {!validationResult.valid && (
            <ul className="mt-2 text-sm text-red-600">
              {validationResult.errors.map((error, index) => (
                <li key={index}>• {error}</li>
              ))}
            </ul>
          )}
        </div>

        {/* Button Testing */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Button Components</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">Variants</h3>
              <Button variant="primary">Primary Button</Button>
              <Button variant="secondary">Secondary Button</Button>
              <Button variant="outline">Outline Button</Button>
              <Button variant="ghost">Ghost Button</Button>
              <Button variant="danger">Danger Button</Button>
            </div>
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">Sizes</h3>
              <Button size="small">Small Button</Button>
              <Button size="medium">Medium Button</Button>
              <Button size="large">Large Button</Button>
              <Button fullWidth>Full Width Button</Button>
            </div>
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">States</h3>
              <Button disabled>Disabled Button</Button>
              <Button loading>Loading Button</Button>
              <Button
                leftIcon={<span>🔍</span>}
                rightIcon={<span>→</span>}
              >
                With Icons
              </Button>
            </div>
          </div>
        </section>

        {/* Badge Testing */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Badge Components</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">Variants</h3>
              <div className="flex flex-wrap gap-2">
                <Badge variant="blue">Boys School</Badge>
                <Badge variant="purple">Girls School</Badge>
                <Badge variant="green">Co-ed School</Badge>
                <Badge variant="purple">IP Program</Badge>
                <Badge variant="cyan">Affiliated</Badge>
                <Badge variant="orange">Cut-off Score</Badge>
                <Badge variant="red">Competitive</Badge>
                <Badge variant="gray">No Data</Badge>
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">Sizes</h3>
              <div className="flex flex-wrap gap-2">
                <Badge size="small">Small</Badge>
                <Badge size="medium">Medium</Badge>
                <Badge size="large">Large</Badge>
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">Performance</h3>
              <div className="flex flex-wrap gap-2">
                <Badge variant="green">Very Strong</Badge>
                <Badge variant="orange">Strong</Badge>
                <Badge variant="red">Fair</Badge>
              </div>
            </div>
          </div>
        </section>

        {/* Metric Card Testing */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Metric Cards</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard
              title="Cut-off Range"
              value="6-8"
              subtitle="PSLE Score (Lower = Better)"
              icon="📊"
              trend="positive"
            />
            <MetricCard
              title="Top Sports"
              value="12"
              subtitle="Sports with data"
              icon="🏆"
              trend="positive"
            />
            <MetricCard
              title="CCA Categories"
              value="4"
              subtitle="of 5 available"
              icon="🎯"
              trend="neutral"
            />
            <MetricCard
              title="Performance"
              value="Excellent"
              subtitle="Overall rating"
              icon="⭐"
              trend="positive"
            />
          </div>
        </section>

        {/* Loading States */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Loading States</h2>
          <div className="space-y-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-4">Loading Skeletons</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {Array.from({ length: 4 }).map((_, i) => (
                  <MetricCardSkeleton key={i} />
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-4">School Card Skeleton</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <SchoolCardSkeleton />
                <SchoolCardSkeleton />
              </div>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-4">Generic Skeletons</h3>
              <div className="space-y-4">
                <LoadingSkeleton variant="text" count={3} />
                <LoadingSkeleton variant="card" />
                <div className="flex space-x-4">
                  <LoadingSkeleton variant="circle" />
                  <LoadingSkeleton variant="circle" />
                  <LoadingSkeleton variant="circle" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* School Card Testing */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">School Cards</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {mockSchools.slice(0, 4).map((school, index) => (
              <SchoolCard
                key={school.code}
                school={{
                  ...school,
                  full_name: school.name,
                  distance_km: school.distance,
                  is_affiliated: Math.random() > 0.5,
                  posting_group: school.hasIP ? null : Math.floor(Math.random() * 3) + 1,
                  ip_cutoff_max: school.hasIP ? school.cutoffs.ip?.max : null,
                  aff_pg_cutoff_max: school.cutoffs.affiliated?.max,
                  open_pg_cutoff_max: school.cutoffs.open[0]?.max,
                  open_pg: school.cutoffs.open[0]?.pg,
                  address: school.address,
                  sports_matches: school.sports.topSports.slice(0, 2).map(s => s.sport),
                  ccas_matches: Object.keys(school.ccas).filter((key) =>
                    key !== 'availableCategories' && key !== 'categoriesWithData'
                  ).slice(0, 3),
                  culture_matches: school.culture.coreValues.slice(0, 2)
                }}
                isSelected={selectedSchools.some(s => s.code === school.code)}
                onToggleCompare={toggleSchoolSelection}
                showComparison={true}
              />
            ))}
          </div>
        </section>

        {/* Interactive Testing */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Interactive Testing</h2>
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => setLoading(!loading)}
                variant={loading ? "danger" : "primary"}
              >
                {loading ? "Stop Loading Test" : "Start Loading Test"}
              </Button>
              <Button onClick={clearAllSchools} variant="outline">
                Clear All Selections
              </Button>
              <span className="text-sm text-gray-600">
                {selectedSchools.length} schools selected
              </span>
            </div>

            {loading && (
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-blue-800">Loading state active - check all loading components above</p>
              </div>
            )}
          </div>
        </section>

        {/* Design System Testing */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Design System</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="apple-card p-6">
              <h3 className="apple-heading-card mb-4">Apple-Style Card</h3>
              <p className="apple-text-body">
                This card uses the Apple-style design system with proper shadows,
                rounded corners, and hover effects.
              </p>
            </div>
            <div className="apple-card apple-hover-lift p-6">
              <h3 className="apple-heading-card mb-4">Hover Effects</h3>
              <p className="apple-text-body">
                This card has hover lift effects. Hover over it to see the animation.
              </p>
            </div>
            <div className="apple-card p-6 apple-gradient-primary text-white">
              <h3 className="apple-heading-card mb-4 text-white">Gradient Card</h3>
              <p className="text-white opacity-90">
                This card demonstrates the primary gradient background.
              </p>
            </div>
          </div>
        </section>

        {/* Component Status */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Implementation Status</h2>
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">✅ Completed Components</h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li>• TypeScript Interfaces</li>
                  <li>• Mock Data Generation</li>
                  <li>• School Profile Pages</li>
                  <li>• Comparison Interface</li>
                  <li>• Enhanced Search Cards</li>
                  <li>• Navigation & Routing</li>
                  <li>• Reusable Component Library</li>
                  <li>• Apple-Style Design System</li>
                  <li>• Loading States & Skeletons</li>
                  <li>• Mobile Responsive Design</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">📊 Statistics</h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li>• {mockSchools.length} Mock Schools Generated</li>
                  <li>• {validationResult.valid ? 'All' : 'Some'} Data Valid</li>
                  <li>• 4 Major Page Routes</li>
                  <li>• 15+ Reusable Components</li>
                  <li>• 5 Loading Skeleton Types</li>
                  <li>• Apple-Style Design System</li>
                  <li>• Mobile-First Responsive</li>
                  <li>• URL State Management</li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Comparison Counter */}
      <ComparisonCounter
        selectedSchools={selectedSchools}
        onClearAll={clearAllSchools}
        maxSchools={4}
      />
    </div>
  );
}