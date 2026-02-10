import Link from 'next/link';
import PropertyCard from '@/components/PropertyCard';
import SearchBar from '@/components/SearchBar';
import { getProperties, MOCK_PROPERTIES } from '@/lib/api';
import { Property, PropertyFilters, PropertyType, ListingType } from '@/lib/types';
import { getPropertyTypeLabel, getListingTypeLabel } from '@/lib/utils';

interface PropertiesPageProps {
  searchParams: {
    listing_type?: string;
    property_type?: string;
    area?: string;
    min_price?: string;
    max_price?: string;
    bedrooms?: string;
    keyword?: string;
    sort_by?: string;
    page?: string;
    is_featured?: string;
  };
}

async function fetchProperties(
  searchParams: PropertiesPageProps['searchParams']
): Promise<{ properties: Property[]; total: number; totalPages: number; currentPage: number }> {
  const filters: PropertyFilters = {
    listing_type: searchParams.listing_type as ListingType | undefined,
    property_type: searchParams.property_type as PropertyType | undefined,
    area: searchParams.area,
    min_price: searchParams.min_price ? Number(searchParams.min_price) : undefined,
    max_price: searchParams.max_price ? Number(searchParams.max_price) : undefined,
    bedrooms: searchParams.bedrooms ? Number(searchParams.bedrooms) : undefined,
    keyword: searchParams.keyword,
    sort_by: searchParams.sort_by as PropertyFilters['sort_by'],
    page: searchParams.page ? Number(searchParams.page) : 1,
    per_page: 12,
    is_featured: searchParams.is_featured === 'true' ? true : undefined,
  };

  try {
    const response = await getProperties(filters);
    const paginated = response.data;
    return {
      properties: paginated?.items || [],
      total: paginated?.total || 0,
      totalPages: paginated?.total_pages || 0,
      currentPage: paginated?.page || 1,
    };
  } catch {
    // Filter mock data based on search params
    let filtered = [...MOCK_PROPERTIES];

    if (searchParams.listing_type) {
      filtered = filtered.filter((p) => p.listing_type === searchParams.listing_type);
    }
    if (searchParams.property_type) {
      filtered = filtered.filter((p) => p.property_type === searchParams.property_type);
    }
    if (searchParams.area) {
      filtered = filtered.filter(
        (p) => p.area.toLowerCase() === searchParams.area?.toLowerCase()
      );
    }
    if (searchParams.keyword) {
      const kw = searchParams.keyword.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.title.toLowerCase().includes(kw) ||
          p.description.toLowerCase().includes(kw) ||
          p.area.toLowerCase().includes(kw)
      );
    }

    return {
      properties: filtered,
      total: filtered.length,
      totalPages: 1,
      currentPage: 1,
    };
  }
}

function buildPageUrl(
  searchParams: PropertiesPageProps['searchParams'],
  overrides: Record<string, string | undefined>
): string {
  const params = new URLSearchParams();
  const merged = { ...searchParams, ...overrides };
  Object.entries(merged).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      params.set(key, value);
    }
  });
  const qs = params.toString();
  return `/properties${qs ? `?${qs}` : ''}`;
}

