'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  StarIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import Pagination from '@/components/Pagination';
import StatusBadge from '@/components/StatusBadge';
import { getProperties, deleteProperty, toggleFeatured } from '@/lib/api';
import { Property, PaginatedResponse } from '@/lib/types';
import { formatPrice, truncate, capitalize } from '@/lib/utils';

export default function PropertiesPage() {
  const [data, setData] = useState<PaginatedResponse<Property> | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [listingType, setListingType] = useState('');
  const [status, setStatus] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const loadProperties = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getProperties({
        page,
        per_page: 10,
        search: search || undefined,
        property_type: propertyType || undefined,
        listing_type: listingType || undefined,
        status: status || undefined,
      });
      setData(result);
    } catch (err) {
      console.error('Failed to load properties:', err);
    } finally {
      setLoading(false);
    }
  }, [page, search, propertyType, listingType, status]);

  useEffect(() => {
    loadProperties();
  }, [loadProperties]);

  async function handleDelete(id: string) {
    try {
      await deleteProperty(id);
      setDeleteConfirm(null);
      loadProperties();
    } catch (err) {
      console.error('Failed to delete property:', err);
    }
  }

  async function handleToggleFeatured(id: string) {
    try {
      await toggleFeatured(id);
      loadProperties();
    } catch (err) {
      console.error('Failed to toggle featured:', err);
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    loadProperties();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-900">Properties</h1>
        <Link href="/properties/new" className="btn-primary gap-2">
          <PlusIcon className="h-4 w-4" />
          Add Property
        </Link>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search properties..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-9"
            />
          </div>
          <select
            value={propertyType}
            onChange={(e) => { setPropertyType(e.target.value); setPage(1); }}
            className="select-field sm:w-40"
          >
            <option value="">All Types</option>
            <option value="villa">Villa</option>
            <option value="house">House</option>
            <option value="apartment">Apartment</option>
            <option value="land">Land</option>
            <option value="commercial">Commercial</option>
          </select>
          <select
            value={listingType}
            onChange={(e) => { setListingType(e.target.value); setPage(1); }}
            className="select-field sm:w-40"
          >
            <option value="">All Listings</option>
            <option value="sale">For Sale</option>
            <option value="rent">For Rent</option>
            <option value="lease">Leasehold</option>
          </select>
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="select-field sm:w-36"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <button type="submit" className="btn-primary">
            Search
          </button>
        </form>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-admin-border">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Image</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Title</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Type</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Listing</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Price</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Area</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Featured</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-admin-border">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {Array.from({ length: 9 }).map((_, j) => (
                      <td key={j} className="px-4 py-4">
                        <div className="h-4 bg-slate-200 rounded w-3/4" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : data && data.data.length > 0 ? (
                data.data.map((property) => (
                  <tr key={property.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="h-12 w-16 rounded-lg bg-slate-200 overflow-hidden flex-shrink-0">
                        {property.images?.[0] ? (
                          <img
                            src={property.images[0]}
                            alt={property.title}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-slate-400 text-xs">
                            No img
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-slate-900">{truncate(property.title, 30)}</p>
                      <p className="text-xs text-slate-400">{property.bedrooms}bd / {property.bathrooms}ba</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">{capitalize(property.property_type)}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{capitalize(property.listing_type)}</td>
                    <td className="px-4 py-3 text-sm font-medium text-slate-900">
                      {formatPrice(property.price, property.currency)}
                      {property.price_period && (
                        <span className="text-xs text-slate-400 font-normal"> /{property.price_period}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">{capitalize(property.area)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={property.is_active ? 'active' : 'inactive'} />
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleToggleFeatured(property.id)}
                        className="p-1 hover:bg-slate-100 rounded transition-colors"
                        title={property.is_featured ? 'Remove featured' : 'Make featured'}
                      >
                        {property.is_featured ? (
                          <StarSolidIcon className="h-5 w-5 text-yellow-500" />
                        ) : (
                          <StarIcon className="h-5 w-5 text-slate-300" />
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Link
                          href={`/properties/${property.id}/edit`}
                          className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <PencilSquareIcon className="h-4 w-4" />
                        </Link>
                        {deleteConfirm === property.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleDelete(property.id)}
                              className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(null)}
                              className="px-2 py-1 text-xs bg-slate-200 text-slate-600 rounded hover:bg-slate-300"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirm(property.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-sm text-slate-400">
                    No properties found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {data && data.total_pages > 1 && (
          <Pagination
            currentPage={data.page}
            totalPages={data.total_pages}
            onPageChange={setPage}
          />
        )}
      </div>
    </div>
  );
}
