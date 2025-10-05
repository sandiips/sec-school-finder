import { SchoolProfile } from '@/types/school';
import Badge from '@/components/ui/Badge';
import ComparisonRow from './ComparisonRow';
import MobileComparisonView from './MobileComparisonView';

interface ComparisonTableProps {
  schools: SchoolProfile[];
}

export default function ComparisonTable({ schools }: ComparisonTableProps) {
  if (schools.length === 0) return null;

  const getScoreColor = (score: number): 'green' | 'orange' | 'red' => {
    if (score <= 10) return 'green'; // Excellent (lower = better for PSLE)
    if (score <= 20) return 'orange'; // Good
    return 'red'; // Competitive
  };

  const getStrengthColor = (strength: string): 'green' | 'orange' | 'red' => {
    switch (strength) {
      case 'Very Strong': return 'green';
      case 'Strong': return 'green';
      case 'Fair': return 'red';
      default: return 'gray' as 'red';
    }
  };

  return (
    <>
      {/* Mobile View */}
      <MobileComparisonView schools={schools} />

      {/* Desktop/Tablet View */}
      <div className="hidden lg:block bg-gray-900 rounded-xl shadow-lg border border-gray-700 overflow-hidden">
        {/* Header */}
        <div className="bg-gray-800 border-b border-gray-700 p-6">
          <h2 className="text-2xl font-semibold text-black">School Comparison</h2>
          <p className="text-black mt-1">
            Side-by-side analysis across all comparable dimensions
          </p>
        </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-max">
          {/* School Headers */}
          <thead className="bg-gray-800 border-b border-gray-700">
            <tr>
              <th className="px-4 py-4 text-left text-sm font-medium text-black uppercase tracking-wider" style={{minWidth: '200px', width: '200px'}}>
                Dimension
              </th>
              {schools.map((school, index) => (
                <th key={school.code} className="px-4 py-4 text-center" style={{minWidth: '280px', width: '280px'}}>
                  <div className="space-y-2">
                    <div className="flex items-center justify-center">
                      <div className="w-8 h-8 bg-accent-blue text-white rounded-full flex items-center justify-center font-bold text-sm mr-2">
                        {index + 1}
                      </div>
                      <h3 className="font-bold text-black text-sm leading-tight">
                        {school.name}
                      </h3>
                    </div>
                    <div className="flex justify-center space-x-1">
                      <Badge
                        variant="gray"
                        size="small"
                      >
                        {school.gender}
                      </Badge>
                      <Badge
                        variant={school.hasIP ? 'blue' : 'gray'}
                        size="small"
                      >
                        {school.hasIP ? 'IP' : 'Regular'}
                      </Badge>
                    </div>
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="bg-gray-900 divide-y divide-gray-700">
            {/* Basic Information */}
            <ComparisonRow
              title="Address"
              icon="📍"
              values={schools.map(school => school.address)}
              type="text"
            />

            <ComparisonRow
              title="Distance from You"
              icon="📏"
              values={schools.map(school => school.distance ? `${school.distance} km` : 'Not calculated')}
              type="text"
            />

            {/* Cut-off Scores */}
            <tr className="bg-gray-800">
              <td colSpan={schools.length + 1} className="px-6 py-3">
                <h4 className="font-semibold text-black flex items-center">
                  <span className="mr-2">📊</span>
                  Cut-off Scores (2024) - Lower = Better
                </h4>
              </td>
            </tr>

            <ComparisonRow
              title="IP Cut-off"
              titleClassName="compare-cutoff-ip-title"
              icon="🎓"
              values={schools.map(school =>
                school.cutoffs.ip
                  ? `${school.cutoffs.ip.min}-${school.cutoffs.ip.max}`
                  : 'No Integrated Program'
              )}
              type="score"
              getColor={(value) => {
                const match = value.match(/^(\d+)-/);
                return match ? getScoreColor(parseInt(match[1])) : 'gray' as 'red';
              }}
            />

            <ComparisonRow
              title="Affiliated Cut-off"
              titleClassName="compare-cutoff-affiliated-title"
              icon="🔗"
              values={schools.map(school =>
                school.cutoffs.affiliated
                  ? `${school.cutoffs.affiliated.min}-${school.cutoffs.affiliated.max}`
                  : 'No Primary Affiliations'
              )}
              type="score"
              getColor={(value) => {
                const match = value.match(/^(\d+)-/);
                return match ? getScoreColor(parseInt(match[1])) : 'gray' as 'red';
              }}
            />

            <ComparisonRow
              title="Open PG3"
              titleClassName="compare-cutoff-open-title"
              icon="🥇"
              values={schools.map(school => {
                const pg3 = school.cutoffs.open.find(o => o.pg === 3);
                return pg3 ? `${pg3.min}-${pg3.max}` : 'Not available';
              })}
              type="score"
              getColor={(value) => {
                const match = value.match(/^(\d+)-/);
                return match ? getScoreColor(parseInt(match[1])) : 'gray' as 'red';
              }}
            />

            {/* Sports Performance */}
            <tr className="bg-gray-800">
              <td colSpan={schools.length + 1} className="px-6 py-3">
                <h4 className="font-semibold text-black flex items-center">
                  <span className="mr-2">🏆</span>
                  Sports Performance - Competition Results
                </h4>
              </td>
            </tr>

            <ComparisonRow
              title="Overall Sports Strength"
              icon="💪"
              values={schools.map(school => {
                if (school.sports.topSports.length === 0) return 'No data';

                const veryStrong = school.sports.topSports.filter(s => s.strength === 'Very Strong');
                const strong = school.sports.topSports.filter(s => s.strength === 'Strong');
                const fair = school.sports.topSports.filter(s => s.strength === 'Fair');

                let overallStrength = 'Fair';
                if (veryStrong.length >= 2) overallStrength = 'Very Strong';
                else if (veryStrong.length >= 1 || strong.length >= 3) overallStrength = 'Strong';

                // Create sport lists by strength category
                const sportLists = [];
                if (veryStrong.length > 0) {
                  sportLists.push(`Very Strong: ${veryStrong.map(s => s.sport).join(', ')}`);
                }
                if (strong.length > 0) {
                  sportLists.push(`Strong: ${strong.map(s => s.sport).join(', ')}`);
                }
                if (fair.length > 0) {
                  sportLists.push(`Fair: ${fair.map(s => s.sport).join(', ')}`);
                }

                return { strength: overallStrength, sportLists };
              })}
              type="sports_strength"
              getColor={getStrengthColor}
            />

            <ComparisonRow
              title="Top Sport Achievement"
              icon="🥇"
              values={schools.map(school =>
                school.sports.topSports.length > 0
                  ? `${school.sports.topSports[0].sport} (${school.sports.topSports[0].strength})`
                  : 'Sports data not available'
              )}
              type="text"
            />

            <ComparisonRow
              title="Best Performance"
              icon="🏅"
              values={schools.map(school =>
                school.sports.topSports.length > 0
                  ? school.sports.topSports[0].achievementSummary
                  : 'Competition data not available'
              )}
              type="text"
            />

            <ComparisonRow
              title="Sports with Data"
              icon="📊"
              values={schools.map(school => `${school.sports.totalSportsWithData} of 26`)}
              type="text"
            />

            {/* CCA Achievements */}
            <tr className="bg-gray-800">
              <td colSpan={schools.length + 1} className="px-6 py-3">
                <h4 className="font-semibold text-black flex items-center">
                  <span className="mr-2">🎯</span>
                  CCA Achievements (5 Categories Available)
                </h4>
              </td>
            </tr>

            <ComparisonRow
              title="Categories with Data"
              icon="📈"
              values={schools.map(school => `${school.ccas.categoriesWithData} of ${school.ccas.availableCategories}`)}
              type="text"
            />

            <ComparisonRow
              title="Total Achievements"
              icon="🏅"
              values={schools.map(school => {
                const achievements: string[] = [];
                const categories = [
                  { name: 'Astronomy', data: school.ccas.astronomy },
                  { name: 'Chemistry Olympiad', data: school.ccas.chemistryOlympiad },
                  { name: 'Math Olympiad', data: school.ccas.mathOlympiad },
                  { name: 'Robotics', data: school.ccas.robotics },
                  { name: 'National STEM', data: school.ccas.nationalStem }
                ];

                let totalCount = 0;
                categories.forEach(category => {
                  if (category.data?.hasData && category.data.achievements > 0) {
                    achievements.push(`${category.name}: ${category.data.achievements}`);
                    totalCount += category.data.achievements;
                  }
                });

                if (totalCount > 0) {
                  return `${totalCount} total (${achievements.join(', ')})`;
                } else {
                  return 'CCA data not available';
                }
              })}
              type="text"
            />

            {/* School Culture */}
            <tr className="bg-gray-800">
              <td colSpan={schools.length + 1} className="px-6 py-3">
                <h4 className="font-semibold text-black flex items-center">
                  <span className="mr-2">🌟</span>
                  School Culture
                </h4>
              </td>
            </tr>

            <ComparisonRow
              title="Core Values"
              icon="🎯"
              values={schools.map(school => school.culture.coreValues.slice(0, 2).join(', '))}
              type="text"
            />

            <ComparisonRow
              title="Culture Summary"
              icon="📚"
              values={schools.map(school => school.culture.description)}
              type="text"
            />
          </tbody>
        </table>
      </div>

      {/* Comparison Notes */}
      <div className="bg-gray-800 p-6 border-t border-gray-700">
        <h4 className="font-semibold text-black mb-3">Comparison Notes</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-black">
          <div>
            <h5 className="font-medium text-black mb-1">PSLE Scores (Lower = Better)</h5>
            <p className="text-black">Cut-off scores range from 4 (highest achievement) to 30. Lower scores indicate more selective schools.</p>
          </div>
          <div>
            <h5 className="font-medium text-black mb-1">Sports Scores (Higher = Better)</h5>
            <p className="text-black">Sports performance based on National School Games results. Higher scores indicate better competitive performance.</p>
          </div>
          <div>
            <h5 className="font-medium text-black mb-1">CCA Categories</h5>
            <p className="text-black">Limited to 5 specific academic categories: Astronomy, Chemistry Olympiad, Math Olympiad, Robotics, National STEM.</p>
          </div>
          <div>
            <h5 className="font-medium text-black mb-1">Data Availability</h5>
            <p className="text-black">"Data not available" indicates the school doesn't participate in that specific program or competition.</p>
          </div>
        </div>
      </div>
      </div>
    </>
  );
}