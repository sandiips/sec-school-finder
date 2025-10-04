import Badge from '@/components/ui/Badge';

interface ComparisonRowProps {
  title: string;
  icon?: string;
  values: (string | { strength: string; sportLists: string[] })[];
  type?: 'text' | 'score' | 'badge' | 'sports_strength';
  getColor?: (value: string) => 'green' | 'orange' | 'red' | 'blue' | 'purple' | 'gray' | 'black' | 'cyan';
}

export default function ComparisonRow({
  title,
  icon,
  values,
  type = 'text',
  getColor
}: ComparisonRowProps) {
  const isSingleResult = values.length === 1;
  const renderValue = (value: string | { strength: string; sportLists: string[] }, index: number) => {
    if (type === 'sports_strength' && typeof value === 'object' && value.strength && getColor) {
      const contentAlignment = isSingleResult ? 'text-center' : 'text-left';
      return (
        <div className={`${contentAlignment} space-y-2`}>
          <Badge variant={getColor(value.strength)} size="medium">
            {value.strength}
          </Badge>
          <div className="space-y-1 mt-2">
            {value.sportLists.map((sportList, idx) => (
              <div key={idx} className={`text-sm text-black leading-relaxed ${contentAlignment}`}>
                {sportList}
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (type === 'badge' && getColor && typeof value === 'string') {
      return (
        <Badge variant={getColor(value)} size="small">
          {value}
        </Badge>
      );
    }

    if (type === 'score' && getColor && typeof value === 'string') {
      return (
        <Badge variant={getColor(value)} size="medium">
          {value}
        </Badge>
      );
    }

    // Handle line breaks for sports performance data
    if (typeof value === 'string' && title === 'Best Performance') {
      // Split by periods followed by space and year patterns, or just periods with capital letters
      const lines = value.split(/(?:\. (?=\d{4}|\w)|\. (?=[A-Z]))/);
      return (
        <div className="text-sm text-black">
          {lines.map((line, idx) => (
            <div key={idx} className={idx > 0 ? 'mt-1' : ''}>
              {line.trim().endsWith('.') ? line.trim() : line.trim() + (idx < lines.length - 1 ? '.' : '')}
            </div>
          ))}
        </div>
      );
    }

    // Handle line breaks for sports performance results (Best Performance)
    if (typeof value === 'string' && title === 'Best Performance') {
      const lines = value.split(/(?=\d{4}:)/); // Split before year patterns like "2024:"
      if (lines.length > 1) {
        return (
          <div className="text-sm text-black space-y-1">
            {lines.map((line, idx) => (
              <div key={idx}>{line.trim()}</div>
            ))}
          </div>
        );
      }
    }

    return (
      <span className="text-sm text-black">
        {typeof value === 'string' ? value : 'No data'}
      </span>
    );
  };

  return (
    <tr className="bg-gray-900">
      <td className="px-4 py-4 whitespace-nowrap" style={{minWidth: '200px', width: '200px'}}>
        <div className="flex items-center">
          {icon && (
            <span className="mr-2 text-lg" role="img" aria-label={title}>
              {icon}
            </span>
          )}
          <span className="text-sm font-medium text-black">
            {title}
          </span>
        </div>
      </td>
      {values.map((value, index) => {
        // Determine alignment: center for single result, left for multiple results
        let alignment = '';
        if (isSingleResult) {
          alignment = type === 'sports_strength' ? 'align-top text-center' : 'text-center';
        } else {
          alignment = 'align-top text-left';
        }

        return (
          <td key={index} className={`px-4 py-4 ${alignment}`} style={{minWidth: '280px', width: '280px'}}>
            <div className={title === 'Culture Summary' ? 'whitespace-normal break-words' : ''}>
              {renderValue(value, index)}
            </div>
          </td>
        );
      })}
    </tr>
  );
}