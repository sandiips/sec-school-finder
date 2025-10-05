import { SchoolProfile } from '@/types/school';

interface ComparisonActionsProps {
  schools: SchoolProfile[];
}

export default function ComparisonActions({ schools }: ComparisonActionsProps) {
  const handleShare = async () => {
    const codes = schools.map(school => school.code).join(',');
    const url = `${window.location.origin}/compare?schools=${codes}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'School Comparison - School Advisor SG',
          text: `Compare ${schools.map(s => s.name).join(', ')}`,
          url: url
        });
      } catch (error) {
        // Fallback to clipboard
        navigator.clipboard.writeText(url);
        alert('Comparison link copied to clipboard!');
      }
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(url);
      alert('Comparison link copied to clipboard!');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSaveComparison = () => {
    // This would save to local storage or user account
    const comparison = {
      schools: schools.map(school => ({
        code: school.code,
        name: school.name
      })),
      timestamp: new Date().toISOString()
    };

    localStorage.setItem('saved_comparison', JSON.stringify(comparison));
    alert('Comparison saved locally!');
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-primary mb-4">
        Comparison Actions
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Share Link */}
        <button
          onClick={handleShare}
          className="flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
          </svg>
          Share Link
        </button>

        {/* Print */}
        <button
          onClick={handlePrint}
          className="flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd" />
          </svg>
          Print
        </button>

        {/* Save Comparison */}
        <button
          onClick={handleSaveComparison}
          className="flex items-center justify-center px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6h5a2 2 0 012 2v7a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h5v5.586l-1.293-1.293zM9 4a1 1 0 012 0v2H9V4z" />
          </svg>
          Save
        </button>
      </div>

      {/* Action Descriptions */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-secondary">
        <div>
          <h4 className="font-medium text-primary mb-1">Share & Compare</h4>
          <p>Create shareable links for easy comparison sharing.</p>
        </div>
        <div>
          <h4 className="font-medium text-primary mb-1">Save & Print</h4>
          <p>Save comparisons locally or print for physical reference.</p>
        </div>
      </div>

      {/* Comparison Summary */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium text-white mb-2 compare-summary-title">Comparison Summary</h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-white compare-summary-label">Schools compared:</span>
            <span className="ml-1 font-medium">{schools.length}</span>
          </div>
          <div>
            <span className="text-white compare-summary-label">Generated:</span>
            <span className="ml-1 font-medium">
              {new Date().toLocaleDateString()}
            </span>
          </div>
          <div>
            <span className="text-white compare-summary-label">Data year:</span>
            <span className="ml-1 font-medium">2024</span>
          </div>
        </div>
      </div>
    </div>
  );
}