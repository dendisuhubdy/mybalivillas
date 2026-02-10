// ============================================================================
// Enums
// ============================================================================

export enum PropertyType {
  VILLA = 'villa',
  HOUSE = 'house',
  APARTMENT = 'apartment',
  LAND = 'land',
  COMMERCIAL = 'commercial',
}

export enum ListingType {
  BUY_FREEHOLD = 'sale_freehold',
  BUY_LEASEHOLD = 'sale_leasehold',
  RENT_SHORT_TERM = 'short_term_rent',
  RENT_LONG_TERM = 'long_term_rent',
}

export enum PricePeriod {
  TOTAL = 'total',
  PER_YEAR = 'per_year',
  PER_MONTH = 'per_month',
  PER_DAY = 'per_day',
  PER_WEEK = 'per_week',
}

export enum PropertyStatus {
  ACTIVE = 'active',
  SOLD = 'sold',
  RENTED = 'rented',
  PENDING = 'pending',
  DRAFT = 'draft',
}

// ============================================================================
// Core Interfaces
// ============================================================================

export interface Property {
  id: string;
  slug: string;
  title: string;
  description: string;
  property_type: PropertyType;
  listing_type: ListingType;
  status: PropertyStatus;
  price: number;
  currency: string;
  price_period?: PricePeriod;
  bedrooms?: number;
  bathrooms?: number;
  land_size?: number;
  building_size?: number;
  land_size_unit?: string;
  building_size_unit?: string;
  address: string;
  area: string;
  city: string;
  latitude?: number;
  longitude?: number;
  features: string[];
  images: PropertyImage[];
  agent?: Agent;
  created_at: string;
  updated_at: string;
  is_featured: boolean;
  is_verified: boolean;
  views_count: number;
}

export interface PropertyImage {
  id: string;
  url: string;
  alt?: string;
  is_primary: boolean;
  order: number;
}

export interface Agent {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  company?: string;
  properties_count: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  role: 'user' | 'agent' | 'admin';
  created_at: string;
}

export interface Area {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  property_count: number;
}

export interface Inquiry {
  id?: string;
  property_id: string;
  name: string;
  email: string;
  phone?: string;
  message: string;
  created_at?: string;
}

// ============================================================================
// Filter & Request Types
// ============================================================================

export interface PropertyFilters {
  property_type?: PropertyType;
  listing_type?: ListingType;
  area?: string;
  min_price?: number;
  max_price?: number;
  bedrooms?: number;
  bathrooms?: number;
  min_land_size?: number;
  max_land_size?: number;
  keyword?: string;
  sort_by?: 'price_asc' | 'price_desc' | 'newest' | 'oldest' | 'popular';
  page?: number;
  per_page?: number;
  is_featured?: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  full_name: string;
  email: string;
  password: string;
  phone?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

// ============================================================================
// API Response Types
// ============================================================================

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    total: number;
    page: number;
    per_page: number;
    total_pages: number;
  };
}
