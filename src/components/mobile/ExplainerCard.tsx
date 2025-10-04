'use client';

import { useState } from 'react';

interface ExplainerCardProps {
  title: string;
  theme: 'green' | 'indigo' | 'amber';
  data: any;
  isActive?: boolean;
}

export default function ExplainerCard({ title, theme, data, isActive = false }: ExplainerCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Theme configurations matching existing design
  const themeConfig = {
    green: {
      background: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-900',
      textSecondary: 'text-green-800/70',
      badge: 'bg-green-200 text-green-900',
      header: 'text-green-900',
      accent: 'bg-green-100'
    },
    indigo: {
      background: 'bg-indigo-50',
      border: 'border-indigo-200',
      text: 'text-indigo-900',
      textSecondary: 'text-indigo-900/70',
      badge: 'bg-indigo-200 text-indigo-900',
      header: 'text-indigo-900',
      accent: 'bg-indigo-100'
    },
    amber: {
      background: 'bg-amber-50',
      border: 'border-amber-200',
      text: 'text-amber-900',
      textSecondary: 'text-amber-900/70',
      badge: 'bg-amber-200 text-amber-900',
      header: 'text-amber-900',
      accent: 'bg-amber-100'
    }
  };

  const config = themeConfig[theme];

  // Render sports-specific content
  const renderSportsContent = () => {
    const { text, mentionedSports } = data;

    return (
      <div className="space-y-3">
        {/* Sports badges */}
        {mentionedSports && mentionedSports.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {mentionedSports.map((sport: string) => (
              <span
                key={sport}
                className={`rounded-full ${config.badge} px-2 py-1 text-xs font-medium`}
              >
                {sport}
              </span>
            ))}
          </div>
        )}

        {/* Sports explanation text */}
        <div className={`text-sm leading-relaxed ${config.text}`}>
          {text ? (
            <div>
              {isExpanded ? text : `${text.substring(0, 120)}${text.length > 120 ? '...' : ''}`}
              {text.length > 120 && (
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className={`ml-2 text-xs font-medium ${config.text} underline`}
                >
                  {isExpanded ? 'Show less' : 'Read more'}
                </button>
              )}
            </div>
          ) : (
            <span className={config.textSecondary}>
              Couldn't find a fit with sports selected
            </span>
          )}
        </div>
      </div>
    );
  };

  // Render CCAs-specific content
  const renderCCAContent = () => {
    const { text } = data;

    return (
      <div className={`text-sm leading-relaxed ${config.text}`}>
        {text && text.trim() ? (
          <div>
            {isExpanded ? text : `${text.substring(0, 120)}${text.length > 120 ? '...' : ''}`}
            {text.length > 120 && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className={`ml-2 text-xs font-medium ${config.text} underline`}
              >
                {isExpanded ? 'Show less' : 'Read more'}
              </button>
            )}
          </div>
        ) : (
          <span className={config.textSecondary}>
            Couldn't find a fit with CCAs selected
          </span>
        )}
      </div>
    );
  };

  // Render culture-specific content
  const renderCultureContent = () => {
    const { text, cultureTags } = data;

    return (
      <div className="space-y-3">
        {/* Culture tags */}
        {cultureTags && cultureTags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {cultureTags.map((tag: string) => (
              <span
                key={tag}
                className={`rounded-full ${config.badge} px-2 py-1 text-xs font-medium`}
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Culture explanation text */}
        <div className={`text-sm leading-relaxed ${config.text}`}>
          {text ? (
            <div>
              {isExpanded ? text : `${text.substring(0, 120)}${text.length > 120 ? '...' : ''}`}
              {text.length > 120 && (
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className={`ml-2 text-xs font-medium ${config.text} underline`}
                >
                  {isExpanded ? 'Show less' : 'Read more'}
                </button>
              )}
            </div>
          ) : (
            <span className={config.textSecondary}>
              Culture summary coming soon.
            </span>
          )}
        </div>
      </div>
    );
  };

  // Render content based on card type
  const renderContent = () => {
    switch (title.toLowerCase()) {
      case 'sports':
        return renderSportsContent();
      case 'ccas':
        return renderCCAContent();
      case 'culture':
        return renderCultureContent();
      default:
        return <div className={config.textSecondary}>No content available</div>;
    }
  };

  return (
    <div
      className={`
        rounded-lg border p-4 transition-all duration-200 min-h-[200px]
        ${config.background} ${config.border}
        ${isActive ? 'shadow-md scale-[1.02]' : 'shadow-sm'}
      `}
      role="tabpanel"
      aria-labelledby={`${title.toLowerCase()}-tab`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <span className={`text-sm font-semibold ${config.header} uppercase tracking-wide`}>
            {title}
          </span>

          {/* Active indicator */}
          {isActive && (
            <div className={`w-2 h-2 rounded-full ${config.badge.split(' ')[0]}`} />
          )}
        </div>

        {/* Card number indicator */}
        <div className={`text-xs ${config.textSecondary} font-medium`}>
          {title === 'Sports' ? '1/3' : title === 'CCAs' ? '2/3' : '3/3'}
        </div>
      </div>

      {/* Content */}
      <div className="space-y-2">
        {renderContent()}
      </div>

      {/* Touch hint for first card */}
      {title === 'Sports' && (
        <div className={`mt-3 pt-2 border-t ${config.border} text-center`}>
          <div className={`text-xs ${config.textSecondary} flex items-center justify-center space-x-1`}>
            <span>Swipe left for CCAs</span>
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
}