import React from 'react';

interface ErrorDisplayProps {
  message: string;
  onRetry: () => void;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ message, onRetry }) => {
  return (
    // Re-styled to match the provided screenshot with a softer, more modern alert design.
    <div className="bg-red-50 p-6 rounded-lg shadow-md" role="alert">
      <div className="flex items-start space-x-4">
        {/* Icon */}
        <div className="flex-shrink-0">
          <svg className="h-6 w-6 text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        {/* Text content and action button */}
        <div className="flex-1">
          <h3 className="text-md font-bold text-red-800">分析失败</h3>
          <p className="mt-1 text-sm text-red-700">
            {message}
          </p>
          <div className="mt-4">
            <button
              onClick={onRetry}
              // The button's style is updated to be more prominent and visually aligned with the screenshot.
              className="px-5 py-2 bg-red-500 text-white text-sm font-semibold rounded-md shadow-sm hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-red-50 focus:ring-red-500 transition-colors"
            >
              重试
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};