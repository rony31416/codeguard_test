import React from 'react';
import { AnalysisResponse, BugPattern } from '../types';

interface ResultsDashboardProps {
  result: AnalysisResponse | null;
  onFeedback: (feedback: string) => void;
}

const ResultsDashboard: React.FC<ResultsDashboardProps> = ({ result, onFeedback }) => {
  if (!result) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>No analysis results yet. Submit code to see the analysis.</p>
      </div>
    );
  }

  const getSeverityColor = (severity: number) => {
    if (severity >= 8) return 'bg-red-100 text-red-800 border-red-300';
    if (severity >= 6) return 'bg-orange-100 text-orange-800 border-orange-300';
    if (severity >= 4) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    return 'bg-green-100 text-green-800 border-green-300';
  };

  const getSeverityLabel = (severity: number) => {
    if (severity >= 8) return 'Critical';
    if (severity >= 6) return 'High';
    if (severity >= 4) return 'Medium';
    if (severity > 0) return 'Low';
    return 'No Issues';
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-4">Analysis Results</h2>
      
      {/* Summary */}
      <div className={`p-4 rounded-lg border-2 mb-6 ${getSeverityColor(result.overall_severity)}`}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold">Overall Severity: {getSeverityLabel(result.overall_severity)}</h3>
          <span className="text-2xl font-bold">{result.overall_severity}/10</span>
        </div>
        <p className="text-sm">{result.summary}</p>
      </div>

      {/* Bug Patterns */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold mb-3">Detected Bug Patterns</h3>
        {result.bug_patterns.map((bug: BugPattern, index: number) => (
          <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-2">
              <h4 className="text-lg font-semibold text-gray-800">{bug.pattern_name}</h4>
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(bug.severity)}`}>
                  Severity: {bug.severity}/10
                </span>
                <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                  Confidence: {(bug.confidence * 100).toFixed(0)}%
                </span>
              </div>
            </div>
            
            <p className="text-gray-700 mb-2">{bug.description}</p>
            
            {bug.location && (
              <p className="text-sm text-gray-600 mb-2">
                <span className="font-medium">Location:</span> {bug.location}
              </p>
            )}
            
            <div className="bg-blue-50 border-l-4 border-primary p-3 rounded">
              <p className="text-sm font-medium text-gray-700 mb-1">💡 Fix Suggestion:</p>
              <p className="text-sm text-gray-600">{bug.fix_suggestion}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Feedback Section */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <h3 className="text-lg font-semibold mb-3">Was this analysis helpful?</h3>
        <div className="flex space-x-3">
          <button
            onClick={() => onFeedback('correct')}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            ✓ Accurate
          </button>
          <button
            onClick={() => onFeedback('incorrect')}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            ✗ Inaccurate
          </button>
          <button
            onClick={() => onFeedback('partial')}
            className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
          >
            ⚠ Partially Correct
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResultsDashboard;
