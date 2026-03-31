import Link from 'next/link';
import PropertyCard from '@/components/PropertyCard';
import SearchBar from '@/components/SearchBar';
import { getFeaturedProperties, MOCK_PROPERTIES } from '@/lib/api';
import { Property } from '@/lib/types';

async function fetchFeaturedProperties(): Promise<Property[]> {
  try {
    const response = await getFeaturedProperties();
    return response.data;
  } catch {
    return MOCK_PROPERTIES;
  }
}

const whyChooseUs = [
  {
    title: 'Verified Properties',
    description:
      'Every listing is personally verified by our team to ensure accuracy and quality. No surprises, just transparent information.',
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
      </svg>
    ),
  },
  {
    title: 'Expert Local Agents',
    description:
      'Our network of experienced agents know Bali inside and out. Get expert guidance through every step of your property journey.',
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
      </svg>
    ),
  },
  {
    title: 'Secure Transactions',
    description:
      'We provide legal support and ensure all transactions are transparent and legally compliant with Indonesian property laws.',
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
      </svg>
    ),
  },
  {
    title: 'Local Knowledge',
    description:
      'From zoning regulations to the best neighborhoods, our deep local expertise helps you make informed investment decisions.',
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" />
      </svg>
    ),
  },
];

export default async function HomePage() {
  const properties = await fetchFeaturedProperties();

  return (
    <>
      {/* ================================================================
          HERO SECTION
          ================================================================ */}
      <section className="relative overflow-hidden bg-hero-gradient">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="hero-pattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                <circle cx="20" cy="20" r="1.5" fill="white" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#hero-pattern)" />
          </svg>
        </div>

        <div className="container-custom relative py-20 sm:py-28 lg:py-36">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Find Your Dream{' '}
              <span className="text-secondary-400">Property</span> in Bali
            </h1>
            <p className="mt-6 text-lg text-primary-100 sm:text-xl">
              Discover premium villas, houses, apartments, land, and commercial
              properties across Bali&apos;s most desirable locations.
            </p>
          </div>

          {/* Search Bar */}
          <div className="mx-auto mt-10 max-w-4xl">
            <SearchBar variant="hero" />
          </div>

          {/* Quick Stats */}
          <div className="mx-auto mt-12 flex max-w-2xl flex-wrap items-center justify-center gap-8 sm:gap-12">
            <div className="text-center">
              <p className="text-3xl font-bold text-white">1,500+</p>
              <p className="mt-1 text-sm text-primary-200">Active Listings</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-white">200+</p>
              <p className="mt-1 text-sm text-primary-200">Verified Agents</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-white">8</p>
              <p className="mt-1 text-sm text-primary-200">Premium Areas</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-white">5,000+</p>
              <p className="mt-1 text-sm text-primary-200">Happy Clients</p>
            </div>
          </div>
        </div>

        {/* Bottom Wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 60V30C240 5 480 0 720 15C960 30 1200 50 1440 30V60H0Z" fill="white" />
          </svg>
        </div>
      </section>

      {/* ================================================================
          BROWSE BY LOCATION
          ================================================================ */}
      <section className="py-16 sm:py-20">
        <div className="container-custom">
          <div className="text-center">
            <h2 className="section-heading">Browse by Location</h2>
            <p className="section-subheading mx-auto max-w-2xl">
              Explore properties in Bali&apos;s most sought-after neighborhoods
            </p>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {/* Canggu */}
            <Link
              href="/properties?area=canggu"
              className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 p-6 text-white transition-all hover:shadow-xl hover:-translate-y-1"
            >
              <div className="absolute right-0 top-0 -mr-4 -mt-4 h-24 w-24 rounded-full bg-white/10" />
              <div className="absolute right-4 bottom-4 h-16 w-16 rounded-full bg-white/5" />
              <div className="relative">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                  </svg>
                </div>
                <h3 className="mt-4 text-xl font-bold">Canggu</h3>
                <p className="mt-2 text-sm text-emerald-100">
                  Trendy surf town with vibrant cafes, beach clubs, and rice field villas.
                </p>
                <div className="mt-4 flex items-center gap-1 text-sm font-semibold text-emerald-100 group-hover:text-white">
                  Browse properties
                  <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                  </svg>
                </div>
              </div>
            </Link>

            {/* Ubud */}
            <Link
              href="/properties?area=ubud"
              className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-teal-500 to-teal-700 p-6 text-white transition-all hover:shadow-xl hover:-translate-y-1"
            >
              <div className="absolute right-0 top-0 -mr-4 -mt-4 h-24 w-24 rounded-full bg-white/10" />
              <div className="absolute right-4 bottom-4 h-16 w-16 rounded-full bg-white/5" />
              <div className="relative">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                  </svg>
                </div>
                <h3 className="mt-4 text-xl font-bold">Ubud</h3>
                <p className="mt-2 text-sm text-teal-100">
                  Cultural heart of Bali with lush jungles, yoga retreats, and artistic charm.
                </p>
                <div className="mt-4 flex items-center gap-1 text-sm font-semibold text-teal-100 group-hover:text-white">
                  Browse properties
                  <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                  </svg>
                </div>
              </div>
            </Link>

            {/* Uluwatu */}
            <Link
              href="/properties?area=uluwatu"
              className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 p-6 text-white transition-all hover:shadow-xl hover:-translate-y-1"
            >
              <div className="absolute right-0 top-0 -mr-4 -mt-4 h-24 w-24 rounded-full bg-white/10" />
              <div className="absolute right-4 bottom-4 h-16 w-16 rounded-full bg-white/5" />
              <div className="relative">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                  </svg>
                </div>
                <h3 className="mt-4 text-xl font-bold">Uluwatu</h3>
                <p className="mt-2 text-sm text-amber-100">
                  Dramatic clifftop setting with world-class surf breaks and luxury villas.
                </p>
                <div className="mt-4 flex items-center gap-1 text-sm font-semibold text-amber-100 group-hover:text-white">
                  Browse properties
                  <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                  </svg>
                </div>
              </div>
            </Link>

            {/* Sanur */}
            <Link
              href="/properties?area=sanur"
              className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 p-6 text-white transition-all hover:shadow-xl hover:-translate-y-1"
            >
              <div className="absolute right-0 top-0 -mr-4 -mt-4 h-24 w-24 rounded-full bg-white/10" />
              <div className="absolute right-4 bottom-4 h-16 w-16 rounded-full bg-white/5" />
              <div className="relative">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                  </svg>
                </div>
                <h3 className="mt-4 text-xl font-bold">Sanur</h3>
                <p className="mt-2 text-sm text-indigo-100">
                  Relaxed coastal village with calm beaches, family-friendly atmosphere.
                </p>
                <div className="mt-4 flex items-center gap-1 text-sm font-semibold text-indigo-100 group-hover:text-white">
                  Browse properties
                  <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                  </svg>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* ================================================================
          FEATURED PROPERTIES
          ================================================================ */}
      <section className="py-16 sm:py-20">
        <div className="container-custom">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="section-heading">Featured Properties</h2>
              <p className="section-subheading">
                Hand-picked properties from our curated collection
              </p>
            </div>
            <Link
              href="/properties?is_featured=true"
              className="hidden items-center gap-1 text-sm font-semibold text-primary-600 transition-colors hover:text-primary-700 sm:flex"
            >
              View All
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {properties.slice(0, 6).map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>

          <div className="mt-8 text-center sm:hidden">
            <Link href="/properties?is_featured=true" className="btn-outline">
              View All Properties
            </Link>
          </div>
        </div>
      </section>


      {/* ================================================================
          WHY CHOOSE US
          ================================================================ */}
      <section className="py-16 sm:py-20">
        <div className="container-custom">
          <div className="text-center">
            <h2 className="section-heading">Why Choose MyBaliVilla</h2>
            <p className="section-subheading mx-auto max-w-2xl">
              We are Bali&apos;s most trusted property platform, helping thousands
              find their perfect home or investment
            </p>
          </div>

          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {whyChooseUs.map((feature) => (
              <div
                key={feature.title}
                className="group rounded-xl border border-gray-100 bg-white p-6 text-center transition-all hover:border-primary-200 hover:shadow-card-hover"
              >
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-50 text-primary-600 transition-colors group-hover:bg-primary-100">
                  {feature.icon}
                </div>
                <h3 className="mt-5 text-lg font-semibold text-gray-900">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-500">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================
          CTA SECTION
          ================================================================ */}
      <section className="bg-primary-700">
        <div className="container-custom py-16 sm:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Have a Property to List?
            </h2>
            <p className="mt-4 text-lg text-primary-100">
              Reach thousands of potential buyers and renters looking for
              properties in Bali. List your property with us and get it seen by
              the right audience.
            </p>
            <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link href="/list-property" className="btn-secondary !px-8 !py-3.5 !text-base">
                List Your Property
              </Link>
              <Link href="/contact" className="btn-white !px-8 !py-3.5 !text-base">
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
