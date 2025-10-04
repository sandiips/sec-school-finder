import { useState, useEffect } from 'react';
import { SchoolProfile } from '@/types/school';

interface School {
  code: string;
  name: string;
}

interface ComparisonSchoolSearchProps {
  onAddSchool: (school: SchoolProfile) => void;
  selectedSchoolCodes: string[];
  userLocation?: { lat: number; lng: number } | null;
  calculateDistance?: (lat1: number, lng1: number, lat2: number, lng2: number) => number;
}

export default function ComparisonSchoolSearch({
  onAddSchool,
  selectedSchoolCodes,
  userLocation,
  calculateDistance
}: ComparisonSchoolSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [schools, setSchools] = useState<School[]>([]);
  const [filteredSchools, setFilteredSchools] = useState<School[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);

  // Fetch all schools on component mount
  useEffect(() => {
    const fetchSchools = async () => {
      try {
        const response = await fetch('/api/schools');
        if (response.ok) {
          const schoolsData = await response.json();
          setSchools(schoolsData);
        } else {
          console.error('Failed to fetch schools');
        }
      } catch (error) {
        console.error('Error fetching schools:', error);
      }
    };

    fetchSchools();
  }, []);

  // Show all available schools by default, filter when searching
  useEffect(() => {
    const filtered = schools
      .filter(school =>
        school?.name && // Ensure name exists
        !selectedSchoolCodes.includes(school.code) &&
        (searchTerm === '' || school.name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      // Remove slice limit to show ALL schools

    setFilteredSchools(filtered);
  }, [searchTerm, schools, selectedSchoolCodes]);

  const handleSchoolSelect = async (school: School) => {
    setLoading(true);
    try {
      // Fetch full school profile data
      const response = await fetch(`/api/school/${school.code}`);
      if (response.ok) {
        const schoolProfile = await response.json();

        // Calculate distance if user location is available
        if (userLocation && calculateDistance && schoolProfile.coordinates) {
          const distance = calculateDistance(
            userLocation.lat,
            userLocation.lng,
            schoolProfile.coordinates.lat,
            schoolProfile.coordinates.lng
          );
          schoolProfile.distance = Math.round(distance * 10) / 10; // Round to 1 decimal
        }

        onAddSchool(schoolProfile);
        setSearchTerm('');
        setShowDropdown(false);
      } else {
        console.error('Failed to fetch school profile');
      }
    } catch (error) {
      console.error('Error adding school:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      <label htmlFor="school-dropdown-search" className="block text-sm font-medium text-primary mb-2">
        🔍 Search & Add Schools
      </label>

      <div className="relative">
        <input
          id="school-dropdown-search"
          type="text"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => setShowDropdown(true)}
          placeholder="Select a school or type to search..."
          className="input-modern"
        />

        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
          <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
          </svg>
        </div>
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute z-50 w-full mt-1 bg-white rounded-lg shadow-lg max-h-80 overflow-y-auto border border-gray-200">
          {filteredSchools.length > 0 ? (
            filteredSchools.map((school) => (
              <button
                key={school.code}
                onClick={() => handleSchoolSelect(school)}
                disabled={loading}
                className="w-full px-4 py-3 text-left hover:bg-blue-50 border-b border-gray-100 last:border-b-0 transition-colors disabled:opacity-50"
              >
                <div className="font-medium text-primary">{school.name}</div>
                <div className="text-sm text-secondary">Code: {school.code}</div>
              </button>
            ))
          ) : (
            <div className="px-4 py-3 text-secondary text-center">
              {searchTerm === ''
                ? 'Loading schools...'
                : `No schools found matching "${searchTerm}"`
              }
            </div>
          )}
        </div>
      )}

      {/* Click outside to close dropdown */}
      {showDropdown && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowDropdown(false)}
        />
      )}

      {loading && (
        <div className="absolute top-full left-0 right-0 mt-1 p-2 bg-white/90 rounded text-center text-sm text-secondary">
          Loading school data...
        </div>
      )}
    </div>
  );
}