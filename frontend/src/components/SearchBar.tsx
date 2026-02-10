'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ListingType, PropertyType } from '@/lib/types';
import { buildQueryString } from '@/lib/utils';

interface SearchBarProps {
  variant?: 'hero' | 'standalone';
  initialFilters?: {
    listing_type?: string;
    property_type?: string;
    keyword?: string;
    min_price?: string;
    max_price?: string;
  };
}

const listingTypes = [
  { value: ListingType.BUY_FREEHOLD, label: 'Buy Freehold' },
  { value: ListingType.BUY_LEASEHOLD, label: 'Buy Leasehold' },
  { value: ListingType.RENT_SHORT_TERM, label: 'Rent Short-Term' },
  { value: ListingType.RENT_LONG_TERM, label: 'Rent Long-Term' },
];

const propertyTypes = [
  { value: '', label: 'All Types' },
  { value: PropertyType.VILLA, label: 'Villa' },
  { value: PropertyType.HOUSE, label: 'House' },
  { value: PropertyType.APARTMENT, label: 'Apartment' },
  { value: PropertyType.LAND, label: 'Land' },
  { value: PropertyType.COMMERCIAL, label: 'Commercial' },
];

export default function SearchBar({
  variant = 'hero',
  initialFilters,
}: SearchBarProps) {
  const router = useRouter();
  const [listingType, setListingType] = useState(
    initialFilters?.listing_type || ListingType.BUY_FREEHOLD
  );
  const [propertyType, setPropertyType] = useState(
    initialFilters?.property_type || ''
  );
  const [keyword, setKeyword] = useState(initialFilters?.keyword || '');
  const [minPrice, setMinPrice] = useState(initialFilters?.min_price || '');
  const [maxPrice, setMaxPrice] = useState(initialFilters?.max_price || '');
  const [showPriceDropdown, setShowPriceDropdown] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params: Record<string, string | undefined> = {
      listing_type: listingType,
      property_type: propertyType || undefined,
      keyword: keyword || undefined,
      min_price: minPrice || undefined,
      max_price: maxPrice || undefined,
    };
    const queryString = buildQueryString(params as Record<string, string | number | boolean | undefined>);
    router.push(`/properties${queryString}`);
  };

  const isHero = variant === 'hero';

  return (
    <form onSubmit={handleSearch} className="w-full">
      {/* Listing Type Tabs */}
      <div className={`flex gap-1 ${isHero ? 'mb-4' : 'mb-3'}`}>
        {listingTypes.map((type) => (
          <button
            key={type.value}
            type="button"
            onClick={() => setListingType(type.value)}
            className={`rounded-lg px-5 py-2 text-sm font-semibold transition-all ${
              listingType === type.value
                ? isHero
                  ? 'bg-white text-primary-700 shadow-md'
                  : 'bg-primary-600 text-white shadow-md'
                : isHero
                  ? 'bg-white/20 text-white hover:bg-white/30'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {type.label}
          </button>
        ))}
      </div>

      {/* Search Fields */}
      <div
        className={`flex flex-col gap-3 rounded-xl p-4 shadow-lg sm:flex-row sm:items-end ${
          isHero ? 'bg-white' : 'bg-white border border-gray-200'
        }`}
      >
        {/* Property Type */}
        <div className="flex-shrink-0 sm:w-40">
          <label className="mb-1 block text-xs font-medium text-gray-500 uppercase tracking-wide">
            Type
          </label>
          <select
            value={propertyType}
            onChange={(e) => setPropertyType(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          >
            {propertyTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        {/* Location / Keyword */}
        <div className="flex-1">
          <label className="mb-1 block text-xs font-medium text-gray-500 uppercase tracking-wide">
            Location or Keyword
          </label>
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
              />
            </svg>
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Search by area, address, or keyword..."
              className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>
        </div>

        {/* Price Range */}
        <div className="relative flex-shrink-0 sm:w-48">
          <label className="mb-1 block text-xs font-medium text-gray-500 uppercase tracking-wide">
            Price Range
          </label>
          <button
            type="button"
            onClick={() => setShowPriceDropdown(!showPriceDropdown)}
            className="flex w-full items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          >
            <span className={minPrice || maxPrice ? 'text-gray-900' : 'text-gray-400'}>
              {minPrice || maxPrice
                ? `${minPrice || '0'} - ${maxPrice || 'Any'}`
                : 'Any Price'}
            </span>
            <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
            </svg>
          </button>

          {/* Price Dropdown */}
          {showPriceDropdown && (
            <div className="absolute left-0 top-full z-20 mt-1 w-64 rounded-lg border border-gray-200 bg-white p-4 shadow-lg">
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500">
                    Min Price
                  </label>
                  <input
                    type="number"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    placeholder="No minimum"
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500">
                    Max Price
                  </label>
                  <input
                    type="number"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    placeholder="No maximum"
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setShowPriceDropdown(false)}
                  className="w-full rounded-lg bg-primary-600 py-2 text-sm font-medium text-white hover:bg-primary-700"
                >
                  Apply
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Search Button */}
        <button
          type="submit"
          className="flex-shrink-0 rounded-lg bg-primary-600 px-8 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary-700 hover:shadow-md active:scale-[0.98]"
        >
          <span className="flex items-center gap-2">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
            Search
          </span>
        </button>
      </div>
    </form>
  );
}
