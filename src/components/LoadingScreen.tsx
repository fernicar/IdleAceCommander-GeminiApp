import React from 'react';

interface LoadingScreenProps {
  message?: string;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message = 'Loading...',
}) => {
  return (
    <div className="fixed inset-0 bg-gray-900 flex items-center justify-center z-50">
      <div className="text-center">
        <i className="fas fa-jet-fighter text-6xl text-hud-blue mb-4 animate-pulse"></i>
        <div className="text-2xl font-bold text-military-tan mb-2">{message}</div>
        <div className="flex justify-center space-x-2">
          <div className="w-3 h-3 bg-military-green rounded-full animate-bounce"></div>
          <div
            className="w-3 h-3 bg-military-green rounded-full animate-bounce"
            style={{ animationDelay: '0.2s' }}
          ></div>
          <div
            className="w-3 h-3 bg-military-green rounded-full animate-bounce"
            style={{ animationDelay: '0.4s' }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
