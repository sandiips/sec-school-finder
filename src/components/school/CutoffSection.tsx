import { SchoolProfile } from '@/types/school';
import Badge from '@/components/ui/Badge';

interface CutoffSectionProps {
  school: SchoolProfile;
}

export default function CutoffSection({ school }: CutoffSectionProps) {
  const { cutoffs } = school;

  const getScoreColor = (score: number): 'green' | 'orange' | 'red' => {
    if (score <= 10) return 'green'; // Excellent (lower = better)
    if (score <= 20) return 'orange'; // Good
    return 'red'; // Competitive
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header - De-emphasized */}
      <div className="bg-gradient-to-r from-gray-500 to-gray-600 text-white p-4">
        <div className="flex items-center">
          <span className="text-2xl mr-3 opacity-70" role="img" aria-label="Cut-off Scores">
            📊
          </span>
          <div>
            <h2 className="text-lg font-semibold">Cut-off Scores (2024)</h2>
            <p className="text-gray-200 mt-1 text-sm">
              Academic entry requirements • Focus on holistic development above
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="space-y-6">
          {/* IP Cut-off */}
          <div className="border border-gray-200 rounded-xl p-6 bg-white hover:shadow-sm hover:border-gray-300 transition-all duration-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-black">
                Integrated Programme (IP)
              </h3>
              {cutoffs.ip ? (
                <Badge variant="purple" size="small">
                  Most Selective
                </Badge>
              ) : (
                <Badge variant="gray" size="small">
                  Not Available
                </Badge>
              )}
            </div>
            {cutoffs.ip ? (
              <>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Badge variant={getScoreColor(cutoffs.ip.min)} size="medium">
                      {cutoffs.ip.min}
                    </Badge>
                    <span className="text-black">to</span>
                    <Badge variant={getScoreColor(cutoffs.ip.max)} size="medium">
                      {cutoffs.ip.max}
                    </Badge>
                  </div>
                  <span className="text-sm text-gray-600">
                    ({cutoffs.ip.year})
                  </span>
                </div>
                <p className="text-sm text-black mt-2">
                  6-year integrated programme bypassing O-Level examinations
                </p>
              </>
            ) : (
              <div className="flex items-center">
                <span className="text-black">No Integrated Program</span>
              </div>
            )}
          </div>

          {/* Affiliated Cut-off */}
          <div className="border border-gray-200 rounded-xl p-6 bg-white hover:shadow-sm hover:border-gray-300 transition-all duration-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-black">
                Affiliated Students
              </h3>
              {cutoffs.affiliated ? (
                <Badge variant="cyan" size="small">
                  Easier Entry
                </Badge>
              ) : (
                <Badge variant="gray" size="small">
                  Not Available
                </Badge>
              )}
            </div>
            {cutoffs.affiliated ? (
              <>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Badge variant={getScoreColor(cutoffs.affiliated.min)} size="medium">
                      {cutoffs.affiliated.min}
                    </Badge>
                    <span className="text-black">to</span>
                    <Badge variant={getScoreColor(cutoffs.affiliated.max)} size="medium">
                      {cutoffs.affiliated.max}
                    </Badge>
                  </div>
                  <span className="text-sm text-gray-600">
                    ({cutoffs.affiliated.year})
                  </span>
                </div>
                <p className="text-sm text-black mt-2">
                  Students from affiliated primary schools get priority placement
                </p>
              </>
            ) : (
              <div className="flex items-center">
                <span className="text-black">No Primary School Affiliations</span>
              </div>
            )}
          </div>

          {/* Open Cut-off by Posting Groups */}
          <div className="border border-gray-200 rounded-xl p-6 bg-white hover:shadow-sm hover:border-gray-300 transition-all duration-200">
            <h3 className="text-lg font-semibold text-black mb-4">
              Open Admission by Posting Group
            </h3>
            <div className="space-y-3">
              {cutoffs.open
                .sort((a, b) => b.pg - a.pg) // Sort PG3 to PG1 (top to bottom)
                .map((track) => {
                  const tierInfo = {
                    3: { color: 'green' as const },
                    2: { color: 'orange' as const },
                    1: { color: 'red' as const }
                  };

                  const info = tierInfo[track.pg];

                  return (
                    <div key={track.pg} className="flex items-center justify-between p-3 bg-gray-500 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Badge variant={info.color} size="small">
                          PG{track.pg}
                        </Badge>
                        <div>
                          <p className="font-medium text-white">
                            Posting Group {track.pg}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {track.min !== null && track.max !== null ? (
                          <>
                            <Badge variant={getScoreColor(track.min)} size="medium">
                              {track.min}
                            </Badge>
                            <span className="text-white">to</span>
                            <Badge variant={getScoreColor(track.max)} size="medium">
                              {track.max}
                            </Badge>
                          </>
                        ) : (
                          <Badge variant="gray" size="medium">
                            No data available
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>

        {/* PSLE Scoring Explanation */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h4 className="font-semibold text-black mb-3">
            Understanding PSLE Scores
          </h4>
          <div className="text-sm text-black space-y-2 leading-relaxed">
            <p>• PSLE scores range from 4 (highest achievement) to 30 (lowest)</p>
            <p>• Lower scores indicate better academic performance</p>
            <p>• Affiliated students from partner primary schools get easier entry</p>
          </div>
        </div>
      </div>
    </div>
  );
}