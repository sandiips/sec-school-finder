import { SchoolProfile } from '@/types/school';
import Badge from '@/components/ui/Badge';

interface LocationSectionProps {
  school: SchoolProfile;
}

export default function LocationSection({ school }: LocationSectionProps) {
  // Extract postal code from address (Singapore addresses typically end with 6-digit postal code)
  const getPostalCode = (address: string): string | null => {
    const match = address.match(/\b\d{6}\b/);
    return match ? match[0] : null;
  };

  const postalCode = getPostalCode(school.address);

  // Mock nearby amenities and transport data (in real implementation, this would come from APIs)
  const mockAmenities = [
    { name: 'Shopping Mall', distance: '0.8 km', type: 'shopping' },
    { name: 'Community Center', distance: '0.5 km', type: 'community' },
    { name: 'Library', distance: '1.2 km', type: 'education' },
    { name: 'Food Court', distance: '0.3 km', type: 'food' }
  ];

  const mockTransport = [
    { type: 'MRT', name: 'Nearest MRT Station', distance: '1.5 km' },
    { type: 'Bus', name: 'Bus Stop', distance: '0.2 km' }
  ];

  const getAmenityIcon = (type: string): string => {
    switch (type) {
      case 'shopping': return '🛍️';
      case 'community': return '🏢';
      case 'education': return '📚';
      case 'food': return '🍽️';
      default: return '📍';
    }
  };

  const getTransportIcon = (type: string): string => {
    switch (type) {
      case 'MRT': return '🚇';
      case 'Bus': return '🚌';
      default: return '🚗';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white p-6">
        <div className="flex items-center">
          <span className="text-3xl mr-4" role="img" aria-label="Location & Access">
            📍
          </span>
          <div>
            <h2 className="text-2xl font-bold">Location & Access</h2>
            <p className="text-cyan-100 mt-1">
              Address, Transportation, and Nearby Amenities
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Address Information */}
        <div className="border border-gray-200 rounded-lg p-4 bg-blue-50">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <span className="mr-2" role="img" aria-label="Address">
              🏠
            </span>
            School Address
          </h3>
          <div className="space-y-3">
            <p className="text-gray-700 font-medium text-lg">
              {school.address}
            </p>
            {postalCode && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Postal Code:</span>
                <Badge variant="blue" size="small">
                  {postalCode}
                </Badge>
              </div>
            )}
            {school.distance && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Distance from your location:</span>
                <Badge variant="green" size="small">
                  {school.distance} km
                </Badge>
              </div>
            )}
          </div>
        </div>

        {/* Map Placeholder */}
        <div className="border border-gray-200 rounded-lg p-6 bg-gradient-to-br from-gray-100 to-gray-200">
          <div className="text-center">
            <div className="w-full h-64 bg-white rounded-lg border-2 border-dashed border-gray-400 flex items-center justify-center">
              <div className="text-center">
                <span className="text-4xl mb-4 block" role="img" aria-label="Map">
                  🗺️
                </span>
                <p className="text-gray-600 font-medium">Interactive Map</p>
                <p className="text-gray-500 text-sm mt-1">
                  Map integration would show school location here
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Transportation & Amenities */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Transportation */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
              <span className="mr-2" role="img" aria-label="Transportation">
                🚌
              </span>
              Transportation Access
            </h4>
            <div className="space-y-3">
              {mockTransport.map((transport, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <span className="text-xl" role="img" aria-label={transport.type}>
                      {getTransportIcon(transport.type)}
                    </span>
                    <div>
                      <p className="font-medium text-gray-900">{transport.name}</p>
                      <p className="text-sm text-gray-600">{transport.type}</p>
                    </div>
                  </div>
                  <Badge variant="blue" size="small">
                    {transport.distance}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Nearby Amenities */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
              <span className="mr-2" role="img" aria-label="Amenities">
                🏪
              </span>
              Nearby Amenities
            </h4>
            <div className="space-y-3">
              {mockAmenities.map((amenity, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <span className="text-xl" role="img" aria-label={amenity.type}>
                      {getAmenityIcon(amenity.type)}
                    </span>
                    <div>
                      <p className="font-medium text-gray-900">{amenity.name}</p>
                      <p className="text-sm text-gray-600 capitalize">{amenity.type}</p>
                    </div>
                  </div>
                  <Badge variant="green" size="small">
                    {amenity.distance}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* School Zone Information */}
        <div className="border border-gray-200 rounded-lg p-4 bg-yellow-50">
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
            <span className="mr-2" role="img" aria-label="School Zone">
              🗺️
            </span>
            School Zone Information
          </h4>
          <div className="space-y-2 text-sm">
            <p className="text-gray-700">
              <span className="font-medium">Zone:</span> School zone boundaries determine eligibility for certain admission tracks
            </p>
            <p className="text-gray-700">
              <span className="font-medium">Priority:</span> Students living within 1km may have priority for certain admission phases
            </p>
            <p className="text-gray-700">
              <span className="font-medium">Affiliation:</span> Primary school affiliations may provide additional priority regardless of distance
            </p>
          </div>
        </div>

        {/* Location Benefits */}
        <div className="bg-gradient-to-r from-cyan-50 to-blue-50 rounded-lg p-4 border border-cyan-200">
          <h4 className="font-semibold text-cyan-900 mb-3">
            Location Benefits
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="flex items-start space-x-2">
              <span className="text-cyan-600 mt-1" role="img" aria-label="Accessibility">
                🚶‍♂️
              </span>
              <div>
                <p className="font-medium text-cyan-900">Accessibility</p>
                <p className="text-cyan-800">
                  Well-connected by public transport
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <span className="text-cyan-600 mt-1" role="img" aria-label="Community">
                🏘️
              </span>
              <div>
                <p className="font-medium text-cyan-900">Community Hub</p>
                <p className="text-cyan-800">
                  Close to essential amenities
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <span className="text-cyan-600 mt-1" role="img" aria-label="Safety">
                🛡️
              </span>
              <div>
                <p className="font-medium text-cyan-900">Safe Environment</p>
                <p className="text-cyan-800">
                  Well-lit and secure neighborhood
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <span className="text-cyan-600 mt-1" role="img" aria-label="Convenience">
                ⏰
              </span>
              <div>
                <p className="font-medium text-cyan-900">Convenience</p>
                <p className="text-cyan-800">
                  Easy commute for students and parents
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Location Information Note */}
        <div className="mt-6 p-4 bg-cyan-50 rounded-lg border border-cyan-200">
          <h4 className="font-semibold text-cyan-900 mb-2">
            About Location Data
          </h4>
          <div className="text-sm text-cyan-800 space-y-1">
            <p>• Distance calculations are based on your provided postal code location</p>
            <p>• Transportation information includes nearest MRT stations and bus stops</p>
            <p>• School zone boundaries may affect admission priority and eligibility</p>
            <p>• Amenity data helps families assess the convenience of the school location</p>
          </div>
        </div>
      </div>
    </div>
  );
}