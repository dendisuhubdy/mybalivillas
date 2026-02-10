'use client';

import { useState } from 'react';

interface SaveButtonProps {
  propertyId: string;
}

export default function SaveButton({ propertyId }: SaveButtonProps) {
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsSaved(!isSaved);
  };

  return (
    <button
      onClick={handleSave}
      className="flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-gray-600 backdrop-blur-sm transition-all hover:bg-white hover:text-red-500 hover:scale-110"
      aria-label={isSaved ? 'Remove from saved' : 'Save property'}
    >
      <svg
        className="h-4.5 w-4.5"
        fill={isSaved ? 'currentColor' : 'none'}
        viewBox="0 0 24 24"
        strokeWidth={2}
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"
        />
      </svg>
    </button>
  );
}
