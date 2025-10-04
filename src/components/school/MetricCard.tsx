interface MetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon?: string;
  trend?: 'positive' | 'negative' | 'neutral';
  className?: string;
}

export default function MetricCard({
  title,
  value,
  subtitle,
  icon,
  trend = 'neutral',
  className = ''
}: MetricCardProps) {
  const trendClasses = {
    positive: 'border-gray-200 bg-white',
    negative: 'border-gray-200 bg-white',
    neutral: 'border-gray-200 bg-white'
  };

  const trendIconClasses = {
    positive: 'text-accent-green',
    negative: 'text-accent-red',
    neutral: 'text-gray-600'
  };

  return (
    <div className={`
      p-6 rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-all duration-200
      ${trendClasses[trend]} ${className}
    `}>
      {/* Header with Icon */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-black uppercase tracking-wide">
          {title}
        </h3>
        {icon && (
          <span className="text-2xl" role="img" aria-label={title}>
            {icon}
          </span>
        )}
      </div>

      {/* Main Value */}
      <div className="mb-3">
        <p className="text-3xl font-bold text-black">
          {value}
        </p>
      </div>

      {/* Subtitle */}
      {subtitle && (
        <p className="text-sm text-gray-600 leading-relaxed">
          {subtitle}
        </p>
      )}

      {/* Trend Indicator */}
      {trend !== 'neutral' && (
        <div className={`flex items-center mt-2 text-sm ${trendIconClasses[trend]}`}>
          {trend === 'positive' ? (
            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l4.293-4.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          )}
          <span className="font-medium">
            {trend === 'positive' ? 'Excellent' : 'Needs Attention'}
          </span>
        </div>
      )}
    </div>
  );
}