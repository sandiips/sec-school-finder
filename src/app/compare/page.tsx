'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { sendGAEvent } from '@next/third-parties/google';
import { SchoolProfile } from '@/types/school';
import Navigation from '@/components/ui/Navigation';
import { isValidSingaporePostalCode, getPostalCodeErrorMessage } from '@/lib/validation';
import ComparisonSelector from '@/components/comparison/ComparisonSelector';
import ComparisonSchoolSearch from '@/components/comparison/ComparisonSchoolSearch';
import ComparisonTable from '@/components/comparison/ComparisonTable';
import ComparisonActions from '@/components/comparison/ComparisonActions';

function ComparePageContent() {
  const searchParams = useSearchParams();
  const [selectedSchools, setSelectedSchools] = useState<SchoolProfile[]>([]);
  const [availableSchools, setAvailableSchools] = useState<SchoolProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [postalCode, setPostalCode] = useState('');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isPostalValid, setIsPostalValid] = useState(false);
  const [postalError, setPostalError] = useState('');

  // Validate postal code
  useEffect(() => {
    const valid = isValidSingaporePostalCode(postalCode);
    setIsPostalValid(valid);

    if (postalCode.length > 0 && !valid) {
      setPostalError(getPostalCodeErrorMessage(postalCode));
    } else {
      setPostalError('');
    }
  }, [postalCode]);

  // Fetch school data from API
  const fetchSchoolByCode = async (code: string): Promise<SchoolProfile | null> => {
    try {
      const response = await fetch(`/api/school/${code.trim()}`);
      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (error) {
      console.error(`Error fetching school ${code}:`, error);
      return null;
    }
  };

  // Fetch popular schools for the selector
  const fetchAvailableSchools = async () => {
    // Use some real school codes as popular schools
    const popularSchoolCodes = ['3004', '3005', '3009', '7023', '806', '7309', '3047', '7021'];
    const schools: SchoolProfile[] = [];

    for (const code of popularSchoolCodes) {
      const school = await fetchSchoolByCode(code);
      if (school) {
        schools.push(school);
      }
    }

    setAvailableSchools(schools);
  };

  // Handle postal code input and geocoding
  const handlePostalCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postalCode.trim() || !isPostalValid) return;

    // Track postal code distance calculation attempt
    sendGAEvent('event', 'postal_code_distance_calculation', {
      postal_code: postalCode.trim(),
      schools_count: selectedSchools.length,
      calculation_source: 'comparison_page'
    });

    try {
      const response = await fetch(`/api/geocode?pincode=${postalCode.trim()}`);
      const data = await response.json();

      if (data.error) {
        // Track geocoding error
        sendGAEvent('event', 'geocoding_error', {
          postal_code: postalCode.trim(),
          error_message: data.error,
          error_source: 'comparison_page'
        });
        alert(data.error);
        return;
      }

      // Track successful distance calculation
      sendGAEvent('event', 'distance_calculation_success', {
        postal_code: postalCode.trim(),
        schools_count: selectedSchools.length,
        lat: data.lat,
        lng: data.lng
      });

      setUserLocation({ lat: data.lat, lng: data.lng });
    } catch (error) {
      console.error('Error geocoding postal code:', error);
      sendGAEvent('event', 'geocoding_error', {
        postal_code: postalCode.trim(),
        error_message: 'Network or API error',
        error_source: 'comparison_page'
      });
      alert('Error processing postal code. Please try again.');
    }
  };

  // Calculate distance between two points using Haversine formula
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Update distances for all schools when user location changes
  useEffect(() => {
    if (userLocation && selectedSchools.length > 0) {
      const updatedSchools = selectedSchools.map(school => {
        if (school.coordinates) {
          const distance = calculateDistance(
            userLocation.lat,
            userLocation.lng,
            school.coordinates.lat,
            school.coordinates.lng
          );
          return { ...school, distance: Math.round(distance * 10) / 10 };
        }
        return school;
      });
      setSelectedSchools(updatedSchools);
    }
  }, [userLocation]);

  // Track comparison completion when schools are actively being compared
  useEffect(() => {
    if (selectedSchools.length >= 2) {
      sendGAEvent('event', 'schools_comparison_active', {
        schools_count: selectedSchools.length,
        school_codes: selectedSchools.map(s => s.code).join(','),
        school_names: selectedSchools.map(s => s.name).join(' | '),
        has_distances: selectedSchools.some(s => s.distance),
        comparison_type: selectedSchools.length === 2 ? 'head_to_head' :
                        selectedSchools.length === 3 ? 'three_way' : 'full_comparison'
      });
    }
  }, [selectedSchools]);

  // Load schools from URL parameters on mount
  useEffect(() => {
    const loadSchools = async () => {
      const schoolCodes = searchParams.get('schools')?.split(',') || [];
      const schools: SchoolProfile[] = [];

      for (const code of schoolCodes) {
        if (schools.length < 4) {
          const school = await fetchSchoolByCode(code.trim());
          if (school) {
            schools.push(school);
          }
        }
      }

      setSelectedSchools(schools);
      setLoading(false);
    };

    loadSchools();
  }, [searchParams]);

  // Load available schools on mount
  useEffect(() => {
    fetchAvailableSchools();
  }, []);

  // Track page view and initial state
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const schoolCodes = urlParams.get('schools')?.split(',') || [];

    sendGAEvent('event', 'comparison_page_view', {
      schools_in_url: schoolCodes.length,
      school_codes: schoolCodes.join(','),
      has_postal_parameter: !!urlParams.get('postal'),
      referrer_page: document.referrer || 'direct'
    });
  }, []);

  // Update URL when schools change
  useEffect(() => {
    if (!loading) {
      const codes = selectedSchools.map(school => school.code).join(',');
      const url = new URL(window.location.href);

      if (codes) {
        url.searchParams.set('schools', codes);
      } else {
        url.searchParams.delete('schools');
      }

      window.history.replaceState({}, '', url.toString());
    }
  }, [selectedSchools, loading]);

  const addSchool = (school: SchoolProfile) => {
    if (selectedSchools.length < 4 && !selectedSchools.find(s => s.code === school.code)) {
      // Track school addition to comparison
      sendGAEvent('event', 'school_added_to_comparison', {
        school_code: school.code,
        school_name: school.name,
        addition_source: 'comparison_page',
        schools_selected: selectedSchools.length + 1,
        school_type: school.gender,
        has_ip_program: school.hasIP,
        distance_km: school.distance || null
      });
      setSelectedSchools([...selectedSchools, school]);
    }
  };

  const removeSchool = (schoolCode: string) => {
    const removedSchool = selectedSchools.find(s => s.code === schoolCode);
    if (removedSchool) {
      // Track school removal from comparison
      sendGAEvent('event', 'school_removed_from_comparison', {
        school_code: schoolCode,
        school_name: removedSchool.name,
        removal_source: 'comparison_page',
        schools_remaining: selectedSchools.length - 1
      });
    }
    setSelectedSchools(selectedSchools.filter(school => school.code !== schoolCode));
  };

  const clearAllSchools = () => {
    // Track clearing all schools in comparison
    sendGAEvent('event', 'comparison_cleared_all', {
      schools_cleared: selectedSchools.length,
      clear_source: 'comparison_page'
    });
    setSelectedSchools([]);
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex items-center justify-center pt-32">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading comparison...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 max-sm:pb-20 sm:pb-0">
      <Navigation />


      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-bold text-primary">
                School Comparison
              </h1>
              <p className="text-secondary mt-2 mb-6">
                Compare up to 4 schools side-by-side across all dimensions
              </p>

              {/* Postal Code Distance Calculator */}
              <form onSubmit={handlePostalCodeSubmit} className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1 max-w-sm">
                  <label htmlFor="postal-code" className="block text-sm font-medium text-primary mb-1">
                    📍 Enter postal code for distance calculations
                  </label>
                  <input
                    id="postal-code"
                    type="text"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    placeholder="e.g. 138675"
                    className={`input-modern ${
                      postalCode.length > 0 && !isPostalValid ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {postalError && (
                    <p className="text-sm text-red-500 mt-1">{postalError}</p>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={!isPostalValid || postalCode.length === 0}
                  className={`sm:mt-6 w-full sm:w-auto ${
                    isPostalValid && postalCode.length > 0
                      ? 'btn-primary'
                      : 'btn-primary opacity-50 cursor-not-allowed'
                  }`}
                >
                  Calculate Distances
                </button>
              </form>
              {userLocation && (
                <p className="text-secondary text-sm mt-2">
                  ✅ Distance calculations enabled for postal code {postalCode}
                </p>
              )}
            </div>

            {/* Right Side: Schools Selected Counter */}
            <div className="lg:ml-6 mt-4 lg:mt-0">
              <div className="text-center lg:text-right">
                <p className="text-secondary text-sm">Schools Selected</p>
                <p className="text-4xl font-bold text-primary">{selectedSchools.length}</p>
                <p className="text-secondary text-sm">of 4 maximum</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area with Sidebar Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Sidebar (1/3 width on desktop, full width on mobile) - School Selection */}
          <div className="w-full lg:w-1/3">
            <div className="lg:sticky lg:top-8 space-y-6">
              {/* School Search */}
              {selectedSchools.length < 4 && (
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-primary mb-4">Add School</h3>
                  <ComparisonSchoolSearch
                    onAddSchool={addSchool}
                    selectedSchoolCodes={selectedSchools.map(s => s.code)}
                    userLocation={userLocation}
                    calculateDistance={calculateDistance}
                  />
                </div>
              )}

              {/* School Selection */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-primary mb-4">Selected Schools</h3>
                <ComparisonSelector
                  selectedSchools={selectedSchools}
                  availableSchools={availableSchools}
                  onAddSchool={addSchool}
                  onRemoveSchool={removeSchool}
                  onClearAll={clearAllSchools}
                  maxSchools={4}
                />
              </div>
            </div>
          </div>

          {/* Right Content Area (2/3 width on desktop, full width on mobile) - Comparison Table */}
          <div className="w-full lg:w-2/3">
            {/* Comparison Content */}
            {selectedSchools.length === 0 ? (
              /* Empty State */
              <div className="text-center py-16">
                <div className="max-w-md mx-auto">
                  <span className="text-8xl mb-6 block" role="img" aria-label="No schools selected">
                    🏫
                  </span>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    No Schools Selected
                  </h2>
                  <p className="text-gray-600 mb-8">
                    Add schools to compare their cut-off scores, sports performance, CCA achievements, and culture side-by-side.
                  </p>

                  {/* Quick Add Popular Schools */}
                  <div className="space-y-4">
                    <p className="text-sm font-medium text-gray-700">Quick Add Popular Schools:</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {availableSchools.slice(0, 4).map(school => (
                        <button
                          key={school.code}
                          onClick={() => addSchool(school)}
                          className="p-3 text-left bg-white border border-gray-300 rounded-lg hover:border-blue-500 hover:shadow-md transition-all duration-200"
                        >
                          <p className="font-medium text-black text-sm">{school.name}</p>
                          <p className="text-xs text-gray-600">{school.gender} • {school.hasIP ? 'IP' : 'Regular'}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Comparison Table */
              <div className="space-y-6">
                <ComparisonTable schools={selectedSchools} />
                <ComparisonActions schools={selectedSchools} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ComparePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div></div>}>
      <ComparePageContent />
    </Suspense>
  );
}