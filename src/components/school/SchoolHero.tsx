import { SchoolProfile } from '@/types/school';
import Badge from '@/components/ui/Badge';

interface SchoolHeroProps {
  school: SchoolProfile;
}

export default function SchoolHero({ school }: SchoolHeroProps) {
  return (
    <div className="relative bg-white border-b border-gray-200">
      {/* Clean white background */}

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex flex-col">
          {/* School Name */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight text-black">
            {school.name}
          </h1>

          {/* Address */}
          <div className="flex items-center mb-6 text-lg text-gray-600">
            <svg className="w-5 h-5 mr-3 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
            {school.address}
          </div>

          {/* Distance */}
          {school.distance && (
            <div className="flex items-center mb-6 text-lg text-gray-600">
              <svg className="w-5 h-5 mr-3 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              {school.distance} km from your location
            </div>
          )}

          {/* Badges */}
          <div className="flex flex-wrap gap-3">
            <Badge
              variant={school.gender === 'Boys' ? 'blue' : school.gender === 'Girls' ? 'purple' : 'green'}
              size="large"
            >
              {school.gender}
            </Badge>

            <Badge
              variant={school.hasIP ? 'purple' : 'gray'}
              size="large"
            >
              {school.hasIP ? 'Integrated Programme' : 'Regular Programme'}
            </Badge>
          </div>

          {/* IP Details */}
          {school.hasIP && school.ipDetails && (
            <div className="mt-6 p-6 bg-gray-50 border border-gray-200 rounded-xl">
              <p className="text-sm font-semibold mb-2 text-gray-900">Integrated Programme Details:</p>
              <p className="text-sm text-gray-700 leading-relaxed">{school.ipDetails}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}