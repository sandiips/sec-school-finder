import Link from 'next/link';
import { useState, useEffect } from 'react';
import Badge from '@/components/ui/Badge';

interface SchoolCardProps {
  school: any; // Search result from API
  isSelected?: boolean;
  onToggleCompare?: (school: any) => void;
  showComparison?: boolean;
}

// Convert slugs like "hwa-chong-institute" -> "Hwa Chong Institute"
function humanize(input?: string) {
  if (!input) return "";
  return input
    .split(/[-_]/g)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export default function SchoolCard({
  school,
  isSelected = false,
  onToggleCompare,
  showComparison = true
}: SchoolCardProps) {
  const name = school.full_name || humanize(school.name);
  const km = school?.distance_km != null
    ? Number(school.distance_km).toFixed(1)
    : (Number(school?.distance_m ?? 0) / 1000).toFixed(1);

  const handleCompareToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onToggleCompare) {
      onToggleCompare(school);
    }
  };

  return (
    <div
      className="card-school-result card-interactive"
    >
      {/* Comparison Checkbox */}
      {showComparison && onToggleCompare && (
        <div className="absolute top-4 right-4 z-10">
          <button
            onClick={handleCompareToggle}
            className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
              isSelected
                ? 'bg-blue-600 border-blue-600 text-white'
                : 'border-gray-300 hover:border-blue-500 bg-white'
            }`}
            title={isSelected ? 'Remove from comparison' : 'Add to comparison'}
          >
            {isSelected && (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            )}
          </button>
        </div>
      )}

      {/* Main Card Content */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-primary mb-2">
            {name}
          </h3>

          {school?.address && (
            <p className="text-sm text-secondary mb-3 line-clamp-2">
              {school.address}
            </p>
          )}

          {/* Badges */}
          <div className="flex flex-wrap gap-2 mb-4">
            {/* Affiliation Status */}
            <Badge
              variant={school.is_affiliated ? 'green' : 'red'}
              size="small"
            >
              {school.is_affiliated ? 'Affiliated' : 'Non-affiliated'}
            </Badge>

            {/* Program Type */}
            <Badge
              variant={school.posting_group == null ? 'purple' : 'blue'}
              size="small"
            >
              {school.posting_group == null ? 'IP' : `PG ${school.posting_group}`}
            </Badge>

            {/* Distance */}
            <Badge variant="gray" size="small">
              {km} km away
            </Badge>
          </div>

          {/* Cut-off Scores */}
          <div className="space-y-1 mb-4">
            {school.ip_cutoff_max != null && (
              <div className="text-sm">
                <span className="text-secondary">IP Cut-off:</span>
                <Badge variant="black" size="small" className="ml-2">
                  {school.ip_cutoff_max}
                </Badge>
              </div>
            )}

            {school.aff_pg_cutoff_max != null && (
              <div className="text-sm">
                <span className="text-secondary">Affiliated Cut-off:</span>
                <Badge variant="black" size="small" className="ml-2">
                  {school.aff_pg_cutoff_max}
                </Badge>
              </div>
            )}

            {school.open_pg_cutoff_max != null && school.open_pg != null && (
              <div className="text-sm">
                <span className="text-secondary">PG {school.open_pg} Cut-off:</span>
                <Badge variant="black" size="small" className="ml-2">
                  {school.open_pg_cutoff_max}
                </Badge>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2">
            <Link
              href={`/school/${school.code}`}
              className="btn-primary text-sm"
            >
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
              </svg>
              View Profile
            </Link>

            {showComparison && (
              <button
                onClick={handleCompareToggle}
                className={`inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
                  isSelected
                    ? 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100'
                    : 'bg-white border-gray-300 text-primary hover:border-blue-500 hover:text-blue-600'
                }`}
              >
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
                {isSelected ? 'Remove' : 'Compare'}
              </button>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}