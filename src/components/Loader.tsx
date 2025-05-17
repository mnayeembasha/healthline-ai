import React from 'react';

const Loader = ({ message = "Processing your diagnosis..." }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-4">
      <div className="relative">
        <div className="h-16 w-16 rounded-full border-4 border-t-primary border-r-transparent border-b-primary border-l-transparent animate-spin"></div>
        <div className="absolute top-0 left-0 h-16 w-16 rounded-full border-4 border-transparent border-l-primary border-r-primary animate-pulse opacity-75"></div>
      </div>
      <p className="text-center text-sm font-medium text-muted-foreground">{message}</p>
    </div>
  );
};

export default Loader;