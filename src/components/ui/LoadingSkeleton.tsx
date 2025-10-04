interface LoadingSkeletonProps {
  className?: string;
  variant?: 'text' | 'card' | 'circle' | 'metric';
  count?: number;
}

export default function LoadingSkeleton({
  className = '',
  variant = 'text',
  count = 1
}: LoadingSkeletonProps) {
  const baseClasses = 'bg-gray-200 animate-pulse rounded';

  const variantClasses = {
    text: 'h-4 w-full',
    card: 'h-64 w-full',
    circle: 'h-12 w-12 rounded-full',
    metric: 'h-32 w-full'
  };

  const skeletonClasses = `${baseClasses} ${variantClasses[variant]} ${className}`;

  if (count === 1) {
    return <div className={skeletonClasses} />;
  }

  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className={skeletonClasses} />
      ))}
    </div>
  );
}

// Specific skeleton components for common use cases
export function SchoolCardSkeleton() {
  return (
    <div className="rounded-2xl border border-gray-200 p-6 shadow-sm bg-white">
      <div className="animate-pulse">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0 space-y-4">
            {/* Title */}
            <div className="h-6 bg-gray-200 rounded w-3/4"></div>

            {/* Address */}
            <div className="h-4 bg-gray-200 rounded w-full"></div>

            {/* Badges */}
            <div className="flex space-x-2">
              <div className="h-6 bg-gray-200 rounded w-20"></div>
              <div className="h-6 bg-gray-200 rounded w-16"></div>
              <div className="h-6 bg-gray-200 rounded w-24"></div>
            </div>

            {/* Cut-offs */}
            <div className="space-y-2">
              <div className="h-5 bg-gray-200 rounded w-32"></div>
              <div className="h-5 bg-gray-200 rounded w-28"></div>
            </div>

            {/* Buttons */}
            <div className="flex space-x-2">
              <div className="h-10 bg-gray-200 rounded w-32"></div>
              <div className="h-10 bg-gray-200 rounded w-24"></div>
            </div>
          </div>

          {/* Distance */}
          <div className="h-4 bg-gray-200 rounded w-16"></div>
        </div>
      </div>
    </div>
  );
}

export function MetricCardSkeleton() {
  return (
    <div className="p-6 rounded-xl border-2 border-gray-200 bg-white shadow-lg">
      <div className="animate-pulse">
        <div className="flex items-center justify-between mb-3">
          <div className="h-4 bg-gray-200 rounded w-24"></div>
          <div className="h-8 w-8 bg-gray-200 rounded"></div>
        </div>
        <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-32"></div>
      </div>
    </div>
  );
}

export function ProfileHeroSkeleton() {
  return (
    <div className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800">
      <div className="absolute inset-0 bg-black opacity-20"></div>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="animate-pulse">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="flex-1">
              <div className="h-16 bg-white bg-opacity-20 rounded mb-4 w-3/4"></div>
              <div className="h-6 bg-white bg-opacity-20 rounded mb-6 w-full"></div>
              <div className="h-6 bg-white bg-opacity-20 rounded mb-6 w-48"></div>
              <div className="flex space-x-3">
                <div className="h-8 bg-white bg-opacity-20 rounded w-20"></div>
                <div className="h-8 bg-white bg-opacity-20 rounded w-32"></div>
                <div className="h-8 bg-white bg-opacity-20 rounded w-28"></div>
              </div>
            </div>
            <div className="mt-8 lg:mt-0 lg:ml-8">
              <div className="w-64 h-48 bg-white bg-opacity-20 rounded-xl"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}