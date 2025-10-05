'use client';

import { useState } from 'react';
import { SchoolProfile } from '@/types/school';
import Badge from '@/components/ui/Badge';
import { useSwipeGesture } from '@/hooks/useSwipeGesture';

interface MobileComparisonViewProps {
  schools: SchoolProfile[];
}

interface ComparisonSection {
  title: string;
  icon: string;
  expanded: boolean;
}

export default function MobileComparisonView({ schools }: MobileComparisonViewProps) {
  const [activeSchoolIndex, setActiveSchoolIndex] = useState(0);
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({
    'basic-info': true,
    'cutoff-scores': false,
    'sports': false,
    'ccas': false,
    'culture': false
  });

  if (schools.length === 0) return null;

  const activeSchool = schools[activeSchoolIndex];

  // Swipe gesture handlers
  const goToNextSchool = () => {
    if (activeSchoolIndex < schools.length - 1) {
      setActiveSchoolIndex(activeSchoolIndex + 1);
    }
  };

  const goToPrevSchool = () => {
    if (activeSchoolIndex > 0) {
      setActiveSchoolIndex(activeSchoolIndex - 1);
    }
  };

  const swipeGesture = useSwipeGesture({
    onSwipeLeft: goToNextSchool,
    onSwipeRight: goToPrevSchool,
    minSwipeDistance: 75,
    maxSwipeTime: 300
  });

  const toggleSection = (sectionKey: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }));
  };

  const getScoreColor = (score: number): 'green' | 'orange' | 'red' => {
    if (score <= 10) return 'green';
    if (score <= 20) return 'orange';
    return 'red';
  };

  const getStrengthColor = (strength: string): 'green' | 'orange' | 'red' => {
    switch (strength) {
      case 'Very Strong': return 'green';
      case 'Strong': return 'green';
      case 'Fair': return 'red';
      default: return 'gray' as 'red';
    }
  };

  const renderBasicInfo = (school: SchoolProfile) => (
    <div className="space-y-3">
      <div className="flex items-start space-x-2">
        <span className="text-lg">📍</span>
        <div>
          <p className="text-sm font-medium text-black">Address</p>
          <p className="text-sm text-gray-600">{school.address}</p>
        </div>
      </div>
      <div className="flex items-start space-x-2">
        <span className="text-lg">📏</span>
        <div>
          <p className="text-sm font-medium text-black">Distance from You</p>
          <p className="text-sm text-gray-600">
            {school.distance ? `${school.distance} km` : 'Not calculated'}
          </p>
        </div>
      </div>
    </div>
  );

  const renderCutoffScores = (school: SchoolProfile) => (
    <div className="space-y-4">
      <div className="bg-gray-50 p-3 rounded-lg">
        <p className="text-xs text-gray-500 mb-2">Lower scores = Better (more selective)</p>

        <div className="space-y-3">
          <div>
            <p className="text-sm font-medium text-white mb-1">🎓 IP cutoff</p>
            {school.cutoffs.ip ? (
              <Badge
                variant={getScoreColor(school.cutoffs.ip.min)}
                size="medium"
              >
                {school.cutoffs.ip.min}-{school.cutoffs.ip.max}
              </Badge>
            ) : (
              <p className="text-sm text-gray-500">No Integrated Program</p>
            )}
          </div>

          <div>
            <p className="text-sm font-medium text-white mb-1">🔗 Affiliated cutoff</p>
            {school.cutoffs.affiliated ? (
              <Badge
                variant={getScoreColor(school.cutoffs.affiliated.min)}
                size="medium"
              >
                {school.cutoffs.affiliated.min}-{school.cutoffs.affiliated.max}
              </Badge>
            ) : (
              <p className="text-sm text-gray-500">No Primary Affiliations</p>
            )}
          </div>

          <div>
            <p className="text-sm font-medium text-white mb-1">🥇 OPEN PG3</p>
            {(() => {
              const pg3 = school.cutoffs.open.find(o => o.pg === 3);
              return pg3 && pg3.min && pg3.max ? (
                <Badge
                  variant={getScoreColor(pg3.min)}
                  size="medium"
                >
                  {pg3.min}-{pg3.max}
                </Badge>
              ) : (
                <p className="text-sm text-gray-500">Not available</p>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );

  const renderSports = (school: SchoolProfile) => (
    <div className="space-y-4">
      <div className="bg-green-50 p-3 rounded-lg">
        <p className="text-xs text-green-600 mb-2">Higher scores = Better performance</p>

        {school.sports.topSports.length === 0 ? (
          <p className="text-sm text-gray-500">Sports data not available</p>
        ) : (
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium text-black mb-2">💪 Overall Sports Strength</p>
              {(() => {
                const veryStrong = school.sports.topSports.filter(s => s.strength === 'Very Strong');
                const strong = school.sports.topSports.filter(s => s.strength === 'Strong');
                const fair = school.sports.topSports.filter(s => s.strength === 'Fair');

                let overallStrength = 'Fair';
                if (veryStrong.length >= 2) overallStrength = 'Very Strong';
                else if (veryStrong.length >= 1 || strong.length >= 3) overallStrength = 'Strong';

                return (
                  <div className="space-y-2">
                    <Badge variant={getStrengthColor(overallStrength)} size="medium">
                      {overallStrength}
                    </Badge>

                    {veryStrong.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-green-700">Very Strong:</p>
                        <p className="text-xs text-gray-600">{veryStrong.map(s => s.sport).join(', ')}</p>
                      </div>
                    )}

                    {strong.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-green-600">Strong:</p>
                        <p className="text-xs text-gray-600">{strong.map(s => s.sport).join(', ')}</p>
                      </div>
                    )}

                    {fair.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-red-600">Fair:</p>
                        <p className="text-xs text-gray-600">{fair.map(s => s.sport).join(', ')}</p>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            <div>
              <p className="text-sm font-medium text-black mb-1">🥇 Top Sport Achievement</p>
              <p className="text-sm text-gray-600">
                {school.sports.topSports[0].sport} ({school.sports.topSports[0].strength})
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-black mb-1">🏅 Best Performance</p>
              <p className="text-xs text-gray-600 leading-relaxed">
                {school.sports.topSports[0].achievementSummary}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-black mb-1">📊 Sports with Data</p>
              <p className="text-sm text-gray-600">{school.sports.totalSportsWithData} of 26</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderCCAs = (school: SchoolProfile) => (
    <div className="space-y-4">
      <div className="bg-indigo-50 p-3 rounded-lg">
        <p className="text-xs text-indigo-600 mb-2">5 Categories Available</p>

        <div className="space-y-3">
          <div>
            <p className="text-sm font-medium text-black mb-1">📈 Categories with Data</p>
            <p className="text-sm text-gray-600">
              {school.ccas.categoriesWithData} of {school.ccas.availableCategories}
            </p>
          </div>

          <div>
            <p className="text-sm font-medium text-black mb-2">🏅 Total Achievements</p>
            {(() => {
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
                return (
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-indigo-700">{totalCount} total</p>
                    {achievements.map((achievement, idx) => (
                      <p key={idx} className="text-xs text-gray-600">{achievement}</p>
                    ))}
                  </div>
                );
              } else {
                return <p className="text-sm text-gray-500">CCA data not available</p>;
              }
            })()}
          </div>
        </div>
      </div>
    </div>
  );

  const renderCulture = (school: SchoolProfile) => (
    <div className="space-y-4">
      <div className="bg-amber-50 p-3 rounded-lg">
        <div className="space-y-3">
          <div>
            <p className="text-sm font-medium text-black mb-1">🎯 Core Values</p>
            <p className="text-sm text-gray-600">
              {school.culture.coreValues.slice(0, 2).join(', ')}
            </p>
          </div>

          <div>
            <p className="text-sm font-medium text-black mb-1">📚 Culture Summary</p>
            <p className="text-xs text-gray-600 leading-relaxed">
              {school.culture.description}
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="lg:hidden"> {/* Only show on mobile/tablet */}
      {/* School Selector Tabs */}
      <div className="mb-6">
        <div className="flex space-x-2 overflow-x-auto pb-2">
          {schools.map((school, index) => (
            <button
              key={school.code}
              onClick={() => setActiveSchoolIndex(index)}
              className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors min-h-[44px] ${
                activeSchoolIndex === index
                  ? 'bg-accent-blue text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span className="block truncate max-w-32">{school.name}</span>
              <span className="block text-xs opacity-75">
                {school.gender} • {school.hasIP ? 'IP' : 'Regular'}
              </span>
            </button>
          ))}
        </div>

        {/* Swipe Indicator */}
        {schools.length > 1 && (
          <div className="flex justify-center items-center space-x-2 mt-2">
            <div className="flex space-x-1">
              {schools.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-all duration-200 ${
                    activeSchoolIndex === index ? 'bg-accent-blue' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-xs text-gray-500 ml-2">
              Swipe ← → between schools
            </span>
          </div>
        )}
      </div>

      {/* Active School Card */}
      <div
        ref={swipeGesture.ref as React.RefObject<HTMLDivElement>}
        className={`bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden transition-transform duration-200 ${
          swipeGesture.isSwiping ? 'scale-[0.98]' : 'scale-100'
        }`}
      >
        {/* School Header */}
        <div className="bg-gray-50 p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-accent-blue text-white rounded-full flex items-center justify-center font-bold">
              {activeSchoolIndex + 1}
            </div>
            <div className="flex-1">
              <h2 className="font-bold text-gray-900 text-lg leading-tight">
                {activeSchool.name}
              </h2>
              <div className="flex space-x-2 mt-1">
                <Badge variant="gray" size="small">{activeSchool.gender}</Badge>
                <Badge
                  variant={activeSchool.hasIP ? 'blue' : 'gray'}
                  size="small"
                >
                  {activeSchool.hasIP ? 'IP' : 'Regular'}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Expandable Sections */}
        <div className="divide-y divide-gray-200">
          {/* Basic Information */}
          <div>
            <button
              onClick={() => toggleSection('basic-info')}
              className="w-full px-4 py-4 text-left flex items-center justify-between hover:bg-gray-50 min-h-[60px] touch-manipulation"
            >
              <div className="flex items-center space-x-3">
                <span className="text-lg">📍</span>
                <span className="font-medium text-black">Basic Information</span>
              </div>
              <span className={`transform transition-transform duration-200 text-black ${
                expandedSections['basic-info'] ? 'rotate-180' : ''
              }`}>
                ▼
              </span>
            </button>
            {expandedSections['basic-info'] && (
              <div className="px-4 pb-4">
                {renderBasicInfo(activeSchool)}
              </div>
            )}
          </div>

          {/* Cut-off Scores */}
          <div>
            <button
              onClick={() => toggleSection('cutoff-scores')}
              className="w-full px-4 py-4 text-left flex items-center justify-between hover:bg-gray-50 min-h-[60px] touch-manipulation"
            >
              <div className="flex items-center space-x-3">
                <span className="text-lg">📊</span>
                <span className="font-medium text-black">Cut-off Scores (2024)</span>
              </div>
              <span className={`transform transition-transform duration-200 text-black ${
                expandedSections['cutoff-scores'] ? 'rotate-180' : ''
              }`}>
                ▼
              </span>
            </button>
            {expandedSections['cutoff-scores'] && (
              <div className="px-4 pb-4">
                {renderCutoffScores(activeSchool)}
              </div>
            )}
          </div>

          {/* Sports Performance */}
          <div>
            <button
              onClick={() => toggleSection('sports')}
              className="w-full px-4 py-4 text-left flex items-center justify-between hover:bg-gray-50 min-h-[60px] touch-manipulation"
            >
              <div className="flex items-center space-x-3">
                <span className="text-lg">🏆</span>
                <span className="font-medium text-black">Sports Performance</span>
              </div>
              <span className={`transform transition-transform duration-200 text-black ${
                expandedSections['sports'] ? 'rotate-180' : ''
              }`}>
                ▼
              </span>
            </button>
            {expandedSections['sports'] && (
              <div className="px-4 pb-4">
                {renderSports(activeSchool)}
              </div>
            )}
          </div>

          {/* CCA Achievements */}
          <div>
            <button
              onClick={() => toggleSection('ccas')}
              className="w-full px-4 py-4 text-left flex items-center justify-between hover:bg-gray-50 min-h-[60px] touch-manipulation"
            >
              <div className="flex items-center space-x-3">
                <span className="text-lg">🎯</span>
                <span className="font-medium text-black">CCA Achievements</span>
              </div>
              <span className={`transform transition-transform duration-200 text-black ${
                expandedSections['ccas'] ? 'rotate-180' : ''
              }`}>
                ▼
              </span>
            </button>
            {expandedSections['ccas'] && (
              <div className="px-4 pb-4">
                {renderCCAs(activeSchool)}
              </div>
            )}
          </div>

          {/* School Culture */}
          <div>
            <button
              onClick={() => toggleSection('culture')}
              className="w-full px-4 py-4 text-left flex items-center justify-between hover:bg-gray-50 min-h-[60px] touch-manipulation"
            >
              <div className="flex items-center space-x-3">
                <span className="text-lg">🌟</span>
                <span className="font-medium text-black">School Culture</span>
              </div>
              <span className={`transform transition-transform duration-200 text-black ${
                expandedSections['culture'] ? 'rotate-180' : ''
              }`}>
                ▼
              </span>
            </button>
            {expandedSections['culture'] && (
              <div className="px-4 pb-4">
                {renderCulture(activeSchool)}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Compare All Quick View */}
      {schools.length > 1 && (
        <div className="mt-6 bg-white rounded-xl shadow-lg border border-gray-200 p-4">
          <h3 className="font-semibold text-black mb-3 flex items-center">
            <span className="mr-2">⚖️</span>
            Quick Compare All Schools
          </h3>
          <div className="space-y-3">
            {schools.map((school, index) => (
              <div key={school.code} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-accent-blue text-white rounded-full flex items-center justify-center text-xs font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{school.name}</p>
                    <p className="text-xs text-gray-500">
                      {school.gender} • {school.hasIP ? 'IP' : 'Regular'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveSchoolIndex(index)}
                  className="px-3 py-2 bg-accent-blue text-white text-xs rounded-lg hover:bg-blue-700 min-h-[44px] min-w-[80px] touch-manipulation"
                >
                  View Details
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Comparison Notes */}
      <div className="mt-6 bg-gray-50 rounded-xl p-4">
        <h4 className="font-semibold text-gray-900 mb-3">Comparison Notes</h4>
        <div className="space-y-3 text-sm text-gray-600">
          <div>
            <h5 className="font-medium text-gray-900 mb-1">PSLE Scores (Lower = Better)</h5>
            <p>Cut-off scores range from 4 (highest achievement) to 30. Lower scores indicate more selective schools.</p>
          </div>
          <div>
            <h5 className="font-medium text-gray-900 mb-1">Sports Scores (Higher = Better)</h5>
            <p>Sports performance based on National School Games results. Higher scores indicate better competitive performance.</p>
          </div>
          <div>
            <h5 className="font-medium text-gray-900 mb-1">CCA Categories</h5>
            <p>Limited to 5 specific academic categories: Astronomy, Chemistry Olympiad, Math Olympiad, Robotics, National STEM.</p>
          </div>
        </div>
      </div>
    </div>
  );
}