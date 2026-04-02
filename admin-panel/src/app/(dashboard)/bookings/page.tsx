'use client';

import { useEffect, useState } from 'react';
import { getBookings, updateBookingStatus } from '@/lib/api';
import { AdminBooking } from '@/lib/types';

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-green-100 text-green-800',
  checked_in: 'bg-blue-100 text-blue-800',
  checked_out: 'bg-gray-100 text-gray-800',
  cancelled: 'bg-red-100 text-red-800',
  refunded: 'bg-purple-100 text-purple-800',
};

const nextStatus: Record<string, string[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['checked_in', 'cancelled'],
  checked_in: ['checked_out'],
  checked_out: ['refunded'],
};

export default function BookingsPage() {
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  const loadBookings = async () => {
    setLoading(true);
    try {
      const res = await getBookings({
        page,
        per_page: 20,
        status: statusFilter || undefined,
      });
      setBookings(res.items || []);
      setTotalPages(res.total_pages || 0);
    } catch {
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadBookings(); }, [page, statusFilter]);

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      const updated = await updateBookingStatus(id, status);
      setBookings((prev) => prev.map((b) => (b.id === id ? updated : b)));
    } catch {
      alert('Failed to update status');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bookings</h1>
          <p className="mt-1 text-sm text-gray-500">Manage guest reservations</p>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="checked_in">Checked In</option>
          <option value="checked_out">Checked Out</option>
          <option value="cancelled">Cancelled</option>
          <option value="refunded">Refunded</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
        </div>
      ) : bookings.length === 0 ? (
        <div className="rounded-lg bg-white border border-gray-200 p-8 text-center text-gray-500">
          No bookings found
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Booking</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dates</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Guests</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {bookings.map((booking) => (
                <tr key={booking.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-gray-900 truncate max-w-[200px]">
                      {booking.id.slice(0, 8)}...
                    </p>
                    <p className="text-xs text-gray-500 capitalize">{booking.duration_type}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {new Date(booking.check_in).toLocaleDateString()} - {new Date(booking.check_out).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {booking.num_guests}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {booking.currency === 'IDR' ? 'Rp ' : '$'}{Number(booking.total_price).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${statusColors[booking.status] || 'bg-gray-100'}`}>
                      {booking.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {(nextStatus[booking.status] || []).map((s) => (
                        <button
                          key={s}
                          onClick={() => handleStatusUpdate(booking.id, s)}
                          className="rounded px-2 py-1 text-xs font-medium text-primary-600 hover:bg-primary-50 capitalize"
                        >
                          {s.replace('_', ' ')}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-4 flex justify-center gap-2">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="rounded px-3 py-1 text-sm border disabled:opacity-50"
          >
            Prev
          </button>
          <span className="px-3 py-1 text-sm">Page {page} of {totalPages}</span>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="rounded px-3 py-1 text-sm border disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
