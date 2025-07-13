import React from 'react';

export const DevBanner: React.FC = () => {
  return (
    <div className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 text-white text-center py-2 px-4 font-bold text-sm shadow-lg relative z-50">
      <div className="flex items-center justify-center space-x-2">
        <div className="animate-pulse">🚧</div>
        <span>DEVELOPMENT BRANCH</span>
        <div className="animate-pulse">🚧</div>
      </div>
      <div className="text-xs opacity-90 mt-1">
        This is the dev version of www.CISSP.app - Features may be unstable
      </div>
    </div>
  );
}; 