import { PricePeriod } from './types';

/**
 * Format a price with currency symbol and optional period
 */
export function formatPrice(
  price: number,
  currency: string = 'USD',
  period?: PricePeriod
): string {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  let formatted = formatter.format(price);

  // Convert IDR display
  if (currency === 'IDR') {
    if (price >= 1_000_000_000) {
      formatted = `Rp ${(price / 1_000_000_000).toFixed(1)}B`;
    } else if (price >= 1_000_000) {
      formatted = `Rp ${(price / 1_000_000).toFixed(0)}M`;
    } else {
      formatted = `Rp ${price.toLocaleString()}`;
    }
  }

  if (period && period !== PricePeriod.TOTAL) {
    const periodLabels: Record<string, string> = {
      [PricePeriod.PER_YEAR]: '/year',
      [PricePeriod.PER_MONTH]: '/month',
      [PricePeriod.PER_DAY]: '/day',
      [PricePeriod.PER_WEEK]: '/week',
    };
    formatted += periodLabels[period] || '';
  }

  return formatted;
}

/**
 * Format area measurement
 */
export function formatArea(sqm: number, unit: string = 'sqm'): string {
  if (unit === 'are') {
    return `${sqm} are`;
  }
  if (unit === 'hectare') {
    return `${sqm} ha`;
  }
  return `${sqm.toLocaleString()} m\u00B2`;
}

/**
 * Create URL-friendly slug from text
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Truncate text to a specified length
 */
export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.slice(0, length).trim() + '...';
}

/**
 * Combine class names, filtering out falsy values
 */
export function classNames(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * Get property type label
 */
export function getPropertyTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    villa: 'Villa',
    house: 'House',
    apartment: 'Apartment',
    land: 'Land',
    commercial: 'Commercial',
  };
  return labels[type] || type;
}

/**
 * Get listing type label
 */
export function getListingTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    sale_freehold: 'Buy Freehold',
    sale_leasehold: 'Buy Leasehold',
    short_term_rent: 'Rent Short-Term',
    long_term_rent: 'Rent Long-Term',
  };
  return labels[type] || type;
}

/**
 * Generate placeholder image gradient based on property type
 */
export function getPlaceholderGradient(type?: string): string {
  const gradients: Record<string, string> = {
    villa: 'from-primary-600 to-primary-800',
    house: 'from-primary-500 to-primary-700',
    apartment: 'from-secondary-500 to-secondary-700',
    land: 'from-green-500 to-green-700',
    commercial: 'from-blue-500 to-blue-700',
  };
  return gradients[type || 'villa'] || 'from-primary-600 to-primary-800';
}

/**
 * Build query string from filters object
 */
export function buildQueryString(params: Record<string, string | number | boolean | undefined>): string {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '' && value !== null) {
      searchParams.set(key, String(value));
    }
  });
  const qs = searchParams.toString();
  return qs ? `?${qs}` : '';
}
