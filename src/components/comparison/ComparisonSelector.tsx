import { useState } from 'react';
import { SchoolProfile } from '@/types/school';
import Badge from '@/components/ui/Badge';

interface ComparisonSelectorProps {
  selectedSchools: SchoolProfile[];
  availableSchools: SchoolProfile[];
  onAddSchool: (school: SchoolProfile) => void;
  onRemoveSchool: (schoolCode: string) => void;
  onClearAll: () => void;
  maxSchools: number;
}

export default function ComparisonSelector({
  selectedSchools,
  availableSchools,
  onAddSchool,
  onRemoveSchool,
  onClearAll,
  maxSchools
}: ComparisonSelectorProps) {
  const canAddMore = selectedSchools.length < maxSchools;

  return (
    <div className="bg-gray-900 rounded-xl shadow-lg border border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-black">
          School Selection
        </h2>
        {selectedSchools.length > 0 && (
          <button
            onClick={onClearAll}
            className="text-sm text-red-600 hover:text-red-700 font-medium transition-colors"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Selected Schools */}
      <div className="space-y-4 mb-6">
        {selectedSchools.map((school, index) => (
          <div
            key={school.code}
            className="relative p-4 bg-gray-800 rounded-lg border border-gray-600"
          >
            <div className="flex items-start space-x-3 pr-8">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-accent-blue text-white rounded-full flex items-center justify-center font-bold text-sm">
                  {index + 1}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-black text-sm leading-tight mb-2 pr-2">
                  {school.name}
                </h3>
                <div className="flex flex-wrap gap-1">
                  <Badge
                    variant={school.gender === 'Boys' ? 'blue' : school.gender === 'Girls' ? 'purple' : 'green'}
                    size="small"
                  >
                    {school.gender}
                  </Badge>
                  <Badge
                    variant={school.hasIP ? 'purple' : 'gray'}
                    size="small"
                  >
                    {school.hasIP ? 'IP' : 'Regular'}
                  </Badge>
                  {school.distance && (
                    <Badge variant="cyan" size="small">
                      {school.distance} km
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={() => onRemoveSchool(school.code)}
              className="absolute top-3 right-3 text-red-500 hover:text-red-700 transition-colors p-1"
              title="Remove school"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        ))}

        {/* Empty slots */}
        {Array.from({ length: maxSchools - selectedSchools.length }).map((_, index) => (
          <div
            key={`empty-${index}`}
            className="flex items-center justify-center p-4 border-2 border-dashed border-gray-600 rounded-lg text-gray-400"
          >
            <span className="text-sm font-medium">
              School {selectedSchools.length + index + 1} - Add a school to compare
            </span>
          </div>
        ))}
      </div>

      {/* Search moved to header - now just show a message */}
      {canAddMore && (
        <div className="text-center p-4 bg-gray-800 rounded-lg border border-gray-600">
          <p className="text-black font-medium">
            ✨ Use the search bar above to add more schools to compare
          </p>
        </div>
      )}

      {/* Selection Status */}
      <div className="mt-4 p-3 bg-gray-800 rounded-lg border border-gray-600">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-black">
            Schools selected: {selectedSchools.length} of {maxSchools}
          </span>
          {!canAddMore && (
            <span className="text-sm text-black">
              Maximum reached
            </span>
          )}
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
          <div
            className="bg-accent-blue h-2 rounded-full transition-all duration-300"
            style={{ width: `${(selectedSchools.length / maxSchools) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}