import React from 'react';
import { Image } from 'lucide-react';

interface ScreenshotPlaceholderProps {
  label: string;
}

export const ScreenshotPlaceholder: React.FC<ScreenshotPlaceholderProps> = ({ label }) => {
  return (
    <div className="w-full flex flex-col items-center justify-center p-12 bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl my-6 text-gray-500">
      <Image className="w-12 h-12 mb-4 text-gray-400" />
      <span className="text-lg font-medium font-body mb-2">Screenshot Placeholder</span>
      <span className="text-sm font-body text-center max-w-md">{label}</span>
      <span className="text-xs mt-4 text-gray-400 font-body">Replace this area with the corresponding system screenshot.</span>
    </div>
  );
};