export default async function PropertiesPage({ searchParams }: PropertiesPageProps) {
  const { properties, total, totalPages, currentPage } = await fetchProperties(searchParams);

  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'price_asc', label: 'Price: Low to High' },
    { value: 'price_desc', label: 'Price: High to Low' },
    { value: 'popular', label: 'Most Popular' },
  ];

  const bedroomOptions = [
    { value: '', label: 'Any' },
    { value: '1', label: '1+' },
    { value: '2', label: '2+' },
    { value: '3', label: '3+' },
    { value: '4', label: '4+' },
    { value: '5', label: '5+' },
  ];

  const areaOptions = [
    { value: '', label: 'All Areas' },
    { value: 'seminyak', label: 'Seminyak' },
    { value: 'canggu', label: 'Canggu' },
    { value: 'ubud', label: 'Ubud' },
    { value: 'uluwatu', label: 'Uluwatu' },
    { value: 'sanur', label: 'Sanur' },
    { value: 'nusa-dua', label: 'Nusa Dua' },
    { value: 'jimbaran', label: 'Jimbaran' },
    { value: 'kuta', label: 'Kuta' },
  ];

  // Page title
  let pageTitle = 'Properties in Bali';
  if (searchParams.listing_type) {
    pageTitle = `Properties ${getListingTypeLabel(searchParams.listing_type)} in Bali`;
  }
  if (searchParams.property_type) {
    pageTitle = `${getPropertyTypeLabel(searchParams.property_type)}s ${
      searchParams.listing_type ? getListingTypeLabel(searchParams.listing_type) : ''
    } in Bali`;
  }
  if (searchParams.area) {
    pageTitle += ` - ${searchParams.area.charAt(0).toUpperCase() + searchParams.area.slice(1)}`;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container-custom py-6">
          {/* Breadcrumb */}
          <nav className="mb-4 flex items-center gap-2 text-sm text-gray-500">
            <Link href="/" className="hover:text-primary-600">
              Home
            </Link>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
            <span className="text-gray-900">Properties</span>
          </nav>

          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
            {pageTitle}
          </h1>
          <p className="mt-1 text-gray-500">
            {total} {total === 1 ? 'property' : 'properties'} found
          </p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="container-custom py-4">
          <SearchBar
            variant="standalone"
            initialFilters={{
              listing_type: searchParams.listing_type,
              property_type: searchParams.property_type,
              keyword: searchParams.keyword,
              min_price: searchParams.min_price,
              max_price: searchParams.max_price,
            }}
          />
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white border-b border-gray-100">
        <div className="container-custom flex flex-wrap items-center gap-3 py-3">
          {/* Area Filter */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-gray-500 uppercase">Area:</label>
            <div className="flex gap-1">
              {areaOptions.slice(0, 5).map((area) => (
                <Link
                  key={area.value}
                  href={buildPageUrl(searchParams, {
                    area: area.value || undefined,
                    page: undefined,
                  })}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    (searchParams.area || '') === area.value
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {area.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="h-5 w-px bg-gray-200 hidden sm:block" />

          {/* Bedrooms Filter */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-gray-500 uppercase">Beds:</label>
            <div className="flex gap-1">
              {bedroomOptions.map((bed) => (
                <Link
                  key={bed.value}
                  href={buildPageUrl(searchParams, {
                    bedrooms: bed.value || undefined,
                    page: undefined,
                  })}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    (searchParams.bedrooms || '') === bed.value
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {bed.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="h-5 w-px bg-gray-200 hidden sm:block" />

          {/* Sort */}
          <div className="ml-auto flex items-center gap-2">
            <label className="text-xs font-medium text-gray-500 uppercase">Sort:</label>
            <div className="flex gap-1">
              {sortOptions.map((sort) => (
                <Link
                  key={sort.value}
                  href={buildPageUrl(searchParams, {
                    sort_by: sort.value,
                    page: undefined,
                  })}
                  className={`hidden rounded-full px-3 py-1 text-xs font-medium transition-colors sm:inline-flex ${
                    (searchParams.sort_by || 'newest') === sort.value
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {sort.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="container-custom py-8">
        {properties.length > 0 ? (
          <>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {properties.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <nav className="mt-12 flex items-center justify-center gap-2">
                {/* Previous */}
                {currentPage > 1 && (
                  <Link
                    href={buildPageUrl(searchParams, {
                      page: String(currentPage - 1),
                    })}
                    className="flex h-10 items-center gap-1 rounded-lg border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                    </svg>
                    Previous
                  </Link>
                )}

                {/* Page Numbers */}
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 7) {
                    pageNum = i + 1;
                  } else if (currentPage <= 4) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 3) {
                    pageNum = totalPages - 6 + i;
                  } else {
                    pageNum = currentPage - 3 + i;
                  }
                  return (
                    <Link
                      key={pageNum}
                      href={buildPageUrl(searchParams, {
                        page: String(pageNum),
                      })}
                      className={`flex h-10 w-10 items-center justify-center rounded-lg text-sm font-medium ${
                        pageNum === currentPage
                          ? 'bg-primary-600 text-white'
                          : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </Link>
                  );
                })}

                {/* Next */}
                {currentPage < totalPages && (
                  <Link
                    href={buildPageUrl(searchParams, {
                      page: String(currentPage + 1),
                    })}
                    className="flex h-10 items-center gap-1 rounded-lg border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Next
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                    </svg>
                  </Link>
                )}
              </nav>
            )}
          </>
        ) : (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-100">
              <svg className="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
            </div>
            <h3 className="mt-4 text-lg font-semibold text-gray-900">
              No properties found
            </h3>
            <p className="mt-2 max-w-sm text-sm text-gray-500">
              Try adjusting your filters or search criteria to find more properties.
            </p>
            <Link href="/properties" className="btn-primary mt-6">
              Clear All Filters
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
