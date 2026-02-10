'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { saveProperty, unsaveProperty } from '@/lib/api';

interface SaveButtonProps {
  propertyId: string;
  initialSaved?: boolean;
}

export default function SaveButton({ propertyId, initialSaved = false }: SaveButtonProps) {
  const router = useRouter();
  const [isSaved, setIsSaved] = useState(initialSaved);
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (!token) {
      router.push('/login');
      return;
    }

    if (isLoading) return;
    setIsLoading(true);

    try {
      if (isSaved) {
        await unsaveProperty(propertyId);
        setIsSaved(false);
      } else {
        await saveProperty(propertyId);
        setIsSaved(true);
      }
    } catch {
      // Silently fail - the UI will stay in current state
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleSave}
      disabled={isLoading}
      className={`flex h-8 w-8 items-center justify-center rounded-full bg-white/80 backdrop-blur-sm transition-all hover:bg-white hover:scale-110 ${
        isSaved ? 'text-red-500' : 'text-gray-600 hover:text-red-500'
      } ${isLoading ? 'opacity-50' : ''}`}
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
