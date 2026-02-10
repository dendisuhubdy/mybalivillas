import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import InquiryForm from '@/components/InquiryForm';
import PropertyCard from '@/components/PropertyCard';
import { getPropertyBySlug, getSimilarProperties, MOCK_PROPERTIES } from '@/lib/api';
import { Property } from '@/lib/types';
import {
  formatPrice,
  formatArea,
  getPropertyTypeLabel,
  getListingTypeLabel,
  getPlaceholderGradient,
} from '@/lib/utils';

interface PropertyDetailPageProps {
  params: { slug: string };
}

async function fetchProperty(slug: string): Promise<Property | null> {
  try {
    const response = await getPropertyBySlug(slug);
    return response.data;
  } catch {
    // Try mock data fallback
    const mockProperty = MOCK_PROPERTIES.find((p) => p.slug === slug);
    return mockProperty || null;
  }
}

async function fetchSimilarProperties(propertyId: string): Promise<Property[]> {
  try {
    const response = await getSimilarProperties(propertyId);
    return response.data;
  } catch {
    return MOCK_PROPERTIES.slice(0, 3);
  }
}

export default async function PropertyDetailPage({
  params,
}: PropertyDetailPageProps) {
  const property = await fetchProperty(params.slug);

  if (!property) {
    notFound();
  }

  const similarProperties = await fetchSimilarProperties(property.id);

  // Handle API field name differences
  const viewCount = (property as Record<string, unknown>).view_count as number ?? property.views_count ?? 0;
  const landSize = (property as Record<string, unknown>).land_size_sqm as number ?? property.land_size;
  const buildingSize = (property as Record<string, unknown>).building_size_sqm as number ?? property.building_size;
  const primaryImage = Array.isArray(property.images) && property.images.length > 0 && property.images[0]?.url
    ? property.images[0].url
    : undefined;

  const listingBadgeColor =
    property.listing_type === 'sale_freehold'
      ? 'bg-emerald-600 text-white'
      : property.listing_type === 'sale_leasehold'
        ? 'bg-teal-600 text-white'
        : property.listing_type === 'short_term_rent'
          ? 'bg-amber-600 text-white'
          : 'bg-indigo-600 text-white';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200">
        <div className="container-custom py-3">
          <nav className="flex items-center gap-2 text-sm text-gray-500">
            <Link href="/" className="hover:text-primary-600">
              Home
            </Link>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
            <Link href="/properties" className="hover:text-primary-600">
              Properties
            </Link>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
            <span className="text-gray-900 line-clamp-1">{property.title}</span>
          </nav>
        </div>
      </div>

      {/* Image Gallery */}
      <div className="bg-white">
        <div className="container-custom py-4">
          <div className="grid gap-2 sm:grid-cols-4 sm:grid-rows-2">
            {/* Main Image */}
            <div className="relative sm:col-span-4">
              {primaryImage ? (
                <div className="relative aspect-[21/9] overflow-hidden rounded-xl">
                  <Image
                    src={primaryImage}
                    alt={property.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1280px) 100vw, 1280px"
                    priority
                  />
                </div>
              ) : (
                <div
                  className={`aspect-[21/9] rounded-xl bg-gradient-to-br ${getPlaceholderGradient(
                    property.property_type
                  )} flex items-center justify-center`}
                >
                  <svg
                    className="h-24 w-24 text-white/20"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={0.75}
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
            </div>
          </div>
        </div>
      </div>

      {/* Property Content */}
      <div className="container-custom py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Header */}
            <div>
              {/* Badges */}
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold ${listingBadgeColor}`}
                >
                  {getListingTypeLabel(property.listing_type)}
                </span>
                <span className="inline-flex items-center rounded-md bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700">
                  {getPropertyTypeLabel(property.property_type)}
                </span>
                {property.is_verified && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700">
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                    </svg>
                    Verified
                  </span>
                )}
                {property.is_featured && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-secondary-100 px-2.5 py-1 text-xs font-semibold text-secondary-700">
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
                    </svg>
                    Featured
                  </span>
                )}
              </div>

              <h1 className="mt-3 text-2xl font-bold text-gray-900 sm:text-3xl">
                {property.title}
              </h1>

              <div className="mt-2 flex items-center gap-1 text-gray-500">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                </svg>
                <span>{property.address ? `${property.address}, ` : ''}{property.area}, Bali</span>
              </div>

              <div className="mt-4">
                <p className="text-3xl font-bold text-primary-600">
                  {formatPrice(property.price, property.currency, property.price_period)}
                </p>
              </div>
            </div>

            {/* Key Details */}
            <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {property.bedrooms !== undefined && (
                <div className="rounded-xl border border-gray-200 bg-white p-4 text-center">
                  <svg className="mx-auto h-6 w-6 text-primary-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                  </svg>
                  <p className="mt-2 text-2xl font-bold text-gray-900">{property.bedrooms}</p>
                  <p className="text-xs text-gray-500">Bedrooms</p>
                </div>
              )}
              {property.bathrooms !== undefined && (
                <div className="rounded-xl border border-gray-200 bg-white p-4 text-center">
                  <svg className="mx-auto h-6 w-6 text-primary-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                  <p className="mt-2 text-2xl font-bold text-gray-900">{property.bathrooms}</p>
                  <p className="text-xs text-gray-500">Bathrooms</p>
                </div>
              )}
              {landSize && (
                <div className="rounded-xl border border-gray-200 bg-white p-4 text-center">
                  <svg className="mx-auto h-6 w-6 text-primary-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                  </svg>
                  <p className="mt-2 text-2xl font-bold text-gray-900">
                    {formatArea(Number(landSize), 'sqm')}
                  </p>
                  <p className="text-xs text-gray-500">Land Size</p>
                </div>
              )}
              {buildingSize && (
                <div className="rounded-xl border border-gray-200 bg-white p-4 text-center">
                  <svg className="mx-auto h-6 w-6 text-primary-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Z" />
                  </svg>
                  <p className="mt-2 text-2xl font-bold text-gray-900">
                    {formatArea(Number(buildingSize), 'sqm')}
                  </p>
                  <p className="text-xs text-gray-500">Building Size</p>
                </div>
              )}
            </div>

            {/* Description */}
            <div className="mt-8">
              <h2 className="text-xl font-semibold text-gray-900">Description</h2>
              <div className="mt-4 prose prose-gray max-w-none">
                <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                  {property.description}
                </p>
              </div>
            </div>

            {/* Features */}
            {Array.isArray(property.features) && property.features.length > 0 && (
              <div className="mt-8">
                <h2 className="text-xl font-semibold text-gray-900">Features & Amenities</h2>
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {property.features.map((feature) => (
                    <div
                      key={feature}
                      className="flex items-center gap-2 rounded-lg bg-white border border-gray-100 px-4 py-3"
                    >
                      <svg className="h-4 w-4 flex-shrink-0 text-primary-600" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                      </svg>
                      <span className="text-sm text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Location */}
            <div className="mt-8">
              <h2 className="text-xl font-semibold text-gray-900">Location</h2>
              <div className="mt-4 rounded-xl border border-gray-200 bg-white p-6">
                <div className="flex items-start gap-3">
                  <svg className="h-5 w-5 flex-shrink-0 text-primary-600 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                  </svg>
                  <div>
                    <p className="font-medium text-gray-900">{property.address}</p>
                    <p className="mt-1 text-sm text-gray-500">
                      {property.area}, Bali, Indonesia
                    </p>
                  </div>
                </div>
                {/* Map Placeholder */}
                <div className="mt-4 aspect-[16/9] rounded-lg bg-gray-100 flex items-center justify-center">
                  <div className="text-center text-gray-400">
                    <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z" />
                    </svg>
                    <p className="mt-2 text-sm">Map will be displayed here</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Agent Info */}
            {property.agent && (
              <div className="mt-8">
                <h2 className="text-xl font-semibold text-gray-900">Listed By</h2>
                <div className="mt-4 rounded-xl border border-gray-200 bg-white p-6">
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-100 text-primary-600">
                      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {property.agent.name}
                      </p>
                      {property.agent.company && (
                        <p className="text-sm text-gray-500">
                          {property.agent.company}
                        </p>
                      )}
                      <p className="mt-1 text-xs text-gray-400">
                        {property.agent.properties_count} listings
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              {/* Inquiry Form */}
              <InquiryForm
                propertyId={property.id}
                propertyTitle={property.title}
                agentName={property.agent?.name}
              />

              {/* Property ID / Meta */}
              <div className="rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-500">
                <div className="flex items-center justify-between">
                  <span>Property ID</span>
                  <span className="font-mono text-gray-700">{property.id}</span>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span>Listed</span>
                  <span className="text-gray-700">
                    {new Date(property.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span>Views</span>
                  <span className="text-gray-700">
                    {viewCount.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Similar Properties */}
        {similarProperties.length > 0 && (
          <div className="mt-16 border-t border-gray-200 pt-12">
            <div className="flex items-end justify-between">
              <div>
                <h2 className="section-heading">Similar Properties</h2>
                <p className="section-subheading">
                  You might also be interested in these properties
                </p>
              </div>
              <Link
                href="/properties"
                className="hidden items-center gap-1 text-sm font-semibold text-primary-600 hover:text-primary-700 sm:flex"
              >
                View All
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                </svg>
              </Link>
            </div>
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {similarProperties.slice(0, 3).map((p) => (
                <PropertyCard key={p.id} property={p} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
