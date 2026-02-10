'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeftIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { getProperty, updateProperty } from '@/lib/api';
import { PropertyFormData } from '@/lib/types';

const AREAS = [
  'Seminyak', 'Canggu', 'Ubud', 'Kuta', 'Jimbaran', 'Nusa Dua',
  'Sanur', 'Uluwatu', 'Tabanan', 'Lovina', 'Amed', 'Candidasa',
  'Denpasar', 'Gianyar', 'Karangasem', 'Buleleng',
];

const FEATURES = [
  'Pool', 'Garden', 'Ocean View', 'Furnished', 'Air Conditioning',
  'Parking', 'Security', 'Wifi', 'Kitchen', 'Laundry', 'Gym',
  'Beachfront', 'Rice Paddy View', 'Rooftop',
];

export default function EditPropertyPage() {
  const router = useRouter();
  const params = useParams();
  const propertyId = params.id as string;

  const [formData, setFormData] = useState<PropertyFormData>({
    title: '',
    description: '',
    property_type: 'villa',
    listing_type: 'sale',
    price: 0,
    currency: 'IDR',
    price_period: '',
    bedrooms: 0,
    bathrooms: 0,
    land_size: 0,
    building_size: 0,
    area: '',
    address: '',
    latitude: 0,
    longitude: 0,
    images: [],
    features: [],
    is_featured: false,
    is_active: true,
  });
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadProperty() {
      try {
        const property = await getProperty(propertyId);
        setFormData({
          title: property.title,
          description: property.description,
          property_type: property.property_type,
          listing_type: property.listing_type,
          price: property.price,
          currency: property.currency,
          price_period: property.price_period || '',
          bedrooms: property.bedrooms,
          bathrooms: property.bathrooms,
          land_size: property.land_size,
          building_size: property.building_size,
          area: property.area,
          address: property.address,
          latitude: property.latitude || 0,
          longitude: property.longitude || 0,
          images: property.images || [],
          features: property.features || [],
          is_featured: property.is_featured,
          is_active: property.is_active,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load property');
      } finally {
        setPageLoading(false);
      }
    }

    loadProperty();
  }, [propertyId]);

  function updateField<K extends keyof PropertyFormData>(key: K, value: PropertyFormData[K]) {
    setFormData((prev) => ({ ...prev, [key]: value }));
  }

  function addImage() {
    if (imageUrl.trim()) {
      updateField('images', [...formData.images, imageUrl.trim()]);
      setImageUrl('');
    }
  }

  function removeImage(index: number) {
    updateField('images', formData.images.filter((_, i) => i !== index));
  }

  function toggleFeature(feature: string) {
    if (formData.features.includes(feature)) {
      updateField('features', formData.features.filter((f) => f !== feature));
    } else {
      updateField('features', [...formData.features, feature]);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await updateProperty(propertyId, formData);
      router.push('/properties');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update property');
    } finally {
      setLoading(false);
    }
  }

  if (pageLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 bg-slate-200 rounded-lg animate-pulse" />
          <div className="h-8 w-48 bg-slate-200 rounded animate-pulse" />
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="card p-6 animate-pulse">
            <div className="h-6 bg-slate-200 rounded w-32 mb-4" />
            <div className="grid grid-cols-2 gap-4">
              <div className="h-10 bg-slate-200 rounded" />
              <div className="h-10 bg-slate-200 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/properties"
          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">Edit Property</h1>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="label-field">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => updateField('title', e.target.value)}
                className="input-field"
                placeholder="e.g., Stunning 3BR Villa in Seminyak"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="label-field">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => updateField('description', e.target.value)}
                className="input-field min-h-[120px]"
                placeholder="Describe the property..."
                required
              />
            </div>
            <div>
              <label className="label-field">Property Type</label>
              <select
                value={formData.property_type}
                onChange={(e) => updateField('property_type', e.target.value)}
                className="select-field"
              >
                <option value="villa">Villa</option>
                <option value="house">House</option>
                <option value="apartment">Apartment</option>
                <option value="land">Land</option>
                <option value="commercial">Commercial</option>
              </select>
            </div>
            <div>
              <label className="label-field">Listing Type</label>
              <select
                value={formData.listing_type}
                onChange={(e) => updateField('listing_type', e.target.value)}
                className="select-field"
              >
                <option value="sale">For Sale</option>
                <option value="rent">For Rent</option>
                <option value="lease">Leasehold</option>
              </select>
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Pricing</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="label-field">Price</label>
              <input
                type="number"
                value={formData.price || ''}
                onChange={(e) => updateField('price', Number(e.target.value))}
                className="input-field"
                placeholder="0"
                min="0"
                required
              />
            </div>
            <div>
              <label className="label-field">Currency</label>
              <select
                value={formData.currency}
                onChange={(e) => updateField('currency', e.target.value)}
                className="select-field"
              >
                <option value="IDR">IDR (Rupiah)</option>
                <option value="USD">USD (Dollar)</option>
              </select>
            </div>
            <div>
              <label className="label-field">Price Period</label>
              <select
                value={formData.price_period}
                onChange={(e) => updateField('price_period', e.target.value)}
                className="select-field"
              >
                <option value="">N/A (Sale)</option>
                <option value="month">Per Month</option>
                <option value="year">Per Year</option>
                <option value="night">Per Night</option>
              </select>
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Property Details</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="label-field">Bedrooms</label>
              <input
                type="number"
                value={formData.bedrooms || ''}
                onChange={(e) => updateField('bedrooms', Number(e.target.value))}
                className="input-field"
                min="0"
              />
            </div>
            <div>
              <label className="label-field">Bathrooms</label>
              <input
                type="number"
                value={formData.bathrooms || ''}
                onChange={(e) => updateField('bathrooms', Number(e.target.value))}
                className="input-field"
                min="0"
              />
            </div>
            <div>
              <label className="label-field">Land Size (sqm)</label>
              <input
                type="number"
                value={formData.land_size || ''}
                onChange={(e) => updateField('land_size', Number(e.target.value))}
                className="input-field"
                min="0"
              />
            </div>
            <div>
              <label className="label-field">Building Size (sqm)</label>
              <input
                type="number"
                value={formData.building_size || ''}
                onChange={(e) => updateField('building_size', Number(e.target.value))}
                className="input-field"
                min="0"
              />
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Location</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label-field">Area</label>
              <select
                value={formData.area}
                onChange={(e) => updateField('area', e.target.value)}
                className="select-field"
                required
              >
                <option value="">Select Area</option>
                {AREAS.map((area) => (
                  <option key={area} value={area.toLowerCase()}>
                    {area}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label-field">Address</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => updateField('address', e.target.value)}
                className="input-field"
                placeholder="Full address"
              />
            </div>
            <div>
              <label className="label-field">Latitude</label>
              <input
                type="number"
                step="any"
                value={formData.latitude || ''}
                onChange={(e) => updateField('latitude', Number(e.target.value))}
                className="input-field"
                placeholder="-8.6500"
              />
            </div>
            <div>
              <label className="label-field">Longitude</label>
              <input
                type="number"
                step="any"
                value={formData.longitude || ''}
                onChange={(e) => updateField('longitude', Number(e.target.value))}
                className="input-field"
                placeholder="115.2167"
              />
            </div>
          </div>
        </div>

        {/* Media */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Media</h2>
          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="input-field flex-1"
                placeholder="https://example.com/image.jpg"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addImage();
                  }
                }}
              />
              <button
                type="button"
                onClick={addImage}
                className="btn-secondary gap-1"
              >
                <PlusIcon className="h-4 w-4" />
                Add
              </button>
            </div>

            {formData.images.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {formData.images.map((url, index) => (
                  <div key={index} className="relative group">
                    <div className="aspect-video rounded-lg bg-slate-100 overflow-hidden border border-admin-border">
                      <img
                        src={url}
                        alt={`Image ${index + 1}`}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '';
                          (e.target as HTMLImageElement).alt = 'Failed to load';
                        }}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 h-6 w-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <XMarkIcon className="h-3.5 w-3.5" />
                    </button>
                    <p className="text-xs text-slate-400 mt-1 truncate">{url}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Features */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Features</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {FEATURES.map((feature) => (
              <label
                key={feature}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${
                  formData.features.includes(feature)
                    ? 'bg-primary-50 border-primary-300 text-primary-700'
                    : 'bg-white border-admin-border text-slate-600 hover:bg-slate-50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={formData.features.includes(feature)}
                  onChange={() => toggleFeature(feature)}
                  className="sr-only"
                />
                <div
                  className={`h-4 w-4 rounded flex items-center justify-center flex-shrink-0 ${
                    formData.features.includes(feature)
                      ? 'bg-primary-600'
                      : 'border border-slate-300'
                  }`}
                >
                  {formData.features.includes(feature) && (
                    <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <span className="text-sm">{feature}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Settings */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Settings</h2>
          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-3 cursor-pointer">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={formData.is_featured}
                  onChange={(e) => updateField('is_featured', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-10 h-6 bg-slate-200 peer-checked:bg-primary-600 rounded-full transition-colors" />
                <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm peer-checked:translate-x-4 transition-transform" />
              </div>
              <span className="text-sm font-medium text-slate-700">Featured Property</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => updateField('is_active', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-10 h-6 bg-slate-200 peer-checked:bg-green-600 rounded-full transition-colors" />
                <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm peer-checked:translate-x-4 transition-transform" />
              </div>
              <span className="text-sm font-medium text-slate-700">Active (Visible on site)</span>
            </label>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3">
          <Link href="/properties" className="btn-secondary">
            Cancel
          </Link>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Updating...
              </span>
            ) : (
              'Update Property'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
