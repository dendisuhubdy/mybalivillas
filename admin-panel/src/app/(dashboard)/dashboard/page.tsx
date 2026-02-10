'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  BuildingOfficeIcon,
  CheckBadgeIcon,
  UsersIcon,
  EnvelopeIcon,
} from '@heroicons/react/24/outline';
import StatsCard from '@/components/StatsCard';
import StatusBadge from '@/components/StatusBadge';
import { getDashboardStats } from '@/lib/api';
import { DashboardStats } from '@/lib/types';
import { formatPrice, formatDate, truncate, capitalize } from '@/lib/utils';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {
      const data = await getDashboardStats();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard stats');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card p-6 animate-pulse">
              <div className="h-4 bg-slate-200 rounded w-24 mb-3" />
              <div className="h-8 bg-slate-200 rounded w-16" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <div key={i} className="card p-6 animate-pulse">
              <div className="h-6 bg-slate-200 rounded w-40 mb-4" />
              <div className="space-y-3">
                {[1, 2, 3].map((j) => (
                  <div key={j} className="h-4 bg-slate-200 rounded" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <div className="card p-8 text-center">
          <p className="text-red-600">{error}</p>
          <button onClick={loadStats} className="btn-primary mt-4">
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const maxTypeCount = Math.max(...Object.values(stats.properties_by_type), 1);
  const maxAreaCount = Math.max(...Object.values(stats.properties_by_area), 1);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          label="Total Properties"
          value={stats.total_properties}
          icon={BuildingOfficeIcon}
          color="indigo"
        />
        <StatsCard
          label="Active Listings"
          value={stats.active_listings}
          icon={CheckBadgeIcon}
          color="green"
        />
        <StatsCard
          label="Total Users"
          value={stats.total_users}
          icon={UsersIcon}
          color="blue"
        />
        <StatsCard
          label="New Inquiries"
          value={stats.new_inquiries}
          icon={EnvelopeIcon}
          color="orange"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Properties by Type */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Properties by Type</h2>
          <div className="space-y-3">
            {Object.entries(stats.properties_by_type).map(([type, count]) => (
              <div key={type} className="flex items-center gap-3">
                <span className="text-sm text-slate-600 w-24 flex-shrink-0">
                  {capitalize(type)}
                </span>
                <div className="flex-1 h-8 bg-slate-100 rounded-lg overflow-hidden">
                  <div
                    className="h-full bg-primary-500 rounded-lg flex items-center justify-end px-2 transition-all duration-500"
                    style={{ width: `${Math.max((count / maxTypeCount) * 100, 8)}%` }}
                  >
                    <span className="text-xs font-medium text-white">{count}</span>
                  </div>
                </div>
              </div>
            ))}
            {Object.keys(stats.properties_by_type).length === 0 && (
              <p className="text-sm text-slate-400 text-center py-4">No data available</p>
            )}
          </div>
        </div>

        {/* Properties by Area */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Properties by Area</h2>
          <div className="space-y-3">
            {Object.entries(stats.properties_by_area).map(([area, count]) => (
              <div key={area} className="flex items-center gap-3">
                <span className="text-sm text-slate-600 w-24 flex-shrink-0">
                  {capitalize(area)}
                </span>
                <div className="flex-1 h-8 bg-slate-100 rounded-lg overflow-hidden">
                  <div
                    className="h-full bg-indigo-400 rounded-lg flex items-center justify-end px-2 transition-all duration-500"
                    style={{ width: `${Math.max((count / maxAreaCount) * 100, 8)}%` }}
                  >
                    <span className="text-xs font-medium text-white">{count}</span>
                  </div>
                </div>
              </div>
            ))}
            {Object.keys(stats.properties_by_area).length === 0 && (
              <p className="text-sm text-slate-400 text-center py-4">No data available</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Inquiries */}
        <div className="card">
          <div className="px-6 py-4 border-b border-admin-border flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Recent Inquiries</h2>
            <Link href="/inquiries" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
              View all
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-admin-border">
              <thead>
                <tr className="bg-slate-50">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Property</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-admin-border">
                {stats.recent_inquiries.length > 0 ? (
                  stats.recent_inquiries.slice(0, 5).map((inquiry) => (
                    <tr key={inquiry.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-sm text-slate-700">{inquiry.name}</td>
                      <td className="px-4 py-3 text-sm text-slate-500">{truncate(inquiry.property_title, 25)}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={inquiry.status} variant="inquiry" />
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-500">{formatDate(inquiry.created_at)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-sm text-slate-400">
                      No recent inquiries
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Properties */}
        <div className="card">
          <div className="px-6 py-4 border-b border-admin-border flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Recent Properties</h2>
            <Link href="/properties" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
              View all
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-admin-border">
              <thead>
                <tr className="bg-slate-50">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Title</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Price</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-admin-border">
                {stats.recent_properties.length > 0 ? (
                  stats.recent_properties.slice(0, 5).map((property) => (
                    <tr key={property.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-sm text-slate-700 font-medium">
                        {truncate(property.title, 25)}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-500">{capitalize(property.property_type)}</td>
                      <td className="px-4 py-3 text-sm text-slate-700">{formatPrice(property.price, property.currency)}</td>
                      <td className="px-4 py-3 text-sm text-slate-500">{formatDate(property.created_at)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-sm text-slate-400">
                      No recent properties
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
