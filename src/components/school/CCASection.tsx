import { SchoolProfile } from '@/types/school';
import Badge from '@/components/ui/Badge';
import { useState } from 'react';

interface CCASectionProps {
  school: SchoolProfile;
}

export default function CCASection({ school }: CCASectionProps) {
  const { ccas } = school;
  const [expandedCCAs, setExpandedCCAs] = useState<Record<string, boolean>>({});

  const toggleCCADetails = (categoryKey: string) => {
    setExpandedCCAs(prev => ({
      ...prev,
      [categoryKey]: !prev[categoryKey]
    }));
  };

  const ccaCategories = [
    { key: 'astronomy', name: 'Astronomy', icon: '🌟' },
    { key: 'chemistryOlympiad', name: 'Chemistry Olympiad', icon: '🔬' },
    { key: 'mathOlympiad', name: 'Math Olympiad', icon: '🧮' },
    { key: 'robotics', name: 'Robotics', icon: '🤖' },
    { key: 'nationalStem', name: 'National STEM', icon: '🧪' }
  ] as const;

  const hasAnyData = ccas.categoriesWithData > 0;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 border-b border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <span className="text-3xl mr-4" role="img" aria-label="CCA Excellence">
              🎯
            </span>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">CCA Excellence</h2>
              <p className="text-gray-600 mt-1">
                Co-Curricular Activities and Competition Achievements
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-gray-600 text-sm font-medium">Categories with Data</p>
            <p className="text-3xl font-bold text-gray-900">{ccas.categoriesWithData}</p>
            <p className="text-gray-600 text-sm">of {ccas.availableCategories}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {hasAnyData ? (
          <div className="space-y-6">
            {/* CCA Categories Grid */}
            <h3 className="text-lg font-semibold text-black mb-6">
              Achievement Categories
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {ccaCategories.map((category) => {
                const ccaData = ccas[category.key as keyof typeof ccas] as any;

                if (!ccaData || typeof ccaData !== 'object') return null;

                return (
                  <div
                    key={category.key}
                    className="border border-gray-200 rounded-xl p-6 bg-white hover:shadow-sm hover:border-gray-300 transition-all duration-200"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-black flex items-center">
                        <span className="mr-2 text-xl" role="img" aria-label={category.name}>
                          {category.icon}
                        </span>
                        {category.name}
                      </h4>
                      {ccaData.hasData ? (
                        <Badge variant="purple" size="small">
                          {ccaData.achievements} achievements
                        </Badge>
                      ) : (
                        <Badge variant="gray" size="small">
                          No data
                        </Badge>
                      )}
                    </div>

                    {ccaData.hasData ? (
                      <div className="space-y-2">
                        <p className="text-sm text-black font-medium">
                          Achievement Details:
                        </p>
                        <ul className="text-sm text-black space-y-2">
                          {(expandedCCAs[category.key] ? ccaData.details : ccaData.details.slice(0, 3)).map((detail: string, index: number) => (
                            <li key={index} className="flex items-start">
                              <span className="w-1 h-1 bg-gray-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                              {detail}
                            </li>
                          ))}
                          {ccaData.details.length > 3 && (
                            <li>
                              <button
                                onClick={() => toggleCCADetails(category.key)}
                                className="text-accent-blue hover:text-blue-700 font-medium cursor-pointer underline text-sm"
                              >
                                {expandedCCAs[category.key]
                                  ? 'Show less achievements'
                                  : `+${ccaData.details.length - 3} more achievements`
                                }
                              </button>
                            </li>
                          )}
                        </ul>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-600">
                        CCA data not available for this category.
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Summary Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Data Coverage */}
              <div className="bg-blue-50 rounded-lg p-6">
                <h4 className="font-bold text-black mb-4">Data Coverage</h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-black">Categories with data:</span>
                    <Badge variant="blue" size="small">
                      {ccas.categoriesWithData}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-black">Total categories:</span>
                    <Badge variant="gray" size="small">
                      {ccas.availableCategories}
                    </Badge>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
                    <div
                      className="bg-accent-blue h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(ccas.categoriesWithData / ccas.availableCategories) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Achievement Overview */}
              <div className="bg-blue-50 rounded-lg p-6">
                <h4 className="font-bold text-black mb-4">Achievement Overview</h4>
                <div className="space-y-3">
                  {ccaCategories.map((category) => {
                    const ccaData = ccas[category.key as keyof typeof ccas] as any;
                    if (!ccaData || typeof ccaData !== 'object' || !ccaData.hasData) return null;

                    return (
                      <div key={category.key}>
                        <div className="flex items-center mb-2">
                          <span className="text-black flex items-center">
                            <span className="mr-2">{category.icon}</span>
                            {category.name}:
                          </span>
                          <Badge variant="green" size="small" className="ml-2">
                            {ccaData.achievements}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-1 ml-6">
                          <Badge variant="green" size="small">
                            {category.name}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* No Data State */
          <div className="text-center py-12">
            <span className="text-6xl mb-4 block" role="img" aria-label="No CCA data">
              🎯
            </span>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              CCA data not available
            </h3>
            <p className="text-gray-600 mb-4">
              No achievement data available for CCA activities at this school.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {ccaCategories.map((category) => (
                <Badge key={category.key} variant="gray" size="small">
                  {category.icon} {category.name}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* CCA Information */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h4 className="font-semibold text-black mb-3">
            About CCA Categories
          </h4>
          <div className="text-sm text-black space-y-2 leading-relaxed">
            <p>• CCA data is limited to 5 specific academic categories available in Singapore schools</p>
            <p>• Achievement data includes competition results, awards, and program participation</p>
            <p>• Categories: Astronomy, Chemistry Olympiad, Math Olympiad, Robotics, National STEM</p>
            <p>• Data availability varies by school participation in these competitive programs</p>
          </div>
        </div>
      </div>
    </div>
  );
}