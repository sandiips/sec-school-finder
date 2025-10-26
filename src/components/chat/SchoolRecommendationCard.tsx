import Link from 'next/link';
import type { SchoolResult } from '@/hooks/useChat';

interface SchoolRecommendationCardProps {
  school: SchoolResult;
  darkMode?: boolean;
}

export default function SchoolRecommendationCard({ school, darkMode = false }: SchoolRecommendationCardProps) {
  const totalMatches =
    school.sports_matches.length +
    school.ccas_matches.length +
    school.culture_matches.length;

  return (
    <div className={`border rounded-lg p-4 hover:border-pink-300 transition-colors ${
      darkMode
        ? 'border-gray-700 bg-[#1f1f1f]'
        : 'border-gray-200 bg-white'
    }`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* School Name */}
          <h3 className={`font-semibold mb-1 truncate ${
            darkMode ? 'text-white' : 'text-gray-900'
          }`}>
            {school.name.split('-').map(word =>
              word.charAt(0).toUpperCase() + word.slice(1)
            ).join(' ')}
          </h3>

          {/* Address */}
          <p className={`text-sm mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {school.address}
          </p>

          {/* Key Info Row */}
          <div className="flex flex-wrap gap-3 text-sm mb-3">
            <div className="flex items-center gap-1">
              <span className={darkMode ? 'text-gray-500' : 'text-gray-500'}>Distance:</span>
              <span className={`font-medium ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                {school.distance_km.toFixed(1)} km
              </span>
            </div>

            <div className="flex items-center gap-1">
              <span className={darkMode ? 'text-gray-500' : 'text-gray-500'}>Cut-off:</span>
              <span className={`font-medium ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                {school.cop_max_score}
              </span>
              {school.is_affiliated && (
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full ml-1">
                  Affiliated
                </span>
              )}
            </div>

            {totalMatches > 0 && (
              <div className="flex items-center gap-1">
                <span className="text-gray-500">Matches:</span>
                <span className="font-medium text-pink-600">{totalMatches}</span>
              </div>
            )}
          </div>

          {/* Match Badges */}
          {(school.sports_matches.length > 0 ||
            school.ccas_matches.length > 0 ||
            school.culture_matches.length > 0) && (
            <div className="flex flex-wrap gap-2 mb-3">
              {school.sports_matches.slice(0, 3).map((sport) => (
                <span
                  key={sport}
                  className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full border border-green-200"
                >
                  ⚽ {sport}
                </span>
              ))}
              {school.ccas_matches.slice(0, 2).map((cca) => (
                <span
                  key={cca}
                  className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded-full border border-purple-200"
                >
                  🎯 {cca}
                </span>
              ))}
              {school.culture_matches.slice(0, 2).map((culture) => (
                <span
                  key={culture}
                  className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full border border-blue-200"
                >
                  💫 {culture}
                </span>
              ))}
              {totalMatches > 7 && (
                <span className="text-xs text-gray-500 px-2 py-1">
                  +{totalMatches - 7} more
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className={`flex gap-2 mt-3 pt-3 border-t ${
        darkMode ? 'border-gray-700' : 'border-gray-100'
      }`}>
        <Link
          href={`/school/${school.code}`}
          className="flex-1 text-center px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors text-sm font-medium"
        >
          View Profile
        </Link>
        <button
          onClick={() => {
            // TODO: Implement add to compare functionality
            console.log('Add to compare:', school.code);
          }}
          className={`px-4 py-2 border rounded-lg transition-colors text-sm font-medium ${
            darkMode
              ? 'border-gray-600 text-gray-300 hover:bg-gray-800'
              : 'border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          Compare
        </button>
      </div>
    </div>
  );
}
