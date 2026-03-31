'use client';

import { useEffect, useState } from 'react';
import { getPropertyAmenities } from '@/lib/api';
import { Amenity } from '@/lib/types';
import AmenityIcon from './AmenityIcon';

interface AmenitiesGridProps {
  slug: string;
}

export default function AmenitiesGrid({ slug }: AmenitiesGridProps) {
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPropertyAmenities(slug)
      .then((res) => setAmenities(res.data || []))
      .catch(() => setAmenities([]))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="mt-8">
        <h2 className="text-xl font-semibold text-gray-900">Amenities</h2>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded-lg bg-gray-100" />
          ))}
        </div>
      </div>
    );
  }

  if (amenities.length === 0) return null;

  // Group by category
  const grouped = amenities.reduce<Record<string, Amenity[]>>((acc, amenity) => {
    const cat = amenity.category;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(amenity);
    return acc;
  }, {});

  return (
    <div className="mt-8">
      <h2 className="text-xl font-semibold text-gray-900">Amenities</h2>
      <div className="mt-4 space-y-4">
        {Object.entries(grouped).map(([category, items]) => (
          <div key={category}>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              {category}
            </p>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {items.map((amenity) => (
                <div
                  key={amenity.id}
                  className="rounded-lg border border-gray-100 bg-white px-3 py-2.5"
                >
                  <AmenityIcon icon={amenity.icon} name={amenity.name} size="sm" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
