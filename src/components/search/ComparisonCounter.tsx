import Link from 'next/link';
import { useState, useEffect } from 'react';

interface ComparisonCounterProps {
  selectedSchools: any[];
  onClearAll: () => void;
  maxSchools?: number;
}

export default function ComparisonCounter({
  selectedSchools,
  onClearAll,
  maxSchools = 4
}: ComparisonCounterProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(selectedSchools.length > 0);
  }, [selectedSchools.length]);

  if (!isVisible) return null;

  const schoolCodes = selectedSchools.map(school => school.code).join(',');

  return (
    <div className="fixed bottom-6 right-20 z-50 animate-in slide-in-from-right duration-300">
      <div className="card-elevated p-4 min-w-64">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900">
            School Comparison
          </h3>
          <button
            onClick={onClearAll}
            className="text-gray-400 hover:text-red-500 transition-colors"
            title="Clear all"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Selected Schools */}
        <div className="space-y-2 mb-4 max-h-32 overflow-y-auto">
          {selectedSchools.map((school, index) => (
            <div key={school.code} className="flex items-center space-x-2 text-sm">
              <div className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                {index + 1}
              </div>
              <span className="flex-1 truncate text-gray-900">
                {school.full_name || school.name}
              </span>
            </div>
          ))}
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span>Schools selected</span>
            <span>{selectedSchools.length} of {maxSchools}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(selectedSchools.length / maxSchools) * 100}%` }}
            />
          </div>
        </div>

        {/* Action Button */}
        <Link
          href={`/compare?schools=${schoolCodes}`}
          className="w-full btn-primary text-sm"
        >
          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
          Compare Schools
        </Link>

        {/* Maximum Notice */}
        {selectedSchools.length >= maxSchools && (
          <p className="text-xs text-amber-600 mt-2 text-center">
            Maximum {maxSchools} schools reached
          </p>
        )}
      </div>
    </div>
  );
}