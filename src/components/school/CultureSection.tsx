import { SchoolProfile } from '@/types/school';
import Badge from '@/components/ui/Badge';

interface CultureSectionProps {
  school: SchoolProfile;
}

export default function CultureSection({ school }: CultureSectionProps) {
  const { culture } = school;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 border-b border-gray-200 p-6">
        <div className="flex items-center">
          <span className="text-3xl mr-4" role="img" aria-label="School Culture">
            🌟
          </span>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">School Culture</h2>
            <p className="text-gray-600 mt-1">
              Values, Character Development, and Learning Environment
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Core Values */}
        {culture.coreValues && culture.coreValues.length > 0 && (
          <div className="border border-gray-200 rounded-xl p-6 bg-white hover:shadow-sm hover:border-gray-300 transition-all duration-200">
            <h3 className="text-lg font-semibold text-black mb-4 flex items-center">
              <span className="mr-3" role="img" aria-label="Core Values">
                🎯
              </span>
              Core Culture Themes
            </h3>
            <div className="flex flex-wrap gap-3">
              {culture.coreValues.map((value, index) => (
                <Badge key={index} variant="blue" size="medium">
                  {value}
                </Badge>
              ))}
            </div>
            <p className="text-sm text-black mt-4 leading-relaxed">
              These culture themes reflect the school's educational philosophy and values.
            </p>
          </div>
        )}

        {/* School Culture Description */}
        <div className="border border-gray-200 rounded-xl p-6 bg-white hover:shadow-sm hover:border-gray-300 transition-all duration-200">
          <h3 className="text-lg font-semibold text-black mb-4 flex items-center">
            <span className="mr-2" role="img" aria-label="School Culture">
              🏫
            </span>
            School Culture
          </h3>
          <p className="text-black leading-relaxed">
            {culture.description}
          </p>
        </div>

        {/* Culture Information */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h4 className="font-semibold text-black mb-3">
            About School Culture Information
          </h4>
          <div className="text-sm text-black space-y-2 leading-relaxed">
            <p>• Culture information is sourced from official school materials and mission statements</p>
            <p>• Core themes are identified from the school's educational philosophy and values</p>
            <p>• This provides insights into the school's approach to character development and community building</p>
          </div>
        </div>
      </div>
    </div>
  );
}