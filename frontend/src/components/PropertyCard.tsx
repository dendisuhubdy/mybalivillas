import Image from 'next/image';
import Link from 'next/link';
import { Property } from '@/lib/types';
import {
  formatPrice,
  formatArea,
  getPropertyTypeLabel,
  getListingTypeLabel,
  getPlaceholderGradient,
} from '@/lib/utils';
import SaveButton from './SaveButton';

interface PropertyCardProps {
  property: Property;
}

export default function PropertyCard({ property }: PropertyCardProps) {
  // Get the primary image URL from images array or thumbnail
  const primaryImage =
    (Array.isArray(property.images) && property.images.length > 0 && property.images[0]?.url) ||
    undefined;

  const listingBadgeColor =
    property.listing_type === 'sale_freehold'
      ? 'bg-emerald-600 text-white'
      : property.listing_type === 'sale_leasehold'
        ? 'bg-teal-600 text-white'
        : property.listing_type === 'short_term_rent'
          ? 'bg-amber-600 text-white'
          : 'bg-indigo-600 text-white';

  return (
    <Link
      href={`/properties/${property.slug}`}
      className="card group block"
    >
      {/* Image Container */}
      <div className="relative aspect-[4/3] overflow-hidden">
        {/* Property Image or Placeholder */}
        {primaryImage ? (
          <Image
            src={primaryImage}
            alt={property.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        ) : (
          <div
            className={`absolute inset-0 bg-gradient-to-br ${getPlaceholderGradient(
              property.property_type
            )} flex items-center justify-center`}
          >
            <svg
              className="h-16 w-16 text-white/20"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21h7.5V10.75M2.25 21h1.5m18 0h-18M2.25 9l4.5-1.636M18.75 3l-1.5.545m0 6.205 3 1m1.5.5-1.5-.5M6.75 7.364V3h-3v18m3-13.636 10.5-3.819"
              />
            </svg>
          </div>
        )}

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Badges */}
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          <span
            className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold ${listingBadgeColor}`}
          >
            {getListingTypeLabel(property.listing_type)}
          </span>
          <span className="inline-flex items-center rounded-md bg-white/90 px-2 py-1 text-xs font-semibold text-gray-700 backdrop-blur-sm">
            {getPropertyTypeLabel(property.property_type)}
          </span>
          {property.is_verified && (
            <span className="inline-flex items-center rounded-md bg-green-500 px-2 py-1 text-xs font-semibold text-white">
              <svg className="mr-0.5 h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
              Verified
            </span>
          )}
        </div>

        {/* Save Button */}
        <div className="absolute right-3 top-3">
          <SaveButton propertyId={property.id} />
        </div>

        {/* Price Overlay */}
        <div className="absolute bottom-3 left-3">
          <p className="text-lg font-bold text-white drop-shadow-md">
            {formatPrice(property.price, property.currency, property.price_period)}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="text-base font-semibold text-gray-900 line-clamp-1 group-hover:text-primary-600 transition-colors">
          {property.title}
        </h3>
        <p className="mt-1 flex items-center gap-1 text-sm text-gray-500">
          <svg
            className="h-3.5 w-3.5 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"
            />
          </svg>
          <span className="line-clamp-1">{property.area}, Bali</span>
        </p>

        {/* Stats */}
        <div className="mt-3 flex items-center gap-4 border-t border-gray-100 pt-3">
          {property.bedrooms !== undefined && (
            <div className="flex items-center gap-1.5 text-sm text-gray-600">
              <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
              </svg>
              <span>{property.bedrooms} Bed{property.bedrooms !== 1 ? 's' : ''}</span>
            </div>
          )}
          {property.bathrooms !== undefined && (
            <div className="flex items-center gap-1.5 text-sm text-gray-600">
              <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
              <span>{property.bathrooms} Bath{property.bathrooms !== 1 ? 's' : ''}</span>
            </div>
          )}
          {property.land_size && (
            <div className="flex items-center gap-1.5 text-sm text-gray-600">
              <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
              </svg>
              <span>{formatArea(property.land_size, property.land_size_unit)}</span>
            </div>
          )}
          {!property.land_size && property.building_size && (
            <div className="flex items-center gap-1.5 text-sm text-gray-600">
              <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
              </svg>
              <span>{formatArea(property.building_size, property.building_size_unit)}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
