import { SchoolProfile } from '@/types/school';
import Badge from '@/components/ui/Badge';
import { useState } from 'react';

interface SportsSectionProps {
  school: SchoolProfile;
}

export default function SportsSection({ school }: SportsSectionProps) {
  const { sports } = school;
  const [showAllSports, setShowAllSports] = useState(false);
  const [expandedResults, setExpandedResults] = useState<Record<string, boolean>>({});

  const INITIAL_SPORTS_COUNT = 4;

  const toggleSportResults = (sportName: string) => {
    setExpandedResults(prev => ({
      ...prev,
      [sportName]: !prev[sportName]
    }));
  };

  const getStrengthColor = (strength: string): 'green' | 'orange' | 'red' => {
    switch (strength) {
      case 'Very Strong': return 'green';
      case 'Strong': return 'green';
      case 'Fair': return 'red';
      default: return 'gray' as 'red';
    }
  };

  const getStrengthIcon = (strength: string): string => {
    switch (strength) {
      case 'Very Strong': return '🏆';
      case 'Strong': return '🥇';
      case 'Fair': return '🥉';
      default: return '⚽';
    }
  };

  // Helper function to generate sports strength summaries
  const generateSportsStrengthSummary = (sport: any) => {
    const results = sport.detailedResults || [];

    if (results.length === 0) {
      return `In ${sport.sport}, the school has ${sport.strength.toLowerCase()} performance with limited competition data available.`;
    }

    // Group results by gender
    const resultsByGender = results.reduce((acc: any, result: any) => {
      const gender = result.gender || 'Mixed';
      if (!acc[gender]) acc[gender] = [];
      acc[gender].push(result);
      return acc;
    }, {});

    const genderSummaries = [];

    // Process each gender separately
    for (const [gender, genderResults] of Object.entries(resultsByGender) as [string, any[]][]) {
      // Count specific result types for this gender
      const finalsCount = genderResults.filter((r: any) => r.result === 'F').length;
      const semisCount = genderResults.filter((r: any) => r.result?.toLowerCase().includes('semi')).length;
      const thirdsCount = genderResults.filter((r: any) => r.result === '3rd/4th' || r.result === '3rd_4th').length;
      const quarterfinalsCount = genderResults.filter((r: any) => r.result?.toLowerCase().includes('quarter')).length;

      // Get years span
      const years = [...new Set(genderResults.map((r: any) => r.year))].sort();
      const yearSpan = years.length > 1 ? `over ${years.length} years (${Math.min(...years)}-${Math.max(...years)})` : `in ${years[0]}`;

      // Get divisions
      const divisions = [...new Set(genderResults.map((r: any) => r.division))].filter(Boolean);
      const divisionText = divisions.length > 1 ? `across ${divisions.join(', ')} divisions` : divisions.length === 1 ? `in ${divisions[0]} division` : '';

      // Build achievement summary for this gender
      const achievements = [];
      if (finalsCount > 0) achievements.push(`${finalsCount} Finals (F) participation${finalsCount > 1 ? 's' : ''}`);
      if (semisCount > 0) achievements.push(`${semisCount} Semifinals participation${semisCount > 1 ? 's' : ''}`);
      if (thirdsCount > 0) achievements.push(`${thirdsCount} 3rd/4th placement${thirdsCount > 1 ? 's' : ''}`);
      if (quarterfinalsCount > 0) achievements.push(`${quarterfinalsCount} Quarterfinals participation${quarterfinalsCount > 1 ? 's' : ''}`);

      if (achievements.length > 0) {
        const achievementText = achievements.join(' and ');
        const strengthLevel = finalsCount >= 3 ? 'very strong' : finalsCount >= 1 || semisCount >= 2 ? 'strong' : 'fair strength';

        let genderSummary = `is ${strengthLevel} in ${gender} with ${achievementText}`;
        if (divisionText) genderSummary += ` ${divisionText}`;
        genderSummary += ` ${yearSpan}`;

        genderSummaries.push(genderSummary);
      }
    }

    // Combine gender summaries
    if (genderSummaries.length === 0) {
      return `In ${sport.sport}, the school has ${sport.strength.toLowerCase()} performance with consistent participation.`;
    }

    const combinedSummary = genderSummaries.length === 1
      ? `In ${sport.sport}, the school ${genderSummaries[0]}.`
      : `In ${sport.sport}, the school ${genderSummaries.join(' and is also ')}.`;

    return combinedSummary;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 border-b border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <span className="text-3xl mr-4" role="img" aria-label="Sports Performance">
              🏆
            </span>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Sports Excellence</h2>
              <p className="text-gray-600 mt-1">
                Competition results from National School Games • Finals, Semifinals, and more
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-gray-600 text-sm font-medium">Sports with Data</p>
            <p className="text-3xl font-bold text-gray-900">{sports.totalSportsWithData}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Top Performing Sports */}
        {sports.topSports.length > 0 ? (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-black mb-6">
              Top Performing Sports
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {(showAllSports ? sports.topSports : sports.topSports.slice(0, INITIAL_SPORTS_COUNT)).map((sport, index) => (
                <div key={sport.sport} className="border border-gray-200 rounded-xl p-6 hover:shadow-sm hover:border-gray-300 transition-all duration-200">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-black flex items-center">
                      <span className="mr-3" role="img" aria-label={sport.sport}>
                        {getStrengthIcon(sport.strength)}
                      </span>
                      {sport.sport}
                    </h4>
                    <Badge variant={getStrengthColor(sport.strength)} size="small">
                      {sport.strength}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    {/* Sports Strength Summary */}
                    <div className="mb-4">
                      <p className="text-sm text-black leading-relaxed">{generateSportsStrengthSummary(sport)}</p>
                    </div>

                    {/* Detailed Results */}
                    {sport.detailedResults.length > 0 && (
                      <div className="pt-3 border-t border-gray-100">
                        <p className="text-xs text-gray-600 mb-3 font-medium">Recent Competition Results:</p>
                        <div className="space-y-2">
                          {(expandedResults[sport.sport] ? sport.detailedResults : sport.detailedResults.slice(0, 3)).map((result, idx) => (
                            <div key={idx} className="text-xs text-gray-600">
                              <span className="text-gray-600">{result.result}</span>
                              <span className="text-gray-600"> • {result.year} • {result.division} Div • {result.gender}</span>
                            </div>
                          ))}
                          {sport.detailedResults.length > 3 && (
                            <button
                              onClick={() => toggleSportResults(sport.sport)}
                              className="text-xs text-accent-blue hover:text-blue-700 font-medium cursor-pointer underline mt-2"
                            >
                              {expandedResults[sport.sport]
                                ? 'Show less results'
                                : `+${sport.detailedResults.length - 3} more results`
                              }
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Show More/Less Button */}
            {sports.topSports.length > INITIAL_SPORTS_COUNT && (
              <div className="text-center mt-4">
                <button
                  onClick={() => setShowAllSports(!showAllSports)}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-accent-blue border border-accent-blue rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {showAllSports ? (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                      Show less
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                      Show {sports.topSports.length - INITIAL_SPORTS_COUNT} more sports
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <span className="text-6xl mb-4 block" role="img" aria-label="No data">
              📊
            </span>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Sports data not available
            </h3>
            <p className="text-gray-600">
              No performance data available for sports activities at this school.
            </p>
          </div>
        )}

        {/* Sports Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Data Availability */}
          <div className="bg-blue-50 rounded-lg p-6">
            <h4 className="font-bold text-black mb-4">Data Coverage</h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-black">Sports with data:</span>
                <Badge variant="blue" size="small">
                  {sports.totalSportsWithData}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-black">Total available sports:</span>
                <Badge variant="gray" size="small">
                  19
                </Badge>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
                <div
                  className="bg-accent-blue h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(sports.totalSportsWithData / 19) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Performance Summary */}
          {sports.topSports.length > 0 && (
            <div className="bg-blue-50 rounded-lg p-6">
              <h4 className="font-bold text-black mb-4">Performance Summary</h4>
              <div className="space-y-4">
                {/* Very Strong Sports */}
                {sports.topSports.filter(s => s.strength === 'Very Strong').length > 0 && (
                  <div>
                    <div className="flex items-center mb-2">
                      <span className="text-black">Very Strong sports:</span>
                      <Badge variant="green" size="small" className="ml-2">
                        {sports.topSports.filter(s => s.strength === 'Very Strong').length}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {sports.topSports.filter(s => s.strength === 'Very Strong').map(sport => (
                        <Badge key={sport.sport} variant="green" size="small">
                          {sport.sport}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Strong Sports */}
                {sports.topSports.filter(s => s.strength === 'Strong').length > 0 && (
                  <div>
                    <div className="flex items-center mb-2">
                      <span className="text-black">Strong sports:</span>
                      <Badge variant="orange" size="small" className="ml-2">
                        {sports.topSports.filter(s => s.strength === 'Strong').length}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {sports.topSports.filter(s => s.strength === 'Strong').map(sport => (
                        <Badge key={sport.sport} variant="orange" size="small">
                          {sport.sport}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Fair Sports */}
                {sports.topSports.filter(s => s.strength === 'Fair').length > 0 && (
                  <div>
                    <div className="flex items-center mb-2">
                      <span className="text-black">Fair sports:</span>
                      <Badge variant="red" size="small" className="ml-2">
                        {sports.topSports.filter(s => s.strength === 'Fair').length}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {sports.topSports.filter(s => s.strength === 'Fair').map(sport => (
                        <Badge key={sport.sport} variant="red" size="small">
                          {sport.sport}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sports Without Data */}
        {sports.sportsWithoutData.length > 0 && (
          <div className="mt-6 p-6 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-black mb-3">
              Sports Without Available Data
            </h4>
            <div className="flex flex-wrap gap-2">
              {sports.sportsWithoutData.map((sport) => (
                <Badge key={sport} variant="black" size="small">
                  {sport}
                </Badge>
              ))}
            </div>
            <p className="text-sm text-black mt-2">
              Data not available for these sports activities.
            </p>
          </div>
        )}

        {/* Performance Explanation */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h4 className="font-semibold text-black mb-3">
            Understanding Sports Performance
          </h4>
          <div className="text-sm text-black space-y-2 leading-relaxed">
            <p>• Performance based on National School Games results (2022-2024)</p>
            <p>• Results include Finals, Semifinals, Quarterfinals, and other tournament placements</p>
            <p>• Very Strong: Multiple Finals/Semifinals • Strong: Regular top-4 finishes • Fair: Developing program</p>
            <p>• Data covers A, B, C divisions across Boys, Girls, and Mixed competitions</p>
          </div>
        </div>
      </div>
    </div>
  );
}