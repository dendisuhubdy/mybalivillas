'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBooking } from '@/lib/api';

interface BookingWidgetProps {
  propertyId: string;
  propertyTitle: string;
  price: number;
  currency: string;
  pricePeriod?: string;
  listingType: string;
}

export default function BookingWidget({
  propertyId,
  propertyTitle,
  price,
  currency,
  pricePeriod,
  listingType,
}: BookingWidgetProps) {
  const router = useRouter();
  const isRental = listingType === 'short_term_rent' || listingType === 'long_term_rent';
  const isLongTerm = listingType === 'long_term_rent';

  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(1);
  const [durationType, setDurationType] = useState<string>(
    isLongTerm ? 'monthly' : 'nightly'
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isRental) return null;

  const calculateTotal = () => {
    if (!checkIn || !checkOut) return null;
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    if (days <= 0) return null;

    let units = days;
    let label = 'night';
    switch (durationType) {
      case 'weekly':
        units = Math.ceil(days / 7);
        label = 'week';
        break;
      case 'monthly':
        units = Math.ceil(days / 30);
        label = 'month';
        break;
      case 'yearly':
        units = Math.ceil(days / 365);
        label = 'year';
        break;
    }

    const total = price * units;
    return { units, label, total };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (!token) {
      router.push('/login');
      return;
    }

    if (!checkIn || !checkOut) {
      setError('Please select check-in and check-out dates');
      return;
    }

    setIsLoading(true);
    try {
      await createBooking({
        property_id: propertyId,
        check_in: checkIn,
        check_out: checkOut,
        num_guests: guests,
        duration_type: durationType,
      });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Booking failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const calc = calculateTotal();
  const minDate = new Date().toISOString().split('T')[0];

  if (success) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
            <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-green-800">Booking Requested!</p>
            <p className="mt-1 text-sm text-green-700">
              Your reservation for {propertyTitle} has been submitted. The host will confirm shortly.
            </p>
          </div>
        </div>
        <button
          onClick={() => router.push('/bookings')}
          className="mt-4 w-full rounded-lg bg-green-600 py-2.5 text-sm font-semibold text-white hover:bg-green-700"
        >
          View My Bookings
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-card">
      <div className="flex items-baseline justify-between">
        <p className="text-2xl font-bold text-gray-900">
          {currency === 'IDR' ? 'Rp ' : '$'}
          {price.toLocaleString()}
        </p>
        {pricePeriod && (
          <span className="text-sm text-gray-500">
            / {pricePeriod.replace('per_', '')}
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        {/* Duration Type */}
        {isLongTerm && (
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500 uppercase tracking-wide">
              Rental Period
            </label>
            <select
              value={durationType}
              onChange={(e) => setDurationType(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            >
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
        )}

        {/* Dates */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500 uppercase tracking-wide">
              {isLongTerm ? 'Move-in' : 'Check-in'}
            </label>
            <input
              type="date"
              value={checkIn}
              min={minDate}
              onChange={(e) => {
                setCheckIn(e.target.value);
                if (checkOut && e.target.value >= checkOut) setCheckOut('');
              }}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500 uppercase tracking-wide">
              {isLongTerm ? 'Move-out' : 'Check-out'}
            </label>
            <input
              type="date"
              value={checkOut}
              min={checkIn || minDate}
              onChange={(e) => setCheckOut(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>
        </div>

        {/* Guests */}
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500 uppercase tracking-wide">
            Guests
          </label>
          <select
            value={guests}
            onChange={(e) => setGuests(Number(e.target.value))}
            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          >
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
              <option key={n} value={n}>
                {n} guest{n > 1 ? 's' : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Price Breakdown */}
        {calc && (
          <div className="rounded-lg bg-gray-50 p-4 space-y-2 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>
                {currency === 'IDR' ? 'Rp ' : '$'}{price.toLocaleString()} x {calc.units} {calc.label}{calc.units > 1 ? 's' : ''}
              </span>
              <span>
                {currency === 'IDR' ? 'Rp ' : '$'}{calc.total.toLocaleString()}
              </span>
            </div>
            <div className="border-t border-gray-200 pt-2 flex justify-between font-semibold text-gray-900">
              <span>Total</span>
              <span>
                {currency === 'IDR' ? 'Rp ' : '$'}{calc.total.toLocaleString()}
              </span>
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-lg bg-primary-600 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary-700 disabled:opacity-50"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Reserving...
            </span>
          ) : (
            'Reserve Now'
          )}
        </button>

        <p className="text-center text-xs text-gray-400">
          You won&apos;t be charged yet. The host will confirm your reservation.
        </p>
      </form>
    </div>
  );
}
