'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createProperty } from '@/lib/api';
import { PropertyType, ListingType, PricePeriod } from '@/lib/types';

const AREAS = [
  'Seminyak', 'Canggu', 'Ubud', 'Uluwatu', 'Sanur', 'Nusa Dua', 'Jimbaran', 'Kuta',
];

const STEPS = ['Basics', 'Details', 'Location', 'Images & Features'];

export default function ListPropertyPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [userRole, setUserRole] = useState<string>('user');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    property_type: PropertyType.VILLA,
    listing_type: ListingType.BUY_FREEHOLD,
    price: '',
    currency: 'USD',
    price_period: '' as string,
    bedrooms: '',
    bathrooms: '',
    land_size_sqm: '',
    building_size_sqm: '',
    year_built: '',
    area: 'Seminyak',
    address: '',
    thumbnail_url: '',
    features: '' as string,
  });

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      router.push('/login?redirect=/list-property');
      return;
    }
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      setUserRole(user.role || 'user');
    } catch {
      // ignore
    }
  }, [router]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const nextStep = () => {
    if (step === 0) {
      if (!formData.title.trim()) { setError('Title is required'); return; }
      if (!formData.price) { setError('Price is required'); return; }
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const prevStep = () => setStep((s) => Math.max(s - 1, 0));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const features = formData.features
        .split(',')
        .map((f) => f.trim())
        .filter(Boolean);

      await createProperty({
        title: formData.title,
        description: formData.description || undefined,
        property_type: formData.property_type,
        listing_type: formData.listing_type,
        price: parseFloat(formData.price),
        currency: formData.currency,
        price_period: formData.price_period ? (formData.price_period as PricePeriod) : undefined,
        bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : undefined,
        bathrooms: formData.bathrooms ? parseInt(formData.bathrooms) : undefined,
        land_size_sqm: formData.land_size_sqm ? parseFloat(formData.land_size_sqm) : undefined,
        building_size_sqm: formData.building_size_sqm ? parseFloat(formData.building_size_sqm) : undefined,
        year_built: formData.year_built ? parseInt(formData.year_built) : undefined,
        area: formData.area,
        address: formData.address || undefined,
        thumbnail_url: formData.thumbnail_url || undefined,
        features: features.length > 0 ? features : undefined,
      });

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create listing');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-[calc(100vh-5rem)] items-center justify-center bg-gray-50 px-4 py-12">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <h2 className="mt-6 text-2xl font-bold text-gray-900">Property Submitted!</h2>
          <p className="mt-3 text-gray-500">
            {userRole === 'agent' || userRole === 'admin'
              ? 'Your property listing is now live and visible to buyers.'
              : 'Your listing has been submitted for review. Our team will activate it shortly.'}
          </p>
          <div className="mt-8 flex flex-col gap-3">
            <Link href="/properties" className="btn-primary !py-3">
              Browse Properties
            </Link>
            <button
              onClick={() => { setSuccess(false); setStep(0); setFormData({ ...formData, title: '', description: '', price: '' }); }}
              className="btn-outline !py-3"
            >
              List Another Property
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-5rem)] items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-600">
              <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21h7.5V10.75M2.25 21h1.5m18 0h-18M2.25 9l4.5-1.636M18.75 3l-1.5.545m0 6.205 3 1m1.5.5-1.5-.5M6.75 7.364V3h-3v18m3-13.636 10.5-3.819" />
              </svg>
            </div>
          </Link>
          <h1 className="mt-6 text-2xl font-bold text-gray-900">List Your Property</h1>
          <p className="mt-2 text-sm text-gray-500">
            Reach thousands of potential buyers and renters in Bali
          </p>
        </div>

        {/* Step Indicator */}
        <div className="mt-8 flex items-center justify-center gap-2">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                i <= step ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                {i + 1}
              </div>
              <span className={`hidden text-xs font-medium sm:inline ${i <= step ? 'text-primary-600' : 'text-gray-400'}`}>
                {label}
              </span>
              {i < STEPS.length - 1 && (
                <div className={`h-px w-6 sm:w-10 ${i < step ? 'bg-primary-600' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Form Card */}
        <div className="mt-8 rounded-xl border border-gray-200 bg-white p-8 shadow-card">
          {error && (
            <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4">
              <div className="flex items-center gap-2">
                <svg className="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                </svg>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Step 1: Basics */}
            {step === 0 && (
              <div className="space-y-5">
                <div>
                  <label htmlFor="title" className="label-field">Property Title *</label>
                  <input id="title" name="title" type="text" required value={formData.title} onChange={handleChange} placeholder="e.g. Luxury Villa in Seminyak" className="input-field" />
                </div>
                <div>
                  <label htmlFor="description" className="label-field">Description</label>
                  <textarea id="description" name="description" rows={4} value={formData.description} onChange={handleChange} placeholder="Describe your property..." className="input-field" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="property_type" className="label-field">Property Type *</label>
                    <select id="property_type" name="property_type" value={formData.property_type} onChange={handleChange} className="select-field">
                      <option value={PropertyType.VILLA}>Villa</option>
                      <option value={PropertyType.HOUSE}>House</option>
                      <option value={PropertyType.APARTMENT}>Apartment</option>
                      <option value={PropertyType.LAND}>Land</option>
                      <option value={PropertyType.COMMERCIAL}>Commercial</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="listing_type" className="label-field">Listing Type *</label>
                    <select id="listing_type" name="listing_type" value={formData.listing_type} onChange={handleChange} className="select-field">
                      <option value={ListingType.BUY_FREEHOLD}>Sale (Freehold)</option>
                      <option value={ListingType.BUY_LEASEHOLD}>Sale (Leasehold)</option>
                      <option value={ListingType.RENT_SHORT_TERM}>Short-Term Rent</option>
                      <option value={ListingType.RENT_LONG_TERM}>Long-Term Rent</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-1">
                    <label htmlFor="currency" className="label-field">Currency</label>
                    <select id="currency" name="currency" value={formData.currency} onChange={handleChange} className="select-field">
                      <option value="USD">USD</option>
                      <option value="IDR">IDR</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label htmlFor="price" className="label-field">Price *</label>
                    <input id="price" name="price" type="number" required min="0" step="any" value={formData.price} onChange={handleChange} placeholder="0" className="input-field" />
                  </div>
                </div>
                {(formData.listing_type === ListingType.RENT_SHORT_TERM || formData.listing_type === ListingType.RENT_LONG_TERM) && (
                  <div>
                    <label htmlFor="price_period" className="label-field">Price Period</label>
                    <select id="price_period" name="price_period" value={formData.price_period} onChange={handleChange} className="select-field">
                      <option value="">Select period</option>
                      <option value={PricePeriod.PER_DAY}>Per Day</option>
                      <option value={PricePeriod.PER_WEEK}>Per Week</option>
                      <option value={PricePeriod.PER_MONTH}>Per Month</option>
                      <option value={PricePeriod.PER_YEAR}>Per Year</option>
                    </select>
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Details */}
            {step === 1 && (
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="bedrooms" className="label-field">Bedrooms</label>
                    <input id="bedrooms" name="bedrooms" type="number" min="0" value={formData.bedrooms} onChange={handleChange} placeholder="0" className="input-field" />
                  </div>
                  <div>
                    <label htmlFor="bathrooms" className="label-field">Bathrooms</label>
                    <input id="bathrooms" name="bathrooms" type="number" min="0" value={formData.bathrooms} onChange={handleChange} placeholder="0" className="input-field" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="land_size_sqm" className="label-field">Land Size (sqm)</label>
                    <input id="land_size_sqm" name="land_size_sqm" type="number" min="0" step="any" value={formData.land_size_sqm} onChange={handleChange} placeholder="0" className="input-field" />
                  </div>
                  <div>
                    <label htmlFor="building_size_sqm" className="label-field">Building Size (sqm)</label>
                    <input id="building_size_sqm" name="building_size_sqm" type="number" min="0" step="any" value={formData.building_size_sqm} onChange={handleChange} placeholder="0" className="input-field" />
                  </div>
                </div>
                <div>
                  <label htmlFor="year_built" className="label-field">Year Built</label>
                  <input id="year_built" name="year_built" type="number" min="1900" max="2030" value={formData.year_built} onChange={handleChange} placeholder="e.g. 2020" className="input-field" />
                </div>
              </div>
            )}

            {/* Step 3: Location */}
            {step === 2 && (
              <div className="space-y-5">
                <div>
                  <label htmlFor="area" className="label-field">Area *</label>
                  <select id="area" name="area" value={formData.area} onChange={handleChange} className="select-field">
                    {AREAS.map((a) => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="address" className="label-field">Street Address</label>
                  <input id="address" name="address" type="text" value={formData.address} onChange={handleChange} placeholder="e.g. Jl. Kayu Aya No. 42" className="input-field" />
                </div>
              </div>
            )}

            {/* Step 4: Images & Features */}
            {step === 3 && (
              <div className="space-y-5">
                <div>
                  <label htmlFor="thumbnail_url" className="label-field">Thumbnail Image URL</label>
                  <input id="thumbnail_url" name="thumbnail_url" type="url" value={formData.thumbnail_url} onChange={handleChange} placeholder="https://example.com/image.jpg" className="input-field" />
                  <p className="mt-1 text-xs text-gray-400">Paste a direct link to the main image of your property</p>
                </div>
                <div>
                  <label htmlFor="features" className="label-field">Features</label>
                  <input id="features" name="features" type="text" value={formData.features} onChange={handleChange} placeholder="Private Pool, Garden, WiFi, AC, Parking" className="input-field" />
                  <p className="mt-1 text-xs text-gray-400">Comma-separated list of features</p>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="mt-8 flex items-center justify-between">
              {step > 0 ? (
                <button type="button" onClick={prevStep} className="btn-outline !py-2.5 !px-6">
                  Back
                </button>
              ) : (
                <div />
              )}
              {step < STEPS.length - 1 ? (
                <button type="button" onClick={nextStep} className="btn-primary !py-2.5 !px-6">
                  Next
                </button>
              ) : (
                <button type="submit" disabled={isLoading} className="btn-primary !py-2.5 !px-6">
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Submitting...
                    </span>
                  ) : (
                    'Submit Listing'
                  )}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
